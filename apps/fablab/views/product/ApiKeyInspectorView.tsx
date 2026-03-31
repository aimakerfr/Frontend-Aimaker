import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Globe,
  Plus,
  Send,
  Download,
  KeyRound,
} from 'lucide-react';
import { getOrCreateProductByType, getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import {
  providerChat,
  providerTestModel,
  validateProviderKey,
  type ApiRuntimeProvider,
  type ProviderChatMessage,
  type ProviderModelInfo,
} from '@core/api-key-runtime';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_CONFIG = 1;
const STEP_CHAT   = 2;
const STEP_STATS  = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  outputKind?: 'text' | 'image' | 'audio' | 'video' | 'none';
  outputPreview?: string;
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
  sortPrice: number;
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

// ─── Static data ─────────────────────────────────────────────────────────────

const PROVIDERS: Array<{ value: ApiRuntimeProvider; label: string; hint: string }> = [
  { value: 'google',      label: 'Google',      hint: 'AIza...'     },
  { value: 'openai',      label: 'OpenAI',      hint: 'sk-...'      },
  { value: 'anthropic',   label: 'Anthropic',   hint: 'sk-ant-...'  },
  { value: 'mistral',     label: 'Mistral',     hint: 'Key token'   },
  { value: 'perplexity',  label: 'Perplexity',  hint: 'pplx-...'   },
];

const EMPTY_STATS: RuntimeStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalEstimatedCost: 0,
  lastLatencyMs: 0,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  try { return btoa(unescape(encodeURIComponent(value))); }
  catch { return ''; }
};

const decodeSecret = (value: string): string => {
  try { return decodeURIComponent(escape(atob(value))); }
  catch { return ''; }
};

const isLikelyKeyFormat = (provider: ApiRuntimeProvider, apiKey: string): boolean => {
  const k = apiKey.trim();
  if (!k) return false;
  switch (provider) {
    case 'google':     return /^AIza[0-9A-Za-z\-_]{20,}$/.test(k);
    case 'openai':     return /^sk-[A-Za-z0-9\-_]{20,}$/.test(k);
    case 'anthropic':  return /^sk-ant-[A-Za-z0-9\-_]{12,}$/.test(k);
    case 'perplexity': return /^pplx-[A-Za-z0-9\-_]{8,}$/.test(k);
    case 'mistral':    return k.length >= 16;
    default:           return false;
  }
};

const normalizeModelId = (value: string): string =>
  value.replace(/^models\//, '').trim().toLowerCase();

const inferCapabilitiesFromId = (modelId: string): ModelCapability[] => {
  const v = normalizeModelId(modelId);
  if (v.includes('veo') || v.includes('video'))  return ['video'];
  if (v.includes('image') || v.includes('imagen') || v.includes('nano-banana')) return ['image'];
  if (v.includes('whisper') || v.includes('tts') || v.includes('stt') || v.includes('audio') || v.includes('voxtral')) return ['audio'];
  if (v.includes('sonar') || v.includes('search')) return ['search'];
  if (v.length > 0) return ['text'];
  return ['unknown'];
};

const capabilityLabel = (capability: ModelCapability, t: any): string => {
  switch (capability) {
    case 'text':    return t.apiKeyProductView?.capabilityText    || 'Texto';
    case 'image':   return t.apiKeyProductView?.capabilityImage   || 'Imagen';
    case 'audio':   return t.apiKeyProductView?.capabilityAudio   || 'Audio';
    case 'video':   return t.apiKeyProductView?.capabilityVideo   || 'Video';
    case 'search':  return t.apiKeyProductView?.capabilitySearch  || 'Búsqueda';
    default:        return t.apiKeyProductView?.capabilityUnknown || 'Desconocido';
  }
};

const formatPriceLabel = (catalogModel?: CatalogModel): string => {
  if (!catalogModel) return 'N/A';
  if (catalogModel.prix?.trim()) return catalogModel.prix.trim();
  if (Number(catalogModel.imageOutput ?? 0) > 0) return `$${Number(catalogModel.imageOutput).toFixed(3)}/img`;
  const input  = Number(catalogModel.inputPer1M  ?? 0);
  const output = Number(catalogModel.outputPer1M ?? 0);
  if (input <= 0 && output <= 0) return 'N/A';
  return `$${input}/$${output} /1M`;
};

const modelSortPrice = (catalogModel?: CatalogModel): number => {
  if (!catalogModel) return Number.POSITIVE_INFINITY;
  if (Number(catalogModel.imageOutput ?? 0) > 0) return Number(catalogModel.imageOutput);
  const input  = Number(catalogModel.inputPer1M  ?? 0);
  const output = Number(catalogModel.outputPer1M ?? 0);
  if (input <= 0 && output <= 0) return Number.POSITIVE_INFINITY;
  return input + output;
};

const capabilityRank = (capabilities: ModelCapability[]): number => {
  if (capabilities.includes('text'))   return 1;
  if (capabilities.includes('search')) return 2;
  if (capabilities.includes('image'))  return 3;
  if (capabilities.includes('audio'))  return 4;
  if (capabilities.includes('video'))  return 5;
  return 99;
};

const estimateCost = (
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  catalogMap: Map<string, CatalogModel>
): number => {
  const info = catalogMap.get(modelId) ?? catalogMap.get(normalizeModelId(modelId));
  if (!info) return 0;
  const inputPer1M  = Number(info.inputPer1M  ?? 0);
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
      text: ['text'], image: ['image'], search: ['search'], tts: ['audio'], stt: ['audio'],
    };
    const models: CatalogModel[] = [];
    for (const [category, items] of Object.entries(parsed || {})) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const id = String(item.id ?? '').trim();
        if (!id) continue;
        models.push({
          id,
          label:      String(item.label ?? item.id ?? ''),
          editeur:    String(item.editeur ?? '').toLowerCase(),
          inputPer1M: Number(item.inputPer1M  ?? 0),
          outputPer1M:Number(item.outputPer1M ?? 0),
          prix:       typeof item.prix === 'string' ? item.prix : undefined,
          imageOutput:Number(item.imageOutput ?? 0),
          capabilities: categoryCapabilities[category] ?? inferCapabilitiesFromId(id),
        });
      }
    }
    return models;
  } catch { return []; }
};

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

/** Sidebar collapsible section wrapper */
const SidebarSection: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  addTitle?: string;
  children: React.ReactNode;
}> = ({ title, open, onToggle, onAdd, addDisabled, addTitle, children }) => (
  <section className="mt-4 border-t border-[#a7d7c5] pt-3">
    <div className="flex items-center gap-1 mb-1">
      <button
        onClick={onToggle}
        className="text-[#6b8f84] w-3.5 text-center text-sm leading-none select-none bg-transparent border-none cursor-pointer p-0"
        aria-expanded={open}
      >
        {open ? '▾' : '▸'}
      </button>
      <span className="text-[0.8rem] font-semibold text-[#3d7a6d] uppercase tracking-[0.03em] flex-1 select-none">
        {title}
      </span>
      {onAdd && (
        <button
          onClick={onAdd}
          disabled={addDisabled}
          title={addTitle}
          className="bg-transparent border border-[#99d8c9] rounded w-6 h-6 text-base leading-none cursor-pointer text-[#3d7a6d] flex items-center justify-center hover:bg-[#d1fae5] hover:text-[#0f2a24] disabled:opacity-40 transition-colors"
        >
          +
        </button>
      )}
    </div>
    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: open ? '2000px' : '0', opacity: open ? 1 : 0 }}
    >
      {children}
    </div>
  </section>
);

