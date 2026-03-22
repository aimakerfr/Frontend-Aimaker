import { httpClient } from '../api/http.client';
import type {
  ProviderChatRequest,
  ProviderChatResponse,
  ValidateProviderKeyRequest,
  ValidateProviderKeyResponse,
} from './api-key-runtime.types';

const ENDPOINT = '/api/v1/provider-proxy';

export const validateProviderKey = async (
  data: ValidateProviderKeyRequest
): Promise<ValidateProviderKeyResponse> => {
  return httpClient.post<ValidateProviderKeyResponse>(`${ENDPOINT}/validate-key`, data);
};

export const providerChat = async (
  data: ProviderChatRequest
): Promise<ProviderChatResponse> => {
  return httpClient.post<ProviderChatResponse>(`${ENDPOINT}/chat`, data);
};
