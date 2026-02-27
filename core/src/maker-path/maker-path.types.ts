/**
 * Maker Path Types
 */

export type MakerPathType = 'architect_ai' | 'module_connector' | 'custom' | 'rag_chat_maker' | 'landing_page_maker' | 'image_generator_rag' | 'translation_maker';
export type MakerPathStatus = 'draft' | 'in_progress' | 'completed';

export interface MakerPath {
  id: number;
  title: string;
  description: string;
  type: MakerPathType;
  status: MakerPathStatus;
  data: string | null;
  projectType: string | null;
  projectName: string | null;
  projectMission: string | null;
  hasDatabase: boolean | null;
  optimizationProvider: string | null;
  apiSource: string | null;
  selectedTool: string | null;
  deploymentUrl: string | null;
  productLink: string | null;
  editionUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
}

export interface MakerPathsParams {
  type?: MakerPathType;
}

export interface CreateMakerPathRequest {
  title: string;
  description?: string;
  type?: MakerPathType;
  status?: MakerPathStatus;
  data?: string;
  projectType?: string;
  projectName?: string;
  projectMission?: string;
  hasDatabase?: boolean;
  productLink?: string;
  editionUrl?: string;
}

export interface UpdateMakerPathRequest {
  title?: string;
  description?: string;
  type?: MakerPathType;
  status?: MakerPathStatus;
  data?: string;
  projectType?: string;
  projectName?: string;
  projectMission?: string;
  hasDatabase?: boolean;
  productLink?: string;
  editionUrl?: string;
}
