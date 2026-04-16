/**
 * Chat Skills Service
 * CRUD operations for Chat Skills resource
 */

import { httpClient } from '../api/http.client';
import {
  ChatSkill,
  ChatSetupType,
  CreateChatSkillRequest,
  UpdateChatSkillRequest,
} from './chat-skills.types';

const ENDPOINT = '/api/v1/fablab-chat-setup';

/**
 * GET /api/v1/fablab-chat-setup
 * List chat setup entries for the authenticated user
 */
export const getChatSkills = async (type: ChatSetupType = 'skill'): Promise<ChatSkill[]> => {
  return httpClient.get<ChatSkill[]>(`${ENDPOINT}?type=${type}`);
};

export const getChatRoles = async (): Promise<ChatSkill[]> => {
  return getChatSkills('role');
};

/**
 * GET /api/v1/fablab-chat-setup/{id}
 * Get a single chat setup entry by ID
 */
export const getChatSkill = async (id: number): Promise<ChatSkill> => {
  return httpClient.get<ChatSkill>(`${ENDPOINT}/${id}`);
};

/**
 * POST /api/v1/fablab-chat-setup
 * Create a new chat setup entry
 */
export const createChatSkill = async (
  payload: CreateChatSkillRequest
): Promise<ChatSkill> => {
  return httpClient.post<ChatSkill>(ENDPOINT, payload);
};

export const createChatRole = async (
  payload: Omit<CreateChatSkillRequest, 'type'>
): Promise<ChatSkill> => {
  return createChatSkill({ ...payload, type: 'role' });
};

/**
 * PATCH /api/v1/fablab-chat-setup/{id}
 * Update an existing chat setup entry
 */
export const updateChatSkill = async (
  id: number,
  payload: UpdateChatSkillRequest
): Promise<ChatSkill> => {
  return httpClient.patch<ChatSkill>(`${ENDPOINT}/${id}`, payload);
};

export const updateChatRole = async (
  id: number,
  payload: Omit<UpdateChatSkillRequest, 'type'>
): Promise<ChatSkill> => {
  return updateChatSkill(id, { ...payload, type: 'role' });
};

/**
 * DELETE /api/v1/fablab-chat-setup/{id}
 * Delete a chat setup entry
 */
export const deleteChatSkill = async (id: number): Promise<void> => {
  await httpClient.delete(`${ENDPOINT}/${id}`);
};

export const deleteChatRole = async (id: number): Promise<void> => {
  await deleteChatSkill(id);
};
