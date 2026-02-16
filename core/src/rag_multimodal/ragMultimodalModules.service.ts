/**
 * Rag Multimodal Modules Service
 * Maneja la asignación de fuentes HTML a módulos (Header, Body, Footer)
 * para la generación del index.html modular.
 */

import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/rag-multimodal-modules';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ModuleType = 'HEADER' | 'BODY' | 'FOOTER';

export interface RagMultimodalModule {
  id: number;
  moduleType: ModuleType;
  sourceId: number;
  sourceName: string;
  sourceType: string;
  sourceFilePath: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Obtener todos los módulos asignados de un notebook
 */
export const getRagMultimodalModules = async (ragMultimodalId: number): Promise<RagMultimodalModule[]> => {
  return httpClient.get<RagMultimodalModule[]>(`${ENDPOINT}/${ragMultimodalId}`);
};

/**
 * Asignar una fuente a un módulo (HEADER, BODY o FOOTER)
 */
export const assignRagMultimodalModule = async (
  ragMultimodalId: number,
  moduleType: ModuleType,
  sourceId: number
): Promise<RagMultimodalModule> => {
  return httpClient.put<RagMultimodalModule>(
    `${ENDPOINT}/${ragMultimodalId}/${moduleType.toLowerCase()}`,
    { source_id: sourceId }
  );
};

/**
 * Desasignar un módulo. moduleId optional para BODY específico.
 */
export const unassignRagMultimodalModule = async (
  ragMultimodalId: number,
  moduleType: ModuleType,
  moduleId?: number
): Promise<void> => {
  const params = moduleId ? `?module_id=${moduleId}` : '';
  return httpClient.delete<void>(`${ENDPOINT}/${ragMultimodalId}/${moduleType.toLowerCase()}${params}`);
};

/**
 * Descargar el index.html generado con las URLs del notebook embebidas
 */
export const downloadRagMultimodalIndex = async (ragMultimodalId: number): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const url = `${apiUrl}${ENDPOINT}/${ragMultimodalId}/generate-index`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('aimaker_jwt_token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate index: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `index-${notebookId}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
};
