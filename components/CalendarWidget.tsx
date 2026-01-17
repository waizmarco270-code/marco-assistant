import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, X, CalendarCheck, RefreshCw } from 'lucide-react';
import { MemoryService, CalendarEvent } from '../services/memoryService';

interface CalendarWidgetProps {
  isActive: boolean;
  onClose: () => void;
  memoryService: MemoryService;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ isActive, onClose, memoryService }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (isActive) {
      refreshEvents();
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
    }
  }, [isActive, memoryService]);

  const refreshEvents = () => {
    setEvents(memoryService.getEvents());
  };

  if (!isActive) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isToday: d.toDateString() === new Date().toDateString()
    };
  };

  return (
    <div className="absolute top-20 right-4 w-80 glass-panel border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.1)] z-40 animate-fade-in-up">
       
       {/* Holographic Header */}
       <div className="relative bg-cyan-900/40 p-3 border-b border-cyan-500/30 flex justify-between items-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500 animate-[width_2s_ease-in-out_infinite]"></div>
          <div className="flex items-center space-x-2 z-10">
             <Calendar className="text-cyan-400" size={18} />
             <span className="text-xs font-display text-cyan-100 tracking-widest">CHRONOS MODULE</span>
          </div>
          <div className="flex items-center space-x-2 z-10">
             <span className="text-[10px] font-mono text-cyan-300">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
          </div>
       </div>

       {/* Body */}
       <div className="max-h-80 overflow-y-auto p-4 custom-scrollbar">
          {events.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-8 opacity-50">
                <CalendarCheck size={40} className="text-cyan-600 mb-2" />
                <span className="text-xs font-mono text-cyan-400">SCHEDULE CLEAR</span>
             </div>
          ) : (
             <div className="relative border-l border-cyan-500/20 ml-3 space-y-6">
                {events.map((event, index) => {
                   const { day, month, time, isToday } = formatDate(event.startTime);
                   return (
                      <div key={event.id} className="relative pl-6 group">
                         {/* Timeline Node */}
                         <div className={`absolute -left-[5px] top-0 w-[9px] h-[9px] rounded-full border border-black ${isToday ? 'bg-cyan-400 shadow-[0_0_10px_#0ff]' : 'bg-gray-700'}`}></div>
                         
                         {/* Card */}
                         <div className="bg-black/40 border border-gray-800 group-hover:border-cyan-500/50 rounded-lg p-3 transition-all duration-300">
                            <div className="flex justify-between items-start mb-1">
                               <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{event.title}</h3>
                               {isToday && <span className="text-[9px] bg-cyan-900/50 text-cyan-300 px-1 rounded border border-cyan-500/30">TODAY</span>}
                            </div>
                            
                            <div className="flex items-center space-x-3 mt-2">
                               <div className="flex flex-col items-center bg-gray-900/50 px-2 py-1 rounded border border-white/5">
                                  <span className="text-[9px] text-gray-500 font-mono">{month}</span>
                                  <span className="text-lg font-display text-white leading-none">{day}</span>
                               </div>
                               <div className="flex flex-col space-y-1">
                                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                                     <Clock size={10} />
                                     <span>{time}</span>
                                  </div>
                                  {event.location && (
                                     <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <MapPin size={10} />
                                        <span className="truncate max-w-[120px]">{event.location}</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
          )}
       </div>

       {/* Footer */}
       <div className="bg-black/60 p-2 text-center border-t border-gray-800">
          <span className="text-[9px] text-gray-600 font-mono tracking-wider">SYNCED: LOCAL_DB_V2</span>
       </div>
    </div>
  );
};