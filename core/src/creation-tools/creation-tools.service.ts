/**
 * Creation Tools Service
 * CRUD operations for Creation Tools resource
 */

import { httpClient } from '../api/http.client';
import type { 
  CreationTool, 
  CreationToolsParams, 
  CreateCreationToolRequest,
  UpdateCreationToolRequest 
} from './creation-tools.types';

const ENDPOINT = '/api/v1/tools';

/**
 * GET /api/creation_tools
 * List all creation tools with optional filters
 */
export const getCreationTools = async (
  params: CreationToolsParams = {}
): Promise<CreationTool[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) {
    queryParams.append('page', params.page.toString());
  }
  
  if (params.itemsPerPage) {
    queryParams.append('itemsPerPage', params.itemsPerPage.toString());
  }
  
  if (params.type) {
    queryParams.append('type', params.type);
  }
  
  const endpoint = queryParams.toString() 
    ? `${ENDPOINT}?${queryParams.toString()}` 
    : ENDPOINT;
  
  return httpClient.get<CreationTool[]>(endpoint);
};

/**
 * GET /api/creation_tools/{id}
 * Get a single creation tool by ID
 */
export const getCreationTool = async (id: number): Promise<CreationTool> => {
  return httpClient.get<CreationTool>(`${ENDPOINT}/${id}`);
};

/**
 * POST /api/creation_tools
 * Create a new creation tool
 * Requires authentication (Bearer JWT)
 */
export const createCreationTool = async (
  data: CreateCreationToolRequest
): Promise<CreationTool> => {
  return httpClient.post<CreationTool>(ENDPOINT, data);
};

/**
 * PATCH /api/creation_tools/{id}
 * Update an existing creation tool (partial update)
 * Requires authentication (Bearer JWT)
 */
export const updateCreationTool = async (
  id: number,
  data: UpdateCreationToolRequest
): Promise<CreationTool> => {
  console.log('Service: Llamando PATCH con data:', data);
  return httpClient.patch<CreationTool>(`${ENDPOINT}/${id}`, data);
};

/**
 * DELETE /api/creation_tools/{id}
 * Delete a creation tool
 * Requires authentication (Bearer JWT)
 * Returns 204 No Content on success
 */
export const deleteCreationTool = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`${ENDPOINT}/${id}`);
};

/**
 * Helper: Toggle public status of a creation tool
 * Uses PATCH endpoint to update hasPublicStatus field
 */
export const toggleCreationToolVisibility = async (
  id: number,
  isPublic: boolean
): Promise<CreationTool> => {
  return updateCreationTool(id, { hasPublicStatus: isPublic });
};

// ========================================
// Alias exports with simplified names
// ========================================
export const getTools = getCreationTools;
export const getTool = getCreationTool;
export const createTool = createCreationTool;
export const updateTool = updateCreationTool;
export const deleteTool = deleteCreationTool;
export const toggleToolVisibility = toggleCreationToolVisibility;
