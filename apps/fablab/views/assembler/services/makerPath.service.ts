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

function normalizeProjectType(input: string): AssemblerProjectType {
  const raw = (input || '').toLowerCase();
  // unify common separators
  const v = raw.replace(/\s+/g, '_').replace(/-+/g, '_');
  if (v === 'landing_page' || v === 'landingpage' || v === 'landing__page') return 'landing_page';
  if (v === 'notebook') return 'notebook';
  // heuristic: if it contains both words
  if (v.includes('landing') && v.includes('page')) return 'landing_page';
  return 'notebook';
}

export async function createAssemblerMakerPath(
  params: CreateAssemblerMakerPathRequest
): Promise<MakerPathResponseMinimal> {
  const base = getBaseUrl();
  const token = tokenStorage.get();
  const normalizedType = normalizeProjectType(params.projectType as string);

  // Use specialized endpoint for assembler creation per spec
  const res = await fetch(`${base}/api/v1/maker-paths/assembler/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      // minimal required payload for assembler creation
      projectType: normalizedType,
      title: params.title,
      description: params.description,
    }),
  });

  const contentType = res.headers.get('Content-Type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (body && (body.error?.message || body.message || body.error)) || `HTTP ${res.status}`;
    throw new Error(message);
  }

  // Extract data from the response envelope { success, data, error, meta }
  const dataAny: any = body && (body as any).data ? (body as any).data : body;

  // Map potential snake_case from backend to camelCase
  if (dataAny && dataAny.edition_url && !dataAny.editionUrl) {
    dataAny.editionUrl = dataAny.edition_url;
  }

  // Fallback per spec for assembler: if editionUrl missing but type + projectType are valid
  if (
    dataAny &&
    (!dataAny.editionUrl || typeof dataAny.editionUrl !== 'string' || dataAny.editionUrl.length === 0)
  ) {
    const typeVal: string | undefined = (dataAny.type as string) || 'assembler';
    const projectTypeVal: string | undefined = (dataAny.projectType as string) || normalizedType;
    if (typeVal === 'assembler' && projectTypeVal) {
      const pt = normalizeProjectType(projectTypeVal);
      dataAny.editionUrl = `/dashboard/assembler/${pt}`;
    }
  }

  if (!dataAny || typeof dataAny.editionUrl !== 'string' || dataAny.editionUrl.length === 0) {
    throw new Error('Missing editionUrl in response');
  }

  return dataAny as MakerPathResponseMinimal;
}
