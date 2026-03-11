/**
 * Assembler Identity Types
 */

export interface AssemblerIdentity {
  id: number;
  makerPathId: number;
  ragId: number | null;
  systemPrompt: string | null;
  modelName: string | null;
  provider: string | null;
  settings: Record<string, unknown> | null;
  templateMode: 'predefined' | 'custom' | null;
  selectedTemplate: string | null;
  customTemplateContent: string | null;
  selectedObjects: string[] | null;
  userApiKey: string | null;
  publicToken: string | null;
  publicEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SaveAssemblerIdentityRequest {
  systemPrompt?: string;
  modelName?: string;
  provider?: string;
  settings?: Record<string, unknown>;
  templateMode?: 'predefined' | 'custom';
  selectedTemplate?: string;
  customTemplateContent?: string;
  selectedObjects?: string[];
  userApiKey?: string;
  publicEnabled?: boolean;
}
