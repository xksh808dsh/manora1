export enum ViewMode {
  OBSIDIAN_CHAT = 'OBSIDIAN_CHAT', // Chat, Search, Maps, Thinking
  NOTION_DASHBOARD = 'NOTION_DASHBOARD', // Modular Dashboards
  BASE44_MARKET = 'BASE44_MARKET', // Marketplace
  GITHUB_REMIX = 'GITHUB_REMIX', // Code/Repo analysis
  VEO_STUDIO = 'VEO_STUDIO', // Video Generation
  LIVE_WIRE = 'LIVE_WIRE', // Real-time Voice
  IMAGE_LAB = 'IMAGE_LAB' // Image Gen & Edit
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  FLASH_LITE = 'gemini-flash-lite-latest',
  PRO = 'gemini-3-pro-preview',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO_GEN = 'veo-3.1-generate-preview', // For extensions
  LIVE_AUDIO = 'gemini-2.5-flash-native-audio-preview-09-2025',
  TTS = 'gemini-2.5-flash-preview-tts'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    mimeType: string;
  }[];
  grounding?: {
    url: string;
    title: string;
  }[];
  isThinking?: boolean;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  author: string;
  tags: string[];
  description: string;
}
