// Local, self-contained Maker Path service for the Deployer New module
// This file intentionally brings the minimal needed definitions from core
// to keep the module atomic at its import surface.

import { httpClient } from '@core/api/http.client';

// Types (copied from core/src/maker-path/maker-path.types.ts)
export type MakerPathType =
  | 'architect_ai'
  | 'module_connector'
  | 'custom'
  | 'rag_chat_maker'
  | 'landing_page_maker'
  | 'image_generator_rag'
  | 'translation_maker'
  | 'style_transfer_maker';

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
  productStatus?: 'public' | 'private';
  editionUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  rag?: {
    id: number;
    cag: string | null;
    tool?: {
      id: number;
      title: string | null;
    } | null;
  } | null;
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
  // mark whether this maker path has an associated application deployment
  // backend column: has_application_deployment (TINYINT(1))
  hasApplicationDeployment?: boolean;
}

// Service (based on core/src/maker-path/maker-path.service.ts)
const ENDPOINT = '/api/v1/maker-paths';

export const createMakerPath = async (
  data: CreateMakerPathRequest
): Promise<MakerPath> => {
  return httpClient.post<MakerPath>(ENDPOINT, data);
};
