import { httpClient, tokenStorage } from '../api/http.client';
import type { AssemblerTemplate } from './assembler.types';

const ENDPOINT = '/api/v1/assembler';

export const getAssemblerTemplates = async (): Promise<AssemblerTemplate[]> => {
  return httpClient.get<AssemblerTemplate[]>(`${ENDPOINT}/templates`);
};

export const downloadAssembledProduct = async (makerPathId: number): Promise<Blob> => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiUrl) {
    throw new Error('VITE_API_URL is not defined');
  }

  const token = tokenStorage.get();
  const response = await fetch(`${apiUrl}${ENDPOINT}/${makerPathId}/download`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
};
