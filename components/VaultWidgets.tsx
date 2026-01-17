import React, { useEffect, useState, useRef } from 'react';
import { X, Image as ImageIcon, Music, Lock, Eye, EyeOff, Play, Pause, Volume2, Aperture, Scan, Layers, Download } from 'lucide-react';
import { VaultItem } from '../services/memoryService';

// --- HOLO-DECK GENERATOR (LOADING STATE) ---
export const HoloDeckGenerator: React.FC<{ prompt: string, isActive: boolean }> = ({ prompt, isActive }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="flex flex-col items-center max-w-md w-full p-6 relative">
                
                {/* Rotating Tesseract Animation */}
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-2 border-cyan-500 rounded-lg animate-[spin_4s_linear_infinite]"></div>
                    <div className="absolute inset-2 border-2 border-purple-500 rounded-lg animate-[spin_3s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-4 border border-cyan-300 rounded-full animate-pulse flex items-center justify-center">
                        <Aperture size={32} className="text-cyan-400 animate-spin-slow" />
                    </div>
                </div>

                <h2 className="text-2xl font-display text-white tracking-[0.2em] mb-2 animate-pulse">HOLO-DECK ACTIVE</h2>
                
                <div className="w-full bg-gray-900 h-1 mb-2 overflow-hidden rounded-full">
                    <div className="h-full bg-cyan-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
                </div>
                
                <div className="text-xs font-mono text-cyan-400 text-center">
                    <p>COMPILING NEURAL ASSETS...</p>
                    <p className="mt-1 opacity-70">PROMPT: "{prompt.toUpperCase()}"</p>
                </div>

                {/* Grid Overlay Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10"></div>
            </div>
        </div>
    );
};

// --- PHOTO WIDGET (HOLO-FRAME) ---
export const PhotoWidget: React.FC<{ item: VaultItem | null; onClose: () => void }> = ({ item, onClose }) => {
  const [scanLine, setScanLine] = useState(0);
  
  useEffect(() => {
     if(item) {
         setScanLine(0);
         const interval = setInterval(() => {
             setScanLine(prev => (prev < 100 ? prev + 2 : 100));
         }, 10);
         return () => clearInterval(interval);
     }
  }, [item]);

  const handleDownload = () => {
      if(!item) return;
      const link = document.createElement('a');
      link.href = item.content;
      link.download = `HOLO_GEN_${item.id}.jpg`;
      link.click();
  };

  if (!item) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm animate-zoom-in">
       <div className="relative glass-panel border border-cyan-500 rounded-none w-auto max-w-4xl shadow-[0_0_100px_rgba(0,255,255,0.15)] p-1">
          
          {/* Holo Corners */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

          <div className="absolute -top-10 right-0 flex space-x-2">
            <button onClick={handleDownload} className="text-cyan-400 hover:text-white transition-colors flex items-center space-x-1 bg-black/50 px-3 py-1 rounded border border-cyan-500/30">
                 <span className="text-xs font-display">SAVE</span>
                 <Download size={16} />
            </button>
            <button onClick={onClose} className="text-cyan-400 hover:text-white transition-colors flex items-center space-x-1 bg-black/50 px-3 py-1 rounded border border-cyan-500/30">
                <span className="text-xs font-display">DISENGAGE</span>
                <X size={16} />
            </button>
          </div>
          
          <div className="relative overflow-hidden bg-black flex items-center justify-center min-w-[300px] min-h-[200px]">
             {/* The Image */}
             <img src={item.content} alt={item.label} className="max-w-[85vw] max-h-[75vh] object-contain" style={{ filter: `grayscale(${100 - scanLine}%) brightness(${scanLine}%)` }} />
             
             {/* Scan Effect Overlay */}
             {scanLine < 100 && (
                 <div className="absolute inset-0 bg-cyan-900/50 border-b-2 border-cyan-400 transition-all duration-75" style={{ height: `${scanLine}%` }}>
                     <div className="absolute bottom-0 right-2 text-[10px] font-mono text-cyan-300">RENDERING... {scanLine}%</div>
                 </div>
             )}
             
             {/* Grid overlay */}
             <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
          </div>
          
          <div className="mt-3 flex items-center justify-between px-2 pb-2">
             <div className="flex items-center space-x-3">
                <Layers size={16} className="text-cyan-400" />
                <div className="flex flex-col">
                    <span className="text-sm font-display text-white tracking-widest">{item.label.toUpperCase()}</span>
                    <span className="text-[9px] font-mono text-cyan-600">SOURCE: HOLO-DECK GENERATION</span>
                </div>
             </div>
             <div className="flex items-center space-x-2">
                 <span className="text-[9px] font-mono text-gray-500">SAVED TO VAULT</span>
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- MUSIC WIDGET (SONIC-CORE) ---
export const MusicWidget: React.FC<{ item: VaultItem | null; onClose: () => void }> = ({ item, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (item && audioRef.current) {
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  }, [item]);

  const togglePlay = () => {
    if(!audioRef.current) return;
    if(isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if(audioRef.current) {
       const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
       setProgress(p || 0);
    }
  };

  if (!item) return null;

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-80 glass-panel rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-slide-up">
       <audio ref={audioRef} src={item.content} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
       
       <div className="bg-purple-900/30 p-3 border-b border-purple-500/30 flex justify-between items-center">
          <div className="flex items-center space-x-2">
             <Music size={16} className="text-purple-400 animate-pulse" />
             <span className="text-xs font-display text-purple-200 tracking-widest truncate max-w-[150px]">{item.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={14} /></button>
       </div>

       <div className="p-4 flex flex-col items-center">
          {/* Visualizer Placeholder */}
          <div className="flex items-end justify-center space-x-1 h-12 mb-4 w-full">
             {[...Array(20)].map((_, i) => (
                <div key={i} className={`w-1 bg-purple-400 transition-all duration-75 ease-in-out`} 
                     style={{ height: isPlaying ? `${Math.random() * 100}%` : '10%' }}></div>
             ))}
          </div>

          <div className="w-full h-1 bg-gray-700 rounded-full mb-4">
             <div className="h-full bg-purple-500" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="flex items-center space-x-6">
             <Volume2 size={16} className="text-gray-400" />
             <button onClick={togglePlay} className="w-12 h-12 rounded-full border-2 border-purple-500 flex items-center justify-center hover:bg-purple-500/20 text-white transition-all">
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
             </button>
             <span className="text-xs font-mono text-gray-400">SONIC-CORE</span>
          </div>
       </div>
    </div>
  );
};

// --- SECRET WIDGET (CIPHER-PAD) ---
export const SecretWidget: React.FC<{ item: VaultItem | null; onClose: () => void }> = ({ item, onClose }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  
  if (!item) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
       <div className="glass-panel border border-red-500/50 rounded-lg p-6 w-72 text-center shadow-[0_0_40px_rgba(255,0,0,0.2)]">
          <div className="mb-4 flex justify-center">
             <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-red-900/20">
                <Lock size={32} className="text-red-500" />
             </div>
          </div>
          
          <h3 className="text-red-400 font-display tracking-widest text-lg mb-1">{item.label}</h3>
          <p className="text-[10px] text-gray-500 font-mono mb-6">SECURE DATA FRAGMENT</p>

          <div className="bg-black/60 border border-gray-700 rounded p-3 mb-4 font-mono text-xl tracking-widest text-white break-all">
             {isRevealed ? item.content : "• • • • • • • •"}
          </div>

          <div className="flex justify-between space-x-2">
             <button 
               onClick={() => setIsRevealed(!isRevealed)}
               className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-600/30 rounded py-2 text-xs text-red-300 flex items-center justify-center space-x-2 transition-all"
             >
                {isRevealed ? <><EyeOff size={14}/><span>HIDE</span></> : <><Eye size={14}/><span>DECRYPT</span></>}
             </button>
             <button 
               onClick={onClose}
               className="px-4 border border-gray-700 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
             >
                <X size={16} />
             </button>
          </div>
       </div>
    </div>
  );
};