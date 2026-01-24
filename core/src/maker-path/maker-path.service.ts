/**
 * Maker Path Service
 * CRUD operations for Maker Path resource
 */

import { httpClient } from '../api/http.client';
import type { 
  MakerPath, 
  MakerPathsParams, 
  CreateMakerPathRequest,
  UpdateMakerPathRequest 
} from './maker-path.types';

const ENDPOINT = '/api/v1/maker-paths';

/**
 * GET /api/v1/maker-paths
 * List all maker paths with optional filters
 */
export const getMakerPaths = async (
  params: MakerPathsParams = {}
): Promise<MakerPath[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.type) {
    queryParams.append('type', params.type);
  }
  
  const endpoint = queryParams.toString() 
    ? `${ENDPOINT}?${queryParams.toString()}` 
    : ENDPOINT;
  
  return httpClient.get<MakerPath[]>(endpoint);
};

/**
 * GET /api/v1/maker-paths/{id}
 * Get a single maker path by ID
 */
export const getMakerPath = async (id: number): Promise<MakerPath> => {
  return httpClient.get<MakerPath>(`${ENDPOINT}/${id}`);
};

/**
 * POST /api/v1/maker-paths
 * Create a new maker path
 * Requires authentication (Bearer JWT)
 */
export const createMakerPath = async (
  data: CreateMakerPathRequest
): Promise<MakerPath> => {
  return httpClient.post<MakerPath>(ENDPOINT, data);
};

/**
 * PATCH /api/v1/maker-paths/{id}
 * Update an existing maker path (partial update)
 * Requires authentication (Bearer JWT)
 */
export const updateMakerPath = async (
  id: number,
  data: UpdateMakerPathRequest
): Promise<MakerPath> => {
  console.log('Service: Updating maker path with data:', data);
  return httpClient.patch<MakerPath>(`${ENDPOINT}/${id}`, data);
};

/**
 * DELETE /api/v1/maker-paths/{id}
 * Delete a maker path
 * Requires authentication (Bearer JWT)
 * Returns 204 No Content on success
 */
export const deleteMakerPath = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`${ENDPOINT}/${id}`);
};
