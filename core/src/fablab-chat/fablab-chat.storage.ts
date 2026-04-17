import type { ApiRuntimeProvider, ProviderModelCapability, ProviderModelInfo } from '../api-key-runtime';
import { getProductStepProgress, updateProductStepProgress } from '../product-step-progress';
import { createProductFromTemplate, getProducts } from '../products';
import type { ProductType } from '../products';
import {
  FABLAB_CHAT_CONFIG_STEP,
  FABLAB_CHAT_CONVERSATION_STEP,
  FABLAB_CHAT_STATS_STEP,
  type FablabChatConversationState,
  type FablabChatRuntimeConfig,
  type FablabChatRuntimeState,
  type FablabChatStats,
  type ResolvedRuntimeSelection,
  type RuntimeProviderProfile,
} from './fablab-chat.types';

const CHAT_PRODUCT_TYPE: ProductType = 'custom';
const CHAT_PRODUCT_TITLE = '[SYSTEM] FABLAB CHAT RUNTIME STORAGE';
const LEGACY_CHAT_PRODUCT_TITLE = '[SYSTEM] FABLAB CHAT RUNTIME';
const CHAT_PRODUCT_MARKER = '[FABLAB_CHAT_RUNTIME_STORAGE]';
const CHAT_PRODUCT_DESCRIPTION = `Internal runtime storage for /dashboard/chat. ${CHAT_PRODUCT_MARKER}`;
const CHAT_PRODUCT_LINK = 'fablab-chat-runtime';
const CHAT_PRODUCT_ID_CACHE_KEY = 'fixed_product_id:fablab_chat_runtime';

const EMPTY_CONVERSATION: FablabChatConversationState = {
  messages: [],
  updatedAt: '',
};

const EMPTY_STATS: FablabChatStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalEstimatedCost: 0,
  lastLatencyMs: 0,
  updatedAt: '',
};

let cachedChatProductId: number | null = null;
let ensureChatProductPromise: Promise<number> | null = null;
let cachedRuntimeState: FablabChatRuntimeState | null = null;
let cachedRuntimeStateAt = 0;
let runtimeStatePromise: Promise<FablabChatRuntimeState> | null = null;

const RUNTIME_STATE_CACHE_TTL_MS = 4000;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const asString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

const asProvider = (value: unknown): ApiRuntimeProvider => {
  const provider = asString(value).toLowerCase();
  const allowed: ApiRuntimeProvider[] = ['google', 'openai', 'anthropic', 'mistral', 'perplexity', 'ollama'];
  return allowed.includes(provider as ApiRuntimeProvider) ? (provider as ApiRuntimeProvider) : 'google';
};

const asModels = (value: unknown): ProviderModelInfo[] => {
  const asCapabilities = (candidate: unknown): ProviderModelCapability[] => {
    if (!Array.isArray(candidate)) return [];

    const allowed: ProviderModelCapability[] = ['text', 'image', 'audio', 'video', 'search'];
    const normalized = candidate
      .map((entry) => asString(entry).toLowerCase() as ProviderModelCapability)
      .filter((entry) => allowed.includes(entry));

    return Array.from(new Set(normalized));
  };

  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => isRecord(item) && typeof item.id === 'string')
    .map((item) => ({
      id: asString(item.id),
      label: asString(item.label || item.id),
      capabilities: asCapabilities(item.capabilities),
    }));
};

const asProfiles = (value: unknown): RuntimeProviderProfile[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => isRecord(item) && typeof item.id === 'string')
    .map((item) => ({
      id: asString(item.id),
      label: asString(item.label),
      provider: asProvider(item.provider),
      apiKeyEncoded: asString(item.apiKeyEncoded),
      baseUrl: asString(item.baseUrl),
      validatedModels: asModels(item.validatedModels),
      lastValidatedAt: asString(item.lastValidatedAt),
    }));
};

