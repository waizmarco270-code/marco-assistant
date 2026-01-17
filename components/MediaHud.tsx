import React, { useEffect, useRef, useState } from 'react';
import { X, Minimize, Maximize } from 'lucide-react';

interface MediaHudProps {
  query: string; 
  isActive: boolean;
  onClose: () => void;
  command: 'play' | 'pause' | null;
}

export const MediaHud: React.FC<MediaHudProps> = ({ query, isActive, onClose, command }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Send postMessage commands to YouTube IFrame
  useEffect(() => {
    if (!iframeRef.current || !isActive) return;
    const contentWindow = iframeRef.current.contentWindow;
    if (!contentWindow) return;

    if (command === 'pause') {
      contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } else if (command === 'play') {
      contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  }, [command, isActive]);

  if (!isActive) return null;

  // listType=search plays the first result automatically. enablejsapi=1 allows control.
  const src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1&enablejsapi=1&controls=0&modestbranding=1&rel=0`;

  return (
    <div className={`absolute transition-all duration-500 ease-in-out z-40 glass-panel border-r-2 border-cyan-500 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)] ${isMinimized ? 'bottom-20 left-4 w-48 h-12 rounded-lg' : 'bottom-32 left-4 w-80 h-48 rounded-xl'}`}>
       
       <div className="flex justify-between items-center bg-cyan-900/40 p-2 border-b border-cyan-500/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-display text-cyan-400 tracking-widest">MEDIA CORE</span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="text-cyan-400 hover:text-white transition-colors">
                {isMinimized ? <Maximize size={12} /> : <Minimize size={12} />}
            </button>
            <button onClick={onClose} className="text-red-400 hover:text-white transition-colors"><X size={12} /></button>
          </div>
       </div>

       {!isMinimized && (
         <div className="w-full h-full bg-black relative">
            <iframe 
                ref={iframeRef}
                width="100%" 
                height="100%" 
                src={src}
                title="Marco Media Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-[calc(100%-32px)] border-none"
            />
            {/* Click shield to prevent stealing focus completely, but allow Youtube controls if needed */}
            <div className="absolute top-0 left-0 w-8 h-full z-10"></div> 
         </div>
       )}
       
       {isMinimized && (
           <div className="flex items-center justify-center h-full pb-2">
                <span className="text-cyan-500 text-[10px] truncate px-2 font-mono">{query.toUpperCase()}</span>
           </div>
       )}
    </div>
  );
};