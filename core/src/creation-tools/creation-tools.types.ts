/**
 * Creation Tools Types
 */

export type CreationToolType = 
  | 'agent' 
  | 'external_link' 
  | 'prompt' 
  | 'note_books' 

export interface CreationTool {
  id: number;
  title: string;
  description: string;
  type: CreationToolType;
  language: 'fr' | 'en' | 'es';
  url: string | null;
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
