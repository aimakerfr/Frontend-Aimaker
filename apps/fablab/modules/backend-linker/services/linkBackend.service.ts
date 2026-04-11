import { httpClient } from '@core/api/http.client';

export type LinkBackendRequest = {
  backendApplicationId: number;
  targetApplicationId: number;
};

export type LinkBackendResponse = {
  message: string;
  backendApplicationId: number;
  targetApplicationId: number;
};


export async function linkBackendApplication(payload: LinkBackendRequest): Promise<LinkBackendResponse> {
  const data = await httpClient.post<LinkBackendResponse>(
    '/api/v1/application-deployment/link-backend-application',
    payload,
    true
  );
  return data;
}
