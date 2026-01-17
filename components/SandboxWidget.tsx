import React, { useState } from 'react';
import { X, Code, Play, Maximize2, Minimize2, Terminal } from 'lucide-react';

interface SandboxWidgetProps {
  isActive: boolean;
  code: string;
  appName: string;
  onClose: () => void;
}

export const SandboxWidget: React.FC<SandboxWidgetProps> = ({ isActive, code, appName, onClose }) => {
  const [showCode, setShowCode] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isActive) return null;

  return (
    <div className={`fixed z-50 transition-all duration-500 ease-in-out flex flex-col items-center justify-center ${isMaximized ? 'inset-0 bg-black/95' : 'inset-0 bg-black/80 backdrop-blur-sm'}`}>
      
      <div className={`relative glass-panel border border-cyan-500 rounded-xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,255,0.2)] transition-all duration-500 ${isMaximized ? 'w-full h-full rounded-none border-none' : 'w-[90vw] h-[80vh] max-w-4xl'}`}>
        
        {/* Header */}
        <div className="bg-cyan-900/40 p-3 border-b border-cyan-500/30 flex justify-between items-center shrink-0">
           <div className="flex items-center space-x-3">
              <Terminal className="text-cyan-400 animate-pulse" size={20} />
              <div>
                 <h2 className="text-sm font-display text-white tracking-widest uppercase">NEURAL SANDBOX</h2>
                 <p className="text-[10px] text-cyan-400 font-mono tracking-wider">EXECUTING: {appName.toUpperCase()}</p>
              </div>
           </div>
           
           <div className="flex items-center space-x-2">
              <button 
                 onClick={() => setShowCode(!showCode)} 
                 className={`p-2 rounded hover:bg-cyan-900/50 transition-colors ${showCode ? 'text-white bg-cyan-900/50' : 'text-cyan-400'}`}
                 title="Toggle Code View"
              >
                 {showCode ? <Play size={16} /> : <Code size={16} />}
              </button>
              <button 
                 onClick={() => setIsMaximized(!isMaximized)} 
                 className="p-2 rounded hover:bg-cyan-900/50 text-cyan-400 transition-colors"
              >
                 {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={onClose} className="p-2 rounded hover:bg-red-900/50 text-red-400 transition-colors">
                 <X size={18} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black">
           {showCode ? (
              <pre className="absolute inset-0 p-4 text-xs font-mono text-green-400 overflow-auto whitespace-pre-wrap bg-gray-900 custom-scrollbar">
                 {code}
              </pre>
           ) : (
              <iframe 
                 srcDoc={code}
                 title="Neural Sandbox"
                 className="w-full h-full border-none"
                 sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
           )}
        </div>
        
        {/* Footer */}
        <div className="bg-black/80 p-1 flex justify-between items-center px-4 border-t border-gray-800 text-[9px] font-mono text-gray-500">
           <span>RUNTIME: ACTIVE</span>
           <span>SANDBOXED ENVIRONMENT</span>
        </div>

      </div>
    </div>
  );
};