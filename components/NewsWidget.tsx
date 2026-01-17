import React, { useState } from 'react';
import { Newspaper, Globe, Cpu, Atom, Shield, X, RefreshCw, Radio } from 'lucide-react';

export interface NewsItem {
    title: string;
    category: 'TECH' | 'GLOBAL' | 'SCIENCE' | 'INTEL';
    summary: string;
}

interface NewsWidgetProps {
    isActive: boolean;
    newsItems: NewsItem[];
    onClose: () => void;
}

export const NewsWidget: React.FC<NewsWidgetProps> = ({ isActive, newsItems, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    if (!isActive) return null;

    const categories = ['ALL', 'TECH', 'GLOBAL', 'SCIENCE'];

    const filteredItems = selectedCategory === 'ALL' 
        ? newsItems 
        : newsItems.filter(item => item.category === selectedCategory);

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'TECH': return <Cpu size={14} className="text-cyan-400" />;
            case 'GLOBAL': return <Globe size={14} className="text-blue-400" />;
            case 'SCIENCE': return <Atom size={14} className="text-purple-400" />;
            case 'INTEL': return <Shield size={14} className="text-red-400" />;
            default: return <Radio size={14} className="text-gray-400" />;
        }
    };

    return (
        <div className="absolute top-24 left-4 w-96 glass-panel border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.1)] z-40 animate-slide-right">
            
            {/* Header */}
            <div className="bg-gray-900/80 p-3 border-b border-cyan-500/50 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10"></div>
                <div className="flex items-center space-x-2 z-10">
                    <Newspaper className="text-cyan-400" size={18} />
                    <span className="text-xs font-display text-cyan-100 tracking-widest">NEURAL NEWS NETWORK</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors z-10"><X size={16} /></button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-800 bg-black/40">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-1 py-2 text-[10px] font-mono tracking-wider transition-colors border-b-2 ${
                            selectedCategory === cat 
                            ? 'text-cyan-300 border-cyan-500 bg-cyan-900/10' 
                            : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Feed Content */}
            <div className="max-h-96 overflow-y-auto p-4 custom-scrollbar bg-black/60">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 space-y-2">
                        <RefreshCw className="animate-spin text-cyan-600" size={24} />
                        <span className="text-xs font-mono text-cyan-600">ACQUIRING SIGNAL...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredItems.map((item, index) => (
                            <div key={index} className="group relative border-l-2 border-cyan-500/20 pl-4 py-1 hover:border-cyan-400 transition-colors">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-black border border-cyan-500/50 group-hover:bg-cyan-400 transition-colors"></div>
                                
                                <div className="flex items-center space-x-2 mb-1">
                                    {getIcon(item.category)}
                                    <span className={`text-[9px] font-bold tracking-widest px-1 rounded ${
                                        item.category === 'TECH' ? 'bg-cyan-900/40 text-cyan-300' :
                                        item.category === 'GLOBAL' ? 'bg-blue-900/40 text-blue-300' :
                                        item.category === 'SCIENCE' ? 'bg-purple-900/40 text-purple-300' :
                                        'bg-red-900/40 text-red-300'
                                    }`}>
                                        {item.category}
                                    </span>
                                </div>
                                
                                <h3 className="text-sm font-display text-white mb-1 leading-snug group-hover:text-cyan-200 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                                    {item.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-cyan-900/20 p-1 border-t border-cyan-500/20 flex justify-between items-center px-2">
                <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
                    <span className="text-[8px] font-mono text-cyan-600">LIVE FEED ACTIVE</span>
                </div>
                <span className="text-[8px] font-mono text-gray-500">SOURCE: MARCO INTELLIGENCE</span>
            </div>
        </div>
    );
};
