import React, { useEffect, useState } from 'react';
import { Timer, Rocket, Trash2 } from 'lucide-react';

interface EventCountdownWidgetProps {
  targetDate: string | null; // ISO string
  label: string;
  onRemove: () => void;
}

export const EventCountdownWidget: React.FC<EventCountdownWidgetProps> = ({ targetDate, label, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass-panel border border-cyan-500/50 rounded-lg p-4 flex flex-col items-center min-w-[300px] shadow-[0_0_30px_rgba(0,255,255,0.15)] animate-fade-in-down z-30">
        
        <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Rocket size={16} className="animate-pulse" />
            <span className="text-xs font-display tracking-[0.2em]">{label.toUpperCase()}</span>
        </div>

        <div className="flex items-center space-x-4 mb-2">
            <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-white">{timeLeft.days}</span>
                <span className="text-[9px] font-mono text-gray-500">DAYS</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-700"></div>
            <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] font-mono text-gray-500">HRS</span>
            </div>
            <div className="text-cyan-600 font-bold mb-4">:</div>
            <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[9px] font-mono text-gray-500">MIN</span>
            </div>
            <div className="text-cyan-600 font-bold mb-4">:</div>
            <div className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-cyan-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[9px] font-mono text-gray-500">SEC</span>
            </div>
        </div>

        <button 
            onClick={onRemove}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 transition-colors"
            title="Cancel Countdown"
        >
            <Trash2 size={12} />
        </button>

        <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 animate-[width_3s_ease-in-out_infinite]" style={{width: '20%'}}></div>
        </div>
    </div>
  );
};
