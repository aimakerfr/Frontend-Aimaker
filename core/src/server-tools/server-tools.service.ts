/**
 * Server Tools Service
 * CRUD operations for Server Tools resource
 */

import { httpClient } from '../api/http.client';
import type { 
  ServerTool, 
  ServerToolsParams, 
  CreateServerToolRequest,
  UpdateServerToolRequest 
} from './server-tools.types';

const ENDPOINT = '/api/v1/server-tools';

/**
 * GET /api/v1/server-tools
 * List all server tools with optional filters
 */
export const getServerTools = async (
  params: ServerToolsParams = {}
): Promise<ServerTool[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.type) {
    queryParams.append('type', params.type);
  }
  
  const endpoint = queryParams.toString() 
    ? `${ENDPOINT}?${queryParams.toString()}` 
    : ENDPOINT;
  
  return httpClient.get<ServerTool[]>(endpoint);
};

/**
 * GET /api/v1/server-tools/{id}
 * Get a single server tool by ID
 */
export const getServerTool = async (id: number): Promise<ServerTool> => {
  return httpClient.get<ServerTool>(`${ENDPOINT}/${id}`);
};

/**
 * POST /api/v1/server-tools
 * Create a new server tool
 * Requires authentication (Bearer JWT)
 */
export const createServerTool = async (
  data: CreateServerToolRequest
): Promise<ServerTool> => {
  return httpClient.post<ServerTool>(ENDPOINT, data);
};

/**
 * PATCH /api/v1/server-tools/{id}
 * Update an existing server tool (partial update)
 * Requires authentication (Bearer JWT)
 */
export const updateServerTool = async (
  id: number,
  data: UpdateServerToolRequest
): Promise<ServerTool> => {
  console.log('Service: Updating server tool with data:', data);
  return httpClient.patch<ServerTool>(`${ENDPOINT}/${id}`, data);
};

/**
 * DELETE /api/v1/server-tools/{id}
 * Delete a server tool
 * Requires authentication (Bearer JWT)
 * Returns 204 No Content on success
 */
export const deleteServerTool = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`${ENDPOINT}/${id}`);
};

/**
 * Helper: Toggle active status of a server tool
 * Uses PATCH endpoint to update isActive field
 */
export const toggleServerToolStatus = async (
  id: number,
  isActive: boolean
): Promise<ServerTool> => {
  return updateServerTool(id, { isActive });
};