const normalizeConversation = (value: unknown): FablabChatConversationState => {
  if (!isRecord(value)) return EMPTY_CONVERSATION;

  const messages = Array.isArray(value.messages)
    ? value.messages
        .filter((entry) => isRecord(entry) && typeof entry.id === 'string' && typeof entry.content === 'string')
        .map((entry) => {
          const role: 'user' | 'assistant' = entry.role === 'assistant' ? 'assistant' : 'user';
          return {
            id: asString(entry.id),
            role,
            content: asString(entry.content),
            createdAt: asString(entry.createdAt),
            sourceIds: Array.isArray(entry.sourceIds) ? entry.sourceIds : undefined,
            skills: isRecord(entry.skills)
              ? Object.fromEntries(
                  Object.entries(entry.skills).map(([key, val]) => [key, Boolean(val)])
                )
              : undefined,
          };
        })
    : [];

  return {
    messages,
    updatedAt: asString(value.updatedAt),
  };
};

const normalizeStats = (value: unknown): FablabChatStats => {
  if (!isRecord(value)) return { ...EMPTY_STATS };
  return {
    totalRequests: Number(value.totalRequests || 0),
    totalInputTokens: Number(value.totalInputTokens || 0),
    totalOutputTokens: Number(value.totalOutputTokens || 0),
    totalTokens: Number(value.totalTokens || 0),
    totalEstimatedCost: Number(value.totalEstimatedCost || 0),
    lastLatencyMs: Number(value.lastLatencyMs || 0),
    updatedAt: asString(value.updatedAt),
  };
};

const normalizeConfig = (value: unknown): FablabChatRuntimeConfig | null => {
  if (!isRecord(value)) return null;

  return {
    ...value,
    provider: asProvider(value.provider),
    baseUrl: asString(value.baseUrl),
    profileLabel: asString(value.profileLabel),
    selectedModel: asString(value.selectedModel),
    selectedTextModelId: asString(value.selectedTextModelId),
    selectedProjectAuditModelId: asString(value.selectedProjectAuditModelId),
    selectedImageModelId: asString(value.selectedImageModelId),
    selectedOtherModelId: asString(value.selectedOtherModelId),
    selectedSearchModelId: asString(value.selectedSearchModelId),
    selectedSummaryModelId: asString(value.selectedSummaryModelId),
    selectedPromptOptimizerModelId: asString(value.selectedPromptOptimizerModelId),
    selectedRoleOptimizerModelId: asString(value.selectedRoleOptimizerModelId),
    selectedSpeechSynthesisModelId: asString(value.selectedSpeechSynthesisModelId),
    selectedSpeechTranscriptionModelId: asString(value.selectedSpeechTranscriptionModelId),
    providerProfiles: asProfiles(value.providerProfiles),
    validatedModels: asModels(value.validatedModels),
    apiKeyEncoded: asString(value.apiKeyEncoded),
    systemPrompt: asString(value.systemPrompt),
    lastValidatedAt: asString(value.lastValidatedAt),
    updatedAt: asString(value.updatedAt),
  };
};

const parseStepPayload = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const rememberProductId = (id: number): void => {
  cachedChatProductId = id;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CHAT_PRODUCT_ID_CACHE_KEY, String(id));
  }
};

const clearRememberedProductId = (): void => {
  cachedChatProductId = null;
  cachedRuntimeState = null;
  cachedRuntimeStateAt = 0;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CHAT_PRODUCT_ID_CACHE_KEY);
  }
};

const rememberRuntimeState = (state: FablabChatRuntimeState): void => {
  cachedRuntimeState = state;
  cachedRuntimeStateAt = Date.now();
};

const updateCachedRuntimeState = (
  updater: (state: FablabChatRuntimeState | null) => FablabChatRuntimeState | null
): void => {
  cachedRuntimeState = updater(cachedRuntimeState);
  if (cachedRuntimeState) {
    cachedRuntimeStateAt = Date.now();
  }
};

