import { GoogleGenAI, Type, Modality } from "@google/genai";
import { IdentificationResult, NatureCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Identifies a nature object from a base64 image string.
 */
export const identifyNatureObject = async (base64Image: string): Promise<IdentificationResult> => {
  // Strip header if present (e.g., "data:image/jpeg;base64,")
  const data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: data
          }
        },
        {
          text: `Identifikasi objek alam utama dalam gambar ini (tanaman, hewan, batu, jamur, dll). 
                 Berikan respons dalam Bahasa Indonesia yang edukatif untuk pelajar.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nama umum dalam Bahasa Indonesia" },
          scientificName: { type: Type.STRING, description: "Nama ilmiah latin" },
          description: { type: Type.STRING, description: "Deskripsi singkat fisik dan habitat (maks 2 kalimat)" },
          funFact: { type: Type.STRING, description: "Satu fakta unik yang menarik" },
          category: { 
            type: Type.STRING, 
            enum: [NatureCategory.FLORA, NatureCategory.FAUNA, NatureCategory.MINERAL, NatureCategory.OTHER] 
          },
          dangerLevel: { 
            type: Type.STRING, 
            enum: ["Aman", "Hati-hati", "Berbahaya"],
            description: "Tingkat bahaya bagi manusia (misal: beracun, buas, atau aman)"
          }
        },
        required: ["name", "scientificName", "description", "funFact", "category", "dangerLevel"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gagal mendapatkan respons dari AI");
  
  const result = JSON.parse(text) as Omit<IdentificationResult, 'timestamp'>;
  
  return {
    ...result,
    timestamp: Date.now()
  };
};

/**
 * Decodes raw PCM audio data from Gemini.
 * Gemini API returns raw PCM 16-bit little-endian without headers.
 */
async function decodePCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  // Convert Uint8Array bytes to Int16Array
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit integer to float range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Generates speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");

  // Create context to create the buffer. 
  // Note: We use 24000 as that is the standard sample rate for Gemini TTS output.
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  
  // Base64 decode
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Use manual PCM decoding instead of decodeAudioData
  const audioBuffer = await decodePCM(bytes, audioContext, 24000, 1);
  return audioBuffer;
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};
