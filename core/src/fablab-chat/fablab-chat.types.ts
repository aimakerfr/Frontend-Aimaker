import type { ApiRuntimeProvider, ProviderModelInfo } from '../api-key-runtime';

export const FABLAB_CHAT_CONFIG_STEP = 1;
export const FABLAB_CHAT_CONVERSATION_STEP = 41;
export const FABLAB_CHAT_STATS_STEP = 42;

export type FablabChatModelBindings = {
  selectedModel: string;
  selectedTextModelId?: string;
  selectedProjectAuditModelId?: string;
  selectedImageModelId?: string;
  selectedOtherModelId?: string;
  selectedSearchModelId?: string;
  selectedSummaryModelId?: string;
  selectedPromptOptimizerModelId?: string;
  selectedRoleOptimizerModelId?: string;
  selectedSpeechSynthesisModelId?: string;
  selectedSpeechTranscriptionModelId?: string;
};

export type RuntimeProviderProfile = {
  id: string;
  label: string;
  provider: ApiRuntimeProvider;
  apiKeyEncoded: string;
  baseUrl?: string;
  validatedModels: ProviderModelInfo[];
  lastValidatedAt?: string;
};

export type FablabChatRuntimeConfig = {
  provider: ApiRuntimeProvider;
  baseUrl: string;
  profileLabel: string;
  selectedModel: string;
  selectedTextModelId?: string;
  selectedProjectAuditModelId?: string;
  selectedImageModelId?: string;
  selectedOtherModelId?: string;
  selectedSearchModelId?: string;
  selectedSummaryModelId?: string;
  selectedPromptOptimizerModelId?: string;
  selectedRoleOptimizerModelId?: string;
  selectedSpeechSynthesisModelId?: string;
  selectedSpeechTranscriptionModelId?: string;
  providerProfiles: RuntimeProviderProfile[];
  validatedModels: ProviderModelInfo[];
  apiKeyEncoded: string;
  systemPrompt: string;
  lastValidatedAt: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type FablabChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sourceIds?: Array<string | number>;
  skills?: Record<string, boolean>;
  attachments?: FablabChatAttachment[];
};

export type FablabChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  objectId?: string | number;
  status?: 'uploading' | 'ready' | 'error';
  type?: string;
};

export type FablabChatConversationState = {
  messages: FablabChatMessage[];
  updatedAt: string;
};

export type FablabChatStats = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCost: number;
  lastLatencyMs: number;
  updatedAt?: string;
};

export type FablabChatRuntimeState = {
  config: FablabChatRuntimeConfig | null;
  rawConfig: Record<string, unknown>;
  conversation: FablabChatConversationState;
  stats: FablabChatStats;
};

export type ResolvedRuntimeSelection = {
  provider: ApiRuntimeProvider;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  profileLabel?: string;
  profileId?: string;
};
