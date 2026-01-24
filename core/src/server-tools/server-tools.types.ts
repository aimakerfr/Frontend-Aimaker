/**
 * Server Tools Types
 */

export type ServerToolType = 
  | 'llm' 
  | 'n8n_workflow' 
  | 'perplexity_index' 
  | 'api_prompt_optimize' 
  | 'image_generation'
  | 'administration';

export interface ServerTool {
  id: number;
  name: string;
  description: string | null;
  type: ServerToolType;
  url: string | null;
  apiKey: string | null;
  configJson: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
}

export interface ServerToolsParams {
  type?: ServerToolType;
}

export interface CreateServerToolRequest {
  name: string;
  description?: string;
  type: ServerToolType;
  url?: string;
  apiKey?: string;
  configJson?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateServerToolRequest {
  name?: string;
  description?: string;
  type?: ServerToolType;
  url?: string;
  apiKey?: string;
  configJson?: Record<string, any>;
  isActive?: boolean;
}
