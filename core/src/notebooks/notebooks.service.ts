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

  async getNotebooks(): Promise<Notebook[]> {
    return httpClient.get<Notebook[]>(this.baseUrl);
  }

  async getNotebook(id: number): Promise<Notebook> {
    return httpClient.get<Notebook>(`${this.baseUrl}/${id}`);
  }

  async getPublicNotebook(id: number): Promise<Notebook> {
    return httpClient.get<Notebook>(`${this.publicBaseUrl}/${id}`, { requiresAuth: false });
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
 */
export const getNotebookSources = async (noteBookId: number): Promise<NotebookSourceItem[]> => {
  return httpClient.get<NotebookSourceItem[]>(`/api/v1/notebook-sources?note_book_id=${noteBookId}`);
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
export const postNoteBookSource = async (data: FormData | { note_book_id: number; type: string; name: string }): Promise<PostNoteBookSourceResponse> => {
  return httpClient.post<PostNoteBookSourceResponse>('/api/v1/notebook-sources', data);
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
  return httpClient.get<{ content: string; isUrl: boolean; type: string; name: string }>(`/api/v1/notebook-sources/${sourceId}/content`);
};
