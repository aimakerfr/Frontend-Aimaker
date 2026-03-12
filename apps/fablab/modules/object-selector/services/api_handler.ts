import { httpClient } from '@core/api/http.client';

export const OBJECTS_ENDPOINT = '/api/v1/objects/by-assembly';

export type ObjectType =
  | 'PDF'
  | 'IMAGE'
  | 'VIDEO'
  | 'TEXT'
  | 'WEBSITE'
  | 'HTML'
  | 'TRANSLATION'
  | 'CODE'
  | 'DOC'
  | 'CONFIG'
  | 'JSON'
  | 'PRODUCT';

export type ObjectItem = {
  id: number;
  name: string;
  title?: string | null;
  url?: string | null;
  relative_path?: string | null;
  product_type_for_assembly?: string | null;
  module_name_for_assembly?: string | null;
  type: ObjectType;
  data?: Record<string, unknown> | null;
  makerPathId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GetObjectsParams = {
  type: ObjectType;
  product_type_for_assembly?: string;
  module_name_for_assembly?: string;
  maker_path_id?: number;
};

export async function fetchObjectsByAssemblyHints(params: GetObjectsParams): Promise<ObjectItem[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('type', params.type);

  if (params.product_type_for_assembly) {
    searchParams.set('product_type_for_assembly', params.product_type_for_assembly);
  }

  if (params.module_name_for_assembly) {
    searchParams.set('module_name_for_assembly', params.module_name_for_assembly);
  }

  const queryString = searchParams.toString();
  const endpoint = queryString ? `${OBJECTS_ENDPOINT}?${queryString}` : OBJECTS_ENDPOINT;

  return httpClient.get<ObjectItem[]>(endpoint);
}
