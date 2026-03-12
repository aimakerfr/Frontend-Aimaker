import { tokenStorage } from '@core/api/http.client';

export type AssemblerProjectType = 'notebook' | 'landing_page';

export interface CreateAssemblerMakerPathRequest {
  projectType: AssemblerProjectType;
  title: string;
  description: string;
}

export interface MakerPathResponseMinimal {
  id: number;
  title: string;
  description: string;
  type: 'assembler' | string;
  status?: 'draft' | 'in_progress' | 'completed' | string;
  projectType: AssemblerProjectType;
  editionUrl: string; // required for redirect per spec
  [key: string]: unknown;
}

function getBaseUrl(): string {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return apiUrl ? apiUrl.replace(/\/$/, '') : '';
}

export async function createAssemblerMakerPath(
  params: CreateAssemblerMakerPathRequest
): Promise<MakerPathResponseMinimal> {
  const base = getBaseUrl();
  const token = tokenStorage.get();

  // Use specialized endpoint for assembler creation per spec
  const res = await fetch(`${base}/api/v1/maker-paths/assembler/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      // minimal required payload for assembler creation
      projectType: params.projectType,
      title: params.title,
      description: params.description,
    }),
  });

  const contentType = res.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (body && (body.error?.message || body.message)) || `HTTP ${res.status}`;
    throw new Error(message);
  }

  const data = body as MakerPathResponseMinimal;
  if (!data || typeof data.editionUrl !== 'string' || data.editionUrl.length === 0) {
    throw new Error('Missing editionUrl in response');
  }
  return data;
}
