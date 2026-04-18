/**
 * Maker Path Share Service
 * Multi-user project sharing functionality
 */

import { httpClient } from '../api/http.client';
import type {
  ShareStatus,
  ShareMembersResponse,
  ShareMember,
  AddMemberRequest,
  UserSearchResult,
} from './maker-path.types';

const ENDPOINT = '/api/v1/maker-paths';
const USER_SEARCH_ENDPOINT = '/api/v1/user-search';

/**
 * GET /api/v1/maker-paths/{id}/share
 * Get sharing status for a maker path
 */
export const getShareStatus = async (makerPathId: number): Promise<ShareStatus> => {
  return httpClient.get<ShareStatus>(`${ENDPOINT}/${makerPathId}/share`);
};

/**
 * POST /api/v1/maker-paths/{id}/share
 * Toggle sharing status (enable/disable)
 */
export const toggleShare = async (
  makerPathId: number,
  enabled: boolean
): Promise<{ message: string; isShared: boolean; removedMembers?: number }> => {
  return httpClient.post<{ message: string; isShared: boolean; removedMembers?: number }>(
    `${ENDPOINT}/${makerPathId}/share`,
    { enabled }
  );
};

/**
 * GET /api/v1/maker-paths/{id}/members
 * List all members of a shared project
 */
export const getShareMembers = async (makerPathId: number): Promise<ShareMembersResponse> => {
  return httpClient.get<ShareMembersResponse>(`${ENDPOINT}/${makerPathId}/members`);
};

/**
 * POST /api/v1/maker-paths/{id}/members
 * Add a member to a shared project
 */
export const addShareMember = async (
  makerPathId: number,
  data: AddMemberRequest
): Promise<{ message: string; share: ShareMember }> => {
  return httpClient.post<{ message: string; share: ShareMember }>(
    `${ENDPOINT}/${makerPathId}/members`,
    data
  );
};

/**
 * DELETE /api/v1/maker-paths/{id}/members/{userId}
 * Remove a member from a shared project (owner only)
 */
export const removeShareMember = async (
  makerPathId: number,
  userId: number
): Promise<{ message: string; removedUserId: number }> => {
  return httpClient.delete<{ message: string; removedUserId: number }>(
    `${ENDPOINT}/${makerPathId}/members/${userId}`
  );
};

/**
 * DELETE /api/v1/maker-paths/shared/{id}/membership
 * Leave a shared project (collaborator/viewer)
 */
export const leaveSharedProject = async (
  makerPathId: number
): Promise<{ message: string; makerPathId: number; makerPathTitle: string }> => {
  return httpClient.delete<{ message: string; makerPathId: number; makerPathTitle: string }>(
    `${ENDPOINT}/shared/${makerPathId}/membership`
  );
};

/**
 * GET /api/v1/users/search?q={query}
 * Search users to add as members
 */
export const searchUsers = async (
  query: string = '',
  limit: number = 20
): Promise<{ users: UserSearchResult[]; total: number; query: string }> => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  params.append('limit', String(limit));

  return httpClient.get<{ users: UserSearchResult[]; total: number; query: string }>(
    `${USER_SEARCH_ENDPOINT}?${params.toString()}`
  );
};
