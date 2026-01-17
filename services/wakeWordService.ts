export class WakeWordService {
  private recognition: any;
  private isListening: boolean = false;
  private callback: () => void;
  private restartTimer: any;

  constructor(onWake: () => void) {
    this.callback = onWake;
    
    // Support for Chrome/Edge/Android Webview
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
        
        // Keyword Spotting Logic - More permissive
        if (
             transcript.includes('marco') || 
             transcript.includes('hey marco') || 
             transcript.includes('wake up') ||
             transcript.includes('system')
           ) {
          console.log("[WakeWord] Detected:", transcript);
          
          // Stop immediately to prevent double firing
          this.stop(); 
          this.callback();
        }
      };

      this.recognition.onerror = (event: any) => {
        // Automatically restart on errors unless forbidden
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.isListening = false;
        } else {
            // Debounce restart
            clearTimeout(this.restartTimer);
            this.restartTimer = setTimeout(() => {
                if(this.isListening) try { this.recognition.start(); } catch(e){}
            }, 1000);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
           // Aggressive Auto-restart
           clearTimeout(this.restartTimer);
           this.restartTimer = setTimeout(() => {
             try { this.recognition.start(); } catch(e) {}
           }, 200);
        }
      };
    } else {
        console.warn("[WakeWord] Web Speech API not supported in this browser.");
    }
  }

  start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
      this.isListening = true;
      console.log("[WakeWord] Sentry Mode Active");
    } catch (e) {
      console.warn("[WakeWord] Failed to start:", e);
    }
  }

  stop() {
    if (!this.recognition) return;
    this.isListening = false;
    clearTimeout(this.restartTimer);
    try { this.recognition.stop(); } catch(e) {}
    console.log("[WakeWord] Sentry Mode Deactivated");
  }
}