/**
 * API Types - Generated from API_MANIFEST
 * These types represent the contract between frontend and backend
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Response Structure
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  error: null;
  meta: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorDetail;
  meta: ApiResponseMeta;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Authentication Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface User {
  id: number;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    createdAt: string;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    lastLoginAt: string;
  };
  token: string;
}

export interface LogoutResponse {
  message: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Health Check Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  environment: 'dev' | 'prod';
}

export interface HealthStatusResponse extends HealthCheckResponse {
  timestamp: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI - Gemini Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GeminiRequest {
  prompt: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface GeminiResponse {
  text: string;
  prompt: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Codes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_FIELD'
  | 'INVALID_FORMAT'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'MISSING_TOKEN'
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'DUPLICATE_ENTRY'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BUSINESS_RULE_VIOLATION'
  | 'OPERATION_NOT_ALLOWED';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Manifest Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const API_CONFIG = {
  version: '1.0.0',
  apiName: 'AI Maker FabLab API',
  authentication: {
    type: 'JWT',
    headerName: 'Authorization',
    headerFormat: 'Bearer',
    tokenExpiration: 3600,
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Endpoints
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const API_ENDPOINTS = {
  health: {
    check: '/health/check',
    status: '/health/status',
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  ai: {
    generate: '/gemini/generate',
  },
} as const;