const isChatStorageProduct = (product: { title?: string | null; productLink?: string | null; description?: string | null }): boolean => {
  const title = String(product.title || '');
  const description = String(product.description || '');
  return product.productLink === CHAT_PRODUCT_LINK
    || title === CHAT_PRODUCT_TITLE
    || title === LEGACY_CHAT_PRODUCT_TITLE
    || description.includes(CHAT_PRODUCT_MARKER);
};

const ensureChatProductId = async (): Promise<number> => {
  if (cachedChatProductId) return cachedChatProductId;

  if (ensureChatProductPromise) {
    return ensureChatProductPromise;
  }

  ensureChatProductPromise = (async () => {
    try {
      const fromCache = typeof window !== 'undefined'
        ? Number(window.localStorage.getItem(CHAT_PRODUCT_ID_CACHE_KEY) || 0)
        : 0;

      const productsByType = await getProducts({ type: CHAT_PRODUCT_TYPE });
      if (fromCache > 0) {
        const cachedByType = productsByType.find((product) => product.id === fromCache && isChatStorageProduct(product));
        if (cachedByType) {
          rememberProductId(cachedByType.id);
          return cachedByType.id;
        }
      }

      let existing = productsByType.find((product) => isChatStorageProduct(product));
      if (!existing) {
        const allProducts = await getProducts();
        if (fromCache > 0) {
          const cachedFromAll = allProducts.find((product) => product.id === fromCache && isChatStorageProduct(product));
          if (cachedFromAll) {
            rememberProductId(cachedFromAll.id);
            return cachedFromAll.id;
          }
        }

        existing = allProducts.find((product) => isChatStorageProduct(product));
      }
      if (existing) {
        rememberProductId(existing.id);
        return existing.id;
      }

      const created = await createProductFromTemplate(
        CHAT_PRODUCT_TYPE,
        CHAT_PRODUCT_TITLE,
        CHAT_PRODUCT_DESCRIPTION,
        {
          productLink: CHAT_PRODUCT_LINK,
          isPublic: false,
        }
      );

      rememberProductId(created.id);
      return created.id;
    } catch (error) {
      clearRememberedProductId();
      throw error;
    }
  })();

  try {
    return await ensureChatProductPromise;
  } finally {
    ensureChatProductPromise = null;
  }
};

export const encodeSecret = (value: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return '';
  }
};

export const decodeSecret = (value: string): string => {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return '';
  }
};

const MODEL_BIND_SEP = '::';

export const encodeModelBindingId = (profileId: string, modelId: string): string => {
  return `${profileId}${MODEL_BIND_SEP}${modelId}`;
};

export const decodeModelBindingId = (bindingId: string): { profileId: string; modelId: string } | null => {
  const idx = bindingId.indexOf(MODEL_BIND_SEP);
  if (idx <= 0) return null;
  return {
    profileId: bindingId.slice(0, idx),
    modelId: bindingId.slice(idx + MODEL_BIND_SEP.length),
  };
};

export const loadFablabChatRuntimeState = async (): Promise<FablabChatRuntimeState> => {
  const now = Date.now();
  if (cachedRuntimeState && now - cachedRuntimeStateAt < RUNTIME_STATE_CACHE_TTL_MS) {
    return cachedRuntimeState;
  }

  if (runtimeStatePromise) {
    return runtimeStatePromise;
  }

  runtimeStatePromise = (async () => {
    const productId = await ensureChatProductId();
    const progressRows = await getProductStepProgress(productId);

    const byStep = new Map(progressRows.map((item) => [item.stepId, item]));

    const rawConfigPayload = parseStepPayload(byStep.get(FABLAB_CHAT_CONFIG_STEP)?.resultText ?? {});
    const rawConfig = isRecord(rawConfigPayload) ? rawConfigPayload : {};

    const conversationPayload = parseStepPayload(byStep.get(FABLAB_CHAT_CONVERSATION_STEP)?.resultText ?? {});
    const statsPayload = parseStepPayload(byStep.get(FABLAB_CHAT_STATS_STEP)?.resultText ?? {});

    const state = {
      config: normalizeConfig(rawConfig),
      rawConfig,
      conversation: normalizeConversation(conversationPayload),
      stats: normalizeStats(statsPayload),
    };

    rememberRuntimeState(state);
    return state;
  })();

  try {
    return await runtimeStatePromise;
  } finally {
    runtimeStatePromise = null;
  }
};

