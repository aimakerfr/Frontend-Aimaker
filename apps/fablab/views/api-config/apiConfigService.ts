import { httpClient } from '@core/api/http.client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiModel {
  id: string;          // e.g. "models/gemini-2.5-flash"
  displayName: string; // e.g. "Gemini 2.5 Flash"
}

export interface GeminiConfig {
  defaultKeyConfigured: boolean;
  maskedKey: string;
}

export interface ValidateKeyResult {
  valid: boolean;
  models: GeminiModel[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Fetches the masked default API key info from backend. */
export const fetchGeminiConfig = async (): Promise<GeminiConfig> => {
  return httpClient.get<GeminiConfig>('/api/v1/gemini/config');
};

/**
 * Validates an API key against Gemini and returns available models.
 * Throws if the key is invalid or the request fails.
 */
export const validateApiKey = async (apiKey: string): Promise<ValidateKeyResult> => {
  return httpClient.post<ValidateKeyResult>('/api/v1/gemini/validate-key', { apiKey });
};
