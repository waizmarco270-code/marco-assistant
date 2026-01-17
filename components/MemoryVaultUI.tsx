import React, { useState, useEffect, useRef } from 'react';
import { Database, Trash2, Search, X, Lock, Key, Image as ImageIcon, Music, Upload, Eye, FileText, Download, Terminal, BookOpen, Save } from 'lucide-react';
import { MemoryService, VaultItem } from '../services/memoryService';

interface MemoryVaultUIProps {
  isActive: boolean;
  onClose: () => void;
  memoryService: MemoryService;
}

type Tab = 'memories' | 'media' | 'secrets' | 'protocols' | 'knowledge';

export const MemoryVaultUI: React.FC<MemoryVaultUIProps> = ({ isActive, onClose, memoryService }) => {
  const [activeTab, setActiveTab] = useState<Tab>('memories');
  const [items, setItems] = useState<any[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Upload/Add State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLabel, setUploadLabel] = useState('');
  const [textValue, setTextValue] = useState(''); // Unified text value for secrets/protocols/knowledge
  const [isUploadMode, setIsUploadMode] = useState(false);

  // Load items
  useEffect(() => {
    if (isActive) {
      setTimeout(() => setIsUnlocked(true), 1500);
      refreshItems();
    } else {
      setIsUnlocked(false);
      setIsUploadMode(false);
      setTextValue('');
      setUploadLabel('');
    }
  }, [isActive]);

  const refreshItems = async () => {
    // Standard Memories
    const raw = memoryService.getRaw();
    setItems((Object.values(raw) as any[]).sort((a, b) => b.timestamp - a.timestamp));
    
    // Omni-Vault Items
    const vItems = await memoryService.getAllVaultItems();
    setVaultItems(vItems.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDelete = async (key: string, isVault: boolean = false) => {
    if (isVault) await memoryService.deleteFromVault(key);
    else memoryService.forget(key);
    refreshItems();
  };

  const handleDownload = (item: VaultItem) => {
      const link = document.createElement('a');
      link.href = item.content;
      link.download = `${item.label.replace(/\s+/g, '_')}.jpg`;
      link.click();
  };

  // --- CRUD Creation Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const type = file.type.startsWith('image/') ? 'image' : 'audio';
      
      const newItem: VaultItem = {
        id: Date.now().toString(),
        type,
        label: uploadLabel || file.name,
        content: base64,
        mimeType: file.type,
        timestamp: Date.now()
      };
      
      await memoryService.saveToVault(newItem);
      refreshItems();
      resetForm();
    };
    reader.readAsDataURL(file);
  };

  const saveTextData = async () => {
    if(!uploadLabel || !textValue) return;
    
    // Determine type based on active tab
    let type: VaultItem['type'] = 'secret';
    if (activeTab === 'protocols') type = 'protocol';
    if (activeTab === 'knowledge') type = 'knowledge';

    const newItem: VaultItem = {
        id: Date.now().toString(),
        type: type,
        label: uploadLabel,
        content: textValue,
        timestamp: Date.now()
    };
    await memoryService.saveToVault(newItem);
    refreshItems();
    resetForm();
  };

  const resetForm = () => {
      setIsUploadMode(false);
      setUploadLabel('');
      setTextValue('');
  };

  if (!isActive) return null;

  // Filter Logic
  const filteredMemories = items.filter(i => i.key.includes(searchTerm.toLowerCase()));
  const filteredVault = vaultItems.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-300">
      
      {!isUnlocked && (
        <div className="flex flex-col items-center animate-pulse">
            <Lock size={64} className="text-cyan-500 mb-4" />
            <h2 className="text-2xl font-display text-cyan-500 tracking-widest">OMNI-VAULT</h2>
            <div className="w-64 h-2 bg-gray-900 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 animate-[width_1.5s_ease-in-out_forwards]" style={{width: '0%'}}></div>
            </div>
            <p className="text-xs text-cyan-400 font-mono mt-2">RETINAL SCAN COMPLETE...</p>
        </div>
      )}

      {isUnlocked && (
        <div className="w-full max-w-4xl h-[90vh] bg-gray-900/90 border border-cyan-500/50 rounded-xl shadow-[0_0_80px_rgba(0,255,255,0.1)] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-cyan-900/30 p-4 border-b border-cyan-500/50 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none"></div>
                <div className="flex items-center space-x-3 z-10">
                    <Database className="text-cyan-400" />
                    <div>
                        <h2 className="text-xl font-display text-white tracking-widest">OMNI-VAULT</h2>
                        <p className="text-[10px] text-cyan-400 font-mono">LEVEL 7 SECURE STORAGE // AI TRAINING DATA</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors z-10">
                    <X />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 overflow-x-auto">
               {[
                   {id: 'memories', label: 'MEMORY', icon: <Database size={14}/>}, 
                   {id: 'media', label: 'MEDIA', icon: <ImageIcon size={14}/>}, 
                   {id: 'secrets', label: 'SECRETS', icon: <Lock size={14}/>},
                   {id: 'protocols', label: 'PROTOCOLS', icon: <Terminal size={14}/>},
                   {id: 'knowledge', label: 'KNOWLEDGE', icon: <BookOpen size={14}/>}
               ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => { setActiveTab(tab.id as Tab); resetForm(); }}
                     className={`flex-1 min-w-[100px] py-3 text-[10px] font-display tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === tab.id ? 'bg-cyan-900/30 text-cyan-300 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                   >
                     {tab.icon}
                     <span>{tab.label}</span>
                   </button>
               ))}
            </div>

            {/* Search / Action Bar */}
            <div className="p-4 border-b border-gray-800 flex space-x-2 bg-black/40">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="SEARCH DATA BANK..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono text-sm uppercase"
                    />
                </div>
                {activeTab !== 'memories' && (
                    <button 
                       onClick={() => setIsUploadMode(!isUploadMode)}
                       className={`px-4 rounded-lg border transition-all flex items-center space-x-2 ${isUploadMode ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-cyan-900/20 border-cyan-500 text-cyan-400'}`}
                    >
                       {isUploadMode ? <X size={16}/> : <Upload size={16}/>}
                       <span className="text-xs font-bold hidden sm:inline">{isUploadMode ? 'CANCEL' : 'ADD NEW'}</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/40 relative">
                
                {/* UPLOAD / ADD OVERLAY */}
                {isUploadMode && (
                   <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center p-8 animate-fade-in backdrop-blur-sm">
                      <h3 className="text-cyan-400 font-display mb-6 tracking-widest border-b border-cyan-500/30 pb-2">
                          {activeTab === 'media' ? 'SECURE MEDIA UPLOAD' : 
                           activeTab === 'protocols' ? 'DEFINE NEW PROTOCOL' :
                           activeTab === 'knowledge' ? 'ADD KNOWLEDGE ENTRY' : 'ENCRYPT SECRET'}
                      </h3>
                      
                      <div className="w-full max-w-lg space-y-4">
                          <input 
                            type="text" 
                            placeholder="ENTER LABEL / TITLE" 
                            value={uploadLabel}
                            onChange={e => setUploadLabel(e.target.value)}
                            className="w-full bg-gray-900 border border-cyan-500/50 rounded p-3 text-white text-center font-mono focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                          />

                          {/* MEDIA UPLOAD UI */}
                          {activeTab === 'media' && (
                             <div className="space-y-4">
                                <input 
                                   type="file" 
                                   ref={fileInputRef} 
                                   accept="image/*,audio/*" 
                                   className="hidden" 
                                   onChange={handleFileUpload}
                                />
                                <button 
                                   onClick={() => fileInputRef.current?.click()}
                                   className="w-full border-2 border-dashed border-cyan-500/30 hover:border-cyan-500 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:text-cyan-400 transition-all cursor-pointer group"
                                >
                                   <Upload size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                                   <span className="text-xs tracking-widest">SELECT FILE FROM LOCAL DRIVE</span>
                                </button>
                             </div>
                          )}

                          {/* TEXT UPLOAD UI (Secrets, Protocols, Knowledge) */}
                          {['secrets', 'protocols', 'knowledge'].includes(activeTab) && (
                              <div className="space-y-4">
                                 <textarea 
                                   placeholder={
                                       activeTab === 'protocols' ? "Example: 'When user says Code Red, turn UI red.'" :
                                       activeTab === 'knowledge' ? "Enter detailed notes, facts, or data..." :
                                       "Enter sensitive data..."
                                   }
                                   value={textValue}
                                   onChange={e => setTextValue(e.target.value)}
                                   className="w-full h-40 bg-gray-900 border border-gray-700 rounded p-3 text-gray-300 font-mono focus:border-cyan-500 focus:outline-none resize-none"
                                 />
                                 <button onClick={saveTextData} className="w-full bg-cyan-900/30 border border-cyan-500 text-cyan-300 py-3 rounded font-display hover:bg-cyan-900/50 flex items-center justify-center space-x-2">
                                    <Save size={16} />
                                    <span>{activeTab === 'secrets' ? 'ENCRYPT & STORE' : 'SAVE TO DATABASE'}</span>
                                 </button>
                              </div>
                          )}
                      </div>
                   </div>
                )}

                {/* MEMORIES LIST */}
                {activeTab === 'memories' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredMemories.map(m => (
                            <div key={m.key} className="bg-gray-800/40 p-4 rounded-lg border border-white/5 flex justify-between hover:border-cyan-500/30 transition-all">
                                <div>
                                    <div className="text-xs text-cyan-400 font-mono uppercase mb-1">{m.key}</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">{m.value}</div>
                                </div>
                                <button onClick={() => handleDelete(m.key)} className="text-gray-600 hover:text-red-500 self-start"><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* MEDIA LIST */}
                {activeTab === 'media' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredVault.filter(i => i.type !== 'secret' && i.type !== 'protocol' && i.type !== 'knowledge').map(item => (
                            <div key={item.id} className="bg-gray-800/40 rounded-lg border border-white/5 relative group overflow-hidden hover:border-cyan-500/50 transition-all">
                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {item.type === 'image' && (
                                        <button onClick={() => handleDownload(item)} className="p-1.5 bg-black/60 rounded hover:text-cyan-400 text-gray-300"><Download size={14}/></button>
                                    )}
                                    <button onClick={() => handleDelete(item.label, true)} className="p-1.5 bg-black/60 rounded hover:text-red-500 text-gray-300"><Trash2 size={14}/></button>
                                </div>
                                
                                <div className="flex flex-col items-center justify-center h-32 mb-2 bg-black/20">
                                    {item.type === 'image' ? (
                                        <img src={item.content} alt={item.label} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Music size={32} className="text-purple-400 opacity-70 group-hover:scale-110 transition-transform" />
                                            <div className="mt-2 w-16 h-1 bg-purple-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 animate-[width_1s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center px-2 pb-2">
                                    <div className="text-xs font-display text-white truncate">{item.label}</div>
                                    <div className="text-[9px] text-gray-500 font-mono uppercase">{item.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PROTOCOLS LIST (NEW) */}
                {activeTab === 'protocols' && (
                    <div className="space-y-3">
                        {filteredVault.filter(i => i.type === 'protocol').map(item => (
                            <div key={item.id} className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-lg hover:bg-cyan-900/20 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Terminal size={16} className="text-cyan-500" />
                                        <span className="text-sm font-display text-cyan-300 tracking-widest">{item.label}</span>
                                    </div>
                                    <button onClick={() => handleDelete(item.label, true)} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                                <div className="bg-black/50 p-3 rounded text-xs font-mono text-gray-300 border-l-2 border-cyan-600">
                                    {item.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                 {/* KNOWLEDGE LIST (NEW) */}
                 {activeTab === 'knowledge' && (
                    <div className="space-y-3">
                        {filteredVault.filter(i => i.type === 'knowledge').map(item => (
                            <div key={item.id} className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg hover:border-cyan-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <BookOpen size={16} className="text-purple-400" />
                                        <span className="text-sm font-display text-white tracking-widest">{item.label}</span>
                                    </div>
                                    <button onClick={() => handleDelete(item.label, true)} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                                <div className="text-xs font-sans text-gray-400 whitespace-pre-wrap leading-relaxed">
                                    {item.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SECRETS LIST */}
                {activeTab === 'secrets' && (
                    <div className="space-y-2">
                        {filteredVault.filter(i => i.type === 'secret').map(item => (
                            <div key={item.id} className="bg-red-900/10 border border-red-900/30 p-4 rounded flex justify-between items-center hover:bg-red-900/20 transition-all">
                                <div className="flex items-center space-x-3">
                                    <Lock size={16} className="text-red-500" />
                                    <span className="text-sm font-mono text-red-200">{item.label}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                     <span className="text-[10px] text-red-500/50 font-mono tracking-widest">ENCRYPTED</span>
                                     <button onClick={() => handleDelete(item.label, true)} className="text-gray-600 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};