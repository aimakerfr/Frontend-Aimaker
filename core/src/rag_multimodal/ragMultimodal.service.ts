/**
 * Rag Multimodal Service
 * Maneja las operaciones CRUD para rag multimodal vinculados a creation_tools
 */

import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/rag-multimodal';

export interface RagMultimodalSource {
  id: string;
  title: string;
  type: string;
  content: string;
  url?: string;
  previewUrl?: string;
  dateAdded: Date;
  selected: boolean;
}

export interface RagMultimodalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface RagMultimodalSettings {
  language: 'es' | 'en' | 'fr';
  [key: string]: any;
}

export interface RagMultimodal {
  id: number;
  title?: string;
  creation_tool_id: number;
  tool: {
    title: string;
    description: string;
    language: string;
  };
  sources: RagMultimodalSource[];
  messages: RagMultimodalMessage[];
  settings: RagMultimodalSettings;
  created_at: string;
  updated_at: string;
}

export interface UpdateRagMultimodalRequest {
  title?: string;
  sources?: RagMultimodalSource[];
  messages?: RagMultimodalMessage[];
  settings?: RagMultimodalSettings;
}

export interface PostRagMultimodalSourceResponse {
  id: number;
  name: string;
  type: string;
  filePath?: string | null;
  createdAt: string;
}

export type RagMultimodalSourceItem = PostRagMultimodalSourceResponse;

export class RagMultimodalService {
  private baseUrl = ENDPOINT;
  private publicBaseUrl = '/api/v1/public/rag-multimodal';

  // Map legacy/internal 'pdf' type to API 'doc' (outgoing)
  private normalizeOutgoingType(type?: string): string | undefined {
    if (!type) return type;
    return type === 'pdf' ? 'doc' : type;
  }

  // Normalize API responses: treat legacy 'pdf' as 'doc' (incoming)
  private normalizeIncomingType(type?: string): string | undefined {
    if (!type) return type;
    return type === 'pdf' ? 'doc' : type;
  }

  private normalizeRagMultimodal(n: RagMultimodal): RagMultimodal {
    return {
      ...n,
      sources: Array.isArray(n.sources)
        ? n.sources.map((s) => ({ ...s, type: this.normalizeIncomingType(s.type) || s.type }))
        : n.sources,
    };
  }

  async getRagMultimodals(): Promise<RagMultimodal[]> {
    const data = await httpClient.get<RagMultimodal[]>(this.baseUrl);
    return Array.isArray(data) ? data.map((n) => this.normalizeRagMultimodal(n)) : data;
  }

  async getRagMultimodal(id: number): Promise<RagMultimodal> {
    const n = await httpClient.get<RagMultimodal>(`${this.baseUrl}/${id}`);
    return this.normalizeRagMultimodal(n);
  }

  async getPublicRagMultimodal(id: number): Promise<RagMultimodal> {
    const n = await httpClient.get<RagMultimodal>(`${this.publicBaseUrl}/${id}`, { requiresAuth: false });
    return this.normalizeRagMultimodal(n);
  }

  async createRagMultimodal(data: { creationToolId: number }): Promise<RagMultimodal> {
    return httpClient.post<RagMultimodal>(this.baseUrl, data);
  }

  async updateRagMultimodal(id: number, data: { title?: string }): Promise<RagMultimodal> {
    return httpClient.patch<RagMultimodal>(`${this.baseUrl}/${id}`, data);
  }

  async deleteRagMultimodal(id: number): Promise<void> {
    return httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

/**
 * Obtener rag multimodal por creation_tool_id
 * TODO: Implementar este endpoint en el backend
 */
export const getRagMultimodalByToolId = async (creationToolId: number): Promise<RagMultimodal> => {
  const data = await httpClient.get<RagMultimodal>(`${ENDPOINT}/by-tool/${creationToolId}`);
  return data;
};

/**
 * Actualizar rag multimodal
 * TODO: Implementar este endpoint en el backend
 */
export const updateRagMultimodal = async (ragMultimodalId: number, updates: UpdateRagMultimodalRequest): Promise<void> => {
  await httpClient.patch<void>(`${ENDPOINT}/${ragMultimodalId}`, updates);
};

/**
 * Eliminar rag multimodal (normalmente se hace eliminando el creation_tool)
 */
export const deleteRagMultimodal = async (ragMultimodalId: number): Promise<void> => {
  await httpClient.delete<void>(`${ENDPOINT}/${ragMultimodalId}`);
};

/**
 * Obtener todas las fuentes de un rag multimodal por id (controlador REST)
 * Si no se pasa ragMultimodalId, devuelve todas las fuentes del usuario
 */
export const getRagMultimodalSources = async (ragMultimodalId?: number, type?: string): Promise<RagMultimodalSourceItem[]> => {
  // Si no se pasa ragMultimodalId, usar el endpoint user-sources
  if (ragMultimodalId === undefined) {
    let url = '/api/v1/rag-multimodal-sources/user-sources';
    if (type) {
      const mapped = type === 'pdf' ? 'doc' : type;
      url += '?type=' + mapped;
    }
    const items = await httpClient.get<RagMultimodalSourceItem[]>(url);
    return items.map((it) => ({ ...it, type: it.type === 'pdf' ? 'doc' : it.type }));
  }
  
  // Si se pasa ragMultimodalId, usar el endpoint normal
  const items = await httpClient.get<RagMultimodalSourceItem[]>(`/api/v1/rag-multimodal-sources?rag_multimodal_id=${ragMultimodalId}`);
  return items.map((it) => ({ ...it, type: it.type === 'pdf' ? 'doc' : it.type }));
};

/**
 * Obtener todas las fuentes de un rag multimodal (ruta anidada Api Platform)
 */
export const getRagMultimodalSourcesNested = async (ragMultimodalId: number): Promise<RagMultimodalSourceItem[]> => {
  return httpClient.get<RagMultimodalSourceItem[]>(`/api/rag_multimodal/${ragMultimodalId}/sources`);
};

/**
 * Añadir una fuente al rag multimodal
 */
export const postRagMultimodalSource = async (
  data: FormData | { rag_multimodal_id: number; type: string; name: string; text?: string; url?: string }
): Promise<PostRagMultimodalSourceResponse> => {
  // If it's FormData, map 'type' field if present
  if (data instanceof FormData) {
    const currentType = data.get('type');
    if (typeof currentType === 'string' && currentType === 'pdf') {
      data.set('type', 'doc');
    }
    const resp = await httpClient.post<PostRagMultimodalSourceResponse>('/api/v1/rag-multimodal-sources', data);
    return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
  }

  // JSON payload variant
  const outgoing = { ...data, type: (data as any).type === 'pdf' ? 'doc' : (data as any).type } as { rag_multimodal_id: number; type: string; name: string; text?: string; url?: string };
  const resp = await httpClient.post<PostRagMultimodalSourceResponse>('/api/v1/rag-multimodal-sources', outgoing);
  return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
};

/**
 * Eliminar una fuente del rag multimodal
 */
export const deleteRagMultimodalSource = async (sourceId: number): Promise<void> => {
  return httpClient.delete<void>(`/api/v1/rag-multimodal-sources/${sourceId}`);
};

/**
 * Obtener el contenido de una fuente del rag multimodal
 */
export const getRagMultimodalSourceContent = async (
  sourceId: number
): Promise<{ content: string; isUrl: boolean; type: string; name: string }> => {
  const resp = await httpClient.get<{ content: string; isUrl: boolean; type: string; name: string }>(`/api/v1/rag-multimodal-sources/${sourceId}/content`);
  return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
};
