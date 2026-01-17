import React, { useState, useEffect } from 'react';
import { Settings, X, Key, Check, AlertTriangle, Shield, Palette, Zap } from 'lucide-react';
import { GeminiLiveService } from '../services/geminiService';

interface SettingsWidgetProps {
    isActive: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    geminiService: GeminiLiveService;
}

const THEMES = [
    { id: 'CYBER', label: 'CYBER CYAN', color: 'bg-cyan-500', hue: '0deg' },
    { id: 'CRIMSON', label: 'CRIMSON OPS', color: 'bg-red-600', hue: '320deg' }, // Hue rotate creates red from cyan
    { id: 'VOID', label: 'VOID WALKER', color: 'bg-purple-600', hue: '260deg' },
    { id: 'BIO', label: 'BIO HAZARD', color: 'bg-green-500', hue: '100deg' },
    { id: 'SOLAR', label: 'SOLAR FLARE', color: 'bg-orange-500', hue: '45deg' },
];

export const SettingsWidget: React.FC<SettingsWidgetProps> = ({ isActive, onClose, currentTheme, onThemeChange, geminiService }) => {
    const [apiKey, setApiKey] = useState('');
    const [keyStatus, setKeyStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
    const [savedKey, setSavedKey] = useState<boolean>(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('MARCO_API_KEY');
        if (storedKey) {
            setSavedKey(true);
            setApiKey(storedKey);
        }
    }, []);

    const handleKeyValidation = async () => {
        if (!apiKey.trim()) return;
        setKeyStatus('validating');
        
        // Temporarily update service to test key
        geminiService.updateApiKey(apiKey);
        const isValid = await geminiService.validateCurrentKey();
        
        if (isValid) {
            setKeyStatus('valid');
            localStorage.setItem('MARCO_API_KEY', apiKey);
            setSavedKey(true);
        } else {
            setKeyStatus('invalid');
            // Revert to saved key or system default if validation fails
            geminiService.updateApiKey(localStorage.getItem('MARCO_API_KEY') || process.env.API_KEY || process.env.GEMINI_API_KEY || ''); 
        }
    };

    const handleRemoveKey = () => {
        localStorage.removeItem('MARCO_API_KEY');
        setApiKey('');
        setSavedKey(false);
        setKeyStatus('idle');
        geminiService.updateApiKey(process.env.API_KEY || process.env.GEMINI_API_KEY || '');
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-lg animate-fade-in">
            <div className="w-full max-w-lg glass-panel border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_100px_rgba(0,255,255,0.1)] flex flex-col relative">
                
                {/* Header */}
                <div className="bg-cyan-900/40 p-4 border-b border-cyan-500/30 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Settings className="text-cyan-400 animate-spin-slow" size={20} />
                        <div>
                            <h2 className="text-lg font-display text-white tracking-[0.2em]">SYSTEM CORE</h2>
                            <p className="text-[10px] text-cyan-400 font-mono uppercase">CONFIGURATION MATRIX</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar">

                    {/* API Key Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-cyan-300 border-b border-gray-800 pb-2">
                            <Key size={18} />
                            <span className="text-sm font-display tracking-widest">API KEY OVERRIDE</span>
                        </div>
                        
                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Enter your personal Google Gemini API Key to bypass system limits and unlock full potential.
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline ml-1">
                                    Get Key Here
                                </a>
                            </p>

                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={(e) => { setApiKey(e.target.value); setKeyStatus('idle'); }}
                                    placeholder="Paste API Key (starts with AIza...)"
                                    className={`w-full bg-black border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none transition-all ${
                                        keyStatus === 'valid' ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 
                                        keyStatus === 'invalid' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 
                                        'border-gray-700 focus:border-cyan-500'
                                    }`}
                                />
                                {keyStatus === 'validating' && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {keyStatus === 'valid' && <Check size={16} className="absolute right-3 top-2.5 text-green-500" />}
                                {keyStatus === 'invalid' && <AlertTriangle size={16} className="absolute right-3 top-2.5 text-red-500" />}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center space-x-2">
                                    <Shield size={14} className={savedKey ? "text-green-500" : "text-gray-600"} />
                                    <span className={`text-[10px] font-mono ${savedKey ? "text-green-500" : "text-gray-600"}`}>
                                        {savedKey ? "SECURE KEY ACTIVE" : "USING SYSTEM DEFAULT"}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    {savedKey && (
                                        <button 
                                            onClick={handleRemoveKey}
                                            className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 border border-red-900/50 rounded transition-colors"
                                        >
                                            REMOVE
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleKeyValidation}
                                        disabled={!apiKey || keyStatus === 'validating'}
                                        className={`px-4 py-1.5 text-xs font-bold rounded flex items-center space-x-1 transition-all ${
                                            keyStatus === 'valid' ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-black'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <Zap size={12} />
                                        <span>{keyStatus === 'valid' ? 'AUTHORIZED' : 'VALIDATE & SAVE'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-cyan-300 border-b border-gray-800 pb-2">
                            <Palette size={18} />
                            <span className="text-sm font-display tracking-widest">VISUAL INTERFACE</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => onThemeChange(theme.id)}
                                    className={`relative group overflow-hidden p-3 rounded-lg border transition-all flex items-center justify-between ${
                                        currentTheme === theme.id 
                                        ? 'bg-white/5 border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.1)]' 
                                        : 'bg-black/40 border-gray-800 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3 z-10">
                                        <div className={`w-8 h-8 rounded border border-white/20 shadow-inner ${theme.color}`}></div>
                                        <span className={`font-display text-sm tracking-widest ${currentTheme === theme.id ? 'text-white' : 'text-gray-400'}`}>
                                            {theme.label}
                                        </span>
                                    </div>
                                    {currentTheme === theme.id && (
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse z-10"></div>
                                    )}
                                    {/* Theme preview gradient background */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${theme.color}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <div className="text-[10px] text-gray-600 font-mono">SYSTEM ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};