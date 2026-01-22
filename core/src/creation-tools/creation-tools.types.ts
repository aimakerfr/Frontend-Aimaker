/**
 * Creation Tools Types
 */

export type CreationToolType = 
  | 'assistant' 
  | 'external_link' 
  | 'prompt' 
  | 'note_books' 
  | 'project'
  | 'app'
  | 'perplexity_search'
  | 'vibe_coding' 

export interface CreationTool {
  id: number;
  title: string;
  description: string;
  type: CreationToolType;
  language: 'fr' | 'en' | 'es';
  url: string | null;
  publicUrl: string | null;
  hasPublicStatus: boolean | null;
  isTemplate: boolean;
  usageCount: number;
}

export interface CreationToolsParams {
  page?: number;
  itemsPerPage?: number;
  type?: CreationToolType;
}

export interface CreateCreationToolRequest {
  title?: string;
  description?: string;
  type?: CreationToolType;
  language?: 'fr' | 'en' | 'es';
  url?: string;
  hasPublicStatus?: boolean;
  isTemplate?: boolean;
}

export interface UpdateCreationToolRequest {
  title?: string;
  description?: string;
  type?: CreationToolType;
  language?: 'fr' | 'en' | 'es';
  url?: string;
  hasPublicStatus?: boolean;
  isTemplate?: boolean;
}

// ========================================
// Type aliases with simplified names
// ========================================
export type ToolType = CreationToolType;
export type Tool = CreationTool;
export type ToolsParams = CreationToolsParams;
export type CreateToolRequest = CreateCreationToolRequest;
export type UpdateToolRequest = UpdateCreationToolRequest;