/** Bottom sidebar button */
const SidebarBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`bg-transparent border border-[#99e6d0] rounded-lg py-[7px] px-2.5 text-[0.82rem] font-[inherit] cursor-pointer text-[#6b8f84] hover:bg-[#d1fae5] hover:text-[#0f2a24] text-center transition-colors ${className}`}
  >
    {children}
  </button>
);

/** Modal overlay wrapper */
const ModalOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-[1000] bg-black/35 backdrop-blur-[6px] flex items-center justify-center p-3">
    {children}
  </div>
);

/** Icon: panel toggle */
const IconPanel: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

/** Icon: bar chart (stats) */
const IconBarChart: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
    <rect x="18" y="3"  width="4" height="18" />
    <rect x="10" y="8"  width="4" height="13" />
    <rect x="2"  y="13" width="4" height="8"  />
  </svg>
);

/** Icon: gear / settings */
const IconGear: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px' }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/** Icon: eye (show/hide password) */
const IconEye: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

/** Icon: list / prompt picker */
const IconList: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" />
  </svg>
);

/** Icon: mic */
const IconMic: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="12" rx="3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8"  y1="23" x2="16" y2="23" />
  </svg>
);

/** Icon: sparkle / enhance */
const IconSparkle: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
    <path d="M17.8 11.8L19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2L19 5"/>
    <path d="M11 6.2L9.7 5"/><path d="M11 11.8L9.7 13"/><path d="M2 21l9-9"/>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ApiKeyInspectorView: React.FC = () => {
  const { id }         = useParams<{ id: string }>();
  const navigate       = useNavigate();
  const { t }          = useLanguage();
  const isAuthenticated = !!tokenStorage.get();

  // ── Product state ──
  const [product,   setProduct]   = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner,   setIsOwner]   = useState(false);

  // ── Config state ──
  const [provider,       setProvider]       = useState<ApiRuntimeProvider>('google');
  const [apiKey,         setApiKey]         = useState('');
  const [selectedModel,  setSelectedModel]  = useState('');
  const [systemPrompt,   setSystemPrompt]   = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [showApiKey,     setShowApiKey]     = useState(false);

  // ── Chat / sidebar state ──
  const [roles,               setRoles]               = useState<RoleRecord[]>([]);
  const [prompts,             setPrompts]             = useState<PromptRecord[]>([]);
  const [conversations,       setConversations]       = useState<ConversationRecord[]>([]);
  const [activeConversationId,setActiveConversationId]= useState('');
  const [messageInput,        setMessageInput]        = useState('');

  // ── Stats / models ──
  const [stats,            setStats]            = useState<RuntimeStats>(EMPTY_STATS);
  const [catalogModels,    setCatalogModels]    = useState<CatalogModel[]>([]);
  const [remoteModels,     setRemoteModels]     = useState<ProviderModelInfo[]>([]);
  const [hasValidatedKey,  setHasValidatedKey]  = useState(false);

  // ── UI toggles ──
  const [isRolesOpen,         setIsRolesOpen]         = useState(true);
  const [isPromptsOpen,       setIsPromptsOpen]       = useState(true);
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false);
  const [isConfigModalOpen,   setIsConfigModalOpen]   = useState(false);
  const [configTab,           setConfigTab]           = useState<'keys' | 'models' | 'budget'>('keys');

  // ── Modal state: role ──
  const [showRoleModal,     setShowRoleModal]     = useState(false);
  const [roleTitleInput,    setRoleTitleInput]    = useState('');
  const [roleBehaviorInput, setRoleBehaviorInput] = useState('');

  // ── Modal state: prompt ──
  const [showPromptModal,     setShowPromptModal]     = useState(false);
  const [promptTitleInput,    setPromptTitleInput]    = useState('');
  const [promptContentInput,  setPromptContentInput]  = useState('');

  // ── Operation mode ──
  const [testMode,  setTestMode]  = useState<ModelCapability>('text');
  const [chatMode,  setChatMode]  = useState<ModelCapability>('text');

  // ── Async status ──
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isSending,       setIsSending]       = useState(false);
  const [statusText,      setStatusText]      = useState('');
  const [errorText,       setErrorText]       = useState('');

  const fixedTitle       = t.products?.fixed?.apiKeyTitle || 'Inspector de API Keys';
  const fixedDescription = t.products?.fixed?.apiKeyDesc  || 'Valida formato y conectividad de API keys por proveedor.';

  // ─── Derived / memoised ───────────────────────────────────────────────────

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogModel>();
    for (const m of catalogModels) {
      map.set(m.id, m);
      map.set(normalizeModelId(m.id), m);
    }
    return map;
  }, [catalogModels]);

  const validatedModelOptions = useMemo<EnrichedModelOption[]>(() => {
    const options: EnrichedModelOption[] = [];
    for (const remote of remoteModels) {
      const catalog      = catalogMap.get(remote.id) ?? catalogMap.get(normalizeModelId(remote.id));
      const capabilities = (catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(remote.id)) as ModelCapability[];
      const usableInChat = capabilities.includes('text') || capabilities.includes('search');
      const priceLabel   = formatPriceLabel(catalog);
      options.push({
        id: remote.id,
        label: remote.label || remote.id,
        displayLabel: `${remote.label || remote.id} (${priceLabel})`,
        capabilities,
        priceLabel,
        usableInChat,
        sortPrice: modelSortPrice(catalog),
      });
    }
    return options.sort((a, b) => {
      const rankDiff  = capabilityRank(a.capabilities) - capabilityRank(b.capabilities);
      if (rankDiff  !== 0) return rankDiff;
      const priceDiff = a.sortPrice - b.sortPrice;
      if (priceDiff !== 0) return priceDiff;
      return a.label.localeCompare(b.label);
    });
  }, [remoteModels, catalogMap]);

  const modelOptions = useMemo(() => validatedModelOptions, [validatedModelOptions]);

  const activeConversation = useMemo(
    () => conversations.find(c => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const selectedRole = useMemo(
    () => roles.find(r => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const selectedModelInfo = useMemo(
    () => validatedModelOptions.find(m => m.id === selectedModel) ?? null,
    [validatedModelOptions, selectedModel]
  );

  const availableTestModes = useMemo<ModelCapability[]>(() => {
    if (!selectedModelInfo) return ['text'];
    const dedup = Array.from(new Set(selectedModelInfo.capabilities));
    return dedup.length > 0 ? dedup : ['text'];
  }, [selectedModelInfo]);

  const availableChatModes = useMemo<ModelCapability[]>(() => {
    if (!selectedModelInfo) return ['text'];
    const dedup = Array.from(new Set(selectedModelInfo.capabilities));
    return dedup.length > 0 ? dedup : ['text'];
  }, [selectedModelInfo]);

  const effectiveSystemPrompt = useMemo(() => {
    const blocks = [systemPrompt.trim(), selectedRole?.behavior?.trim() ?? ''].filter(Boolean);
    return blocks.join('\n\n');
  }, [systemPrompt, selectedRole]);

  // ─── Persist helpers ──────────────────────────────────────────────────────

  const persistConfig = async (productId: number, override?: Partial<Record<string, unknown>>) => {
    await updateProductStepProgress({
      productId,
      stepId: STEP_CONFIG,
      status: 'success',
      resultText: {
        provider, selectedModel, systemPrompt, selectedRoleId,
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
        roles, prompts, conversations, activeConversationId,
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
      resultText: { ...nextStats, updatedAt: new Date().toISOString() },
    });
  };

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/view-ApiKey/models.js');
        if (!response.ok) return;
        const text   = await response.text();
        const parsed = parseCatalogModels(text);
        setCatalogModels(parsed);
      } catch (err) { console.error('[ApiKeyInspectorView] catalog load failed:', err); }
    })();
  }, []);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        let productData: Product;
        let targetId: number | null = id ? parseInt(id, 10) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('api_key_maker', {
            title: fixedTitle, description: fixedDescription,
          });
          targetId = ensured.id;
        }
        if (isAuthenticated) {
          try { productData = await getProduct(targetId); setIsOwner(true); }
          catch { productData = await getPublicProduct(targetId); setIsOwner(false); }
        } else {
          productData = await getPublicProduct(targetId); setIsOwner(false);
        }
        setProduct(productData);

        const progress      = await getProductStepProgress(productData.id);
        const config        = progress.find(p => p.stepId === STEP_CONFIG)?.resultText;
        const chatProgress  = progress.find(p => p.stepId === STEP_CHAT)?.resultText;
        const statsProgress = progress.find(p => p.stepId === STEP_STATS)?.resultText;

        if (config) {
          if (typeof config.provider       === 'string') setProvider(config.provider as ApiRuntimeProvider);
          if (typeof config.selectedModel  === 'string') setSelectedModel(config.selectedModel);
          if (typeof config.systemPrompt   === 'string') setSystemPrompt(config.systemPrompt);
          if (typeof config.selectedRoleId === 'string') setSelectedRoleId(config.selectedRoleId);
          if (typeof config.apiKeyEncoded  === 'string') setApiKey(decodeSecret(config.apiKeyEncoded));
          if (Array.isArray(config.validatedModels)) {
            setRemoteModels(config.validatedModels as ProviderModelInfo[]);
            setHasValidatedKey((config.validatedModels as ProviderModelInfo[]).length > 0);
          }
          if (typeof config.lastValidatedAt === 'string') setHasValidatedKey(true);
        }

        const newConv = () => {
          const c = createConversation(t.apiKeyProductView?.newConversationDefault || 'Nueva conversación');
          setConversations([c]);
          setActiveConversationId(c.id);
        };
        if (chatProgress) {
          if (Array.isArray(chatProgress.roles))   setRoles(chatProgress.roles as RoleRecord[]);
          if (Array.isArray(chatProgress.prompts)) setPrompts(chatProgress.prompts as PromptRecord[]);
          if (Array.isArray(chatProgress.conversations) && chatProgress.conversations.length > 0) {
            setConversations(chatProgress.conversations as ConversationRecord[]);
          } else { newConv(); }
          if (typeof chatProgress.activeConversationId === 'string') {
            setActiveConversationId(chatProgress.activeConversationId);
          }
        } else { newConv(); }

        if (statsProgress && typeof statsProgress === 'object') {
          setStats({ ...EMPTY_STATS, ...(statsProgress as RuntimeStats) });
        }
      } catch (err) {
        console.error('[ApiKeyInspectorView] load error:', err);
      } finally { setIsLoading(false); }
    })();
  }, [id, isAuthenticated, fixedTitle, fixedDescription, t.apiKeyProductView]);

  useEffect(() => {
    if (!selectedModel && modelOptions.length > 0) setSelectedModel(modelOptions[0].id);
  }, [selectedModel, modelOptions]);

  useEffect(() => {
    if (!availableTestModes.includes(testMode)) setTestMode(availableTestModes[0] ?? 'text');
  }, [availableTestModes, testMode]);

  useEffect(() => {
    if (!availableChatModes.includes(chatMode)) setChatMode(availableChatModes[0] ?? 'text');
  }, [availableChatModes, chatMode]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!modelOptions.some(m => m.id === selectedModel)) setSelectedModel(modelOptions[0]?.id ?? '');
  }, [selectedModel, modelOptions]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const patchConversation = (
    conversationId: string,
    updater: (c: ConversationRecord) => ConversationRecord
  ) => setConversations(prev => prev.map(conv => conv.id === conversationId ? updater(conv) : conv));

  const handleValidateKey = async () => {
    if (!product) return;
    setErrorText(''); setStatusText('');
    if (!isLikelyKeyFormat(provider, apiKey)) {
      setErrorText('Formato de API key no válido para el proveedor elegido.');
      return;
    }
    try {
      setIsValidatingKey(true);
      const result = await validateProviderKey({ provider, apiKey: apiKey.trim() });
      setRemoteModels(result.models || []);
      setHasValidatedKey(true);
      if (!selectedModel && result.models.length > 0) {
        const firstUsable = result.models.find(m => {
          const catalog = catalogMap.get(m.id) ?? catalogMap.get(normalizeModelId(m.id));
          const caps    = catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(m.id);
          return caps.includes('text') || caps.includes('search');
        });
        setSelectedModel(firstUsable?.id ?? '');
      }
      await persistConfig(product.id, {
        lastValidatedAt: new Date().toISOString(),
        validatedModels: result.models,
      });
      setStatusText('API key validada correctamente y modelos cargados.');
    } catch (err: any) {
      setErrorText(err?.message || 'No se pudo validar la API key.');
    } finally { setIsValidatingKey(false); }
  };

  const getCurrentMessages = (): ChatItem[] => activeConversation?.messages ?? [];

  const runChat = async (text: string, isTest: boolean) => {
    if (!product || !activeConversation) {
      setErrorText('Debes crear o seleccionar una conversación.');
      return;
    }
    if (!apiKey.trim())        { setErrorText('Debes ingresar una API key.');   return; }
    if (!selectedModel.trim()) { setErrorText('Debes elegir un modelo.');        return; }

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`, role: 'user', content: text,
      createdAt: new Date().toISOString(),
    };
    const nextChatBase = [...getCurrentMessages(), userMessage];
    patchConversation(activeConversation.id, conv => ({
      ...conv,
      title: conv.messages.length === 0 ? text.slice(0, 42) : conv.title,
      messages: nextChatBase,
      updatedAt: new Date().toISOString(),
    }));

    setErrorText(''); setStatusText(''); setIsSending(true);
    try {
      const payloadMessages: ProviderChatMessage[] = nextChatBase
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await providerChat({
        provider, apiKey: apiKey.trim(), model: selectedModel,
        systemPrompt: effectiveSystemPrompt, messages: payloadMessages,
      });

      const assistantMessage: ChatItem = {
        id: `a-${Date.now()}`, role: 'assistant',
        content: response.content || '(sin contenido)',
        createdAt: new Date().toISOString(), outputKind: 'text',
      };
      const nextChat = [...nextChatBase, assistantMessage];
      patchConversation(activeConversation.id, conv => ({
        ...conv, messages: nextChat, updatedAt: new Date().toISOString(),
      }));

      const estimatedCost = estimateCost(selectedModel, response.usage.inputTokens, response.usage.outputTokens, catalogMap);
      const nextStats: RuntimeStats = {
        totalRequests:      stats.totalRequests + 1,
        totalInputTokens:   stats.totalInputTokens  + response.usage.inputTokens,
        totalOutputTokens:  stats.totalOutputTokens + response.usage.outputTokens,
        totalTokens:        stats.totalTokens       + response.usage.totalTokens,
        totalEstimatedCost: stats.totalEstimatedCost + estimatedCost,
        lastLatencyMs:      response.latencyMs,
      };
      setStats(nextStats);

      await Promise.all([
        persistChat(product.id, {
          conversations: conversations.map(conv =>
            conv.id === activeConversation.id
              ? { ...conv, messages: nextChat, updatedAt: new Date().toISOString() }
              : conv
          ),
        }),
        persistStats(product.id, nextStats),
        persistConfig(product.id),
      ]);
      if (!isTest) setMessageInput('');
      setStatusText(isTest ? 'Modelo probado correctamente.' : 'Respuesta recibida y guardada.');
    } catch (err: any) {
      setErrorText(err?.message || 'No se pudo completar el chat con el proveedor.');
    } finally { setIsSending(false); }
  };

  const runCapabilityGeneration = async (capability: ModelCapability, promptText: string, isTest: boolean) => {
    if (!product || !activeConversation) {
      setErrorText('Debes crear o seleccionar una conversación.');
      return;
    }
    if (!apiKey.trim())        { setErrorText('Debes ingresar una API key.'); return; }
    if (!selectedModel.trim()) { setErrorText('Debes elegir un modelo.');      return; }

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`, role: 'user', content: promptText,
      createdAt: new Date().toISOString(),
      outputKind: capability === 'text' || capability === 'search' ? 'text' : 'none',
    };
    const nextChatBase = [...getCurrentMessages(), userMessage];
    patchConversation(activeConversation.id, conv => ({
      ...conv,
      title: conv.messages.length === 0 ? promptText.slice(0, 42) : conv.title,
      messages: nextChatBase,
      updatedAt: new Date().toISOString(),
    }));

    setErrorText(''); setStatusText(''); setIsSending(true);
    try {
      const response = await providerTestModel({
        provider, apiKey: apiKey.trim(), model: selectedModel,
        capability: capability === 'unknown' ? 'text' : capability,
        prompt: promptText,
      });
      const kind = response.outputKind || (capability === 'image' || capability === 'audio' || capability === 'video' ? capability : 'text');
      const assistantMessage: ChatItem = {
        id: `cap-${Date.now()}`, role: 'assistant',
        content: response.message || 'Prueba ejecutada',
        createdAt: new Date().toISOString(),
        outputKind: kind,
        outputPreview: response.outputPreview,
      };
      const nextChat = [...nextChatBase, assistantMessage];
      const nextConversations = conversations.map(conv =>
        conv.id === activeConversation.id
          ? { ...conv, messages: nextChat, updatedAt: new Date().toISOString() }
          : conv
      );
      setConversations(nextConversations);

      const nextStats: RuntimeStats = { ...stats, totalRequests: stats.totalRequests + 1 };
      setStats(nextStats);

      await Promise.all([
        persistChat(product.id, { conversations: nextConversations }),
        persistStats(product.id, nextStats),
        persistConfig(product.id),
      ]);
      if (!isTest) setMessageInput('');
      setStatusText(isTest ? 'Modelo probado correctamente.' : 'Generación ejecutada y guardada.');
    } catch (err: any) {
      setErrorText(err?.message || 'No se pudo ejecutar la generación para este modo.');
    } finally { setIsSending(false); }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text) return;
    if (chatMode === 'text' || chatMode === 'search') {
      if (selectedModelInfo && !selectedModelInfo.usableInChat) {
        setErrorText('Este modelo no soporta chat de texto.');
        return;
      }
      await runChat(text, false);
    } else {
      await runCapabilityGeneration(chatMode, text, false);
    }
  };

  const handleTestModel = async () => {
    if (!selectedModelInfo) { setErrorText('Debes seleccionar un modelo.'); return; }
    if (!availableTestModes.includes(testMode)) { setErrorText('Esta modalidad no está disponible.'); return; }
    await runCapabilityGeneration(
      testMode,
      testMode === 'image' ? 'Create a small test image with the word AIMAKER' : 'Reply only with OK',
      true
    );
  };

  const handleCreateConversation = async () => {
    const title = t.apiKeyProductView?.newConversationDefault || 'Nueva conversación';
    const conversation = createConversation(title);
    const nextConversations = [conversation, ...conversations];
    setConversations(nextConversations);
    setActiveConversationId(conversation.id);
    setStatusText('Nueva conversación creada.');
    if (product) await persistChat(product.id, { conversations: nextConversations, activeConversationId: conversation.id });
  };

  const handleCreateRole = async () => {
    const title    = roleTitleInput.trim();
    const behavior = roleBehaviorInput.trim();
    if (!title || !behavior) { setErrorText('Debes completar título y comportamiento.'); return; }
    const newRole: RoleRecord = {
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, behavior,
    };
    const nextRoles = [newRole, ...roles];
    setRoles(nextRoles);
    setSelectedRoleId(newRole.id);
    setShowRoleModal(false);
    setRoleTitleInput('');
    setRoleBehaviorInput('');
    setStatusText('Rol guardado.');
    if (product) {
      await persistChat(product.id, { roles: nextRoles });
      await persistConfig(product.id, { selectedRoleId: newRole.id });
    }
  };

  const handleCreatePrompt = async () => {
    const title  = promptTitleInput.trim();
    const prompt = promptContentInput.trim();
    if (!title || !prompt) { setErrorText('Debes completar título y contenido.'); return; }
    const newPrompt: PromptRecord = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, prompt,
    };
    const nextPrompts = [newPrompt, ...prompts];
    setPrompts(nextPrompts);
    setShowPromptModal(false);
    setPromptTitleInput('');
    setPromptContentInput('');
    setStatusText('Prompt guardado.');
    if (product) await persistChat(product.id, { prompts: nextPrompts });
  };

  const handleUsePrompt = (prompt: PromptRecord) => {
    setMessageInput(prompt.prompt);
    setStatusText('Prompt aplicado al cuadro de chat.');
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setStatusText(''); setErrorText('');
    if (product) persistChat(product.id, { activeConversationId: conversationId }).catch(console.error);
  };

  const handleDownloadConversation = (conversation: ConversationRecord) => {
    const title     = (conversation.title || 'conversacion').trim();
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9\-_\s]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'conversacion';
    const lines: string[] = [
      `Conversación: ${title}`,
      `Actualizada: ${new Date(conversation.updatedAt).toLocaleString()}`, '',
    ];
    conversation.messages.forEach((msg, i) => {
      const roleLabel = msg.role === 'user' ? 'Tú' : 'Asistente';
      lines.push(`--- Mensaje ${i + 1} (${roleLabel}) - ${new Date(msg.createdAt).toLocaleString()} ---`);
      lines.push(msg.content || '');
      lines.push('');
    });
    const blob   = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url    = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href  = url;
    anchor.download = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatusText('Conversación descargada.');
  };

  // ─── Loading / not-found screens ─────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fffe]">
        <span className="inline-block h-9 w-9 rounded-full border-4 border-[#a7f3d0] border-t-[#0f766e] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fffe]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Producto no encontrado o no es público.</p>
          <button
            onClick={() => navigate('/dashboard/products')}
            className="px-4 py-2 bg-[#0f766e] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Volver a productos
          </button>
        </div>
      </div>
    );
  }

  // ─── Shared CSS fragments (as template strings for readability) ───────────
  const selectCls = 'text-[0.8rem] font-[inherit] px-2 py-1 border border-[#99e6d0] rounded-md bg-white text-[#0f2a24] cursor-pointer outline-none focus:border-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#ecfdf5]';
  const inputCls  = 'font-[inherit] text-[0.9rem] px-3 py-2 border border-[#99e6d0] rounded-lg outline-none bg-[#f8fffe] text-[#0f2a24] focus:border-[#6b8f84] transition-colors';
  const modalBtnCancelCls = 'font-[inherit] text-[0.85rem] px-[18px] py-2 rounded-[10px] cursor-pointer bg-[#ecfdf5] text-[#3d7a6d] border-none hover:bg-[#d1fae5] transition-colors';
  const modalBtnSaveCls   = 'font-[inherit] text-[0.85rem] px-[18px] py-2 rounded-[10px] cursor-pointer bg-[#0f766e] text-white border-none hover:opacity-85 transition-opacity';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fffe] text-[#0f2a24]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* ── Sidebar toggle (fixed) ─────────────────────────────────────── */}
      <button
        onClick={() => setSidebarCollapsed(v => !v)}
        title="Ocultar panel"
        className={`fixed top-2.5 z-[100] bg-[#ecfdf5] border border-[#99e6d0] rounded-md p-1 cursor-pointer text-[#6b8f84] flex items-center justify-center hover:text-[#0f2a24] hover:bg-[#d1fae5] transition-all duration-[250ms] ${sidebarCollapsed ? 'left-2' : 'left-[224px]'}`}
      >
        <IconPanel />
      </button>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className="bg-[#ecfdf5] flex flex-col border-r border-[#a7d7c5] transition-all duration-[250ms] overflow-hidden"
        style={{
          width:    sidebarCollapsed ? 0 : 300,
          minWidth: sidebarCollapsed ? 0 : 240,
          padding:  sidebarCollapsed ? '24px 0' : '24px 16px',
          opacity:  sidebarCollapsed ? 0 : 1,
          borderRightWidth: sidebarCollapsed ? 0 : 1,
        }}
      >
        {/* Header */}
        <h1 className="text-[1.6rem] font-extrabold mb-1 text-[#0f2a24] flex items-center justify-center gap-2 tracking-[-0.02em]">
          <KeyRound size={28} className="text-[#0f766e] flex-shrink-0" />
          <span className="whitespace-nowrap">FabLab AIMaker</span>
          <span className="text-[0.45em] font-semibold opacity-50 align-super">v2.3</span>
        </h1>
        <a
          href="#"
          className="block text-center text-[0.7rem] text-[#6b8f84] no-underline mb-5 hover:text-[#0f2a24] hover:underline transition-colors"
        >
          by DoItAndShare
        </a>

        {/* New conversation */}
        <button
          onClick={handleCreateConversation}
          className="bg-[#0f766e] text-white border border-[#0f766e] rounded-[10px] py-2.5 px-3.5 text-[0.9rem] cursor-pointer text-center font-semibold mb-4 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + {t.apiKeyProductView?.newConversation || 'Nueva conversación'}
        </button>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#99d8c9] [&::-webkit-scrollbar-thumb]:rounded-sm">

          {/* Roles */}
          <SidebarSection
            title={t.apiKeyProductView?.rolesTitle || 'Roles'}
            open={isRolesOpen}
            onToggle={() => setIsRolesOpen(v => !v)}
            onAdd={() => setShowRoleModal(true)}
            addDisabled={!isOwner}
            addTitle="Crear rol"
          >
            <div className="flex flex-col gap-0.5 mt-1">
              {roles.length === 0 && (
                <p className="text-xs text-[#6b8f84]">{t.apiKeyProductView?.emptyRoles || 'Sin roles guardados'}</p>
              )}
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRoleId(role.id);
                    if (product) persistConfig(product.id, { selectedRoleId: role.id }).catch(console.error);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[0.82rem] font-medium transition-colors cursor-pointer border-none ${selectedRoleId === role.id ? 'bg-[#a7f3d0] text-[#0f2a24]' : 'bg-transparent hover:bg-[#d1fae5] text-[#0f2a24]'}`}
                >
                  {role.title}
                </button>
              ))}
            </div>
          </SidebarSection>

          {/* Saved prompts */}
          <SidebarSection
            title={t.apiKeyProductView?.promptsTitle || 'Prompts guardados'}
            open={isPromptsOpen}
            onToggle={() => setIsPromptsOpen(v => !v)}
            onAdd={() => setShowPromptModal(true)}
            addDisabled={!isOwner}
            addTitle="Crear prompt"
          >
            <div className="flex flex-col gap-0.5 mt-1">
              {prompts.length === 0 && (
                <p className="text-xs text-[#6b8f84]">{t.apiKeyProductView?.emptyPrompts || 'Sin prompts guardados'}</p>
              )}
              {prompts.map(prompt => (
                <div key={prompt.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#d1fae5] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.82rem] font-medium text-[#0f2a24] truncate">{prompt.title}</p>
                  </div>
                  <button
                    onClick={() => handleUsePrompt(prompt)}
                    className="text-[0.7rem] text-[#0f766e] underline whitespace-nowrap bg-transparent border-none cursor-pointer hover:text-[#0a5a54] transition-colors"
                  >
                    {t.apiKeyProductView?.usePrompt || 'Usar'}
                  </button>
                </div>
              ))}
            </div>
          </SidebarSection>

          {/* Conversations */}
          <section className="mt-4 border-t border-[#a7d7c5] pt-3 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => setIsConversationsOpen(v => !v)}
                className="text-[#6b8f84] w-3.5 text-center text-sm leading-none select-none bg-transparent border-none cursor-pointer p-0"
              >
                {isConversationsOpen ? '▾' : '▸'}
              </button>
              <span className="text-[0.8rem] font-semibold text-[#3d7a6d] uppercase tracking-[0.03em] flex-1">
                {t.apiKeyProductView?.conversationsTitle || 'Conversaciones'}
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-0.5 pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#99d8c9] [&::-webkit-scrollbar-thumb]:rounded-sm transition-all duration-200"
              style={{ maxHeight: isConversationsOpen ? undefined : 0, opacity: isConversationsOpen ? 1 : 0, overflow: isConversationsOpen ? 'auto' : 'hidden' }}
            >
              {conversations.length === 0 && (
                <p className="text-xs text-[#6b8f84]">{t.apiKeyProductView?.emptyConversations || 'Sin conversaciones'}</p>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`flex items-start gap-0 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-[#a7f3d0]' : 'hover:bg-[#d1fae5]'}`}
                >
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className="flex-1 min-w-0 text-left px-3 py-2.5 bg-transparent border-none cursor-pointer"
                  >
                    <p className="text-[0.85rem] font-medium text-[#0f2a24] truncate">
                      {conv.title || 'Conversación sin título'}
                    </p>
                    <p className="text-[0.7rem] text-[#6b8f84] mt-0.5">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownloadConversation(conv); }}
                    className="mt-1 mr-1 text-[#6b8f84] cursor-pointer p-1 rounded border-none bg-transparent hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Descargar conversación"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom buttons */}
        <div className="flex flex-col gap-1.5 mt-auto pt-4 relative">
          {/* Fade gradient above */}
          <div className="absolute -top-10 -left-4 -right-4 h-10 bg-gradient-to-b from-transparent to-[#ecfdf5] pointer-events-none" />

          <div className="flex gap-1.5">
            <SidebarBtn className="flex-1">⬆ Exportar</SidebarBtn>
            <SidebarBtn className="flex-1">⬇ Importar</SidebarBtn>
          </div>
          <SidebarBtn
            onClick={() => { setIsConfigModalOpen(true); setConfigTab('budget'); }}
            className="flex items-center justify-center gap-1.5"
            >
            <IconBarChart /> Estadísticas
          </SidebarBtn>
          <SidebarBtn
            onClick={() => { setIsConfigModalOpen(true); setConfigTab('keys'); }}
            className="flex items-center justify-center gap-1.5"
          >
            <IconGear /> {t.apiKeyProductView?.apiConfigTitle || 'Configuración'}
          </SidebarBtn>
          <SidebarBtn className="flex items-center justify-center gap-1.5">
            ☀ Tema claro
          </SidebarBtn>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8fffe]">

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#99d8c9] [&::-webkit-scrollbar-thumb]:rounded-sm">
          {(!activeConversation || activeConversation.messages.length === 0) && (
            <p className="text-[#6b8f84] text-[0.95rem]">
              {t.apiKeyProductView?.emptyChat || 'Aún no hay mensajes en esta conversación.'}
            </p>
          )}

          {activeConversation?.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'self-start' : 'self-end'}`}
            >
              {/* Bubble */}
              <div
                className={`px-[18px] py-3.5 text-[0.95rem] leading-relaxed break-words word-wrap-break-word ${
                  msg.role === 'user'
                    ? 'bg-[#ecfdf5] rounded-[18px_18px_18px_4px]'
                    : 'bg-[#d1fae5] rounded-[18px_18px_4px_18px]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.outputKind === 'image' && msg.outputPreview && (
                  <img
                    src={msg.outputPreview}
                    alt="generated"
                    className="max-h-64 rounded-lg border border-[#a7d7c5] mt-2 max-w-[400px] object-contain cursor-pointer"
                  />
                )}
                {msg.outputKind === 'audio' && msg.outputPreview && (
                  <audio controls src={msg.outputPreview} className="w-full mt-2" />
                )}
                {msg.outputKind === 'video' && msg.outputPreview && (
                  <video controls src={msg.outputPreview} className="max-h-64 rounded-lg border border-[#a7d7c5] mt-2" />
                )}
              </div>

              {/* Meta row */}
              <div className={`flex items-center gap-1 mt-0.5 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <span className="text-[0.7rem] text-[#6b8f84] opacity-50">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Alert / status banners */}
        {(errorText || statusText) && (
          <div
            className={`mx-8 mb-1 px-4 py-2 rounded-lg text-[0.82rem] text-center border animate-[fadeIn_0.2s_ease] ${
              errorText
                ? 'bg-amber-50 text-yellow-800 border-yellow-300'
                : 'bg-emerald-50 text-green-800 border-green-300'
            }`}
          >
            {errorText || statusText}
          </div>
        )}

        {/* ── Model bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-8 py-2 border-t border-[#ccfbf1] flex-wrap z-[15] bg-[#f8fffe] relative">

          {/* Text model */}
          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.modelTextLabel || 'Modelo texto'}:
          </label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={!isOwner || modelOptions.length === 0}
            className={selectCls}
          >
            {modelOptions.length === 0 && <option value="">—</option>}
            {modelOptions.map(m => (
              <option key={m.id} value={m.id}>{m.displayLabel}</option>
            ))}
          </select>

          {/* Provider */}
          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.providerLabel || 'Proveedor'}:
          </label>
          <select
            value={provider}
            onChange={e => {
              setProvider(e.target.value as ApiRuntimeProvider);
              setRemoteModels([]); setSelectedModel(''); setHasValidatedKey(false);
            }}
            disabled={!isOwner}
            className={selectCls}
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Chat mode */}
          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            Modo:
          </label>
          <select
            value={chatMode}
            onChange={e => setChatMode(e.target.value as ModelCapability)}
            disabled={!isOwner || !selectedModel}
            className={selectCls}
          >
            {availableChatModes.map(mode => (
              <option key={mode} value={mode}>{capabilityLabel(mode, t)}</option>
            ))}
          </select>

          {/* Spacer */}
          <span className="flex-1" />

          {/* Role */}
          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.roleSelectorLabel || 'Rol'}:
          </label>
          <select
            value={selectedRoleId}
            onChange={e => {
              setSelectedRoleId(e.target.value);
              if (product) persistConfig(product.id, { selectedRoleId: e.target.value }).catch(console.error);
            }}
            disabled={!isOwner || roles.length === 0}
            className={selectCls}
          >
            <option value="">{t.apiKeyProductView?.noneOption || 'Ninguno'}</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.title}</option>
            ))}
          </select>
        </div>

        {/* ── Token bar ─────────────────────────────────────────────── */}
        <div className="flex justify-between px-8 py-[6px] text-[0.75rem] text-[#6b8f84] border-t border-[#ccfbf1] z-[15] bg-[#f8fffe] tabular-nums">
          <span>
            Tokens — entrada: {stats.totalInputTokens} | salida: {stats.totalOutputTokens}
          </span>
          <span>
            Costo estimado: ${stats.totalEstimatedCost.toFixed(4)}
          </span>
        </div>

        {/* ── Input area ────────────────────────────────────────────── */}
        <div className="px-8 pb-6 pt-4 border-t border-[#ccfbf1] flex flex-col items-center gap-1.5 bg-[#f8fffe] z-[15]">
          <div className="flex flex-col gap-1.5 w-full max-w-[800px]">
            {/* Wrapper */}
            <div className="flex items-center w-full border-2 border-[#99e6d0] rounded-[20px] py-2 pl-3 pr-2 gap-1.5 bg-white focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.10)] transition-all duration-200">

              {/* Attach */}
              <button
                disabled={!isOwner}
                title="Adjuntar archivo"
                className="bg-transparent border border-[#99e6d0] rounded-full w-7 h-7 min-w-[28px] min-h-[28px] cursor-pointer text-[#6b8f84] flex items-center justify-center flex-shrink-0 hover:text-[#0f2a24] disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>

              {/* Web search toggle */}
              <button
                title="Búsqueda web"
                className="bg-transparent border border-[#99e6d0] rounded-md cursor-pointer text-[#6b8f84] p-[3px_5px] flex items-center justify-center flex-shrink-0 hover:text-[#0f2a24] hover:bg-[#d1fae5] transition-colors"
              >
                <Globe size={16} />
              </button>

              {/* Textarea */}
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                disabled={!isOwner || isSending}
                rows={1}
                placeholder={t.apiKeyProductView?.chatPlaceholder || 'Escribe tu mensaje...'}
                className="flex-1 min-w-0 border-none outline-none text-[0.95rem] font-[inherit] resize-none max-h-[200px] leading-[1.5] py-1 bg-transparent align-middle text-[#0f2a24] placeholder:text-[#6b8f84]"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                }}
              />

              {/* Enhance prompt */}
              <button
                title="Mejorar prompt"
                disabled={!isOwner || !messageInput.trim()}
                className="bg-transparent border-none cursor-pointer p-1 text-[#6b8f84] flex-shrink-0 flex items-center justify-center hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconSparkle />
              </button>

              {/* Prompt picker */}
              <button
                title="Insertar prompt guardado"
                className="bg-transparent border-none cursor-pointer p-1 text-[#6b8f84] flex-shrink-0 flex items-center justify-center hover:text-[#0f2a24] transition-colors"
              >
                <IconList />
              </button>

              {/* Mic */}
              <button
                title="Dictar"
                className="bg-transparent border-none cursor-pointer p-1 text-[#6b8f84] flex-shrink-0 flex items-center justify-center mb-0.5 hover:text-[#0f2a24] transition-colors"
              >
                <IconMic />
              </button>

              {/* Send */}
              <button
                onClick={handleSendMessage}
                disabled={!isOwner || isSending || !messageInput.trim()}
                className="bg-[#0f766e] text-white border-none rounded-[12px] py-1.5 px-4 text-[0.9rem] font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5"
              >
                {isSending
                  ? <span className="inline-block h-3 w-3 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                  : <Send size={13} />
                }
                {chatMode === 'text' || chatMode === 'search'
                  ? (t.apiKeyProductView?.sendButton || 'OK')
                  : (t.apiKeyProductView?.generateButton || 'Generar')}
              </button>
            </div>

            <span className="text-[0.75rem] text-[#6b8f84] text-center">
              {t.apiKeyProductView?.chatHint || 'Enter para enviar · Shift+Enter para nueva línea'}
            </span>
          </div>
        </div>
      </main>

      {/* ── Config Modal ──────────────────────────────────────────────── */}
      {isConfigModalOpen && (
        <ModalOverlay>
          <div
            className="bg-white rounded-2xl overflow-hidden flex flex-row shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
            style={{ width: 620, maxWidth: '90vw', height: 520, maxHeight: '80vh' }}
          >
            {/* Tab rail */}
            <div className="flex flex-col gap-0.5 p-5 border-r border-[#99e6d0] min-w-[120px] bg-[#ecfdf5] rounded-l-2xl flex-shrink-0">
              {(['keys', 'models', 'budget'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setConfigTab(tab)}
                  className={`text-left px-3 py-2 rounded-md text-[0.82rem] font-[inherit] cursor-pointer border-none transition-colors ${
                    configTab === tab
                      ? 'bg-white text-[#0f2a24] font-semibold'
                      : 'bg-transparent text-[#6b8f84] hover:bg-[#d1fae5] hover:text-[#0f2a24]'
                  }`}
                >
                  {tab === 'keys'   ? 'Claves API'  : ''}
                  {tab === 'models' ? 'Modelos'     : ''}
                  {tab === 'budget' ? 'Estadísticas': ''}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">

              {/* ── Keys tab ── */}
              {configTab === 'keys' && (
                <>
                  <h3 className="text-[1.1rem] font-semibold text-[#0f2a24] mb-1">
                    {t.apiKeyProductView?.apiConfigTitle || 'Configuración de API'}
                  </h3>
                  <p className="text-[0.8rem] text-[#6b8f84] leading-relaxed mb-4">
                    Agrega tu clave API para usar la IA directamente, sin límite de mensajes.
                  </p>

                  <div className="flex flex-col gap-3 flex-1">
                    {/* Provider + key */}
                    <div className="flex gap-2">
                      <select
                        value={provider}
                        onChange={e => {
                          setProvider(e.target.value as ApiRuntimeProvider);
                          setRemoteModels([]); setSelectedModel(''); setHasValidatedKey(false);
                        }}
                        disabled={!isOwner}
                        className={`${selectCls} flex-shrink-0`}
                      >
                        {PROVIDERS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <input
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        disabled={!isOwner}
                        placeholder={PROVIDERS.find(p => p.value === provider)?.hint || 'API key'}
                        type={showApiKey ? 'text' : 'password'}
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        onClick={() => setShowApiKey(v => !v)}
                        className="bg-transparent border border-[#99e6d0] rounded-lg px-2 py-2 cursor-pointer text-[#6b8f84] flex items-center justify-center hover:text-[#0f2a24] hover:bg-[#d1fae5] transition-colors flex-shrink-0"
                        title="Mostrar/ocultar"
                      >
                        <IconEye />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleValidateKey}
                        disabled={!isOwner || isValidatingKey || !apiKey.trim()}
                        className="flex-1 bg-[#0f766e] text-white font-[inherit] text-[0.85rem] py-2 rounded-lg cursor-pointer font-semibold hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {isValidatingKey ? 'Validando...' : (t.apiKeyProductView?.validateKey || 'Validar key')}
                      </button>
                      <button
                        onClick={handleTestModel}
                        disabled={!isOwner || isSending || !selectedModel || !apiKey.trim()}
                        className="flex-1 bg-transparent border border-[#0f766e] text-[#0f766e] font-[inherit] text-[0.85rem] py-2 rounded-lg cursor-pointer font-semibold hover:bg-[#ecfdf5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t.apiKeyProductView?.testModel || 'Probar modelo'}
                      </button>
                    </div>

                    {/* Test mode */}
                    <div className="flex items-center gap-3">
                      <span className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
                        {t.apiKeyProductView?.testModeLabel || 'Modo de prueba'}:
                      </span>
                      <select
                        value={testMode}
                        onChange={e => setTestMode(e.target.value as ModelCapability)}
                        disabled={!isOwner || !selectedModel}
                        className={selectCls}
                      >
                        {availableTestModes.map(mode => (
                          <option key={mode} value={mode}>{capabilityLabel(mode, t)}</option>
                        ))}
                      </select>
                    </div>

                    {/* System prompt */}
                    <textarea
                      value={systemPrompt}
                      onChange={e => setSystemPrompt(e.target.value)}
                      disabled={!isOwner}
                      rows={3}
                      placeholder={t.apiKeyProductView?.baseInstructionPlaceholder || 'Instrucción base para el asistente...'}
                      className={`${inputCls} resize-y min-h-[80px] w-full`}
                    />

                    {selectedRole && (
                      <p className="text-[0.8rem] text-[#6b8f84]">
                        Rol activo: <strong className="text-[#0f2a24]">{selectedRole.title}</strong>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── Models tab ── */}
              {configTab === 'models' && (
                <>
                  <h3 className="text-[1.1rem] font-semibold text-[#0f2a24] mb-1">Modelos validados</h3>
                  <p className="text-[0.8rem] text-[#6b8f84] leading-relaxed mb-3">
                    {hasValidatedKey
                      ? 'Modelos disponibles para tu cuenta.'
                      : 'Valida la API key para listar los modelos disponibles.'}
                  </p>
                  {validatedModelOptions.length > 0 && (
                    <div className="border border-[#a7d7c5] rounded-lg overflow-hidden flex-1 overflow-y-auto">
                      {validatedModelOptions.map(model => (
                        <div key={model.id} className="grid grid-cols-[1fr_auto_auto] gap-2 p-2.5 text-[0.8rem] border-b last:border-b-0 border-[#e6f4f0] hover:bg-[#f3fbf9] transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0f2a24] truncate">{model.label}</p>
                            <p className="text-[#6b8f84] truncate text-[0.7rem]">{model.id}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 items-center">
                            {model.capabilities.map(cap => (
                              <span key={`${model.id}-${cap}`} className="px-1.5 py-0.5 rounded bg-[#d1fae5] text-[#0f766e] border border-[#a7d7c5] text-[0.65rem]">
                                {capabilityLabel(cap, t)}
                              </span>
                            ))}
                          </div>
                          <p className="text-[#0f766e] font-semibold whitespace-nowrap">{model.priceLabel}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Budget / Stats tab ── */}
              {configTab === 'budget' && (
                <>
                  <h3 className="text-[1.1rem] font-semibold text-[#0f2a24] mb-1">
                    {t.apiKeyProductView?.usageStatsTitle || 'Estadísticas de uso'}
                  </h3>
                  <p className="text-[0.8rem] text-[#6b8f84] leading-relaxed mb-4">
                    Consumo acumulado de tokens y costos estimados.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Requests',       value: stats.totalRequests },
                      { label: 'Última latencia', value: `${stats.lastLatencyMs} ms` },
                      { label: 'Tokens entrada',  value: stats.totalInputTokens },
                      { label: 'Tokens salida',   value: stats.totalOutputTokens },
                      { label: 'Total tokens',    value: stats.totalTokens },
                      { label: 'Costo estimado',  value: `$${stats.totalEstimatedCost.toFixed(6)}` },
                    ].map(item => (
                      <div key={item.label} className="bg-[#f3fbf9] border border-[#a7d7c5] rounded-lg px-3 py-2.5">
                        <p className="text-[0.7rem] text-[#6b8f84] uppercase tracking-[0.04em] font-semibold">{item.label}</p>
                        <p className="text-[1rem] font-bold text-[#0f2a24] mt-0.5 tabular-nums">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[0.8rem] text-[#6b8f84]">
                    Proveedor: <strong className="text-[#0f2a24]">{provider}</strong> ·
                    Modelo: <strong className="text-[#0f2a24]">{selectedModel || '—'}</strong>
                  </div>
                </>
              )}

              {/* Footer actions */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#ccfbf1]">
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className={modalBtnCancelCls}
                >
                  {t.apiKeyProductView?.closeButton || 'Cerrar'}
                </button>
                {isOwner && configTab === 'keys' && (
                  <button
                    onClick={() => product && persistConfig(product.id).then(() => setStatusText('Configuración guardada.'))}
                    className={modalBtnSaveCls}
                  >
                    Guardar
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Role modal ────────────────────────────────────────────────── */}
      {showRoleModal && (
        <ModalOverlay>
          <div className="bg-white rounded-2xl p-6 w-full max-w-[480px] max-h-[80vh] overflow-y-auto flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
            <h3 className="text-[1.1rem] font-semibold text-[#0f2a24] m-0">
              {t.apiKeyProductView?.newRoleModalTitle || 'Nuevo rol'}
            </h3>
            <label className="text-[0.8rem] font-medium text-[#3d7a6d]">Nombre</label>
            <input
              value={roleTitleInput}
              onChange={e => setRoleTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.roleTitlePlaceholder || 'Ej: Asistente técnico'}
              className={inputCls}
            />
            <label className="text-[0.8rem] font-medium text-[#3d7a6d]">Contenido</label>
            <textarea
              value={roleBehaviorInput}
              onChange={e => setRoleBehaviorInput(e.target.value)}
              rows={8}
              placeholder={t.apiKeyProductView?.roleBehaviorPlaceholder || 'Eres un asistente...'}
              className={`${inputCls} resize-y min-h-[120px]`}
            />
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setShowRoleModal(false)} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button onClick={handleCreateRole} className={modalBtnSaveCls}>
                {t.apiKeyProductView?.saveRoleButton || 'Guardar rol'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Prompt modal ──────────────────────────────────────────────── */}
      {showPromptModal && (
        <ModalOverlay>
          <div className="bg-white rounded-2xl p-6 w-full max-w-[480px] max-h-[80vh] overflow-y-auto flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
            <h3 className="text-[1.1rem] font-semibold text-[#0f2a24] m-0">
              {t.apiKeyProductView?.newPromptModalTitle || 'Nuevo Prompt'}
            </h3>
            <label className="text-[0.8rem] font-medium text-[#3d7a6d]">Nombre</label>
            <input
              value={promptTitleInput}
              onChange={e => setPromptTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.promptTitlePlaceholder || 'Ej: Resume este texto'}
              className={inputCls}
            />
            <label className="text-[0.8rem] font-medium text-[#3d7a6d]">Contenido</label>
            <textarea
              value={promptContentInput}
              onChange={e => setPromptContentInput(e.target.value)}
              rows={8}
              placeholder={t.apiKeyProductView?.promptContentPlaceholder || 'Resume el siguiente texto en 3 puntos...'}
              className={`${inputCls} resize-y min-h-[120px]`}
            />
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setShowPromptModal(false)} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button onClick={handleCreatePrompt} className={modalBtnSaveCls}>
                {t.apiKeyProductView?.savePromptButton || 'Guardar prompt'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ApiKeyInspectorView;