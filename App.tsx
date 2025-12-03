
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, IdentificationResult, CollectionItem } from './types';
import CameraView from './components/CameraView';
import ResultOverlay from './components/ResultOverlay';
import Collection from './components/Collection';
import { identifyNatureObject } from './services/geminiService';
import { Camera, Compass, BookOpen, User, Upload, Smartphone, Monitor, Download } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<IdentificationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load collection from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('natureSpotCollection');
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setIsAnalyzing(true);
    // Temporary UI change before full result
    // In a real app we might stay on camera view with a loading overlay, 
    // here we switch to result view's loading state implicitly or use a specific loading view.
    setMode(AppMode.RESULT); 

    try {
      const result = await identifyNatureObject(imageData);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Maaf, gagal mengidentifikasi objek. Coba lagi!");
      setMode(AppMode.CAMERA);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        handleCapture(result);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  const saveToCollection = () => {
    if (analysisResult && capturedImage) {
      const newItem: CollectionItem = {
        ...analysisResult,
        id: Date.now().toString(),
        imageUrl: capturedImage
      };
      const newCollection = [newItem, ...collection];
      setCollection(newCollection);
      localStorage.setItem('natureSpotCollection', JSON.stringify(newCollection));
    }
  };

  const clearCollection = () => {
    if (window.confirm("Hapus semua koleksi?")) {
      setCollection([]);
      localStorage.removeItem('natureSpotCollection');
    }
  };

  return (
    <div className="h-full w-full bg-gray-900 text-white relative flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* HOME VIEW */}
        {mode === AppMode.HOME && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-900 to-gray-900 relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="z-10 text-center space-y-6 w-full max-w-sm">
              <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-green-900/50 mb-4 transform rotate-3">
                <Compass size={48} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 font-['Plus_Jakarta_Sans']">NatureSpot</h1>
                <p className="text-gray-400 text-lg max-w-[280px] mx-auto leading-relaxed">
                  Jelajahi keajaiban alam di sekitarmu dengan kecerdasan buatan.
                </p>
              </div>
              
              <div className="pt-6 w-full space-y-3">
                <button 
                  onClick={() => setMode(AppMode.CAMERA)}
                  className="w-full py-4 bg-white text-green-900 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  Mulai Eksplorasi
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-emerald-800/50 text-emerald-100 border border-emerald-700/50 rounded-xl font-semibold hover:bg-emerald-800/70 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    Upload
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  
                  <button 
                    onClick={() => setMode(AppMode.COLLECTION)}
                    className="w-full py-3 bg-gray-800 text-white border border-gray-700 rounded-xl font-semibold hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <BookOpen size={18} />
                    Koleksi
                  </button>
                </div>

                {/* Install Button (Only visible if installable) */}
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-blue-600/90 text-white border border-blue-500/50 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    <Download size={18} />
                    Install Aplikasi
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-6 text-gray-500 text-xs text-center w-full flex flex-col items-center gap-2">
              <p>Powered by Gemini AI • AR Prototype</p>
              <div className="flex items-center gap-3 opacity-60">
                <div className="flex items-center gap-1">
                    <Smartphone size={12} />
                    <span>Android</span>
                </div>
                <div className="flex items-center gap-1">
                    <Monitor size={12} />
                    <span>PC</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAMERA VIEW */}
        {mode === AppMode.CAMERA && (
          <CameraView 
            onCapture={handleCapture} 
            onClose={() => setMode(AppMode.HOME)} 
          />
        )}

        {/* RESULT VIEW */}
        {mode === AppMode.RESULT && (
          <>
            {isAnalyzing ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 z-50">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass size={32} className="text-green-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-white">Menganalisis Alam...</h3>
                <p className="text-gray-400 mt-2 text-sm animate-pulse">AI sedang mengidentifikasi objek</p>
              </div>
            ) : analysisResult && capturedImage ? (
              <ResultOverlay 
                result={analysisResult} 
                imageSrc={capturedImage}
                onSave={saveToCollection}
                onBack={() => {
                  setAnalysisResult(null);
                  setCapturedImage(null);
                  setMode(AppMode.CAMERA); // Go back to camera to take another
                }}
              />
            ) : (
               // Fallback if something weird happens
               <div className="flex items-center justify-center h-full">
                 <button onClick={() => setMode(AppMode.HOME)}>Error State. Kembali.</button>
               </div>
            )}
          </>
        )}

        {/* COLLECTION VIEW */}
        {mode === AppMode.COLLECTION && (
          <Collection 
            items={collection} 
            onBack={() => setMode(AppMode.HOME)}
            onClear={clearCollection}
          />
        )}
      </div>
      
      {/* Bottom Navigation (Hidden in Camera Mode for immersion) */}
      {mode !== AppMode.CAMERA && mode !== AppMode.RESULT && (
         <div className="bg-gray-900 border-t border-gray-800 p-2 pb-6 safe-area-pb">
            {/* Simple footer if needed, but the main nav is central on home. 
                Keeping this empty or minimal for now to focus on the main flows. 
            */}
         </div>
      )}
    </div>
  );
};

export default App;
