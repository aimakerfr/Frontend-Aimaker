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
  outputPreview?: string;
}
