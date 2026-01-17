import React, { useEffect, useState } from 'react';
import { Timer, X } from 'lucide-react';

interface TimerWidgetProps {
  duration: number; // seconds
  isActive: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ duration, isActive, onClose, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, duration, onComplete]);

  if (!isActive) return null;

  const progress = (timeLeft / duration) * 100;
  const strokeDashoffset = 440 - (440 * progress) / 100; // 2 * PI * r (r=70) approx 440

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-32 right-4 w-32 h-32 flex items-center justify-center z-30">
       {/* Background Glow */}
       <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full"></div>
       
       <svg className="w-full h-full transform -rotate-90">
         <circle
           cx="64"
           cy="64"
           r="60"
           stroke="currentColor"
           strokeWidth="4"
           fill="transparent"
           className="text-gray-800"
         />
         <circle
           cx="64"
           cy="64"
           r="60"
           stroke="currentColor"
           strokeWidth="4"
           fill="transparent"
           strokeDasharray="440"
           strokeDashoffset={strokeDashoffset}
           className="text-cyan-400 transition-all duration-1000 ease-linear shadow-[0_0_15px_#0ff]"
         />
       </svg>

       <div className="absolute flex flex-col items-center">
           <span className="text-2xl font-display font-bold text-white drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
             {formatTime(timeLeft)}
           </span>
           <span className="text-[8px] text-cyan-400 tracking-widest mt-1">CHRONO</span>
           <button onClick={onClose} className="mt-1 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
             <X size={12} />
           </button>
       </div>
    </div>
  );
};