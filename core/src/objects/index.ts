import { httpClient, tokenStorage } from '../api/http.client';

// Shared type for objects returned by the API
export type ObjectItem = {
  id: string | number;
  name: string;
  url?: string;
  type?: string;
  title?: string;
  relative_path?: string | null;
  data?: Record<string, unknown> | null;
  folderId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ObjectFolder = {
  id: number;
  name: string;
  emoji?: string | null;
  color?: string | null;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectTreeNode = {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: ProjectTreeNode[];
};

export type ProjectTreeResponse = {
  root: string;
  tree: ProjectTreeNode[];
};

export type ProjectFileResponse = {
  path: string;
  content: string;
  size: number;
};

export type CreateObjectPayload = {
  title: string;
  type: string;
  file?: File;
  product_type_for_assembly?: string;
  module_name_for_assembly?: string;
  folder_id?: number | null;
};

export type CopyObjectToRagPayload = {
  object_id: number;
  rag_id: number;
};

const ENDPOINT = '/api/v1/objects';
const FOLDERS_ENDPOINT = '/api/v1/object-folders';
/**
 * Fetch all objects from the backend.
 * Uses the centralized httpClient so auth/base URL are handled consistently.
 */
export async function getAllObjects(): Promise<ObjectItem[]> {
  // Endpoint per current implementation in ObjectsLibrary
  // Se agrega cache-buster para evitar respuestas 304 con cuerpo vacío en prod (ETag)
  const res = await httpClient.get<any>(`${ENDPOINT}?_=${Date.now()}`);

  // ApiResponse shape handled by httpClient -> already an array
  if (Array.isArray(res)) return res;

  // ApiPlatform collection (hydra) fallback
  if (Array.isArray(res?.['hydra:member'])) {
    return res['hydra:member'];
  }

  // Generic { data: [...] } shape fallback
  if (Array.isArray(res?.data)) {
    return res.data;
  }

   // Paginated shape { data: { items: [...] } }
  if (Array.isArray(res?.data?.items)) {
    return res.data.items;
  }

  // Generic items array
  if (Array.isArray(res?.items)) {
    return res.items;
  }

  console.warn('[getAllObjects] Respuesta sin items reconocibles', res);

  return [];
}

/**
 * Create a new object.
 * Minimal payload with title; adjust as backend evolves.
 */
export async function createObject(payload: CreateObjectPayload): Promise<ObjectItem> {
  const formData = new FormData();
  formData.append('title', payload?.title);
  formData.append('type', payload?.type);
  if (payload.folder_id !== undefined && payload.folder_id !== null) {
    formData.append('folder_id', String(payload.folder_id));
  }
  if (payload.file) {
    formData.append('file', payload.file);
    formData.append('stream_file', payload.file);
  }
  if (payload.product_type_for_assembly) {
    formData.append('product_type_for_assembly', payload.product_type_for_assembly);
  }
  if (payload.module_name_for_assembly) {
    formData.append('module_name_for_assembly', payload.module_name_for_assembly);
  }

  return httpClient.post<ObjectItem>(ENDPOINT + '/upload', formData);
}

/**
 * Copy an object's file/content to a RAG multimodal source.
 */
export async function copyObjectToRag(payload: CopyObjectToRagPayload) {
  return httpClient.post(`${ENDPOINT}/copy_to_rag`, payload);
}
export type UpdateObjectPayload = {
  name?: string;
  title?: string;
  product_type_for_assembly?: string;
  module_name_for_assembly?: string;
};

/**
 * Update an existing object (PATCH).
 */
export async function updateObject(id: number | string, payload: UpdateObjectPayload = {}): Promise<ObjectItem> {
  return httpClient.patch<ObjectItem>(`${ENDPOINT}/${id}/assembly-tags`, payload);
}


/**
 * Delete an object by ID.
 */
export async function deleteObject(id: string | number): Promise<void> {
  await httpClient.delete(`${ENDPOINT}/${id}`);
}

export async function getObjectFolders(): Promise<ObjectFolder[]> {
  const res = await httpClient.get<any>(FOLDERS_ENDPOINT);
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function createObjectFolder(payload: {
  name: string;
  emoji?: string | null;
  color?: string | null;
  sort_order?: number;
}): Promise<ObjectFolder> {
  return httpClient.post<ObjectFolder>(FOLDERS_ENDPOINT, payload);
}

export async function updateObjectFolder(
  id: number,
  payload: { name?: string; emoji?: string | null; color?: string | null; sort_order?: number }
): Promise<ObjectFolder> {
  return httpClient.patch<ObjectFolder>(`${FOLDERS_ENDPOINT}/${id}`, payload);
}

export async function deleteObjectFolder(id: number): Promise<void> {
  await httpClient.delete(`${FOLDERS_ENDPOINT}/${id}`);
}

export async function setObjectFolder(objectId: string | number, folderId: number | null): Promise<ObjectItem> {
  return httpClient.patch<ObjectItem>(`${ENDPOINT}/${objectId}/folder`, { folder_id: folderId });
}

/**
 * Download an object file as an attachment.
 * Constructs headers with JWT auth, fetches from backend, and triggers browser download.
 */
export async function downloadObjectFile(objectId: string | number, fallbackName?: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('VITE_API_URL is not defined');
  
  const cleanBase = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const path = `api/v1/objects/${objectId}/download`;
  const url = `${cleanBase}/${path}`;
  
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Download failed with status ${response.status}`);
  }

  const blob = await response.blob();

  const disposition = response.headers.get('content-disposition');
  const filenameFromHeader = disposition ? extractFilenameFromDisposition(disposition) : null;
  const filename = filenameFromHeader || fallbackName || `object-${objectId}`;

  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export async function getProjectTree(objectId: string | number): Promise<ProjectTreeResponse> {
  return httpClient.get<ProjectTreeResponse>(`${ENDPOINT}/${objectId}/tree`);
}

export async function getProjectFile(objectId: string | number, path: string): Promise<ProjectFileResponse> {
  const encoded = encodeURIComponent(path);
  return httpClient.get<ProjectFileResponse>(`${ENDPOINT}/${objectId}/file?path=${encoded}`);
}

const extractFilenameFromDisposition = (header: string): string | null => {
  const match = header.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  if (!match) return null;
  const raw = match[1] || match[2];
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
};
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