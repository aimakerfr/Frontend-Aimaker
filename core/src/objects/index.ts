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
export async function copyObjectToRag(payload: CopyObjectToRagPayload) {
  return httpClient.post(`${ENDPOINT}/copy_to_rag`, payload);
}
/**
 * Create an object from a base64-encoded image.
 * Converts the base64 string to a Blob and uploads it.
 */
export type CreateObjectFromBase64Payload = {
  name: string;
  description?: string;
  type: string;
  base64Data: string;
  mimeType: string;
};

export async function createObjectFromBase64(payload: CreateObjectFromBase64Payload): Promise<ObjectItem> {
  // Convert base64 to Blob
  const byteString = atob(payload.base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([uint8Array], { type: payload.mimeType });
  const file = new File([blob], `${payload.name}.png`, { type: payload.mimeType });

  // Use existing createObject function
  return createObject({
    title: payload.name,
    type: payload.type,
    file
  });
}