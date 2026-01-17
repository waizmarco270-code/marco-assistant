import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, MicOff, Power, Video, VideoOff, Zap, ShieldAlert, MessageSquare, Send, X, Settings as SettingsIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip'; // Imported from esm.sh
import { GeminiLiveService } from './services/geminiService';
import { WakeWordService } from './services/wakeWordService';
import { MemoryService, FileHistoryEntry, VaultItem, EventCountdown } from './services/memoryService';
import AvatarCore from './components/AvatarCore';
import { StatusWidget, LogsWidget, ActionSuggestion, CreatorWidget } from './components/HudWidgets';
import { SearchOverlay } from './components/SearchOverlay';
import { MediaHud } from './components/MediaHud';
import { NavigationHud } from './components/NavigationHud';
import { TimerWidget } from './components/TimerWidget';
import { MemoryVaultUI } from './components/MemoryVaultUI';
import { WeatherWidget } from './components/WeatherWidget';
import { FileHistoryWidget } from './components/FileHistoryWidget';
import { CalendarWidget } from './components/CalendarWidget';
import { PhotoWidget, MusicWidget, SecretWidget, HoloDeckGenerator } from './components/VaultWidgets';
import { SandboxWidget } from './components/SandboxWidget'; 
import { NewsWidget, NewsItem } from './components/NewsWidget'; 
import { EventCountdownWidget } from './components/EventCountdownWidget'; 
import { SettingsWidget } from './components/SettingsWidget'; 
import { ConnectionState, MarcoState, LogEntry } from './types';
import { decodeAudioData, createPcmBlob, base64ToUint8Array } from './utils/audioUtils';

const SAMPLE_RATE = 16000;
const FRAME_RATE = 1; 
const JPEG_QUALITY = 0.6;

const THEME_HUES: Record<string, string> = {
    'CYBER': '0deg',
    'CRIMSON': '140deg', // Shifts cyan to red
    'VOID': '60deg',     // Shifts cyan to purple
    'BIO': '280deg',     // Shifts cyan to green
    'SOLAR': '180deg'    // Shifts cyan to gold/orange
};

