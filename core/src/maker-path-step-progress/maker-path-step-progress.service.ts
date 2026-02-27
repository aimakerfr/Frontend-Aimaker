/**
 * Maker Path Step Progress - Service
 * Endpoint: POST/GET /api/v1/maker_path_step_progress
 */

import { httpClient } from '../api/http.client';

export type StepStatus = 'failed' | 'success' | 'not_executed';

export interface MakerPathStepProgressRequest {
  makerPathId: number;
  stepId: number;
  status: StepStatus;
  resultText?: any; // JSON structure depends on step type
  executedAt?: string; // ISO date-time
}

export interface MakerPathStepProgressResponse {
  makerPathId: number;
  stepId: number;
  status: StepStatus;
  resultText: any;
  executedAt: string | null;
}

const ENDPOINT = '/api/v1/maker_path_step_progress';

/**
 * Create or update (UPSERT) maker path step progress
 * POST /api/v1/maker_path_step_progress
 */
export const saveMakerPathStepProgress = async (
  data: MakerPathStepProgressRequest
): Promise<MakerPathStepProgressResponse> => {
  return httpClient.post<MakerPathStepProgressResponse>(ENDPOINT, data);
};

/**
 * Get all step progress for a maker path
 * GET /api/v1/maker_path_step_progress?makerPathId=123
 */
export const getMakerPathStepProgress = async (
  makerPathId: number
): Promise<MakerPathStepProgressResponse[]> => {
  return httpClient.get<MakerPathStepProgressResponse[]>(
    `${ENDPOINT}?makerPathId=${makerPathId}`
  );
};
