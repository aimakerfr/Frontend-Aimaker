/**
 * Chat Skills Service
 * CRUD operations for Chat Skills resource
 */

import { httpClient } from '../api/http.client';
import type {
  ChatSkill,
  CreateChatSkillRequest,
  UpdateChatSkillRequest,
} from './chat-skills.types';

const ENDPOINT = '/api/v1/chat-skills';

/**
 * GET /api/v1/chat-skills
 * List all chat skills for the authenticated user
 */
export const getChatSkills = async (): Promise<ChatSkill[]> => {
  return httpClient.get<ChatSkill[]>(ENDPOINT);
};

/**
 * GET /api/v1/chat-skills/{id}
 * Get a single chat skill by ID
 */
export const getChatSkill = async (id: number): Promise<ChatSkill> => {
  return httpClient.get<ChatSkill>(`${ENDPOINT}/${id}`);
};

/**
 * POST /api/v1/chat-skills
 * Create a new chat skill
 */
export const createChatSkill = async (
  data: CreateChatSkillRequest
): Promise<ChatSkill> => {
  return httpClient.post<ChatSkill>(ENDPOINT, data);
};

/**
 * PATCH /api/v1/chat-skills/{id}
 * Update an existing chat skill
 */
export const updateChatSkill = async (
  id: number,
  data: UpdateChatSkillRequest
): Promise<ChatSkill> => {
  return httpClient.patch<ChatSkill>(`${ENDPOINT}/${id}`, data);
};

/**
 * DELETE /api/v1/chat-skills/{id}
 * Delete a chat skill
 */
export const deleteChatSkill = async (id: number): Promise<void> => {
  return httpClient.delete<void>(`${ENDPOINT}/${id}`);
};
