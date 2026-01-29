export interface KnowledgeFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface Attachment {
  name?: string;
  mimeType: string;
  data: string; // base64
}

export interface AssistantConfig {
  instructions?: string;
  starters?: string[];
  capabilities?: {
    imageGen?: boolean;
  };
  knowledgeFiles?: KnowledgeFile[];
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; 
  attachments?: Attachment[];
}

export type Language = 'en' | 'fr' | 'es';
