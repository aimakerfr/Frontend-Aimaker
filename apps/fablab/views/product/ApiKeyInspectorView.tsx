import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Copy,
  Bot,
  Check,
  Globe,
  GripVertical,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getOrCreateProductByType, getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import {
  providerChat,
  validateProviderKey,
  type ApiRuntimeProvider,
  type ProviderChatMessage,
  type ProviderModelInfo,
} from '@core/api-key-runtime';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

const STEP_CONFIG = 1;
const STEP_CHAT = 2;
const STEP_STATS = 3;

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type RuntimeStats = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCost: number;
  lastLatencyMs: number;
};

type CatalogModel = {
  id: string;
  label: string;
  editeur: string;
  inputPer1M?: number;
  outputPer1M?: number;
  prix?: string;
  imageOutput?: number;
  capabilities: ModelCapability[];
};

type ModelCapability = 'text' | 'image' | 'audio' | 'video' | 'search' | 'unknown';

type EnrichedModelOption = {
  id: string;
  label: string;
  displayLabel: string;
  capabilities: ModelCapability[];
  priceLabel: string;
  usableInChat: boolean;
};

type PromptRecord = {
  id: string;
  title: string;
  prompt: string;
};

type RoleRecord = {
  id: string;
  title: string;
  behavior: string;
};

type ConversationRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatItem[];
};

const PROVIDERS: Array<{ value: ApiRuntimeProvider; label: string; hint: string }> = [
  { value: 'google', label: 'Google', hint: 'AIza...' },
  { value: 'openai', label: 'OpenAI', hint: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic', hint: 'sk-ant-...' },
  { value: 'mistral', label: 'Mistral', hint: 'Key token' },
  { value: 'perplexity', label: 'Perplexity', hint: 'pplx-...' },
];

const EMPTY_STATS: RuntimeStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalEstimatedCost: 0,
  lastLatencyMs: 0,
};

const createConversation = (title: string): ConversationRecord => {
  const now = new Date().toISOString();
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const encodeSecret = (value: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return '';
  }
};

const decodeSecret = (value: string): string => {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return '';
  }
};

const isLikelyKeyFormat = (provider: ApiRuntimeProvider, apiKey: string): boolean => {
  const k = apiKey.trim();
  if (!k) return false;
  switch (provider) {
    case 'google':
      return /^AIza[0-9A-Za-z\-_]{20,}$/.test(k);
    case 'openai':
      return /^sk-[A-Za-z0-9\-_]{20,}$/.test(k);
    case 'anthropic':
      return /^sk-ant-[A-Za-z0-9\-_]{12,}$/.test(k);
    case 'perplexity':
      return /^pplx-[A-Za-z0-9\-_]{8,}$/.test(k);
    case 'mistral':
      return k.length >= 16;
    default:
      return false;
  }
};

const normalizeModelId = (value: string): string => value.replace(/^models\//, '').trim().toLowerCase();

const inferCapabilitiesFromId = (modelId: string): ModelCapability[] => {
  const value = normalizeModelId(modelId);

  if (value.includes('veo') || value.includes('video')) return ['video'];
  if (value.includes('image') || value.includes('imagen') || value.includes('nano-banana')) return ['image'];
  if (value.includes('whisper') || value.includes('tts') || value.includes('stt') || value.includes('audio') || value.includes('voxtral')) {
    return ['audio'];
  }
  if (value.includes('sonar') || value.includes('search')) return ['search'];
  if (value.length > 0) return ['text'];
  return ['unknown'];
};

const capabilityLabel = (capability: ModelCapability, t: any): string => {
  switch (capability) {
    case 'text':
      return t.apiKeyProductView?.capabilityText || 'Texto';
    case 'image':
      return t.apiKeyProductView?.capabilityImage || 'Imagen';
    case 'audio':
      return t.apiKeyProductView?.capabilityAudio || 'Audio';
    case 'video':
      return t.apiKeyProductView?.capabilityVideo || 'Video';
    case 'search':
      return t.apiKeyProductView?.capabilitySearch || 'Busqueda';
    default:
      return t.apiKeyProductView?.capabilityUnknown || 'Desconocido';
  }
};

const formatPriceLabel = (catalogModel?: CatalogModel): string => {
  if (!catalogModel) return 'N/A';

  if (catalogModel.prix && catalogModel.prix.trim()) {
    return catalogModel.prix.trim();
  }

  if (Number(catalogModel.imageOutput ?? 0) > 0) {
    return `$${Number(catalogModel.imageOutput).toFixed(3)}/img`;
  }

  const input = Number(catalogModel.inputPer1M ?? 0);
  const output = Number(catalogModel.outputPer1M ?? 0);
  if (input <= 0 && output <= 0) return 'N/A';
  return `$${input}/$${output} /1M`;
};

const estimateCost = (
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  catalogMap: Map<string, CatalogModel>
): number => {
  const info = catalogMap.get(modelId) ?? catalogMap.get(normalizeModelId(modelId));
  if (!info) return 0;
  const inputPer1M = Number(info.inputPer1M ?? 0);
  const outputPer1M = Number(info.outputPer1M ?? 0);
  if (inputPer1M <= 0 && outputPer1M <= 0) return 0;
  return (inputTokens / 1_000_000) * inputPer1M + (outputTokens / 1_000_000) * outputPer1M;
};

const parseCatalogModels = (raw: string): CatalogModel[] => {
  const match = raw.match(/const\s+MODELS_DATA\s*=\s*([\s\S]*?);\s*$/m);
  if (!match) return [];

  try {
    const parsed = new Function(`return (${match[1]});`)() as Record<string, Array<Record<string, unknown>>>;

    const categoryCapabilities: Record<string, ModelCapability[]> = {
      text: ['text'],
      image: ['image'],
      search: ['search'],
      tts: ['audio'],
      stt: ['audio'],
    };

    const models: CatalogModel[] = [];
    for (const [category, items] of Object.entries(parsed || {})) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const id = String(item.id ?? '').trim();
        if (!id) continue;

        models.push({
          id,
          label: String(item.label ?? item.id ?? ''),
          editeur: String(item.editeur ?? '').toLowerCase(),
          inputPer1M: Number(item.inputPer1M ?? 0),
          outputPer1M: Number(item.outputPer1M ?? 0),
          prix: typeof item.prix === 'string' ? item.prix : undefined,
          imageOutput: Number(item.imageOutput ?? 0),
          capabilities: categoryCapabilities[category] ?? inferCapabilitiesFromId(id),
        });
      }
    }

    return models;
  } catch {
    return [];
  }
};

const ApiKeyInspectorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const [provider, setProvider] = useState<ApiRuntimeProvider>('google');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');

  const [stats, setStats] = useState<RuntimeStats>(EMPTY_STATS);
  const [catalogModels, setCatalogModels] = useState<CatalogModel[]>([]);
  const [remoteModels, setRemoteModels] = useState<ProviderModelInfo[]>([]);
  const [hasValidatedKey, setHasValidatedKey] = useState(false);

  const [isRolesOpen, setIsRolesOpen] = useState(true);
  const [isPromptsOpen, setIsPromptsOpen] = useState(true);
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleTitleInput, setRoleTitleInput] = useState('');
  const [roleBehaviorInput, setRoleBehaviorInput] = useState('');

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptTitleInput, setPromptTitleInput] = useState('');
  const [promptContentInput, setPromptContentInput] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const fixedTitle = t.products.fixed.apiKeyTitle || 'Inspector de API Keys';
  const fixedDescription = t.products.fixed.apiKeyDesc || 'Valida formato y conectividad de API keys por proveedor.';

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogModel>();
    for (const model of catalogModels) {
      map.set(model.id, model);
      map.set(normalizeModelId(model.id), model);
    }
    return map;
  }, [catalogModels]);

  const validatedModelOptions = useMemo<EnrichedModelOption[]>(() => {
    const options: EnrichedModelOption[] = [];
    for (const remote of remoteModels) {
      const catalog = catalogMap.get(remote.id) ?? catalogMap.get(normalizeModelId(remote.id));
      const capabilities = (catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(remote.id)) as ModelCapability[];
      const usableInChat = capabilities.includes('text') || capabilities.includes('search');
      const priceLabel = formatPriceLabel(catalog);
      options.push({
        id: remote.id,
        label: remote.label || remote.id,
        displayLabel: `${remote.label || remote.id} (${priceLabel})`,
        capabilities,
        priceLabel,
        usableInChat,
      });
    }
    return options;
  }, [remoteModels, catalogMap]);

  const modelOptions = useMemo(() => {
    return validatedModelOptions.filter((m) => m.usableInChat);
  }, [validatedModelOptions]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const effectiveSystemPrompt = useMemo(() => {
    const blocks = [systemPrompt.trim(), selectedRole?.behavior?.trim() ?? ''].filter(Boolean);
    return blocks.join('\n\n');
  }, [systemPrompt, selectedRole]);

  const persistConfig = async (productId: number, override?: Partial<Record<string, unknown>>) => {
    await updateProductStepProgress({
      productId,
      stepId: STEP_CONFIG,
      status: 'success',
      resultText: {
        provider,
        selectedModel,
        systemPrompt,
        selectedRoleId,
        apiKeyEncoded: encodeSecret(apiKey),
        updatedAt: new Date().toISOString(),
        ...override,
      },
    });
  };

  const persistChat = async (productId: number, override?: Partial<Record<string, unknown>>) => {
    await updateProductStepProgress({
      productId,
      stepId: STEP_CHAT,
      status: 'success',
      resultText: {
        roles,
        prompts,
        conversations,
        activeConversationId,
        updatedAt: new Date().toISOString(),
        ...override,
      },
    });
  };

  const persistStats = async (productId: number, nextStats: RuntimeStats) => {
    await updateProductStepProgress({
      productId,
      stepId: STEP_STATS,
      status: 'success',
      resultText: {
        ...nextStats,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch('/view-ApiKey/models.js');
        if (!response.ok) return;
        const text = await response.text();
        const parsed = parseCatalogModels(text);
        setCatalogModels(parsed);
      } catch (err) {
        console.error('[ApiKeyInspectorView] Unable to load catalog models:', err);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        let productData: Product;

        let targetId: number | null = id ? parseInt(id, 10) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('api_key_maker', {
            title: fixedTitle,
            description: fixedDescription,
          });
          targetId = ensured.id;
        }

        if (isAuthenticated) {
          try {
            productData = await getProduct(targetId);
            setIsOwner(true);
          } catch {
            productData = await getPublicProduct(targetId);
            setIsOwner(false);
          }
        } else {
          productData = await getPublicProduct(targetId);
          setIsOwner(false);
        }

        setProduct(productData);

        const progress = await getProductStepProgress(productData.id);
        const config = progress.find((p) => p.stepId === STEP_CONFIG)?.resultText;
        const chatProgress = progress.find((p) => p.stepId === STEP_CHAT)?.resultText;
        const statsProgress = progress.find((p) => p.stepId === STEP_STATS)?.resultText;

        if (config) {
          if (typeof config.provider === 'string') {
            setProvider(config.provider as ApiRuntimeProvider);
          }
          if (typeof config.selectedModel === 'string') {
            setSelectedModel(config.selectedModel);
          }
          if (typeof config.systemPrompt === 'string') {
            setSystemPrompt(config.systemPrompt);
          }
          if (typeof config.selectedRoleId === 'string') {
            setSelectedRoleId(config.selectedRoleId);
          }
          if (typeof config.apiKeyEncoded === 'string') {
            setApiKey(decodeSecret(config.apiKeyEncoded));
          }
          if (Array.isArray(config.validatedModels)) {
            setRemoteModels(config.validatedModels as ProviderModelInfo[]);
            setHasValidatedKey((config.validatedModels as ProviderModelInfo[]).length > 0);
          }
          if (typeof config.lastValidatedAt === 'string') {
            setHasValidatedKey(true);
          }
        }

        if (chatProgress) {
          if (Array.isArray(chatProgress.roles)) {
            setRoles(chatProgress.roles as RoleRecord[]);
          }
          if (Array.isArray(chatProgress.prompts)) {
            setPrompts(chatProgress.prompts as PromptRecord[]);
          }
          if (Array.isArray(chatProgress.conversations) && chatProgress.conversations.length > 0) {
            setConversations(chatProgress.conversations as ConversationRecord[]);
          } else {
            const firstConversation = createConversation(t.apiKeyProductView?.newConversationDefault || 'Nueva conversacion');
            setConversations([firstConversation]);
            setActiveConversationId(firstConversation.id);
          }
          if (typeof chatProgress.activeConversationId === 'string') {
            setActiveConversationId(chatProgress.activeConversationId);
          }
        } else {
          const firstConversation = createConversation(t.apiKeyProductView?.newConversationDefault || 'Nueva conversacion');
          setConversations([firstConversation]);
          setActiveConversationId(firstConversation.id);
        }

        if (statsProgress && typeof statsProgress === 'object') {
          setStats({ ...EMPTY_STATS, ...(statsProgress as RuntimeStats) });
        }
      } catch (error) {
        console.error('[ApiKeyInspectorView] Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated, fixedTitle, fixedDescription, t.apiKeyProductView]);

  useEffect(() => {
    if (!selectedModel && modelOptions.length > 0) {
      setSelectedModel(modelOptions[0].id);
    }
  }, [selectedModel, modelOptions]);

  useEffect(() => {
    if (!selectedModel) return;
    const stillAvailable = modelOptions.some((m) => m.id === selectedModel);
    if (!stillAvailable) {
      setSelectedModel(modelOptions[0]?.id ?? '');
    }
  }, [selectedModel, modelOptions]);

  const patchConversation = (conversationId: string, updater: (c: ConversationRecord) => ConversationRecord) => {
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? updater(conv) : conv)));
  };

  const handleCopyUrl = () => {
    if (!product) return;
    navigator.clipboard.writeText(`${window.location.origin}/product/api-key/${product.id}`);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1800);
  };

  const handleValidateKey = async () => {
    if (!product) return;
    setErrorText('');
    setStatusText('');

    if (!isLikelyKeyFormat(provider, apiKey)) {
      setErrorText('Formato de API key no valido para el proveedor elegido.');
      return;
    }

    try {
      setIsValidatingKey(true);
      const result = await validateProviderKey({ provider, apiKey: apiKey.trim() });
      setRemoteModels(result.models || []);
      setHasValidatedKey(true);

      if (!selectedModel && result.models.length > 0) {
        const firstUsable = result.models.find((m) => {
          const catalog = catalogMap.get(m.id) ?? catalogMap.get(normalizeModelId(m.id));
          const capabilities = catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(m.id);
          return capabilities.includes('text') || capabilities.includes('search');
        });
        setSelectedModel(firstUsable?.id ?? '');
      }

      await persistConfig(product.id, {
        lastValidatedAt: new Date().toISOString(),
        validatedModels: result.models,
      });
      setStatusText('API key validada correctamente y modelos cargados.');
    } catch (err: any) {
      console.error('[ApiKeyInspectorView] Key validation error:', err);
      setErrorText(err?.message || 'No se pudo validar la API key.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const getCurrentMessages = (): ChatItem[] => {
    return activeConversation?.messages ?? [];
  };

  const runChat = async (text: string, isTest: boolean) => {
    if (!product) return;
    if (!apiKey.trim()) {
      setErrorText('Debes ingresar una API key.');
      return;
    }
    if (!selectedModel.trim()) {
      setErrorText('Debes elegir un modelo.');
      return;
    }

    if (!activeConversation) {
      setErrorText(t.apiKeyProductView?.selectConversationFirst || 'Debes crear o seleccionar una conversacion.');
      return;
    }

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const nextChatBase = [...getCurrentMessages(), userMessage];

    patchConversation(activeConversation.id, (conv) => ({
      ...conv,
      title: conv.messages.length === 0 ? text.slice(0, 42) : conv.title,
      messages: nextChatBase,
      updatedAt: new Date().toISOString(),
    }));

    setErrorText('');
    setStatusText('');
    setIsSending(true);

    try {
      const payloadMessages: ProviderChatMessage[] = nextChatBase
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await providerChat({
        provider,
        apiKey: apiKey.trim(),
        model: selectedModel,
        systemPrompt: effectiveSystemPrompt,
        messages: payloadMessages,
      });

      const assistantMessage: ChatItem = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.content || '(sin contenido)',
        createdAt: new Date().toISOString(),
      };

      const nextChat = [...nextChatBase, assistantMessage];
      patchConversation(activeConversation.id, (conv) => ({
        ...conv,
        messages: nextChat,
        updatedAt: new Date().toISOString(),
      }));

      const estimatedCost = estimateCost(
        selectedModel,
        response.usage.inputTokens,
        response.usage.outputTokens,
        catalogMap
      );

      const nextStats: RuntimeStats = {
        totalRequests: stats.totalRequests + 1,
        totalInputTokens: stats.totalInputTokens + response.usage.inputTokens,
        totalOutputTokens: stats.totalOutputTokens + response.usage.outputTokens,
        totalTokens: stats.totalTokens + response.usage.totalTokens,
        totalEstimatedCost: stats.totalEstimatedCost + estimatedCost,
        lastLatencyMs: response.latencyMs,
      };
      setStats(nextStats);

      await Promise.all([
        persistChat(product.id, {
          conversations: conversations.map((conv) =>
            conv.id === activeConversation.id
              ? {
                  ...conv,
                  messages: nextChat,
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }),
        persistStats(product.id, nextStats),
        persistConfig(product.id),
      ]);

      if (!isTest) {
        setMessageInput('');
      }
      setStatusText(isTest ? 'Modelo probado correctamente.' : 'Respuesta recibida y guardada.');
    } catch (err: any) {
      console.error('[ApiKeyInspectorView] Chat error:', err);
      setErrorText(err?.message || 'No se pudo completar el chat con el proveedor.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;
    await runChat(text, false);
  };

  const handleTestModel = async () => {
    await runChat('Responde solo: OK', true);
  };

  const handleCreateConversation = async () => {
    const title = t.apiKeyProductView?.newConversationDefault || 'Nueva conversacion';
    const conversation = createConversation(title);
    const nextConversations = [conversation, ...conversations];
    setConversations(nextConversations);
    setActiveConversationId(conversation.id);
    setStatusText(t.apiKeyProductView?.newConversationCreated || 'Nueva conversacion creada.');

    if (product) {
      await persistChat(product.id, {
        conversations: nextConversations,
        activeConversationId: conversation.id,
      });
    }
  };

  const handleCreateRole = async () => {
    const title = roleTitleInput.trim();
    const behavior = roleBehaviorInput.trim();
    if (!title || !behavior) {
      setErrorText(t.apiKeyProductView?.roleValidation || 'Debes completar titulo y comportamiento del rol.');
      return;
    }

    const newRole: RoleRecord = {
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      behavior,
    };

    const nextRoles = [newRole, ...roles];
    setRoles(nextRoles);
    setSelectedRoleId(newRole.id);
    setShowRoleModal(false);
    setRoleTitleInput('');
    setRoleBehaviorInput('');
    setStatusText(t.apiKeyProductView?.roleSaved || 'Rol guardado.');

    if (product) {
      await persistChat(product.id, { roles: nextRoles });
      await persistConfig(product.id, { selectedRoleId: newRole.id });
    }
  };

  const handleCreatePrompt = async () => {
    const title = promptTitleInput.trim();
    const prompt = promptContentInput.trim();
    if (!title || !prompt) {
      setErrorText(t.apiKeyProductView?.promptValidation || 'Debes completar titulo y contenido del prompt.');
      return;
    }

    const newPrompt: PromptRecord = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      prompt,
    };

    const nextPrompts = [newPrompt, ...prompts];
    setPrompts(nextPrompts);
    setShowPromptModal(false);
    setPromptTitleInput('');
    setPromptContentInput('');
    setStatusText(t.apiKeyProductView?.promptSaved || 'Prompt guardado.');

    if (product) {
      await persistChat(product.id, { prompts: nextPrompts });
    }
  };

  const handleUsePrompt = (prompt: PromptRecord) => {
    setMessageInput(prompt.prompt);
    setStatusText(t.apiKeyProductView?.promptApplied || 'Prompt aplicado al cuadro de chat.');
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setStatusText('');
    setErrorText('');
    if (product) {
      persistChat(product.id, { activeConversationId: conversationId }).catch((err) => {
        console.error('[ApiKeyInspectorView] Persist active conversation failed:', err);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-cyan-600" size={36} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t.apiKeyProductView?.notFound || 'Producto no encontrado o no es publico.'}</p>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            {t.apiKeyProductView?.backToProducts || 'Volver a productos'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#d8e7e3] overflow-hidden">
      <div className="h-full flex">
        <aside className={`${sidebarCollapsed ? 'w-14' : 'w-[280px]'} transition-all duration-200 bg-[#d2e4df] border-r border-[#9ecbc2] flex-shrink-0 flex flex-col`}>
          <div className="p-3 border-b border-[#9ecbc2] flex items-start gap-2">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-1 rounded border border-[#87c7bc] text-[#1d7269] hover:bg-[#bfe0d9]"
              title={t.apiKeyProductView?.collapseSidebar || 'Colapsar'}
            >
              <GripVertical size={14} />
            </button>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-[#0e3f3a] leading-6">FabLab AIMaker</p>
                <p className="text-xs text-[#4b817a]">v2.3</p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="px-3 pt-3">
                <button
                  onClick={handleCreateConversation}
                  className="w-full rounded-xl bg-[#0b7d72] text-white py-2.5 px-3 font-bold text-sm hover:bg-[#0a6f66]"
                >
                  + {t.apiKeyProductView?.newConversation || 'Nueva conversacion'}
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-3">
                <section className="border-t border-[#9ecbc2] pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsRolesOpen((v) => !v)}
                      className="flex items-center gap-1 text-[#186f65] font-bold text-sm"
                    >
                      {isRolesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {t.apiKeyProductView?.rolesTitle || 'ROLES'}
                    </button>
                    <button
                      onClick={() => setShowRoleModal(true)}
                      disabled={!isOwner}
                      className="p-1 rounded border border-[#87c7bc] text-[#186f65] disabled:opacity-40"
                      title={t.apiKeyProductView?.newRole || 'Nuevo rol'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {isRolesOpen && (
                    <div className="mt-2 space-y-1">
                      {roles.length === 0 && (
                        <p className="text-xs text-[#3f7b73]">{t.apiKeyProductView?.emptyRoles || 'Sin roles guardados'}</p>
                      )}
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => {
                            setSelectedRoleId(role.id);
                            if (product) {
                              persistConfig(product.id, { selectedRoleId: role.id }).catch((err) => {
                                console.error('[ApiKeyInspectorView] Persist role failed:', err);
                              });
                            }
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-sm ${selectedRoleId === role.id ? 'bg-[#0b7d72] text-white' : 'hover:bg-[#c3dfd8] text-[#18413d]'}`}
                        >
                          {role.title}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="border-t border-[#9ecbc2] pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsPromptsOpen((v) => !v)}
                      className="flex items-center gap-1 text-[#186f65] font-bold text-sm"
                    >
                      {isPromptsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {t.apiKeyProductView?.promptsTitle || 'PROMPTS'}
                    </button>
                    <button
                      onClick={() => setShowPromptModal(true)}
                      disabled={!isOwner}
                      className="p-1 rounded border border-[#87c7bc] text-[#186f65] disabled:opacity-40"
                      title={t.apiKeyProductView?.newPrompt || 'Nuevo prompt'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {isPromptsOpen && (
                    <div className="mt-2 space-y-1">
                      {prompts.length === 0 && (
                        <p className="text-xs text-[#3f7b73]">{t.apiKeyProductView?.emptyPrompts || 'Sin prompts guardados'}</p>
                      )}
                      {prompts.map((prompt) => (
                        <div key={prompt.id} className="rounded bg-[#c8dfd9] p-2">
                          <p className="text-xs font-semibold text-[#154c45]">{prompt.title}</p>
                          <button
                            onClick={() => handleUsePrompt(prompt)}
                            className="text-[11px] mt-1 text-[#0b7d72] underline"
                          >
                            {t.apiKeyProductView?.usePrompt || 'Usar en chat'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="border-t border-[#9ecbc2] pt-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsConversationsOpen((v) => !v)}
                      className="flex items-center gap-1 text-[#186f65] font-bold text-sm"
                    >
                      {isConversationsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {t.apiKeyProductView?.conversationsTitle || 'CONVERSACIONES'}
                    </button>
                    <button
                      onClick={handleCreateConversation}
                      className="p-1 rounded border border-dashed border-[#87c7bc] text-[#186f65]"
                      title={t.apiKeyProductView?.newConversation || 'Nueva conversacion'}
                    >
                      <CirclePlus size={14} />
                    </button>
                  </div>
                  {isConversationsOpen && (
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
                      {conversations.length === 0 && (
                        <p className="text-xs text-[#3f7b73]">{t.apiKeyProductView?.emptyConversations || 'Sin conversaciones'}</p>
                      )}
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm ${activeConversationId === conv.id ? 'bg-[#0b7d72] text-white' : 'hover:bg-[#c3dfd8] text-[#18413d]'}`}
                        >
                          <p className="truncate">{conv.title || (t.apiKeyProductView?.untitledConversation || 'Conversacion sin titulo')}</p>
                          <p className={`text-[11px] ${activeConversationId === conv.id ? 'text-white/80' : 'text-[#3e7770]'}`}>
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col bg-[#eef3f2]">
          <header className="border-b border-[#b6d7d1] bg-[#e8f0ee] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {isOwner && (
                  <button
                    onClick={() => navigate('/dashboard/products')}
                    className="p-1.5 rounded border border-[#87c7bc] text-[#186f65] hover:bg-[#d6ebe6]"
                    title={t.apiKeyProductView?.backToProducts || 'Volver a productos'}
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <KeyRound size={18} className="text-[#0b7d72] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-[#133f3a] truncate">{fixedTitle}</p>
                  <p className="text-xs text-[#3d7670] truncate">{fixedDescription}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded border text-xs font-semibold ${product.isPublic ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  {product.isPublic ? (
                    <span className="inline-flex items-center gap-1"><Globe size={12} /> {t.apiKeyProductView?.publicLabel || 'Publico'}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><Lock size={12} /> {t.apiKeyProductView?.privateLabel || 'Privado'}</span>
                  )}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="p-1.5 rounded border border-[#87c7bc] text-[#186f65] hover:bg-[#d6ebe6]"
                  title={t.apiKeyProductView?.copyProductUrl || 'Copiar URL del producto'}
                >
                  {urlCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </header>

          {!isOwner && (
            <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t.apiKeyProductView?.publicReadOnlyNotice || 'Modo publico: puedes ver historial, pero no editar keys o configuracion.'}
            </div>
          )}

          <div className="border-y border-[#b6d7d1] bg-[#edf5f3] px-4 py-2 text-sm flex flex-wrap items-center gap-2">
            <span className="text-[#2a6f68]">{t.apiKeyProductView?.modelTextLabel || 'Modelo texto'}:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!isOwner || modelOptions.length === 0}
              className="rounded border border-[#8ccabd] bg-[#f5faf8] px-2 py-1 text-sm"
            >
              {modelOptions.length === 0 && <option value="">{t.apiKeyProductView?.noModels || 'Sin modelos'}</option>}
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.displayLabel}</option>
              ))}
            </select>

            <span className="text-[#2a6f68] ml-3">{t.apiKeyProductView?.providerLabel || 'Proveedor'}:</span>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as ApiRuntimeProvider);
                setRemoteModels([]);
                setSelectedModel('');
                setHasValidatedKey(false);
              }}
              disabled={!isOwner}
              className="rounded border border-[#8ccabd] bg-[#f5faf8] px-2 py-1 text-sm"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <span className="text-[#2a6f68] ml-3">{t.apiKeyProductView?.roleSelectorLabel || 'Rol'}:</span>
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                if (product) {
                  persistConfig(product.id, { selectedRoleId: e.target.value }).catch((err) => {
                    console.error('[ApiKeyInspectorView] Persist role selector failed:', err);
                  });
                }
              }}
              disabled={!isOwner || roles.length === 0}
              className="rounded border border-[#8ccabd] bg-[#f5faf8] px-2 py-1 text-sm"
            >
              <option value="">{t.apiKeyProductView?.noneOption || 'Ninguno'}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
          </div>

          <div className="border-b border-[#b6d7d1] bg-[#edf5f3] px-4 py-1 text-xs text-[#2f706a] flex items-center justify-between">
            <span>
              {t.apiKeyProductView?.tokenBar || 'Tokens'} - IN: {stats.totalInputTokens} | OUT: {stats.totalOutputTokens} | TOTAL: {stats.totalTokens}
            </span>
            <span>
              {t.apiKeyProductView?.estimatedCost || 'Costo estimado'}: ${stats.totalEstimatedCost.toFixed(6)}
            </span>
          </div>

          <section className="px-4 py-3 border-b border-[#c5ddd8] bg-[#f0f7f5]">
            <h3 className="text-sm font-semibold text-[#174540] mb-2">{t.apiKeyProductView?.quickFlowTitle || 'Flujo rapido de uso'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-[#2e6d66]">
              <div className="rounded border border-[#b6d7d1] bg-white p-2">
                <strong>{t.apiKeyProductView?.step1Title || '1. Configura key'}</strong>
                <p>{t.apiKeyProductView?.step1Body || 'Elige proveedor, pega API key y valida para cargar modelos.'}</p>
              </div>
              <div className="rounded border border-[#b6d7d1] bg-white p-2">
                <strong>{t.apiKeyProductView?.step2Title || '2. Define comportamiento'}</strong>
                <p>{t.apiKeyProductView?.step2Body || 'Selecciona un rol, agrega instruccion base y usa prompts guardados.'}</p>
              </div>
              <div className="rounded border border-[#b6d7d1] bg-white p-2">
                <strong>{t.apiKeyProductView?.step3Title || '3. Chatea y registra'}</strong>
                <p>{t.apiKeyProductView?.step3Body || 'Envia mensajes, guarda conversaciones y consulta estadisticas de uso.'}</p>
              </div>
            </div>
          </section>

          <section className="px-4 py-3 border-b border-[#c5ddd8] bg-[#f5faf8] grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded border border-[#b6d7d1] bg-white p-3">
              <h4 className="text-sm font-semibold text-[#174540] mb-2 inline-flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#0b7d72]" /> {t.apiKeyProductView?.apiConfigTitle || 'Configuracion de API'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isOwner}
                  placeholder={PROVIDERS.find((p) => p.value === provider)?.hint || 'API key'}
                  className="rounded border border-[#8ccabd] bg-[#f8fcfb] px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleValidateKey}
                    disabled={!isOwner || isValidatingKey || !apiKey.trim()}
                    className="flex-1 rounded bg-[#0b7d72] text-white text-sm font-semibold py-2 hover:bg-[#0a7067] disabled:opacity-50"
                  >
                    {isValidatingKey ? (t.apiKeyProductView?.validating || 'Validando...') : (t.apiKeyProductView?.validateKey || 'Validar key')}
                  </button>
                  <button
                    onClick={handleTestModel}
                    disabled={!isOwner || isSending || !selectedModel || !apiKey.trim()}
                    className="flex-1 rounded border border-[#0b7d72] text-[#0b7d72] text-sm font-semibold py-2 hover:bg-[#e4f4f0] disabled:opacity-50"
                  >
                    {t.apiKeyProductView?.testModel || 'Probar modelo'}
                  </button>
                </div>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                disabled={!isOwner}
                rows={2}
                placeholder={t.apiKeyProductView?.baseInstructionPlaceholder || 'Instruccion base para el asistente...'}
                className="w-full mt-2 rounded border border-[#8ccabd] bg-[#f8fcfb] px-3 py-2 text-sm"
              />
              {selectedRole && (
                <p className="text-xs text-[#2e6d66] mt-2">
                  {t.apiKeyProductView?.activeRolePrefix || 'Rol activo'}: <strong>{selectedRole.title}</strong>
                </p>
              )}
            </div>

            <div className="rounded border border-[#b6d7d1] bg-white p-3">
              <h4 className="text-sm font-semibold text-[#174540] mb-2">{t.apiKeyProductView?.usageStatsTitle || 'Uso y costo'}</h4>
              <div className="space-y-1 text-xs text-[#2f706a]">
                <p>{t.apiKeyProductView?.requestsLabel || 'Requests'}: <strong>{stats.totalRequests}</strong></p>
                <p>{t.apiKeyProductView?.latencyLabel || 'Ultima latencia'}: <strong>{stats.lastLatencyMs} ms</strong></p>
                <p>{t.apiKeyProductView?.selectedModelLabel || 'Modelo seleccionado'}: <strong>{selectedModel || '-'}</strong></p>
                <p>{t.apiKeyProductView?.providerLabel || 'Proveedor'}: <strong>{provider}</strong></p>
              </div>
            </div>
          </section>

          <section className="px-4 py-3 border-b border-[#c5ddd8] bg-[#f3f8f7]">
            <h4 className="text-sm font-semibold text-[#174540] mb-2">{t.apiKeyProductView?.validatedModelsTitle || 'Modelos validados con esta key'}</h4>
            {!hasValidatedKey && (
              <p className="text-xs text-[#2e6d66]">
                {t.apiKeyProductView?.validateToSeeModels || 'Valida la API key para listar solo modelos realmente habilitados para tu cuenta.'}
              </p>
            )}
            {hasValidatedKey && validatedModelOptions.length === 0 && (
              <p className="text-xs text-[#2e6d66]">
                {t.apiKeyProductView?.noValidatedModels || 'La validacion fue correcta, pero no se recibieron modelos para este proveedor.'}
              </p>
            )}
            {validatedModelOptions.length > 0 && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {validatedModelOptions.map((model) => (
                  <div key={model.id} className="rounded border border-[#b6d7d1] bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#173f3a] break-all">{model.label}</p>
                      <span className="text-[#0b7d72] font-semibold whitespace-nowrap">{model.priceLabel}</span>
                    </div>
                    <p className="text-[#4a7e77] mt-1 break-all">{model.id}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.capabilities.map((cap) => (
                        <span key={`${model.id}-${cap}`} className="px-1.5 py-0.5 rounded bg-[#e5f3f0] text-[#1a6f65] border border-[#b9ddd6]">
                          {capabilityLabel(cap, t)}
                        </span>
                      ))}
                    </div>
                    <p className={`mt-2 font-medium ${model.usableInChat ? 'text-green-700' : 'text-amber-700'}`}>
                      {model.usableInChat
                        ? (t.apiKeyProductView?.compatibleWithChat || 'Compatible con chat de texto')
                        : (t.apiKeyProductView?.notCompatibleWithChat || 'No compatible con chat de texto (requiere prueba por modalidad)')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {(!activeConversation || activeConversation.messages.length === 0) && (
              <div className="rounded border border-[#b6d7d1] bg-white px-3 py-2 text-sm text-[#2d6c65]">
                {t.apiKeyProductView?.emptyChat || 'Aun no hay mensajes en esta conversacion.'}
              </div>
            )}
            {activeConversation?.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[860px] rounded-lg border px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#0b7d72] text-white border-[#0a6e65]' : 'bg-white text-[#183f3a] border-[#b6d7d1]'}`}>
                  <div className="text-[11px] opacity-80 flex items-center gap-1 mb-1">
                    {msg.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                    {msg.role === 'user' ? (t.apiKeyProductView?.youLabel || 'Tu') : (t.apiKeyProductView?.assistantLabel || 'Asistente')}
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-[#b6d7d1] bg-[#e8f1ef] px-4 py-3">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 rounded-full border border-[#7cc8ba] bg-white px-3 py-2">
                <button
                  onClick={() => setShowPromptModal(true)}
                  disabled={!isOwner}
                  className="p-1.5 rounded-full border border-[#84ccb8] text-[#1b756b] disabled:opacity-40"
                  title={t.apiKeyProductView?.newPrompt || 'Nuevo prompt'}
                >
                  <Plus size={14} />
                </button>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!isOwner || isSending}
                  rows={1}
                  placeholder={t.apiKeyProductView?.chatPlaceholder || 'Escribe tu mensaje...'}
                  className="flex-1 bg-transparent outline-none resize-none text-sm text-[#1b4e48]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isOwner || isSending || !messageInput.trim()}
                  className="rounded-full bg-[#0b7d72] text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {t.apiKeyProductView?.sendButton || 'Enviar'}
                </button>
              </div>
              <p className="text-center text-xs text-[#4f817a] mt-2">{t.apiKeyProductView?.chatHint || 'Enter para nueva linea. Usa el boton Enviar para ejecutar.'}</p>
            </div>
          </footer>

          {(statusText || errorText) && (
            <div className={`mx-4 mb-3 rounded-lg border px-3 py-2 text-sm ${errorText ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'}`}>
              {errorText || statusText}
            </div>
          )}
        </main>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-3">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 border border-[#b6d7d1]">
            <h3 className="text-lg font-bold text-[#173f3a]">{t.apiKeyProductView?.newRoleModalTitle || 'Nuevo rol'}</h3>
            <input
              value={roleTitleInput}
              onChange={(e) => setRoleTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.roleTitlePlaceholder || 'Titulo del rol'}
              className="w-full mt-3 rounded border border-[#8ccabd] px-3 py-2 text-sm"
            />
            <textarea
              value={roleBehaviorInput}
              onChange={(e) => setRoleBehaviorInput(e.target.value)}
              rows={5}
              placeholder={t.apiKeyProductView?.roleBehaviorPlaceholder || 'Comportamiento u objetivo del asistente'}
              className="w-full mt-2 rounded border border-[#8ccabd] px-3 py-2 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-3 py-2 rounded border border-[#8ccabd] text-[#1b756b]"
              >
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button
                onClick={handleCreateRole}
                className="px-3 py-2 rounded bg-[#0b7d72] text-white font-semibold"
              >
                {t.apiKeyProductView?.saveRoleButton || 'Guardar rol'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-3">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 border border-[#b6d7d1]">
            <h3 className="text-lg font-bold text-[#173f3a]">{t.apiKeyProductView?.newPromptModalTitle || 'Nuevo prompt'}</h3>
            <input
              value={promptTitleInput}
              onChange={(e) => setPromptTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.promptTitlePlaceholder || 'Titulo del prompt'}
              className="w-full mt-3 rounded border border-[#8ccabd] px-3 py-2 text-sm"
            />
            <textarea
              value={promptContentInput}
              onChange={(e) => setPromptContentInput(e.target.value)}
              rows={5}
              placeholder={t.apiKeyProductView?.promptContentPlaceholder || 'Contenido del prompt'}
              className="w-full mt-2 rounded border border-[#8ccabd] px-3 py-2 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-3 py-2 rounded border border-[#8ccabd] text-[#1b756b]"
              >
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button
                onClick={handleCreatePrompt}
                className="px-3 py-2 rounded bg-[#0b7d72] text-white font-semibold"
              >
                {t.apiKeyProductView?.savePromptButton || 'Guardar prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInspectorView;
