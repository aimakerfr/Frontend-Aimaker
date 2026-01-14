/**
 * HTTP Client - Centralized API communication
 * All API calls MUST go through this client
 * Handles JWT authentication, error handling, and response transformation
 */

import {
  API_CONFIG,
  type ApiResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from './api.types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOKEN_KEY = 'aimaker_jwt_token';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  exists: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTTP Client Error
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class HttpClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request Options
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTTP Client
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class HttpClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(options: RequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    // Add JWT token if authentication is required
    if (options.requiresAuth !== false) {
      const token = tokenStorage.get();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Parse API response
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      // If JSON parsing fails, create a generic error response
      return {
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message: 'Invalid response format from server',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'unknown',
        },
      } as ApiErrorResponse;
    }
  }

  /**
   * Handle API response and throw on error
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const apiResponse = await this.parseResponse<T>(response);

    if (apiResponse.success) {
      return (apiResponse as ApiSuccessResponse<T>).data;
    } else {
      const errorResponse = apiResponse as ApiErrorResponse;
      // Manejar casos donde error.code o error.message no existen
      const errorCode = errorResponse?.error?.code || 'API_ERROR';
      const errorMessage = errorResponse?.error?.message || `Request failed with status ${response.status}`;
      
      throw new HttpClientError(
        errorCode,
        errorMessage,
        response.status
      );
    }
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    const method = options.method || 'GET';

    const fetchOptions: RequestInit = {
      method,
      headers: this.buildHeaders(options),
    };

    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // If it's already an HttpClientError, rethrow it
      if (error instanceof HttpClientError) {
        throw error;
      }

      // Network or other errors
      throw new HttpClientError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed'
      );
    }
  }

  /**
   * GET request
   */
  public get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  /**
   * POST request
   */
  public post<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth });
  }

  /**
   * PUT request
   */
  public put<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth });
  }

  /**
   * PATCH request
   */
  public patch<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requiresAuth });
  }

  /**
   * DELETE request
   */
  public delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export singleton instance
// ━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━

export const httpClient = new HttpClient();
