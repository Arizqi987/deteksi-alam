import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, Zap, X, Image as ImageIcon } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin diberikan.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]); // Intentionally re-run when facingMode changes

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally if using front camera for natural mirror effect (optional, but standard)
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {error ? (
        <div className="text-white p-6 text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <button 
            onClick={() => onClose()}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30"
          >
            Kembali
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            className={`absolute h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
            <button 
              onClick={onClose}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
            >
              <X size={24} />
            </button>
            <div className="bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1 shadow-lg">
              <Zap size={12} fill="currentColor" />
              Mode Deteksi Aktif
            </div>
            <div className="w-10"></div> {/* Spacer for layout balance */}
          </div>

          {/* AR Reticle Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-64 h-64 border-2 border-white/50 rounded-xl relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 -mt-1 -ml-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 -mt-1 -mr-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 -mb-1 -ml-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 -mb-1 -mr-1 rounded-br-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/70 text-sm font-medium tracking-wide bg-black/30 px-2 py-1 rounded">Arahkan pada Objek</div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-around items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
            {/* Gallery Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
              aria-label="Upload Foto"
            >
              <ImageIcon size={24} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 transition-transform duration-200"
              aria-label="Ambil Foto"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>
            
            <button 
              onClick={toggleCamera}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;