import React, { useState } from 'react';
import { IdentificationResult, NatureCategory } from '../types';
import { Volume2, Share2, Check, AlertTriangle, Leaf, Info, Activity, Zap } from 'lucide-react';
import { generateSpeech, playAudioBuffer } from '../services/geminiService';

interface ResultOverlayProps {
  result: IdentificationResult;
  imageSrc: string;
  onSave: () => void;
  onBack: () => void;
  initialSavedState?: boolean;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ result, imageSrc, onSave, onBack, initialSavedState = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSavedState);

  const handlePlayTTS = async () => {
    if (isPlaying) return;
    try {
      setIsPlaying(true);
      const textToRead = `Ini adalah ${result.name}. ${result.description} Fakta uniknya: ${result.funFact}`;
      const audioBuffer = await generateSpeech(textToRead);
      playAudioBuffer(audioBuffer);
      // Reset state after approximate duration (simple heuristic or listener if complex)
      setTimeout(() => setIsPlaying(false), audioBuffer.duration * 1000);
    } catch (e) {
      console.error("TTS Error", e);
      setIsPlaying(false);
    }
  };

  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const getCategoryColor = (cat: NatureCategory) => {
    switch (cat) {
      case NatureCategory.FLORA: return 'text-green-400 bg-green-900/30 border-green-500/50';
      case NatureCategory.FAUNA: return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case NatureCategory.MINERAL: return 'text-blue-400 bg-blue-900/30 border-blue-500/50';
      default: return 'text-purple-400 bg-purple-900/30 border-purple-500/50';
    }
  };

  const getDangerColor = (level: string) => {
    switch(level) {
      case 'Aman': return 'text-green-500 bg-green-100';
      case 'Hati-hati': return 'text-yellow-600 bg-yellow-100';
      case 'Berbahaya': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-900/95 backdrop-blur-sm overflow-y-auto no-scrollbar">
      {/* Image Header */}
      <div className="relative h-64 w-full shrink-0">
        <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 px-6 -mt-12 relative z-10 pb-20">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-2xl mb-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getCategoryColor(result.category)}`}>
                {result.category}
              </span>
              <h1 className="text-3xl font-bold text-white mt-2 leading-tight">{result.name}</h1>
              <p className="text-gray-400 italic text-sm">{result.scientificName}</p>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${getDangerColor(result.dangerLevel)}`}>
              {result.dangerLevel === 'Berbahaya' && <AlertTriangle size={12} />}
              {result.dangerLevel}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              onClick={handlePlayTTS}
              disabled={isPlaying}
              className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              {isPlaying ? <Activity className="animate-pulse" size={18} /> : <Volume2 size={18} />}
              {isPlaying ? 'Mendengarkan...' : 'Dengar'}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaved}
              className={`flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
            >
              {isSaved ? <Check size={18} /> : <Leaf size={18} />}
              {isSaved ? 'Tersimpan' : 'Simpan'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info size={14} /> Tentang
            </h3>
            <p className="text-gray-200 leading-relaxed text-sm">
              {result.description}
            </p>
          </div>

          <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-700/30">
            <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap size={14} /> Fakta Unik
            </h3>
            <p className="text-yellow-100/90 leading-relaxed text-sm">
              {result.funFact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;