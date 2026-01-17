import React, { useEffect, useState } from 'react';
import { FileCode, Archive, Download, X, Clock, FileText } from 'lucide-react';
import { MemoryService, FileHistoryEntry } from '../services/memoryService';

interface FileHistoryWidgetProps {
  isActive: boolean;
  onClose: () => void;
  memoryService: MemoryService;
  onDownload: (entry: FileHistoryEntry) => void;
}

export const FileHistoryWidget: React.FC<FileHistoryWidgetProps> = ({ isActive, onClose, memoryService, onDownload }) => {
  const [history, setHistory] = useState<FileHistoryEntry[]>([]);

  useEffect(() => {
    if (isActive) {
      setHistory(memoryService.getFileHistory());
    }
  }, [isActive, memoryService]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
       <div className="w-full max-w-md h-[70vh] glass-panel border border-cyan-500/50 rounded-xl flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.15)]">
          
          {/* Header */}
          <div className="bg-cyan-900/40 p-4 border-b border-cyan-500/30 flex justify-between items-center">
             <div className="flex items-center space-x-2">
                <Archive className="text-cyan-400" size={20} />
                <span className="text-sm font-display text-cyan-100 tracking-widest">ARCHIVE LOGS</span>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
             </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                   <FileText size={48} className="opacity-20" />
                   <span className="text-xs font-mono">NO CONSTRUCTS GENERATED</span>
                </div>
             ) : (
                history.map((entry) => (
                   <div key={entry.id} className="group bg-gray-900/50 border border-gray-800 hover:border-cyan-500/50 p-3 rounded-lg flex items-center justify-between transition-all">
                      <div className="flex items-center space-x-3 overflow-hidden">
                         <div className={`p-2 rounded-lg ${entry.type === 'archive' ? 'bg-purple-900/20 text-purple-400' : 'bg-cyan-900/20 text-cyan-400'}`}>
                            {entry.type === 'archive' ? <Archive size={18} /> : <FileCode size={18} />}
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm text-gray-200 font-mono truncate">{entry.name}</span>
                            <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                               <Clock size={10} />
                               <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                      
                      <button 
                         onClick={() => onDownload(entry)}
                         className="p-2 bg-gray-800 hover:bg-cyan-600/20 text-gray-400 hover:text-cyan-300 rounded-lg transition-all ml-2"
                         title="Re-materialize"
                      >
                         <Download size={16} />
                      </button>
                   </div>
                ))
             )}
          </div>
          
          {/* Footer */}
          <div className="p-2 bg-black/60 border-t border-gray-800 text-center">
             <span className="text-[9px] text-gray-500 font-mono">SYSTEM STORAGE: {history.length} ITEMS</span>
          </div>
       </div>
    </div>
  );
};