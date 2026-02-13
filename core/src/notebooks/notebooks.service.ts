/**
 * Notebooks Service
 * Maneja las operaciones CRUD para notebooks vinculados a creation_tools
 */

import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/notebooks';

export interface NotebookSource {
  id: string;
  title: string;
  type: string;
  content: string;
  url?: string;
  previewUrl?: string;
  dateAdded: Date;
  selected: boolean;
}

export interface NotebookMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface NotebookSettings {
  language: 'es' | 'en' | 'fr';
  [key: string]: any;
}

export interface Notebook {
  id: number;
  title?: string;
  creation_tool_id: number;
  tool: {
    title: string;
    description: string;
    language: string;
  };
  sources: NotebookSource[];
  messages: NotebookMessage[];
  settings: NotebookSettings;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotebookRequest {
  title?: string;
  sources?: NotebookSource[];
  messages?: NotebookMessage[];
  settings?: NotebookSettings;
}

export interface PostNoteBookSourceResponse {
  id: number;
  name: string;
  type: string;
  filePath?: string | null;
  createdAt: string;
}

export type NotebookSourceItem = PostNoteBookSourceResponse;

export class NotebookService {
  private baseUrl = '/api/v1/notebooks';
  private publicBaseUrl = '/api/v1/public/notebooks';

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

  private normalizeNotebook(n: Notebook): Notebook {
    return {
      ...n,
      sources: Array.isArray(n.sources)
        ? n.sources.map((s) => ({ ...s, type: this.normalizeIncomingType(s.type) || s.type }))
        : n.sources,
    };
  }

  async getNotebooks(): Promise<Notebook[]> {
    const data = await httpClient.get<Notebook[]>(this.baseUrl);
    return Array.isArray(data) ? data.map((n) => this.normalizeNotebook(n)) : data;
  }

  async getNotebook(id: number): Promise<Notebook> {
    const n = await httpClient.get<Notebook>(`${this.baseUrl}/${id}`);
    return this.normalizeNotebook(n);
  }

  async getPublicNotebook(id: number): Promise<Notebook> {
    const n = await httpClient.get<Notebook>(`${this.publicBaseUrl}/${id}`, { requiresAuth: false });
    return this.normalizeNotebook(n);
  }

  async createNotebook(data: { creationToolId: number }): Promise<Notebook> {
    return httpClient.post<Notebook>(this.baseUrl, data);
  }

  async updateNotebook(id: number, data: { title?: string }): Promise<Notebook> {
    return httpClient.patch<Notebook>(`${this.baseUrl}/${id}`, data);
  }

  async deleteNotebook(id: number): Promise<void> {
    return httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

/**
 * Obtener notebook por creation_tool_id
 * TODO: Implementar este endpoint en el backend
 */
export const getNotebookByToolId = async (creationToolId: number): Promise<Notebook> => {
  const data = await httpClient.get<Notebook>(`${ENDPOINT}/by-tool/${creationToolId}`);
  return data;
};

/**
 * Actualizar notebook
 * TODO: Implementar este endpoint en el backend
 */
export const updateNotebook = async (notebookId: number, updates: UpdateNotebookRequest): Promise<void> => {
  await httpClient.patch<void>(`${ENDPOINT}/${notebookId}`, updates);
};

/**
 * Eliminar notebook (normalmente se hace eliminando el creation_tool)
 */
export const deleteNotebook = async (notebookId: number): Promise<void> => {
  await httpClient.delete<void>(`${ENDPOINT}/${notebookId}`);
};

/**
 * Obtener todas las fuentes de un notebook por id (controlador REST)
 * Si no se pasa noteBookId, devuelve todas las fuentes del usuario
 */
export const getNotebookSources = async (noteBookId?: number, type?: string): Promise<NotebookSourceItem[]> => {
  // Si no se pasa noteBookId, usar el endpoint user-sources
  if (noteBookId === undefined) {
    let url = '/api/v1/notebook-sources/user-sources';
    if (type) {
      const mapped = type === 'pdf' ? 'doc' : type;
      url += '?type=' + mapped;
    }
    const items = await httpClient.get<NotebookSourceItem[]>(url);
    return items.map((it) => ({ ...it, type: it.type === 'pdf' ? 'doc' : it.type }));
  }
  
  // Si se pasa noteBookId, usar el endpoint normal
  const items = await httpClient.get<NotebookSourceItem[]>(`/api/v1/notebook-sources?note_book_id=${noteBookId}`);
  return items.map((it) => ({ ...it, type: it.type === 'pdf' ? 'doc' : it.type }));
};

/**
 * Obtener todas las fuentes de un notebook (ruta anidada Api Platform)
 */
export const getNotebookSourcesNested = async (noteBookId: number): Promise<NotebookSourceItem[]> => {
  return httpClient.get<NotebookSourceItem[]>(`/api/note_books/${noteBookId}/sources`);
};

/**
 * Añadir una fuente al notebook
 */
export const postNoteBookSource = async (
  data: FormData | { note_book_id: number; type: string; name: string; text?: string; url?: string }
): Promise<PostNoteBookSourceResponse> => {
  // If it's FormData, map 'type' field if present
  if (data instanceof FormData) {
    const currentType = data.get('type');
    if (typeof currentType === 'string' && currentType === 'pdf') {
      data.set('type', 'doc');
    }
    const resp = await httpClient.post<PostNoteBookSourceResponse>('/api/v1/notebook-sources', data);
    return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
  }

  // JSON payload variant
  const outgoing = { ...data, type: data.type === 'pdf' ? 'doc' : data.type };
  const resp = await httpClient.post<PostNoteBookSourceResponse>('/api/v1/notebook-sources', outgoing);
  return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
};

/**
 * Eliminar una fuente del notebook
 */
export const deleteNotebookSource = async (sourceId: number): Promise<void> => {
  return httpClient.delete<void>(`/api/v1/notebook-sources/${sourceId}`);
};

/**
 * Obtener el contenido de una fuente del notebook
 */
export const getNotebookSourceContent = async (sourceId: number): Promise<{ content: string; isUrl: boolean; type: string; name: string }> => {
  const resp = await httpClient.get<{ content: string; isUrl: boolean; type: string; name: string }>(`/api/v1/notebook-sources/${sourceId}/content`);
  return { ...resp, type: resp.type === 'pdf' ? 'doc' : resp.type };
};
