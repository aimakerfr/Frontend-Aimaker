export type ApiRuntimeProvider = 'google' | 'openai' | 'anthropic' | 'mistral' | 'perplexity';

export interface ProviderModelInfo {
  id: string;
  label: string;
}

export interface ValidateProviderKeyRequest {
  provider: ApiRuntimeProvider;
  apiKey: string;
}

export interface ValidateProviderKeyResponse {
  valid: boolean;
  models: ProviderModelInfo[];
}

export interface ProviderChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderChatRequest {
  provider: ApiRuntimeProvider;
  apiKey: string;
  model: string;
  messages: ProviderChatMessage[];
  systemPrompt?: string;
}

export interface ProviderChatResponse {
  content: string;
  model: string;
  latencyMs: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export type ProviderModelCapability = 'text' | 'image' | 'audio' | 'video' | 'search';

export interface ProviderModelTestRequest {
  provider: ApiRuntimeProvider;
  apiKey: string;
  model: string;
  capability: ProviderModelCapability;
  prompt?: string;
}

export interface ProviderModelTestResponse {
  ok: boolean;
  mode: 'execution' | 'availability';
  message: string;
  capability: ProviderModelCapability;
  outputKind?: 'text' | 'image' | 'audio' | 'video' | 'none';
  outputPreview?: string;
}

export interface ProviderUsageSummaryRequest {
  provider: ApiRuntimeProvider;
  apiKey: string;
  days?: number;
}

export interface ProviderUsageSummaryResponse {
  supported: boolean;
  provider: ApiRuntimeProvider;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  currency: string;
  source?: string;
  reasonCode?: string;
  requiresScope?: string;
  message?: string;
  range?: {
    from: string;
    to: string;
    days: number;
  };
}
