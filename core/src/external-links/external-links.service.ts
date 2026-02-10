import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/external-links';

export interface ExternalLink {
  id: number;
  title: string;
  description: string;
  type: 'external_link' | 'vibe_coding';
  language: 'fr' | 'en' | 'es';
  url: string;
  publicUrl?: string;
  hasPublicStatus: boolean;
  category?: string;
  isFavorite: boolean;
  userId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExternalLinkDto {
  title: string;
  description?: string;
  type: 'external_link' | 'vibe_coding';
  language?: 'fr' | 'en' | 'es';
  url: string;
  publicUrl?: string;
  hasPublicStatus?: boolean;
  category?: string;
  isFavorite?: boolean;
}

export interface UpdateExternalLinkDto {
  title?: string;
  description?: string;
  type?: 'external_link' | 'vibe_coding';
  language?: 'fr' | 'en' | 'es';
  url?: string;
  publicUrl?: string;
  hasPublicStatus?: boolean;
  category?: string;
  isFavorite?: boolean;
}

/**
 * GET /api/v1/external-links
 * Get all external links for current user
 */
export async function getExternalLinks(type?: 'external_link' | 'vibe_coding'): Promise<ExternalLink[]> {
  const params = type ? `?type=${type}` : '';
  const response = await httpClient.get<ExternalLink[]>(`${ENDPOINT}${params}`);
  return response || [];
}

/**
 * GET /api/v1/external-links/{id}
 * Get a specific external link by ID
 */
export async function getExternalLink(id: number): Promise<ExternalLink> {
  const response = await httpClient.get<ExternalLink>(`${ENDPOINT}/${id}`);
  return response;
}

/**
 * POST /api/v1/external-links
 * Create a new external link
 */
export async function createExternalLink(data: CreateExternalLinkDto): Promise<ExternalLink> {
  const response = await httpClient.post<ExternalLink>(ENDPOINT, data);
  return response;
}

/**
 * PATCH /api/v1/external-links/{id}
 * Update an existing external link
 */
export async function updateExternalLink(id: number, data: UpdateExternalLinkDto): Promise<ExternalLink> {
  const response = await httpClient.patch<ExternalLink>(`${ENDPOINT}/${id}`, data);
  return response;
}

/**
 * DELETE /api/v1/external-links/{id}
 * Delete an external link
 */
export async function deleteExternalLink(id: number): Promise<void> {
  await httpClient.delete(`${ENDPOINT}/${id}`);
}

/**
 * PATCH /api/v1/external-links/{id}/toggle-favorite
 * Toggle favorite status of an external link
 */
export async function toggleExternalLinkFavorite(id: number): Promise<ExternalLink> {
  const response = await httpClient.patch<ExternalLink>(`${ENDPOINT}/${id}/toggle-favorite`, {});
  return response;
}
