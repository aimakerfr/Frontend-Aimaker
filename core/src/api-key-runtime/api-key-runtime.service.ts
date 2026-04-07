import { httpClient } from '../api/http.client';
import type {
  ProviderChatRequest,
  ProviderChatResponse,
  ProviderModelTestRequest,
  ProviderModelTestResponse,
  ProviderUsageSummaryRequest,
  ProviderUsageSummaryResponse,
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

export const providerTestModel = async (
  data: ProviderModelTestRequest
): Promise<ProviderModelTestResponse> => {
  return httpClient.post<ProviderModelTestResponse>(`${ENDPOINT}/test-model`, data);
};

export const providerUsageSummary = async (
  data: ProviderUsageSummaryRequest
): Promise<ProviderUsageSummaryResponse> => {
  return httpClient.post<ProviderUsageSummaryResponse>(`${ENDPOINT}/usage-summary`, data);
};
