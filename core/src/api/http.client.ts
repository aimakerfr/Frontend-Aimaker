/**
 * HTTP Client - Centralized API communication
 * All API calls MUST go through this client
 * Handles JWT authentication, error handling, and response transformation
 */

import {
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
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      throw new Error('VITE_API_URL is not defined');
    }

    this.baseUrl = apiUrl;
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(options: RequestOptions, method: string = 'GET'): HeadersInit {
    const headers: Record<string, string> = {
      // Symfony requires application/merge-patch+json for PATCH requests
      'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
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
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T> | T> {
    try {
      const data = await response.json();
      return data;
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
   * Check if response is in ApiResponse format
   */
  private isApiResponse(data: any): data is ApiResponse<any> {
    return data && typeof data === 'object' && 'success' in data && 'data' in data;
  }

  /**
   * Handle API response and throw on error
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const parsedData = await this.parseResponse<T>(response);

    // Check if response is in ApiResponse format
    if (this.isApiResponse(parsedData)) {
      if (parsedData.success) {
        return (parsedData as ApiSuccessResponse<T>).data;
      } else {
        const errorResponse = parsedData as ApiErrorResponse;
        const errorCode = errorResponse?.error?.code || 'API_ERROR';
        const errorMessage = errorResponse?.error?.message || `Request failed with status ${response.status}`;

        throw new HttpClientError(
          errorCode,
          errorMessage,
          response.status
        );
      }
    }

    // If not ApiResponse format, return data directly (for endpoints that return raw data)
    // This handles cases where backend returns arrays or objects directly
    if (!response.ok) {
      throw new HttpClientError(
        'HTTP_ERROR',
        `Request failed with status ${response.status}`,
        response.status
      );
    }

    return parsedData as T;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(endpoint);
    const method = options.method || 'GET';

    const fetchOptions: RequestInit = {
      method,
      headers: this.buildHeaders(options, method),
    };

    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
      console.log('HTTP Client - Request Details:', {
        method,
        url,
        headers: fetchOptions.headers,
        bodyString: fetchOptions.body,
        bodyObject: options.body
      });
    }

    try {
      const response = await fetch(url, fetchOptions);
      console.log(`HTTP Client - Response: ${method} ${url} ${response.status}`);
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
