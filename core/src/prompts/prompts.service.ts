/**
 * Prompts Service
 * Read/update prompt body by toolId via core HTTP client
 */

import { httpClient } from '../api/http.client';

const TOOLS_ENDPOINT = '/api/v1/tools';

const getToolPromptPath = (toolId: number) => `${TOOLS_ENDPOINT}/${toolId}/prompt`;

export interface PromptDetails {
  id?: number;
  toolId?: number;
  promptBody?: string;
  // Allow passing through any other backend fields without strict typing
  [key: string]: any;
}

/**
 * GET /api/v1/tools/{toolId}/prompt
 */
export const getPromptByToolId = async (toolId: number): Promise<PromptDetails> => {
  return httpClient.get<PromptDetails>(getToolPromptPath(toolId));
};

/**
 * PATCH /api/v1/tools/{toolId}/prompt
 */
export const updatePromptBody = async (
  toolId: number,
  data: { prompt: string }
): Promise<PromptDetails> => {
  return httpClient.patch<PromptDetails>(getToolPromptPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}/prompt (generic)
 * Allows updating arbitrary prompt fields such as context, outputFormat, etc.
 */
export const updatePrompt = async (
  toolId: number,
  data: Record<string, any>
): Promise<PromptDetails> => {
  return httpClient.patch<PromptDetails>(getToolPromptPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}
 * Wrapper to publish the owning tool by toggling `hasPublicStatus`.
 */
export const publishPrompt = async (
  toolId: number
): Promise<PromptDetails> => {
  return httpClient.patch<PromptDetails>(`${TOOLS_ENDPOINT}/${toolId}`, { hasPublicStatus: true });
};

/**
 * POST /api/v1/tools/{toolId}/prompt
 * Create a prompt entry for a tool. Payload expects `{ prompt: string }`.
 */
export const createPromptForTool = async (
  toolId: number,
  prompt: string
): Promise<PromptDetails> => {
  return httpClient.post<PromptDetails>(`${TOOLS_ENDPOINT}/${toolId}/prompt`, { prompt });
};

// Alias exports (optional)
export const getPrompt = getPromptByToolId;
export const patchPrompt = updatePromptBody;
