/**
 * Image Generation - Service
 *
 * Proxy endpoint that generates images server-side via Pollinations.ai.
 * The backend handles the request to avoid Cloudflare Turnstile restrictions
 * that block direct browser requests.
 *
 * Endpoint: POST /api/v1/image/generate
 */

import { httpClient } from '../api/http.client';

const ENDPOINT = '/api/v1/image/generate';

export interface GenerateImageRequest {
  prompt: string;
}

export interface GenerateImageResponse {
  /** data:image/...;base64,... URI */
  imageUrl: string;
  contentType: string;
  size: number;
}

/**
 * Generate an image from a text prompt via the backend proxy.
 * Returns a base64 data URI that can be used directly as an `<img src>`.
 */
export const generateImageFromPrompt = async (
  prompt: string
): Promise<GenerateImageResponse> => {
  return httpClient.post<GenerateImageResponse>(ENDPOINT, { prompt });
};
