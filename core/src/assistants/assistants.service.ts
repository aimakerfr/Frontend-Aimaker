/**
 * Assistants Service
 * Read/update assistant details by toolId via core HTTP client
 */

import { httpClient } from '../api/http.client';

const TOOLS_ENDPOINT = '/api/v1/tools';

const getToolAssistantPath = (toolId: number) => `${TOOLS_ENDPOINT}/${toolId}/assistant`;

export interface AssistantDetails {
  id?: number;
  toolId?: number;
  assistantBody?: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  // Allow passing through any other backend fields without strict typing
  [key: string]: any;
}

/**
 * GET /api/v1/tools/{toolId}/assistant
 */
export const getAssistantByToolId = async (toolId: number): Promise<AssistantDetails> => {
  return httpClient.get<AssistantDetails>(getToolAssistantPath(toolId));
};

/**
 * PATCH /api/v1/tools/{toolId}/assistant
 */
export const updateAssistantBody = async (
  toolId: number,
  data: { assistant: string }
): Promise<AssistantDetails> => {
  return httpClient.patch<AssistantDetails>(getToolAssistantPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}/assistant (generic)
 * Allows updating arbitrary assistant fields such as instructions, model, etc.
 */
export const updateAssistant = async (
  toolId: number,
  data: Record<string, any>
): Promise<AssistantDetails> => {
  return httpClient.patch<AssistantDetails>(getToolAssistantPath(toolId), data);
};

/**
 * PATCH /api/v1/tools/{toolId}
 * Wrapper to publish the owning tool by toggling `hasPublicStatus`.
 */
export const publishAssistant = async (
  toolId: number
): Promise<AssistantDetails> => {
  return httpClient.patch<AssistantDetails>(`${TOOLS_ENDPOINT}/${toolId}`, { hasPublicStatus: true });
};

/**
 * POST /api/v1/tools/{toolId}/assistant
 * Create an assistant entry for a tool. Payload expects `{ assistant: string }`.
 */
export const createAssistantForTool = async (
  toolId: number,
  assistant: string
): Promise<AssistantDetails> => {
  return httpClient.post<AssistantDetails>(`${TOOLS_ENDPOINT}/${toolId}/assistant`, { assistant });
};

// Alias exports (optional)
export const getAssistant = getAssistantByToolId;
export const patchAssistant = updateAssistantBody;
