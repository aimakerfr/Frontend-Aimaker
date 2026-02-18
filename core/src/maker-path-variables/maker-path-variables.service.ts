/**
 * Maker Path Variables - Service
 * Endpoint: POST /api/v1/maker_path_variables
 */

import { httpClient } from '../api/http.client';
import type {
  CreateMakerPathVariableRequest,
  MakerPathVariableResponse,
  MakerPathVariableListResponse,
} from './maker-path-variables.types';

const ENDPOINT = '/api/v1/maker_path_variables';

/**
 * Update a maker path variable (completed state)
 * Example body:
 * {
 *   "makerPathId":123,
 *   "variableIndexNumber":1,
 *   "ragMultimodalSourceId":45,
 *   "variableName":"someVar",
 *   "variableValue":{"any":"json"}
 * }
 */
export const putMakerPathVariable = async (
  data: CreateMakerPathVariableRequest
): Promise<MakerPathVariableResponse> => {
  return httpClient.put<MakerPathVariableResponse>(ENDPOINT, data);
};

/**
 * Create a maker path variable (NOT completed yet)
 * Uses POST /api/v1/maker_path_variables
 */
export const postMakerPathVariable = async (
  data: CreateMakerPathVariableRequest
): Promise<MakerPathVariableResponse> => {
  return httpClient.post<MakerPathVariableResponse>(ENDPOINT, data);
};

/**
 * Get maker path variables for a given makerPathId
 * GET /api/v1/maker_path_variables?makerPathId=123
 */
export const getMakerPathVariables = async (
  makerPathId: number
): Promise<MakerPathVariableListResponse> => {
  return httpClient.get<MakerPathVariableListResponse>(ENDPOINT, {
    params: { makerPathId },
  });
};

export type {
  CreateMakerPathVariableRequest,
  MakerPathVariableResponse,
  MakerPathVariableListResponse,
};