export const saveFablabChatRuntimeConfig = async (
  nextConfig: Record<string, unknown>
): Promise<void> => {
  const productId = await ensureChatProductId();
  const payload = {
    ...nextConfig,
    updatedAt: new Date().toISOString(),
  };
  await updateProductStepProgress({
    productId,
    stepId: FABLAB_CHAT_CONFIG_STEP,
    status: 'success',
    executedAt: new Date().toISOString(),
    resultText: payload,
  });

  updateCachedRuntimeState((state) => {
    if (!state) return state;
    return {
      ...state,
      config: normalizeConfig(payload),
      rawConfig: payload,
    };
  });
};

export const saveFablabChatConversation = async (
  conversation: FablabChatConversationState
): Promise<void> => {
  const productId = await ensureChatProductId();
  await updateProductStepProgress({
    productId,
    stepId: FABLAB_CHAT_CONVERSATION_STEP,
    status: 'success',
    executedAt: new Date().toISOString(),
    resultText: {
      ...conversation,
      updatedAt: conversation.updatedAt || new Date().toISOString(),
    },
  });

  updateCachedRuntimeState((state) => {
    if (!state) return state;
    return {
      ...state,
      conversation,
    };
  });
};

export const saveFablabChatStats = async (
  stats: FablabChatStats
): Promise<void> => {
  const productId = await ensureChatProductId();
  await updateProductStepProgress({
    productId,
    stepId: FABLAB_CHAT_STATS_STEP,
    status: 'success',
    executedAt: new Date().toISOString(),
    resultText: {
      ...stats,
      updatedAt: stats.updatedAt || new Date().toISOString(),
    },
  });

  updateCachedRuntimeState((state) => {
    if (!state) return state;
    return {
      ...state,
      stats,
    };
  });
};

export const resolveRuntimeFromConfig = (
  config: Pick<FablabChatRuntimeConfig, 'selectedModel' | 'providerProfiles' | 'provider' | 'apiKeyEncoded' | 'baseUrl' | 'profileLabel'>
): ResolvedRuntimeSelection | null => {
  const selectedModel = (config.selectedModel || '').trim();
  if (!selectedModel) return null;

  const decoded = decodeModelBindingId(selectedModel);
  if (decoded) {
    const profile = (config.providerProfiles || []).find((item) => item.id === decoded.profileId);
    if (!profile) return null;

    const apiKey = decodeSecret(profile.apiKeyEncoded || '');
    const baseUrl = (profile.baseUrl || '').trim();
    if (profile.provider === 'ollama' && !baseUrl) return null;
    if (profile.provider !== 'ollama' && profile.provider !== 'google' && !apiKey.trim()) return null;

    return {
      provider: profile.provider,
      modelId: decoded.modelId,
      apiKey,
      baseUrl: baseUrl || undefined,
      profileLabel: profile.label,
      profileId: profile.id,
    };
  }

  const provider = config.provider;
  const apiKey = decodeSecret(config.apiKeyEncoded || '');
  const baseUrl = (config.baseUrl || '').trim();
  if (provider === 'ollama' && !baseUrl) return null;
  if (provider !== 'ollama' && provider !== 'google' && !apiKey.trim()) return null;

  return {
    provider,
    modelId: selectedModel,
    apiKey,
    baseUrl: baseUrl || undefined,
    profileLabel: config.profileLabel,
  };
};
