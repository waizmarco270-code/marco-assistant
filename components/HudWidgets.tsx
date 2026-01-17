import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Activity, ChevronDown, Cpu, ShieldCheck, Code, Fingerprint } from 'lucide-react';

interface HudWidgetsProps {
  logs: LogEntry[];
  isConnected: boolean;
}

// StatusWidget
export const StatusWidget: React.FC<{ isConnected: boolean, battery: number }> = ({ isConnected, battery }) => (
  <div className="flex flex-col items-end space-y-2">
    <div className="flex items-center space-x-2 glass-panel px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-xs font-display text-cyan-100 tracking-wider">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
    </div>
    <div className="flex items-center space-x-2 glass-panel px-3 py-1 rounded-full border border-cyan-500/30">
        <Activity size={10} className="text-cyan-400" />
        <span className="text-xs font-display text-cyan-100">{battery}% PWR</span>
    </div>
  </div>
);

// LogsWidget
export const LogsWidget: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="absolute top-24 right-4 w-72 h-64 glass-panel border border-cyan-500/30 rounded-lg flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.1)] z-30 animate-fade-in">
            <div className="bg-cyan-900/40 p-2 border-b border-cyan-500/30 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center space-x-2">
                    <Terminal size={12} className="text-cyan-400" />
                    <span className="text-[10px] font-display tracking-[0.2em] text-cyan-300">NEURAL LOGS</span>
                </div>
                <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-400/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50 border border-yellow-400/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50 border border-green-400/50"></div>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2 custom-scrollbar bg-black/40"
            >
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <Terminal size={24} className="mb-2" />
                        <span>AWAITING INPUT...</span>
                    </div>
                )}
                
                {logs.map((log) => (
                    <div key={log.id} className="flex flex-col animate-slide-left">
                        <div className="flex items-center space-x-2 opacity-50 mb-0.5">
                            <span className="text-[9px] text-cyan-600">
                                [{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                log.source === 'USER' ? 'text-green-500' :
                                log.source === 'MARCO' ? 'text-cyan-400' :
                                'text-purple-400'
                            }`}>
                                {log.source}
                            </span>
                        </div>
                        <div className={`pl-2 border-l-2 ${
                             log.type === 'error' ? 'border-red-500 text-red-300' : 
                             log.type === 'success' ? 'border-green-500 text-green-300' : 
                             log.type === 'warning' ? 'border-yellow-500 text-yellow-300' : 
                             'border-cyan-500/30 text-cyan-100'
                        } leading-relaxed break-words`}>
                            {log.message}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-1 bg-cyan-900/20 border-t border-cyan-500/20 flex justify-between items-center px-2">
                <span className="text-[8px] text-cyan-700 animate-pulse">● LIVE STREAM</span>
                <ChevronDown size={8} className="text-cyan-700" />
            </div>
        </div>
    )
}

// CreatorWidget - The Legendary Identity Card
export const CreatorWidget: React.FC<{ isActive: boolean, onClose: () => void }> = ({ isActive, onClose }) => {
    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
             <div onClick={onClose} className="absolute inset-0 z-0"></div>
             <div className="relative w-full max-w-sm glass-panel border border-cyan-500 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0,255,255,0.3)] animate-zoom-in z-10 p-6 flex flex-col items-center">
                
                {/* Holographic Header */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                
                <div className="w-24 h-24 rounded-full border-2 border-cyan-400 flex items-center justify-center mb-4 relative bg-cyan-900/20">
                    <div className="absolute inset-0 rounded-full border border-cyan-500 animate-ping opacity-20"></div>
                    <Cpu size={40} className="text-cyan-400" />
                </div>

                <h1 className="text-2xl font-display font-bold text-white tracking-widest text-center mb-1 text-shadow">MARCO A.I.</h1>
                <div className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] mb-6">SYSTEM ARCHITECT</div>

                <div className="w-full bg-cyan-900/30 rounded-lg p-4 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center space-x-3">
                        <Fingerprint size={16} className="text-cyan-500" />
                        <div>
                            <div className="text-[8px] text-gray-400 font-mono">CREATED BY</div>
                            <div className="text-sm font-display text-white tracking-wider">MOHAMMED WAIZ MONAZZUM</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Code size={16} className="text-cyan-500" />
                        <div>
                            <div className="text-[8px] text-gray-400 font-mono">DESIGNATION</div>
                            <div className="text-sm font-display text-white tracking-wider">VISIONARY DEVELOPER</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <ShieldCheck size={16} className="text-green-500" />
                        <div>
                            <div className="text-[8px] text-gray-400 font-mono">LOYALTY STATUS</div>
                            <div className="text-sm font-display text-green-400 tracking-wider">100% TO MASTER</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-500 font-mono italic">"Innovating the future, one line of code at a time."</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-cyan-900/40 hover:bg-cyan-500 hover:text-black border border-cyan-500 text-cyan-400 rounded text-xs font-display tracking-widest transition-all">
                        ACKNOWLEDGE
                    </button>
                </div>
             </div>
        </div>
    );
}

export const ActionSuggestion: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
    <button 
        onClick={onClick}
        className="glass-panel px-4 py-2 rounded-lg text-cyan-300 text-sm font-display hover:bg-cyan-900/30 transition-all border border-cyan-800 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] active:scale-95"
    >
        {label}
    </button>
);