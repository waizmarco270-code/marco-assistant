import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../types";

const systemControlTool: FunctionDeclaration = {
  name: 'systemControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Control system hardware, brightness, connectivity, or shutdown.',
    properties: {
      action: { type: Type.STRING, description: 'Action: "shutdown", "back_to_home".' },
      value: { type: Type.STRING }
    },
    required: ['action'],
  },
};

const browserTool: FunctionDeclaration = {
  name: 'browserControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Open websites, search, or control media playback.',
    properties: {
      action: { type: Type.STRING, description: 'Action: "open_url", "google_search", "play_music", "pause_media", "resume_media", "stop_media".' },
      query: { type: Type.STRING, description: 'The search query, URL, or song name.' }
    },
    required: ['action'],
  },
};

const commsTool: FunctionDeclaration = {
  name: 'communicationControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Send messages via WhatsApp or Email.',
    properties: {
      platform: { type: Type.STRING, description: '"whatsapp" or "email".' },
      recipient: { type: Type.STRING, description: 'Phone number, Email address, or Contact Name.' },
      subject: { type: Type.STRING, description: 'Required for Email: The subject line.' },
      message: { type: Type.STRING, description: 'The content/body of the message.' }
    },
    required: ['platform', 'message'],
  },
};

const memoryTool: FunctionDeclaration = {
  name: 'memoryVault',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage memories, media (photos/audio), and secrets.',
    properties: {
      action: { type: Type.STRING, description: '"store", "retrieve", "forget", "list_all", "open_vault", "show_media", "play_audio", "reveal_secret".' },
      key: { type: Type.STRING, description: 'The key/label of the item. This searches roughly, exact match not needed.' },
      value: { type: Type.STRING }
    },
    required: ['action'],
  },
};

const navigationTool: FunctionDeclaration = {
  name: 'navigationControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Navigate to a physical location using maps.',
    properties: {
      location: { type: Type.STRING },
      mode: { type: Type.STRING }
    },
    required: ['location'],
  },
};

const timerTool: FunctionDeclaration = {
  name: 'timerControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Set a SHORT duration timer (seconds/minutes). For dates, use countdownControl.',
    properties: {
      duration: { type: Type.NUMBER },
      label: { type: Type.STRING }
    },
    required: ['duration'],
  },
};

const fileTool: FunctionDeclaration = {
  name: 'fileControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Create and download files (Use this for permanent storage, use neuralSandbox for instant apps).',
    properties: {
      action: { type: Type.STRING },
      fileName: { type: Type.STRING },
      content: { type: Type.STRING },
      files_json: { type: Type.STRING }
    },
    required: ['action', 'fileName'],
  },
};

const weatherTool: FunctionDeclaration = {
  name: 'weatherControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Get weather information.',
    properties: {
      location: { type: Type.STRING },
      action: { type: Type.STRING }
    },
    required: ['action'],
  },
};

const calendarTool: FunctionDeclaration = {
  name: 'calendarControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage calendar events.',
    properties: {
      action: { type: Type.STRING },
      title: { type: Type.STRING },
      startTime: { type: Type.STRING },
      endTime: { type: Type.STRING },
      eventId: { type: Type.STRING }
    },
    required: ['action'],
  },
};

const neuralSandboxTool: FunctionDeclaration = {
  name: 'neuralSandbox',
  parameters: {
    type: Type.OBJECT,
    description: 'Generate and run INSTANT UI applications. Returns HTML/CSS/JS code.',
    properties: {
      htmlCode: { type: Type.STRING },
      appName: { type: Type.STRING }
    },
    required: ['htmlCode', 'appName'],
  },
};

const imageGenerationTool: FunctionDeclaration = {
  name: 'imageGenerationTool',
  parameters: {
    type: Type.OBJECT,
    description: 'Generate and run image generation prompt using the Holo-Deck visualization engine.',
    properties: {
      prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' }
    },
    required: ['prompt'],
  },
};

const newsTool: FunctionDeclaration = {
  name: 'newsControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Display a news briefing widget. Use this when user asks for news.',
    properties: {
      items: { 
        type: Type.STRING, 
        description: 'JSON string array of objects: [{ title: string, category: "TECH"|"GLOBAL"|"SCIENCE", summary: string }]' 
      }
    },
    required: ['items'],
  },
};

const countdownTool: FunctionDeclaration = {
  name: 'countdownControl',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage a long-term countdown to a specific date.',
    properties: {
      action: { type: Type.STRING, description: '"set" or "remove"' },
      targetDate: { type: Type.STRING, description: 'ISO string of the target date.' },
      label: { type: Type.STRING, description: 'Name of the event (e.g., "Project Launch").' }
    },
    required: ['action'],
  },
};

export class GeminiLiveService {
  private client: GoogleGenAI;
  private session: any = null;
  private currentApiKey: string;
  
  constructor(options: { apiKey: string }) {
    this.currentApiKey = options.apiKey;
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
  }

  updateApiKey(newKey: string) {
      this.currentApiKey = newKey;
      this.client = new GoogleGenAI({ apiKey: newKey });
  }

  // --- Validate Key Method ---
  async validateCurrentKey(): Promise<boolean> {
      try {
          // Attempt a very cheap/fast call to check if the key is valid
          // Using gemini-3-flash-preview for a quick text check as per guidelines
          await this.client.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: 'test'
          });
          return true;
      } catch (e) {
          console.error("API Key Validation Failed:", e);
          return false;
      }
  }

  // --- Image Generation (Non-Streaming) ---
  async generateImage(prompt: string): Promise<string | null> {
    try {
        const response = await this.client.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
                parts: [
                    { text: `Generate an image of: ${prompt}` }
                ]
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return part.inlineData.data;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error", e);
        return null;
    }
  }

  async connect(
    onOpen: () => void,
    onMessage: (message: LiveServerMessage) => void,
    onError: (e: ErrorEvent) => void,
    onClose: (e: CloseEvent) => void,
    toolsHandler: (toolName: string, args: any) => Promise<any>
  ) {
    this.session = await this.client.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: onOpen,
        onmessage: async (msg) => {
          // Fix: Check for toolCall AND functionCalls to avoid undefined error
          if (msg.toolCall?.functionCalls) {
            for (const fc of msg.toolCall.functionCalls) {
              if (!fc.name) continue; // Fix: Skip if name is undefined
              
              const result = await toolsHandler(fc.name, fc.args);
              
              // Fix: Handle sendToolResponse structure and potential undefined id
              this.session.sendToolResponse({
                functionResponses: [
                  {
                    id: fc.id || "unknown_id",
                    name: fc.name,
                    response: { result: result },
                  }
                ]
              });
            }
          }
          onMessage(msg);
        },
        onerror: onError,
        onclose: onClose,
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          { googleSearch: {} }, 
          { functionDeclarations: [
              systemControlTool, 
              browserTool, 
              commsTool, 
              memoryTool,
              navigationTool,
              timerTool,
              fileTool,
              weatherTool,
              calendarTool,
              neuralSandboxTool,
              imageGenerationTool,
              newsTool,
              countdownTool
            ] 
          }
        ],
      },
    });
    return this.session;
  }

  async sendAudioChunk(base64Pcm: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm
        }
      });
    }
  }

  async sendVideoFrame(base64Image: string) {
    if (this.session) {
      await this.session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      });
    }
  }

  async sendText(text: string) {
    if (this.session) {
      await this.session.send({
        client_content: {
          turns: [{ role: 'user', parts: [{ text: text }] }],
          turn_complete: true
        }
      });
    }
  }

  async disconnect() {
    this.session = null;
  }
}