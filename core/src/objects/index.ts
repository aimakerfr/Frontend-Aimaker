import { httpClient } from '../api/http.client';

// Shared type for objects returned by the API
export type ObjectItem = {
  id: string | number;
  name: string;
  url?: string;
  type?: string;
};

export type CreateObjectPayload = {
  title: string;
  type: string;
  file?: File;
};

export type CopyObjectToRagPayload = {
  object_id: number;
  rag_id: number;
};

const ENDPOINT = '/api/v1/objects';
/**
 * Fetch all objects from the backend.
 * Uses the centralized httpClient so auth/base URL are handled consistently.
 */
export async function getAllObjects(): Promise<ObjectItem[]> {
  // Endpoint per current implementation in ObjectsLibrary
  return httpClient.get<ObjectItem[]>(ENDPOINT);
}

/**
 * Create a new object.
 * Minimal payload with title; adjust as backend evolves.
 */
export async function createObject(payload: CreateObjectPayload): Promise<ObjectItem> {
  const formData = new FormData();
  formData.append('title', payload?.title);
  formData.append('type', payload?.type);
  if (payload.file) {
    formData.append('file', payload.file);
    formData.append('stream_file', payload.file);
  }

  return httpClient.post<ObjectItem>(ENDPOINT + '/upload', formData);
}

/**
 * Copy an object's file/content to a RAG multimodal source.
 */
export async function copyObjectToRag(payload: CopyOjectToRagPayload) {
  return httpClient.post(`${ENDPOINT}/copy_to_rag`, payload);
}
