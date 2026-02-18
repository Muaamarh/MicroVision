
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  type?: 'text' | 'image' | 'analysis' | 'video';
  mediaUrl?: string;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface UserInfo {
  university: string;
  institute: string;
  department: string;
  student: string;
  professor: string;
}

export enum AppMode {
  Chat = 'chat',
  Live = 'live',
  Vision = 'vision',
  Generator = 'generator'
}

export type LiveSubMode = 'video' | 'voice';
