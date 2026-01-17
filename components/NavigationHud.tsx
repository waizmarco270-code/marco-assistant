import React, { useEffect, useState } from 'react';
import { Navigation, MapPin, ExternalLink, X } from 'lucide-react';

interface NavigationHudProps {
  destination: string;
  isActive: boolean;
  onClose: () => void;
}

export const NavigationHud: React.FC<NavigationHudProps> = ({ destination, isActive, onClose }) => {
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (isActive) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isActive, destination]);

  const handleLaunchMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, '_blank');
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="absolute top-24 left-4 z-40 w-64 glass-panel border border-cyan-500 rounded-lg overflow-hidden neon-glow animate-pulse-fast">
      {/* Header */}
      <div className="bg-cyan-900/50 p-2 flex justify-between items-center border-b border-cyan-500/30">
        <div className="flex items-center space-x-2">
           <Navigation size={14} className="text-cyan-400" />
           <span className="text-[10px] font-display text-cyan-400 tracking-widest">NAV SYSTEM</span>
        </div>
        <button onClick={onClose} className="text-cyan-400 hover:text-white"><X size={14}/></button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col items-center relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20"></div>
        
        {/* Animated Target Reticle */}
        <div className="w-24 h-24 border-2 border-cyan-500/50 rounded-full flex items-center justify-center relative mb-4">
             <div className="absolute w-full h-full border border-cyan-500 rounded-full animate-ping opacity-20"></div>
             <div className="w-20 h-20 border border-dotted border-cyan-400 rounded-full animate-spin-slow"></div>
             <MapPin size={24} className="text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
        </div>

        <div className="text-center z-10 w-full">
            <div className="text-[10px] text-cyan-600 font-mono mb-1">TARGET ACQUIRED</div>
            <div className="text-lg font-display text-white truncate w-full">{destination}</div>
            
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-800 mt-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 shadow-[0_0_10px_#0ff]" 
                  style={{ width: `${scanProgress}%` }}
                ></div>
            </div>

            {scanProgress === 100 && (
                <button 
                  onClick={handleLaunchMaps}
                  className="mt-4 w-full bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500 text-cyan-300 text-xs py-2 rounded font-display tracking-wider flex items-center justify-center space-x-2 transition-all"
                >
                  <span>ENGAGE THRUSTERS</span>
                  <ExternalLink size={12} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};