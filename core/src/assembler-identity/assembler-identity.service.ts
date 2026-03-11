/**
 * Assembler Identity Service
 * CRUD operations for ProjectAssemblerIdentity resource
 */

import { httpClient, tokenStorage } from '../api/http.client';
import type { AssemblerIdentity, SaveAssemblerIdentityRequest } from './assembler-identity.types';

const ENDPOINT = '/api/v1/assembler/identity';

/**
 * GET /api/v1/assembler/identity/{makerPathId}
 * Get the assembler identity for a given MakerPath
 */
export const getAssemblerIdentity = async (
  makerPathId: number
): Promise<AssemblerIdentity> => {
  return httpClient.get<AssemblerIdentity>(`${ENDPOINT}/${makerPathId}`);
};

/**
 * POST /api/v1/assembler/identity/{makerPathId}
 * Create or update the assembler identity for a given MakerPath
 */
export const saveAssemblerIdentity = async (
  makerPathId: number,
  data: SaveAssemblerIdentityRequest
): Promise<AssemblerIdentity> => {
  return httpClient.post<AssemblerIdentity>(`${ENDPOINT}/${makerPathId}`, data);
};

/**
 * GET /api/v1/assembler/download/{makerPathId}
 * Download the assembled HTML for a given MakerPath
 */
export const downloadAssembledProject = async (
  makerPathId: number
): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : '';
  const token = tokenStorage.get();

  const response = await fetch(`${baseUrl}/api/v1/assembler/download/${makerPathId}`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Error al descargar el proyecto');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'project.html';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * GET /api/v1/assembler/templates
 * List available product templates
 */
export const getAssemblerTemplates = async (): Promise<Array<{
  id: string;
  title: string;
  description: string;
  category: string;
  frontendTemplateId: string | null;
}>> => {
  return httpClient.get(`${ENDPOINT.replace('/identity', '')}/templates`);
};
