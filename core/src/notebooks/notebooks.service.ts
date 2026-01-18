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
  sources?: NotebookSource[];
  messages?: NotebookMessage[];
  settings?: NotebookSettings;
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
