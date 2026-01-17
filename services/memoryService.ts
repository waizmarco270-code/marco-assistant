// Interfaces
export interface MemoryItem {
  key: string;
  value: string;
  timestamp: number;
}

export interface VaultItem {
  id: string;
  type: 'image' | 'audio' | 'secret' | 'protocol' | 'knowledge'; // Added protocol & knowledge
  label: string;
  content: string; // Base64 for media, Text for secrets/protocols
  mimeType?: string;
  timestamp: number;
}

export interface FileHistoryEntry {
  id: string;
  name: string;
  type: 'file' | 'archive';
  content?: string;
  filesJson?: string;
  timestamp: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

export interface EventCountdown {
  targetDate: string; // ISO String
  label: string;
}

const STORAGE_KEY = 'MARCO_MEMORY_VAULT';
const HISTORY_KEY = 'MARCO_FILE_HISTORY';
const CALENDAR_KEY = 'MARCO_CALENDAR_DB';
const COUNTDOWN_KEY = 'MARCO_COUNTDOWN';
const DB_NAME = 'MARCO_OMNI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'vault_media';

export class MemoryService {
  private memories: Record<string, MemoryItem> = {};
  private fileHistory: FileHistoryEntry[] = [];
  private calendarEvents: CalendarEvent[] = [];
  private eventCountdown: EventCountdown | null = null;
  private db: IDBDatabase | null = null;

  constructor() {
    this.loadLocalStorage();
    this.initDB();
  }

  // --- IndexedDB Setup (For heavy files) ---
  private initDB() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'label' }); // Index by label for easy search
      }
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      console.log("Omni-Vault Database Initialized");
    };

    request.onerror = (event) => {
      console.error("Omni-Vault DB Error", event);
    };
  }

  // --- Vault Methods (Async due to DB) ---
  async saveToVault(item: VaultItem): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject("Database not ready"); return; }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const normalizedItem = { ...item, label: item.label.toLowerCase().trim() };
      const req = store.put(normalizedItem);
      
      req.onsuccess = () => resolve("Item secured in Vault.");
      req.onerror = () => reject("Vault storage failed.");
    });
  }

  async getFromVault(label: string): Promise<VaultItem | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(null); return; }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(label.toLowerCase().trim());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async findInVault(query: string): Promise<VaultItem | null> {
      return new Promise((resolve) => {
          if (!this.db) { resolve(null); return; }
          const tx = this.db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.openCursor();
          const search = query.toLowerCase().trim();

          request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result;
              if (cursor) {
                  const item = cursor.value as VaultItem;
                  if (item.label.includes(search)) {
                      resolve(item);
                      return;
                  }
                  cursor.continue();
              } else {
                  resolve(null);
              }
          };
          request.onerror = () => resolve(null);
      });
  }

  async getAllVaultItems(): Promise<VaultItem[]> {
     return new Promise((resolve, reject) => {
      if (!this.db) { resolve([]); return; }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async deleteFromVault(label: string): Promise<void> {
    return new Promise((resolve, reject) => {
       if (!this.db) { resolve(); return; }
       const tx = this.db.transaction(STORE_NAME, 'readwrite');
       const store = tx.objectStore(STORE_NAME);
       store.delete(label.toLowerCase().trim());
       tx.oncomplete = () => resolve();
    });
  }

  // --- LocalStorage Logic ---
  private loadLocalStorage() {
    try {
      const storedMemories = localStorage.getItem(STORAGE_KEY);
      if (storedMemories) this.memories = JSON.parse(storedMemories);
      
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) this.fileHistory = JSON.parse(storedHistory);

      const storedCalendar = localStorage.getItem(CALENDAR_KEY);
      if (storedCalendar) this.calendarEvents = JSON.parse(storedCalendar);
      
      const storedCountdown = localStorage.getItem(COUNTDOWN_KEY);
      if (storedCountdown) this.eventCountdown = JSON.parse(storedCountdown);
    } catch (e) { console.error(e); }
  }

  private saveMemories() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
  }

  // --- Standard Text Memory ---
  remember(key: string, value: string): string {
    const cleanKey = key.toLowerCase().trim();
    this.memories[cleanKey] = { key: cleanKey, value: value, timestamp: Date.now() };
    this.saveMemories();
    return `Memory stored: [${cleanKey}]`;
  }

  recall(key: string): string | null {
    return this.memories[key.toLowerCase().trim()]?.value || null;
  }

  findContact(name: string): string | null {
    const target = `contact_${name.toLowerCase().trim()}`;
    if (this.memories[target]) return this.memories[target].value;
    const partialKey = Object.keys(this.memories).find(k => k.includes(target));
    return partialKey ? this.memories[partialKey].value : null;
  }

  findEmail(name: string): string | null {
    const target = `email_${name.toLowerCase().trim()}`;
    if (this.memories[target]) return this.memories[target].value;
    const partialKey = Object.keys(this.memories).find(k => k.includes(target));
    return partialKey ? this.memories[partialKey].value : null;
  }

  forget(key: string): string {
    const cleanKey = key.toLowerCase().trim();
    if (this.memories[cleanKey]) {
      delete this.memories[cleanKey];
      this.saveMemories();
      return `Forgotten: [${cleanKey}]`;
    }
    return `Not found: [${cleanKey}]`;
  }

  getAll(): string {
    const keys = Object.keys(this.memories);
    if (keys.length === 0) return "Vault empty.";
    return keys.map(k => `${k}: ${this.memories[k].value}`).join("; ");
  }

  getRaw(): Record<string, MemoryItem> { return this.memories; }

  // --- History & Calendar ---
  addFileEntry(entry: FileHistoryEntry) {
    this.fileHistory.unshift(entry);
    if (this.fileHistory.length > 50) this.fileHistory = this.fileHistory.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.fileHistory));
  }

  getFileHistory() { return this.fileHistory; }

  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const newEvent = { id: Date.now().toString(36), ...event };
    this.calendarEvents.push(newEvent);
    this.saveCalendar();
    return newEvent;
  }

  getEvents() {
    const now = new Date();
    now.setHours(now.getHours() - 24);
    return this.calendarEvents.filter(e => new Date(e.endTime) > now);
  }

  private saveCalendar() {
    this.calendarEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(this.calendarEvents));
  }
  
  // --- Event Countdown ---
  setCountdown(targetDate: string, label: string) {
      this.eventCountdown = { targetDate, label };
      localStorage.setItem(COUNTDOWN_KEY, JSON.stringify(this.eventCountdown));
  }
  
  getCountdown(): EventCountdown | null {
      return this.eventCountdown;
  }
  
  clearCountdown() {
      this.eventCountdown = null;
      localStorage.removeItem(COUNTDOWN_KEY);
  }
}