const App: React.FC = () => {
  // --- State ---
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [marcoState, setMarcoState] = useState<MarcoState>(MarcoState.IDLE);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [audioLevel, setAudioLevel] = useState(0); 
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  
  // Feature States
  const [isSearching, setIsSearching] = useState(false);
  const [mediaState, setMediaState] = useState<{ active: boolean; query: string; command: 'play'|'pause'|null }>({ 
      active: false, query: '', command: null 
  });
  const [navState, setNavState] = useState<{ active: boolean; destination: string }>({
    active: false, destination: ''
  });
  const [timerState, setTimerState] = useState<{ active: boolean; duration: number }>({
    active: false, duration: 0
  });
  const [weatherState, setWeatherState] = useState<{ active: boolean; location: string }>({
    active: false, location: ''
  });
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isFileHistoryOpen, setIsFileHistoryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [chatInput, setChatInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [currentTheme, setCurrentTheme] = useState('CYBER'); 
  const [isCreatorWidgetActive, setIsCreatorWidgetActive] = useState(false); // NEW

  // --- New Feature States ---
  const [newsState, setNewsState] = useState<{ active: boolean; items: NewsItem[] }>({ active: false, items: [] });
  const [eventCountdown, setEventCountdown] = useState<EventCountdown | null>(null);

  // --- Holo-Deck & Vault Display States ---
  const [holoDeckState, setHoloDeckState] = useState<{ active: boolean; prompt: string }>({ active: false, prompt: '' });
  const [displayedPhoto, setDisplayedPhoto] = useState<VaultItem | null>(null);
  const [playingMusic, setPlayingMusic] = useState<VaultItem | null>(null);
  const [displayedSecret, setDisplayedSecret] = useState<VaultItem | null>(null);

  // --- Neural Sandbox State ---
  const [sandboxState, setSandboxState] = useState<{ active: boolean; code: string; appName: string }>({
    active: false, code: '', appName: ''
  });

  // --- Refs ---
  const geminiService = useRef<GeminiLiveService>(new GeminiLiveService({ apiKey: process.env.API_KEY as string }));
  const wakeWordService = useRef<WakeWordService | null>(null);
  const memoryService = useRef<MemoryService>(new MemoryService());
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null); 
  
  // Audio Playback Queue Management
  const activeAudioSources = useRef<AudioBufferSourceNode[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);
  const visualizerRafRef = useRef<number>();
  const wakeLockRef = useRef<any>(null);

  // Triple Tap Logic
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  // --- Load Persistent Data ---
  useEffect(() => {
      const savedCountdown = memoryService.current.getCountdown();
      if(savedCountdown) setEventCountdown(savedCountdown);

      // Check for saved API Key
      const savedKey = localStorage.getItem('MARCO_API_KEY');
      if (savedKey) {
          geminiService.current.updateApiKey(savedKey);
      }

      // Check for Saved Theme
      const savedTheme = localStorage.getItem('MARCO_THEME');
      if (savedTheme && THEME_HUES[savedTheme]) {
          setCurrentTheme(savedTheme);
      }
  }, []);

  // --- Helpers ---
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source: LogEntry['source'] = 'SYSTEM') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36), timestamp: new Date(), message, type, source }]);
  }, []);

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
  };

  const handleHistoryDownload = async (entry: FileHistoryEntry) => {
    try {
        if (entry.type === 'archive' && entry.filesJson) {
            const zip = new JSZip();
            const files = JSON.parse(entry.filesJson);
            files.forEach((f: any) => zip.file(f.name, f.content));
            const blob = await zip.generateAsync({type: "blob"});
            downloadBlob(blob, entry.name);
            addLog(`Restored Archive: ${entry.name}`, 'success');
        } else if (entry.type === 'file' && entry.content) {
            let mimeType = 'text/plain';
            if (entry.name.endsWith('.html')) mimeType = 'text/html';
            if (entry.name.endsWith('.js')) mimeType = 'text/javascript';
            if (entry.name.endsWith('.json')) mimeType = 'application/json';
            if (entry.name.endsWith('.py')) mimeType = 'text/x-python';
            const blob = new Blob([entry.content], { type: `${mimeType};charset=utf-8` });
            downloadBlob(blob, entry.name);
            addLog(`Restored File: ${entry.name}`, 'success');
        } else {
            addLog("Error: File content corrupted or missing.", "error");
        }
    } catch(e) {
        addLog("Restoration Failed.", "error");
    }
  };

  // --- SFX: Startup Sound ---
  const playWakeSound = useCallback(() => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  }, []);

  // --- Avatar Interaction (Triple Tap) ---
  const handleAvatarTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    
    tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
    }, 400); // 400ms window

    if (tapCountRef.current === 3) {
        // Triple Tap Detected
        addLog("Silent Link Established.", "warning", "SYSTEM");
        setIsChatOpen(true);
        tapCountRef.current = 0;
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      
      addLog(chatInput, "info", "USER");
      
      if (connectionState === ConnectionState.DISCONNECTED) {
          // If disconnected, just flash connection error
          addLog("Neural Link Offline. Connect first.", "error");
      } else {
          geminiService.current.sendText(chatInput);
      }
      setChatInput("");
  };

  const handleThemeChange = (themeId: string) => {
      setCurrentTheme(themeId);
      localStorage.setItem('MARCO_THEME', themeId);
      addLog(`Visual Interface Reconfigured: ${themeId}`, 'success', 'SYSTEM');
  };

  // --- Background Persistence ---
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { console.error(err); }
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    });
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, []);

  // --- Session Management ---
  const stopSession = useCallback(async () => {
     await geminiService.current.disconnect();
     if (inputSourceRef.current) inputSourceRef.current.disconnect();
     if (processorRef.current) processorRef.current.disconnect();
     if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
     if (visualizerRafRef.current) cancelAnimationFrame(visualizerRafRef.current);
     
     // Stop Audio Output
     stopAllAudio();

     setConnectionState(ConnectionState.DISCONNECTED);
     
     // Switch to SENTRY mode if wake word is active
     if (wakeWordService.current) {
         wakeWordService.current.start();
         setIsWakeWordActive(true);
         setMarcoState(MarcoState.SENTRY); 
         addLog("Sentry Mode Engaged.", "warning", "SYSTEM");
     } else {
         setMarcoState(MarcoState.IDLE);
         addLog("System Offline.", "info", "SYSTEM");
     }
     
     setMediaState(prev => ({ ...prev, command: 'pause' })); 
  }, [addLog]);

  // --- UNIVERSAL TOOL HANDLER (ADVANCED) ---
  const handleToolExecution = async (toolName: string, args: any) => {
    addLog(`Protocol: ${toolName}`, 'warning', 'MARCO');

    // 1. System Control
    if (toolName === 'systemControl') {
      if (args.action === 'shutdown') {
        setTimeout(() => stopSession(), 2000);
        return "Initiating Shutdown Sequence.";
      }
      if (args.action === 'show_creator_card') {
          setIsCreatorWidgetActive(true);
          return "Displaying Creator Identity Matrix.";
      }
      if (args.action === 'back_to_home') {
        setIsCameraActive(false);
        setIsSearching(false);
        setMediaState({ active: false, query: '', command: null });
        setNavState({ active: false, destination: '' });
        setTimerState({ active: false, duration: 0 });
        setWeatherState({ active: false, location: '' });
        setIsVaultOpen(false);
        setIsFileHistoryOpen(false);
        setIsCalendarOpen(false);
        setDisplayedPhoto(null);
        setPlayingMusic(null);
        setDisplayedSecret(null);
        setSandboxState({ active: false, code: '', appName: '' });
        setNewsState({ active: false, items: [] });
        setIsChatOpen(false);
        setIsSettingsOpen(false);
        setIsCreatorWidgetActive(false);
        return "UI Reset. Welcome home, Master.";
      }
      return "System config updated.";
    }

    // 2. Browser / Media
    if (toolName === 'browserControl') {
      if (args.action === 'google_search') {
         setIsSearching(true);
         setTimeout(() => {
             setIsSearching(false);
             window.open(`https://www.google.com/search?q=${encodeURIComponent(args.query)}`, '_blank');
         }, 2500); 
         return `Scanning Neural Net for: ${args.query}`;
      }
      if (args.action === 'play_music' || args.action === 'open_youtube') {
        const query = args.query || "lofi hip hop";
        setMediaState({ active: true, query, command: 'play' });
        return `Engaging Media Core: ${query}`;
      }
      if (args.action === 'pause_media') {
        setMediaState(prev => ({ ...prev, command: 'pause' }));
        return "Media Paused.";
      }
      if (args.action === 'resume_media') {
        setMediaState(prev => ({ ...prev, command: 'play' }));
        return "Media Resumed.";
      }
      if (args.action === 'stop_media') {
        setMediaState({ active: false, query: '', command: null });
        return "Media Core Disengaged.";
      }
      if (args.action === 'open_url') {
        window.open(args.query.startsWith('http') ? args.query : `https://${args.query}`, '_blank');
        return `Navigating to ${args.query}`;
      }
    }

    // 3. Communication
    if (toolName === 'communicationControl') {
      const recipientName = args.recipient;
      let target = recipientName;
      let foundInMemory = false;

      if (args.platform === 'whatsapp') {
        if (/[a-zA-Z]/.test(target)) {
           const storedNumber = memoryService.current.findContact(target);
           if (storedNumber) { target = storedNumber; foundInMemory = true; } 
           else { return `Error: Contact number for ${recipientName} not found in Memory.`; }
        }
        const text = encodeURIComponent(args.message);
        window.open(`https://wa.me/${target}?text=${text}`, '_blank');
        return `WhatsApp dispatched to ${foundInMemory ? recipientName : target}.`;
      }

      if (args.platform === 'email') {
         addLog("Drafting Email Protocol...", "info");
         if (/[a-zA-Z]/.test(target) && !target.includes('@')) {
             const storedEmail = memoryService.current.findEmail(target);
             if (storedEmail) { target = storedEmail; foundInMemory = true; addLog(`Email Found: ${target}`, 'success'); } 
             else { return `Error: Email address for ${recipientName} not found in Memory.`; }
         }
         const subject = encodeURIComponent(args.subject || "No Subject");
         const body = encodeURIComponent(args.message || "");
         window.open(`mailto:${target}?subject=${subject}&body=${body}`, '_self');
         return `Email client opened for ${foundInMemory ? recipientName : target}.`;
      }
    }

    // 4. Memory Vault
    if (toolName === 'memoryVault') {
      if (args.action === 'open_vault') {
          setIsVaultOpen(true);
          return "Authenticating... Omni-Vault Accessed.";
      }
      if (args.action === 'store') return memoryService.current.remember(args.key, args.value);
      if (args.action === 'retrieve') {
        // First try to find text memory, then fuzzy search vault for protocol/knowledge
        const val = memoryService.current.recall(args.key);
        if (val) return `Memory Retrieved: ${val}`;
        
        const item = await memoryService.current.findInVault(args.key);
        if (item && (item.type === 'protocol' || item.type === 'knowledge')) {
            return `VAULT DATA FOUND (${item.type.toUpperCase()}): ${item.content}`;
        }
        return `Data matching '${args.key}' not found.`;
      }
      
      if (args.action === 'show_media') {
          const item = await memoryService.current.findInVault(args.key);
          if (item && item.type === 'image') {
              setDisplayedPhoto(item);
              return `Displaying holo-frame for: ${item.label}`;
          }
          return `Visual data matching '${args.key}' not found in Vault.`;
      }
      if (args.action === 'play_audio') {
          const item = await memoryService.current.findInVault(args.key);
          if (item && item.type === 'audio') {
              setPlayingMusic(item);
              return `Engaging Sonic-Core for: ${item.label}`;
          }
          return `Audio file matching '${args.key}' not found in Vault.`;
      }
      if (args.action === 'reveal_secret') {
          const item = await memoryService.current.findInVault(args.key);
          if (item && item.type === 'secret') {
              setDisplayedSecret(item);
              return `Decryption authorized. Accessing secret: ${item.label}`;
          }
          return `Secure data '${args.key}' not found in Vault.`;
      }
      if (args.action === 'list_all') return memoryService.current.getAll();
      if (args.action === 'forget') return memoryService.current.forget(args.key);
    }

    // 5. Navigation Control
    if (toolName === 'navigationControl') {
      setNavState({ active: true, destination: args.location });
      return `Calculating route to ${args.location}...`;
    }

    // 6. Timer Control (Short term)
    if (toolName === 'timerControl') {
      setTimerState({ active: true, duration: args.duration });
      return `Chronometer initialized for ${args.duration} seconds.`;
    }

    // 7. File Control
    if (toolName === 'fileControl') {
       const { action, fileName, content, files_json } = args;

       if (action === 'create_archive' && files_json) {
           try {
             addLog("Compiling Project Archive...", "warning", "MARCO");
             const zip = new JSZip();
             const files = JSON.parse(files_json);
             files.forEach((f: any) => { zip.file(f.name, f.content); });

             const blob = await zip.generateAsync({type: "blob"});
             const finalName = fileName || "project_archive.zip";
             downloadBlob(blob, finalName);

             memoryService.current.addFileEntry({
                 id: Date.now().toString(),
                 name: finalName,
                 type: 'archive',
                 filesJson: files_json,
                 timestamp: Date.now()
             });
             return `Archive "${finalName}" compiled. Download initiated.`;
           } catch (e) {
             console.error(e);
             return "Error constructing archive protocol.";
           }
       } 
       
       if (action === 'write_file' || !action) {
           try {
               const name = fileName || `marco_code_${Date.now()}.txt`;
               let mimeType = 'text/plain';
               if (name.endsWith('.html')) mimeType = 'text/html';
               if (name.endsWith('.js')) mimeType = 'text/javascript';
               if (name.endsWith('.json')) mimeType = 'application/json';
               const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
               downloadBlob(blob, name);

               memoryService.current.addFileEntry({
                 id: Date.now().toString(),
                 name: name,
                 type: 'file',
                 content: content,
                 timestamp: Date.now()
               });
               return `File "${name}" generated. Download sequence active.`;
           } catch(e) {
               return "Error executing file write protocol.";
           }
       }
    }

    // 8. Weather Control
    if (toolName === 'weatherControl') {
        if (args.action === 'close_widget') {
            setWeatherState({ active: false, location: '' });
            return "Atmospheric sensors disengaged.";
        }
        setWeatherState({ active: true, location: args.location || 'current' });
        return `Scanning atmospheric data for ${args.location || 'current location'}...`;
    }

    // 9. Calendar Control
    if (toolName === 'calendarControl') {
        const { action, title, startTime, endTime } = args;
        
        if (action === 'close_calendar') {
            setIsCalendarOpen(false);
            return "Chronos Module minimized.";
        }
        if (action === 'add_event') {
            if (!title || !startTime) return "Error: Missing title or time for event.";
            let finalEndTime = endTime;
            if (!finalEndTime) {
                const start = new Date(startTime);
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                finalEndTime = end.toISOString();
            }
            memoryService.current.addEvent({ title, startTime, endTime: finalEndTime });
            setIsCalendarOpen(true);
            return `Event scheduled: "${title}" at ${new Date(startTime).toLocaleString()}.`;
        }
        if (action === 'list_events') {
            const events = memoryService.current.getEvents();
            setIsCalendarOpen(true);
            if (events.length === 0) return "Schedule is clear for the next 24 hours.";
            return `You have ${events.length} upcoming events. Displaying timeline.`;
        }
    }

    // 10. NEURAL SANDBOX
    if (toolName === 'neuralSandbox') {
        const { htmlCode, appName } = args;
        addLog(`Compiling Neural Sandbox App: ${appName}`, "success", "MARCO");
        setSandboxState({
            active: true,
            code: htmlCode,
            appName: appName || "Untitled Construct"
        });
        return `Neural Sandbox initiated. Executing ${appName}.`;
    }

    // 11. HOLO-DECK GENERATOR
    if (toolName === 'imageGenerationTool') {
        const { prompt } = args;
        
        // CHECK IF PROMPT IS A URL
        if (prompt.startsWith('http')) {
             setDisplayedPhoto({
                 id: Date.now().toString(),
                 type: 'image',
                 label: 'WEB IMAGE FETCHED',
                 content: prompt,
                 mimeType: 'image/jpeg',
                 timestamp: Date.now()
             });
             return "Displaying visual data from web source, Master.";
        }

        setHoloDeckState({ active: true, prompt });
        addLog(`Holo-Deck Construction Engaged: ${prompt}`, "warning", "MARCO");

        setTimeout(async () => {
            try {
                const base64Image = await geminiService.current.generateImage(prompt);
                
                if (base64Image) {
                    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
                    const newItem: VaultItem = {
                        id: Date.now().toString(),
                        type: 'image',
                        label: `Holo-Gen: ${prompt.substring(0, 20)}...`,
                        content: dataUrl,
                        mimeType: 'image/jpeg',
                        timestamp: Date.now()
                    };
                    await memoryService.current.saveToVault(newItem);
                    
                    setHoloDeckState({ active: false, prompt: '' });
                    setDisplayedPhoto(newItem);
                    addLog("Holo-Deck Visualization Complete.", "success", "SYSTEM");
                } else {
                    setHoloDeckState({ active: false, prompt: '' });
                    addLog("Holo-Deck Compilation Failed.", "error", "SYSTEM");
                }
            } catch (e) {
                console.error(e);
                setHoloDeckState({ active: false, prompt: '' });
                addLog("Critical Holo-Deck Failure.", "error", "SYSTEM");
            }
        }, 100);

        return "Holo-Deck Protocols Activated. Compiling visual data now.";
    }

    // 12. NEWS CONTROL
    if (toolName === 'newsControl') {
        const { items } = args;
        try {
            const newsItems = typeof items === 'string' ? JSON.parse(items) : items;
            setNewsState({ active: true, items: newsItems });
            addLog("Neural News Feed Active.", "success", "MARCO");
            return "Displaying aggregated news briefing.";
        } catch(e) {
            return "Error parsing news data stream.";
        }
    }

    // 13. COUNTDOWN CONTROL
    if (toolName === 'countdownControl') {
        const { action, targetDate, label } = args;
        
        if (action === 'set' && targetDate) {
            const finalLabel = label || "Target Event";
            memoryService.current.setCountdown(targetDate, finalLabel);
            setEventCountdown({ targetDate, label: finalLabel });
            addLog(`Event Tracker Set: ${finalLabel}`, "success");
            return `Countdown initialized for ${finalLabel} on ${new Date(targetDate).toLocaleDateString()}.`;
        }
        
        if (action === 'remove') {
            memoryService.current.clearCountdown();
            setEventCountdown(null);
            return "Event tracker cleared.";
        }
    }

    return "Protocol executed.";
  };

  // --- Audio / Gemini Setup ---
  const startSession = useCallback(async (trigger: 'button' | 'wake_word' = 'button') => {
    try {
      if (wakeWordService.current) {
          wakeWordService.current.stop();
          setIsWakeWordActive(false);
      }

      if (trigger === 'wake_word') {
          playWakeSound(); // Play SFX
      }

      setConnectionState(ConnectionState.CONNECTING);
      addLog("Initializing Neural Link...", "info");

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      await audioContextRef.current.resume();

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      outputAnalyserRef.current = analyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE } });
      
      await geminiService.current.connect(
        () => {
          setConnectionState(ConnectionState.CONNECTED);
          addLog("MARCO Online.", "success", "MARCO");
          setMarcoState(MarcoState.LISTENING); 
          setupAudioInput(stream);
          if (trigger === 'wake_word') {
             geminiService.current.sendText("WAKE_UP_PROTOCOL");
             setMarcoState(MarcoState.THINKING); 
          }
        },
        async (msg) => {
           // Handle Server Interruption Signal
           if (msg.serverContent?.interrupted) {
               // CRITICAL: Stop all currently playing audio immediately
               stopAllAudio();
               setMarcoState(MarcoState.LISTENING);
               return; 
           }

           const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
           if (audioData) {
             setMarcoState(MarcoState.SPEAKING);
             playAudioChunk(audioData);
           }
           if (msg.serverContent?.turnComplete) {
             setMarcoState(MarcoState.LISTENING);
           }
        },
        (err) => {
          console.error(err);
          addLog("Connection Error", "error");
          setConnectionState(ConnectionState.ERROR);
          stopAllAudio();
          // Restart wake word on error
          if(wakeWordService.current) { 
              wakeWordService.current.start(); 
              setIsWakeWordActive(true); 
              setMarcoState(MarcoState.SENTRY);
          }
        },
        () => {
          addLog("Session Ended", "info");
          setConnectionState(ConnectionState.DISCONNECTED);
          stopAllAudio();
        },
        handleToolExecution
      );

    } catch (e) {
      console.error(e);
      addLog("Initialization Failed.", "error");
      setConnectionState(ConnectionState.DISCONNECTED);
      if(wakeWordService.current) { 
          wakeWordService.current.start(); 
          setIsWakeWordActive(true); 
          setMarcoState(MarcoState.SENTRY);
      }
    }
  }, [addLog, playWakeSound]);

  // --- Visualizer Loop ---
  useEffect(() => {
    const renderVisualizer = () => {
        if (marcoState === MarcoState.SPEAKING && outputAnalyserRef.current) {
            const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
            outputAnalyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(1, (average / 100) * 1.5));
        }
        visualizerRafRef.current = requestAnimationFrame(renderVisualizer);
    };
    renderVisualizer();
    return () => { if (visualizerRafRef.current) cancelAnimationFrame(visualizerRafRef.current); }
  }, [marcoState]);

  // --- Wake Word Init ---
  useEffect(() => {
      wakeWordService.current = new WakeWordService(() => {
          addLog("Wake Word Detected", "success", "USER");
          // If already connected, just handle the wake trigger logic, but don't restart everything unnecessarily
          if (connectionState === ConnectionState.CONNECTED) {
              stopAllAudio(); // Stop him if he's talking
              geminiService.current.sendText("WAKE_UP_PROTOCOL");
          } else {
              startSession('wake_word');
          }
      });
      // Start Sentry Mode by default
      wakeWordService.current.start();
      setIsWakeWordActive(true);
      setMarcoState(MarcoState.SENTRY);

      return () => { wakeWordService.current?.stop(); };
  }, [addLog, startSession, connectionState]);

  // --- Audio Processing ---
  const setupAudioInput = (stream: MediaStream) => {
    if (!audioContextRef.current) return;
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    const source = inputCtx.createMediaStreamSource(stream);
    const processor = inputCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate Volume for UI and VAD (Voice Activity Detection)
      let sum = 0;
      for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      const volume = Math.sqrt(sum / inputData.length);
      
      if (marcoState !== MarcoState.SPEAKING) {
          setAudioLevel(volume * 5); 
      }
      
      // Basic VAD: If Marco is speaking and User talks loud enough, stop Marco.
      if (marcoState === MarcoState.SPEAKING && volume > 0.1) {
          // Optional: You can uncomment this if you want client-side barge-in
          // stopAllAudio();
      }

      if (isMicActive) {
          const pcmBlob = createPcmBlob(inputData);
          geminiService.current.sendAudioChunk(pcmBlob.data);
      }
    };
    source.connect(processor);
    processor.connect(inputCtx.destination); 
    inputSourceRef.current = source;
    processorRef.current = processor;
  };

  const stopAllAudio = () => {
      activeAudioSources.current.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      activeAudioSources.current = [];
      
      if (audioContextRef.current) {
          nextStartTimeRef.current = audioContextRef.current.currentTime;
      }
      setMarcoState(MarcoState.LISTENING);
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current || !outputAnalyserRef.current) return;
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

    try {
      const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), audioContextRef.current, 24000);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAnalyserRef.current);
      outputAnalyserRef.current.connect(audioContextRef.current.destination);
      
      const currentTime = audioContextRef.current.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      // Track the source
      activeAudioSources.current.push(source);
      
      source.onended = () => {
          // Remove from active sources
          activeAudioSources.current = activeAudioSources.current.filter(s => s !== source);
          if (activeAudioSources.current.length === 0) {
              setMarcoState(MarcoState.LISTENING);
          }
      };
    } catch (e) { console.error("Decode Error", e); }
  };

  // --- Vision ---
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
          frameIntervalRef.current = window.setInterval(captureAndSendFrame, 1000 / FRAME_RATE);
          addLog("Vision Module Active", "success");
        })
        .catch(e => { addLog("Camera access denied", "error"); setIsCameraActive(false); });
    } else {
      if (videoRef.current?.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    }
    return () => { if (frameIntervalRef.current) clearInterval(frameIntervalRef.current); };
  }, [isCameraActive]);

  const captureAndSendFrame = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
        geminiService.current.sendVideoFrame(base64);
    }
  };

  // --- Render ---
  return (
    <div 
        className="relative w-full h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-between p-4 selection:bg-cyan-500 selection:text-black transition-all duration-700"
        style={{ filter: `hue-rotate(${THEME_HUES[currentTheme] || '0deg'})` }}
    >
      
      {isSearching && <SearchOverlay />}
      <MediaHud 
        query={mediaState.query} 
        isActive={mediaState.active} 
        command={mediaState.command} 
        onClose={() => setMediaState({ active: false, query: '', command: null })} 
      />
      <NavigationHud 
        destination={navState.destination} 
        isActive={navState.active} 
        onClose={() => setNavState({ active: false, destination: '' })} 
      />
      <TimerWidget 
        duration={timerState.duration} 
        isActive={timerState.active} 
        onClose={() => setTimerState({ active: false, duration: 0 })}
        onComplete={() => {
            addLog("Timer Complete", "success");
        }}
      />
      
      <EventCountdownWidget 
          targetDate={eventCountdown?.targetDate || null} 
          label={eventCountdown?.label || "EVENT"} 
          onRemove={() => {
              memoryService.current.clearCountdown();
              setEventCountdown(null);
          }}
      />
      
      <WeatherWidget
          isActive={weatherState.active}
          locationQuery={weatherState.location}
          onClose={() => setWeatherState({ active: false, location: '' })}
          onDataLoaded={(desc) => {
              addLog(desc, "info", "MARCO");
          }}
      />
      
      <NewsWidget 
          isActive={newsState.active} 
          newsItems={newsState.items} 
          onClose={() => setNewsState({ active: false, items: [] })}
      />

      <MemoryVaultUI 
          isActive={isVaultOpen} 
          onClose={() => setIsVaultOpen(false)} 
          memoryService={memoryService.current} 
      />
      <FileHistoryWidget 
          isActive={isFileHistoryOpen}
          onClose={() => setIsFileHistoryOpen(false)}
          memoryService={memoryService.current}
          onDownload={handleHistoryDownload}
      />
      <CalendarWidget 
          isActive={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          memoryService={memoryService.current}
      />
      <SandboxWidget
          isActive={sandboxState.active}
          code={sandboxState.code}
          appName={sandboxState.appName}
          onClose={() => setSandboxState({ active: false, code: '', appName: '' })}
      />

      {/* SYSTEM CORE (SETTINGS) */}
      <SettingsWidget 
          isActive={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          geminiService={geminiService.current}
      />

      {/* CREATOR IDENTITY WIDGET */}
      <CreatorWidget 
          isActive={isCreatorWidgetActive}
          onClose={() => setIsCreatorWidgetActive(false)}
      />
      
      {/* Omni-Vault Widgets */}
      <HoloDeckGenerator isActive={holoDeckState.active} prompt={holoDeckState.prompt} />
      <PhotoWidget item={displayedPhoto} onClose={() => setDisplayedPhoto(null)} />
      <MusicWidget item={playingMusic} onClose={() => setPlayingMusic(null)} />
      <SecretWidget item={displayedSecret} onClose={() => setDisplayedSecret(null)} />
      
      {/* SILENT LINK CHAT OVERLAY */}
      {isChatOpen && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-sm glass-panel border border-cyan-500 rounded-lg p-3 z-50 animate-slide-up shadow-[0_0_50px_rgba(0,255,255,0.2)]">
              <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                      <MessageSquare size={14} className="text-cyan-400" />
                      <span className="text-xs font-display text-cyan-300 tracking-widest">SILENT LINK</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)}><X size={14} className="text-gray-500 hover:text-white"/></button>
              </div>
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="ENTER COMMAND..."
                    className="flex-1 bg-black/50 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="bg-cyan-900/50 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 text-cyan-400 p-2 rounded transition-all">
                      <Send size={16} />
                  </button>
              </form>
          </div>
      )}

      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      {/* --- REFACTORED TOP HEADER --- */}
      <div className="w-full flex justify-between items-start z-20">
        <div className="flex flex-col">
            <h1 className="text-3xl font-display font-bold tracking-widest neon-text">MARCO</h1>
            <span className="text-xs text-cyan-500 tracking-[0.3em]">AI OPERATING SYSTEM</span>
        </div>
        
        {/* RIGHT SIDE: Settings + Status Container */}
        <div className="flex items-start space-x-3">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 glass-panel rounded-full hover:bg-cyan-900/30 text-cyan-400 hover:text-white transition-colors border border-cyan-500/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] group"
            >
                <SettingsIcon size={20} className="animate-spin-slow group-hover:text-white" />
            </button>
            <StatusWidget isConnected={connectionState === ConnectionState.CONNECTED} battery={batteryLevel} />
        </div>
      </div>

      <LogsWidget logs={logs} />

      <div className="relative flex-1 flex items-center justify-center w-full">
         <div onClick={handleAvatarTap} className="cursor-pointer">
             <AvatarCore state={marcoState} audioLevel={audioLevel} />
         </div>
         
         {isWakeWordActive && connectionState === ConnectionState.DISCONNECTED && (
             <div className="absolute bottom-10 flex items-center space-x-2 animate-pulse">
                <ShieldAlert size={16} className="text-red-500" />
                <span className="text-xs font-display text-red-500 tracking-widest">SENTRY MODE ACTIVE</span>
             </div>
         )}
         
         <video ref={videoRef} className="hidden" muted playsInline />
         <canvas ref={canvasRef} className="hidden" />

         {isCameraActive && (
             <div className="absolute top-4 left-4 w-32 h-48 border-2 border-cyan-500/50 rounded-lg overflow-hidden glass-panel z-30">
                 <video ref={el => { if(el && videoRef.current?.srcObject) el.srcObject = videoRef.current.srcObject }} 
                    autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
                 <div className="absolute bottom-0 w-full bg-black/50 text-[10px] text-center text-cyan-400 font-mono">VISION FEED</div>
             </div>
         )}
      </div>

      <div className="w-full flex justify-center space-x-2 mb-8 z-20 overflow-x-auto pb-2">
         <ActionSuggestion label="Vault" onClick={() => handleToolExecution('memoryVault', {action: 'open_vault'})} />
         <ActionSuggestion label="Files" onClick={() => setIsFileHistoryOpen(true)} />
         <ActionSuggestion label="News" onClick={() => handleToolExecution('newsControl', {items: []})} />
         <ActionSuggestion label="Calendar" onClick={() => setIsCalendarOpen(true)} />
         <ActionSuggestion label="Code" onClick={() => handleToolExecution('neuralSandbox', {appName: 'Demo', htmlCode: '<h1>Hello</h1>'})} />
         <ActionSuggestion label="Sleep" onClick={() => handleToolExecution('systemControl', {action: 'shutdown'})} />
      </div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-4 flex items-center justify-between z-30 neon-glow">
        <button onClick={() => setIsCameraActive(!isCameraActive)} className={`p-4 rounded-full transition-all ${isCameraActive ? 'bg-cyan-500 text-black shadow-[0_0_15px_#0ff]' : 'bg-gray-800 text-gray-400'}`}>
            {isCameraActive ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button onClick={() => connectionState === ConnectionState.CONNECTED ? stopSession() : startSession('button')} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${connectionState === ConnectionState.CONNECTED ? 'border-cyan-400 bg-cyan-900/50 shadow-[0_0_30px_#0ff]' : 'border-red-500/50 bg-red-900/20 shadow-[0_0_20px_rgba(255,0,0,0.3)]'}`}>
            {connectionState === ConnectionState.CONNECTING ? (
                <div className="w-8 h-8 border-2 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            ) : (
                <Power size={32} className={connectionState === ConnectionState.CONNECTED ? 'text-cyan-400' : 'text-red-500'} />
            )}
        </button>

        <button onClick={() => setIsMicActive(!isMicActive)} className={`p-4 rounded-full transition-all ${isMicActive ? 'bg-cyan-900/50 text-cyan-400' : 'bg-red-900/50 text-red-400'}`}>
            {isMicActive ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
      </div>
      
      <div className="text-[10px] text-gray-600 mt-2 font-mono">v2.1.0 | MARCO OS ONLINE</div>
    </div>
  );
};

export default App;