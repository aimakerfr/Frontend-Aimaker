/**
 * Maker Path Variables - Service
 * Endpoint: POST /api/v1/maker_path_variables
 */

import { httpClient } from '../api/http.client';
import type {
  CreateMakerPathVariableRequest,
  MakerPathVariableResponse,
} from './maker-path-variables.types';

const ENDPOINT = '/api/v1/maker_path_variables';

/**
 * Create a maker path variable
 * Example body:
 * {
 *   "makerPathId":123,
 *   "variableIndexNumber":1,
 *   "ragMultimodalSourceId":45,
 *   "variableName":"someVar",
 *   "variableValue":{"any":"json"}
 * }
 */
export const createMakerPathVariable = async (
  data: CreateMakerPathVariableRequest
): Promise<MakerPathVariableResponse> => {
  return httpClient.post<MakerPathVariableResponse>(ENDPOINT, data);
};

export type { CreateMakerPathVariableRequest, MakerPathVariableResponse };
