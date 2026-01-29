/**
 * Projects Service
 * Read/update project details by toolId via core HTTP client
 */

import { httpClient } from '../api/http.client';

const TOOLS_ENDPOINT = '/api/v1/tools';

const getToolProjectPath = (toolId: number) => `${TOOLS_ENDPOINT}/${toolId}/project`;

export interface ProjectDetails {
  id?: number;
  toolId?: number;
  projectBody?: string;
  deploymentUrl?: string;
  projectType?: string;
  // Allow passing through any other backend fields without strict typing
  [key: string]: any;
}

/**
 * GET /api/v1/tools/{toolId}/project
 */
export const getProjectByToolId = async (toolId: number): Promise<ProjectDetails> => {
  return httpClient.get<ProjectDetails>(getToolProjectPath(toolId));
};

/**
 * PATCH /api/v1/tools/{toolId}/project
 */
export const updateProjectBody = async (
  toolId: number,
  data: { project: string }
): Promise<ProjectDetails> => {
  return httpClient.patch<ProjectDetails>(getToolProjectPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}/project (generic)
 * Allows updating arbitrary project fields such as deploymentUrl, projectType, etc.
 */
export const updateProject = async (
  toolId: number,
  data: Record<string, any>
): Promise<ProjectDetails> => {
  return httpClient.patch<ProjectDetails>(getToolProjectPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}
 * Wrapper to publish the owning tool by toggling `hasPublicStatus`.
 */
export const publishProject = async (
  toolId: number
): Promise<ProjectDetails> => {
  return httpClient.patch<ProjectDetails>(`${TOOLS_ENDPOINT}/${toolId}`, { hasPublicStatus: true });
};

/**
 * POST /api/v1/tools/{toolId}/project
 * Create a project entry for a tool. Payload expects `{ project: string }`.
 */
export const createProjectForTool = async (
  toolId: number,
  project: string
): Promise<ProjectDetails> => {
  return httpClient.post<ProjectDetails>(`${TOOLS_ENDPOINT}/${toolId}/project`, { project });
};

// Alias exports (optional)
export const getProject = getProjectByToolId;
export const patchProject = updateProjectBody;
