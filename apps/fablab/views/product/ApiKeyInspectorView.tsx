import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Moon,
  Plus,
  Send,
  Sun,
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
const THEME_STORAGE_KEY = 'aimaker:api_key_theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  outputKind?: 'text' | 'image' | 'audio' | 'video' | 'none';
  outputPreview?: string;
};

type PendingAttachment = {
  id: string;
  name: string;
  mimeType: string;
  data: string;
  summary: string;
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
type ChatMode = ModelCapability;

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
  { value: 'ollama',      label: 'OLLAMA / Local', hint: 'Optional local token' },
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
  if (provider === 'ollama') return true;
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

const toBase64 = async (file: File): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : '';
};

const isTextLikeFile = (file: File): boolean => {
  return file.type.startsWith('text/') || /\.(txt|md|json|csv|xml|html|js|ts|tsx|jsx|py|php|yml|yaml|sql)$/i.test(file.name);
};

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

const optimizeShortText = (raw: string, maxChars = 400): string => {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const core = text
    .replace(/^eres\s+un\s+/i, '')
    .replace(/^tu\s+eres\s+/i, '')
    .replace(/^actua\s+como\s+/i, '')
    .trim();

  const base = [
    'Objetivo: responder de forma precisa y accionable.',
    `Contexto clave: ${core}`,
    'Formato: breve, claro, con pasos concretos y sin relleno.',
  ].join(' ');

  if (base.length <= maxChars) return base;
  return `${base.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
};

const RUNTIME_STYLE_PROMPT = [
  'Return only the final answer for the user.',
  'Use plain text with short paragraphs and concise bullet points when helpful.',
  'Do not output markdown headings, code fences, HTML tags, JSON traces, tool logs, or internal thoughts.',
].join(' ');

const buildRuntimeSystemPrompt = (basePrompt: string): string => {
  const blocks = [basePrompt.trim(), RUNTIME_STYLE_PROMPT].filter(Boolean);
  return blocks.join('\n\n');
};

const tryParseToolTraceObject = (raw: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const hasAction = typeof parsed.action === 'string';
    const hasActionInput = typeof parsed.action_input === 'string';
    const hasThought = typeof parsed.thought === 'string';
    return hasAction && hasActionInput && hasThought ? parsed : null;
  } catch {
    return null;
  }
};

const stripLeadingToolTrace = (raw: string): string => {
  let text = raw.trim();
  if (!text) return '';

  text = text.replace(/^Refining the response\.\.\./i, '').trim();
  text = text.replace(/\n\s*Refining the response\.\.\./gi, '\n').trim();

  // Handle ```json ... ``` wrappers containing action traces.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*([\s\S]*)$/i);
  if (fenced) {
    const maybeTrace = tryParseToolTraceObject((fenced[1] || '').trim());
    if (maybeTrace) {
      text = (fenced[2] || '').trim();
    }
  }

  // Handle raw JSON trace prefix at the beginning.
  if (text.startsWith('{')) {
    let depth = 0;
    let cutIndex = -1;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          cutIndex = i;
          break;
        }
      }
    }
    if (cutIndex > 0) {
      const head = text.slice(0, cutIndex + 1).trim();
      const tail = text.slice(cutIndex + 1).trim();
      const maybeTrace = tryParseToolTraceObject(head);
      if (maybeTrace) {
        text = tail;
      }
    }
  }

  text = text.replace(/^\s*Refining the response\.\.\.\s*/i, '').trim();
  return text;
};

const stripPresentationFormatting = (raw: string): string => {
  let text = raw;

  // Remove HTML embeds often returned by generic model renderers.
  text = text.replace(/<img\b[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');

  // Convert markdown headings and decorations to plain readable text.
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^\s*[-*]\s+/gm, '- ');
  text = text.replace(/^\s*---+\s*$/gm, '');

  // Remove empty fenced blocks that sometimes leak from tool traces.
  text = text.replace(/```(?:[a-z0-9_-]+)?\s*([\s\S]*?)\s*```/gi, '$1');

  return text.replace(/\n{3,}/g, '\n\n').trim();
};

const normalizeAssistantOutput = (raw: string): string => {
  const cleaned = stripPresentationFormatting(stripLeadingToolTrace(raw));
  return cleaned || stripPresentationFormatting(raw.trim()) || '(sin contenido)';
};

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

/** Sidebar collapsible section wrapper */
const SidebarSection: React.FC<{
  title: string;
  open: boolean;
  isDark?: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  addTitle?: string;
  children: React.ReactNode;
}> = ({ title, open, isDark = false, onToggle, onAdd, addDisabled, addTitle, children }) => (
  <section className={`mt-4 border-t pt-3 ${isDark ? 'border-slate-700' : 'border-[#a7d7c5]'}`}>
    <div className="flex items-center gap-1 mb-1">
      <button
        onClick={onToggle}
        className={`w-3.5 text-center text-sm leading-none select-none bg-transparent border-none cursor-pointer p-0 ${isDark ? 'text-slate-400' : 'text-[#6b8f84]'}`}
        aria-expanded={open}
      >
        {open ? '▾' : '▸'}
      </button>
      <span className={`text-[0.8rem] font-semibold uppercase tracking-[0.03em] flex-1 select-none ${isDark ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>
        {title}
      </span>
      {onAdd && (
        <button
          onClick={onAdd}
          disabled={addDisabled}
          title={addTitle}
          className={`bg-transparent border rounded w-6 h-6 text-base leading-none cursor-pointer flex items-center justify-center disabled:opacity-40 transition-colors ${
            isDark
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
              : 'border-[#99d8c9] text-[#3d7a6d] hover:bg-[#d1fae5] hover:text-[#0f2a24]'
          }`}
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
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; isDark?: boolean }
> = ({ children, className = '', isDark = false, ...props }) => (
  <button
    {...props}
    className={`bg-transparent border rounded-lg py-[7px] px-2.5 text-[0.82rem] font-[inherit] cursor-pointer text-center transition-colors ${
      isDark
        ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
        : 'border-[#99e6d0] text-[#6b8f84] hover:bg-[#d1fae5] hover:text-[#0f2a24]'
    } ${className}`}
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
  const [baseUrl,        setBaseUrl]        = useState('');
  const [selectedModel,  setSelectedModel]  = useState('');
  const [selectedTextModelId, setSelectedTextModelId] = useState('');
  const [selectedImageModelId, setSelectedImageModelId] = useState('');
  const [selectedOtherModelId, setSelectedOtherModelId] = useState('');
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
  const [lastValidatedAt,  setLastValidatedAt]  = useState<string>('');

  // ── UX helpers ──
  const [isDarkTheme,        setIsDarkTheme]        = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });
  const [webSearchEnabled,   setWebSearchEnabled]   = useState(false);
  const [showPromptPicker,   setShowPromptPicker]   = useState(false);
  const [attachedContext,    setAttachedContext]    = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isListening,        setIsListening]        = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

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
  const [chatMode,  setChatMode]  = useState<ChatMode>('text');

  // ── Async status ──
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isSending,       setIsSending]       = useState(false);
  const [statusText,      setStatusText]      = useState('');
  const [errorText,       setErrorText]       = useState('');

  const fixedTitle       = t.products?.fixed?.apiKeyTitle || 'Inspector de API Keys';
  const fixedDescription = t.products?.fixed?.apiKeyDesc  || 'Valida formato y conectividad de API keys por proveedor.';
  const requiresApiKey = provider !== 'ollama';
  const requiresBaseUrl = provider === 'ollama';

  const themeStyle = useMemo<React.CSSProperties>(() => {
    return isDarkTheme
      ? {
          backgroundColor: '#0b1220',
          color: '#e5e7eb',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }
      : {
          backgroundColor: '#f8fffe',
          color: '#0f2a24',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        };
  }, [isDarkTheme]);

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

  const textModelOptions = useMemo(
    () => validatedModelOptions.filter((m) => m.capabilities.includes('text') || m.capabilities.includes('search')),
    [validatedModelOptions]
  );

  const imageModelOptions = useMemo(
    () => validatedModelOptions.filter((m) => m.capabilities.includes('image')),
    [validatedModelOptions]
  );

  const otherModelOptions = useMemo(
    () => validatedModelOptions.filter((m) => !m.capabilities.includes('text') && !m.capabilities.includes('search') && !m.capabilities.includes('image')),
    [validatedModelOptions]
  );

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

  const effectiveSystemPrompt = useMemo(() => {
    const blocks = [systemPrompt.trim(), selectedRole?.behavior?.trim() ?? ''].filter(Boolean);
    return blocks.join('\n\n');
  }, [systemPrompt, selectedRole]);

  // ─── Persist helpers ──────────────────────────────────────────────────────

  const persistConfig = async (productId: number, override?: Partial<Record<string, unknown>>) => {
    const resolvedLastValidatedAt = hasValidatedKey
      ? (lastValidatedAt || new Date().toISOString())
      : '';

    await updateProductStepProgress({
      productId,
      stepId: STEP_CONFIG,
      status: 'success',
      resultText: {
        provider,
        baseUrl,
        selectedModel,
        selectedTextModelId,
        selectedImageModelId,
        selectedOtherModelId,
        systemPrompt,
        selectedRoleId,
        apiKeyEncoded: encodeSecret(apiKey),
        validatedModels: remoteModels,
        lastValidatedAt: resolvedLastValidatedAt,
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

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
          if (typeof config.baseUrl        === 'string') setBaseUrl(config.baseUrl);
          if (typeof config.selectedModel  === 'string') setSelectedModel(config.selectedModel);
          if (typeof config.selectedTextModelId === 'string') setSelectedTextModelId(config.selectedTextModelId);
          if (typeof config.selectedImageModelId === 'string') setSelectedImageModelId(config.selectedImageModelId);
          if (typeof config.selectedOtherModelId === 'string') setSelectedOtherModelId(config.selectedOtherModelId);
          if (typeof config.systemPrompt   === 'string') setSystemPrompt(config.systemPrompt);
          if (typeof config.selectedRoleId === 'string') setSelectedRoleId(config.selectedRoleId);
          if (typeof config.apiKeyEncoded  === 'string') setApiKey(decodeSecret(config.apiKeyEncoded));
          if (Array.isArray(config.validatedModels)) {
            setRemoteModels(config.validatedModels as ProviderModelInfo[]);
            setHasValidatedKey((config.validatedModels as ProviderModelInfo[]).length > 0);
          }
          if (typeof config.lastValidatedAt === 'string' && config.lastValidatedAt.trim()) {
            setLastValidatedAt(config.lastValidatedAt);
            setHasValidatedKey(true);
          }

          if (!config.selectedTextModelId && !config.selectedImageModelId && !config.selectedOtherModelId && typeof config.selectedModel === 'string') {
            const legacyModelId = config.selectedModel;
            const legacyCatalog = catalogMap.get(legacyModelId) ?? catalogMap.get(normalizeModelId(legacyModelId));
            const legacyCaps = legacyCatalog?.capabilities?.length ? legacyCatalog.capabilities : inferCapabilitiesFromId(legacyModelId);
            if (legacyCaps.includes('image')) setSelectedImageModelId(legacyModelId);
            else if (legacyCaps.includes('audio') || legacyCaps.includes('video')) setSelectedOtherModelId(legacyModelId);
            else setSelectedTextModelId(legacyModelId);
          }
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
    if (!selectedTextModelId && textModelOptions.length > 0) {
      setSelectedTextModelId(textModelOptions[0].id);
    }
  }, [selectedTextModelId, textModelOptions]);

  useEffect(() => {
    if (!selectedImageModelId && imageModelOptions.length > 0) {
      setSelectedImageModelId(imageModelOptions[0].id);
    }
  }, [selectedImageModelId, imageModelOptions]);

  useEffect(() => {
    if (!selectedOtherModelId && otherModelOptions.length > 0) {
      setSelectedOtherModelId(otherModelOptions[0].id);
    }
  }, [selectedOtherModelId, otherModelOptions]);

  useEffect(() => {
    const fallbackModelId = selectedTextModelId || selectedImageModelId || selectedOtherModelId || modelOptions[0]?.id || '';
    if (!selectedModel && fallbackModelId) {
      setSelectedModel(fallbackModelId);
    }
  }, [selectedModel, selectedTextModelId, selectedImageModelId, selectedOtherModelId, modelOptions]);

  useEffect(() => {
    if (!availableTestModes.includes(testMode)) setTestMode(availableTestModes[0] ?? 'text');
  }, [availableTestModes, testMode]);

  useEffect(() => {
    if (!selectedModel) return;
    if (!modelOptions.some(m => m.id === selectedModel)) setSelectedModel(modelOptions[0]?.id ?? '');
  }, [selectedModel, modelOptions]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const detectPromptCapability = (rawPrompt: string): ModelCapability => {
    const text = rawPrompt.toLowerCase();
    if (/\b(video|clip|animacion|animación|veo)\b/.test(text)) return 'video';
    if (/\b(audio|voz|tts|speech|narraci[oó]n|narrar)\b/.test(text)) return 'audio';
    if (/\b(imagen|image|foto|photoreal|render|ilustra|dibuja|draw|thumbnail)\b/.test(text)) return 'image';
    if (webSearchEnabled || /\b(busca|buscar|search|investiga|research|fuentes)\b/.test(text)) return 'search';
    return 'text';
  };

  const resolveRoutedModel = (desired: ModelCapability): { mode: ModelCapability; modelId: string; fallbackNotice: string } => {
    const findOtherByCapability = (cap: ModelCapability): string => {
      const selectedOther = validatedModelOptions.find((item) => item.id === selectedOtherModelId);
      if (selectedOther?.capabilities.includes(cap)) return selectedOther.id;
      return otherModelOptions.find((item) => item.capabilities.includes(cap))?.id || '';
    };

    if (desired === 'image') {
      if (selectedImageModelId) return { mode: 'image', modelId: selectedImageModelId, fallbackNotice: '' };
      if (selectedTextModelId) return { mode: 'text', modelId: selectedTextModelId, fallbackNotice: t.apiKeyProductView?.autoFallbackImageToText || 'No hay modelo de imagen seleccionado. Se usó modelo de texto.' };
      return { mode: 'text', modelId: '', fallbackNotice: '' };
    }

    if (desired === 'audio') {
      const audioModel = findOtherByCapability('audio');
      if (audioModel) return { mode: 'audio', modelId: audioModel, fallbackNotice: '' };
      if (selectedTextModelId) return { mode: 'text', modelId: selectedTextModelId, fallbackNotice: t.apiKeyProductView?.autoFallbackAudioToText || 'No hay modelo de audio seleccionado. Se usó modelo de texto.' };
      return { mode: 'text', modelId: '', fallbackNotice: '' };
    }

    if (desired === 'video') {
      const videoModel = findOtherByCapability('video');
      if (videoModel) return { mode: 'video', modelId: videoModel, fallbackNotice: '' };
      if (selectedTextModelId) return { mode: 'text', modelId: selectedTextModelId, fallbackNotice: t.apiKeyProductView?.autoFallbackVideoToText || 'No hay modelo de video seleccionado. Se usó modelo de texto.' };
      return { mode: 'text', modelId: '', fallbackNotice: '' };
    }

    if (desired === 'search') {
      if (selectedTextModelId) return { mode: 'search', modelId: selectedTextModelId, fallbackNotice: '' };
      return { mode: 'text', modelId: selectedImageModelId || selectedOtherModelId || '', fallbackNotice: t.apiKeyProductView?.autoFallbackTextToAny || 'No hay modelo de texto seleccionado. Se usó un modelo alterno.' };
    }

    return {
      mode: 'text',
      modelId: selectedTextModelId || selectedImageModelId || selectedOtherModelId || '',
      fallbackNotice: selectedTextModelId ? '' : (t.apiKeyProductView?.autoFallbackTextToAny || 'No hay modelo de texto seleccionado. Se usó un modelo alterno.'),
    };
  };

  const patchConversation = (
    conversationId: string,
    updater: (c: ConversationRecord) => ConversationRecord
  ) => setConversations(prev => prev.map(conv => conv.id === conversationId ? updater(conv) : conv));

  const handleValidateKey = async () => {
    if (!product) return;
    setErrorText(''); setStatusText('');
    if (requiresBaseUrl && !baseUrl.trim()) {
      setErrorText(t.apiKeyProductView?.localEndpointRequired || 'Debes indicar la URL local del proveedor.');
      return;
    }
    if (requiresApiKey && !isLikelyKeyFormat(provider, apiKey)) {
      setErrorText('Formato de API key no válido para el proveedor elegido.');
      return;
    }
    try {
      setIsValidatingKey(true);
      const result = await validateProviderKey({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: requiresBaseUrl ? baseUrl.trim() : undefined,
      });
      const validatedAt = new Date().toISOString();
      setRemoteModels(result.models || []);
      setHasValidatedKey(true);
      setLastValidatedAt(validatedAt);

      const firstText = result.models.find((m) => {
        const catalog = catalogMap.get(m.id) ?? catalogMap.get(normalizeModelId(m.id));
        const caps = catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(m.id);
        return caps.includes('text') || caps.includes('search');
      });
      const firstImage = result.models.find((m) => {
        const catalog = catalogMap.get(m.id) ?? catalogMap.get(normalizeModelId(m.id));
        const caps = catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(m.id);
        return caps.includes('image');
      });
      const firstOther = result.models.find((m) => {
        const catalog = catalogMap.get(m.id) ?? catalogMap.get(normalizeModelId(m.id));
        const caps = catalog?.capabilities?.length ? catalog.capabilities : inferCapabilitiesFromId(m.id);
        return caps.includes('audio') || caps.includes('video');
      });

      if (firstText?.id) setSelectedTextModelId(firstText.id);
      if (firstImage?.id) setSelectedImageModelId(firstImage.id);
      if (firstOther?.id) setSelectedOtherModelId(firstOther.id);

      if (!selectedModel && result.models.length > 0) {
        setSelectedModel(firstText?.id || firstImage?.id || firstOther?.id || result.models[0]?.id || '');
      }
      await persistConfig(product.id, {
        lastValidatedAt: validatedAt,
        validatedModels: result.models,
      });
      setStatusText(requiresApiKey
        ? 'API key validada correctamente y modelos cargados.'
        : (t.apiKeyProductView?.localValidationSuccess || 'Endpoint local validado y modelos cargados.'));
    } catch (err: any) {
      setErrorText(err?.message || (requiresApiKey ? 'No se pudo validar la API key.' : 'No se pudo validar el endpoint local.'));
    } finally { setIsValidatingKey(false); }
  };

  const getCurrentMessages = (): ChatItem[] => activeConversation?.messages ?? [];

  const runChat = async (text: string, isTest: boolean, modelOverride?: string) => {
    if (!product || !activeConversation) {
      setErrorText('Debes crear o seleccionar una conversación.');
      return;
    }
    if (requiresApiKey && !apiKey.trim()) {
      setErrorText('Debes ingresar una API key.');
      return;
    }
    if (requiresBaseUrl && !baseUrl.trim()) {
      setErrorText(t.apiKeyProductView?.localEndpointRequired || 'Debes indicar la URL local del proveedor.');
      return;
    }
    const modelToUse = (modelOverride || selectedModel).trim();
    if (!modelToUse) { setErrorText('Debes elegir un modelo.'); return; }

    const composedPrompt = [
      text,
      attachedContext ? `\n\n[Contexto adjunto]\n${attachedContext}` : '',
      webSearchEnabled ? '\n\n[Modo búsqueda web activo] Responde con referencias de fuente cuando aplique.' : '',
    ].join('').trim();

    const userMessage: ChatItem = {
      id: `u-${Date.now()}`, role: 'user', content: composedPrompt,
      createdAt: new Date().toISOString(),
    };
    const runtimeAttachments = pendingAttachments.map((item) => ({
      name: item.name,
      mimeType: item.mimeType,
      data: item.data,
    }));
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
        .map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.id === userMessage.id && m.role === 'user' ? runtimeAttachments : undefined,
        }));

      const response = await providerChat({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: requiresBaseUrl ? baseUrl.trim() : undefined,
        model: modelToUse,
        systemPrompt: buildRuntimeSystemPrompt(effectiveSystemPrompt), messages: payloadMessages,
      });

      const assistantMessage: ChatItem = {
        id: `a-${Date.now()}`, role: 'assistant',
        content: normalizeAssistantOutput(response.content || ''),
        createdAt: new Date().toISOString(), outputKind: 'text',
      };
      const nextChat = [...nextChatBase, assistantMessage];
      patchConversation(activeConversation.id, conv => ({
        ...conv, messages: nextChat, updatedAt: new Date().toISOString(),
      }));

      const estimatedCost = estimateCost(modelToUse, response.usage.inputTokens, response.usage.outputTokens, catalogMap);
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
      if (!isTest) {
        setAttachedContext('');
        setPendingAttachments([]);
      }
      setStatusText(isTest ? 'Modelo probado correctamente.' : 'Respuesta recibida y guardada.');
    } catch (err: any) {
      setErrorText(err?.message || 'No se pudo completar el chat con el proveedor.');
    } finally { setIsSending(false); }
  };

  const runCapabilityGeneration = async (capability: ModelCapability, promptText: string, isTest: boolean, modelOverride?: string) => {
    if (!product || !activeConversation) {
      setErrorText('Debes crear o seleccionar una conversación.');
      return;
    }
    if (requiresApiKey && !apiKey.trim()) {
      setErrorText('Debes ingresar una API key.');
      return;
    }
    if (requiresBaseUrl && !baseUrl.trim()) {
      setErrorText(t.apiKeyProductView?.localEndpointRequired || 'Debes indicar la URL local del proveedor.');
      return;
    }
    const modelToUse = (modelOverride || selectedModel).trim();
    if (!modelToUse) { setErrorText('Debes elegir un modelo.'); return; }

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
      const runtimeAttachments = pendingAttachments.map((item) => ({
        name: item.name,
        mimeType: item.mimeType,
        data: item.data,
      }));

      const response = await providerTestModel({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: requiresBaseUrl ? baseUrl.trim() : undefined,
        model: modelToUse,
        capability: capability === 'unknown' ? 'text' : capability,
        prompt: promptText,
        attachments: runtimeAttachments,
      });
      const kind = response.outputKind || (capability === 'image' || capability === 'audio' || capability === 'video' ? capability : 'text');
      const assistantMessage: ChatItem = {
        id: `cap-${Date.now()}`, role: 'assistant',
        content: normalizeAssistantOutput(response.message || 'Prueba ejecutada'),
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
      if (!isTest) {
        setAttachedContext('');
        setPendingAttachments([]);
      }
      setStatusText(isTest ? 'Modelo probado correctamente.' : 'Generación ejecutada y guardada.');
    } catch (err: any) {
      setErrorText(err?.message || 'No se pudo ejecutar la generación para este modo.');
    } finally { setIsSending(false); }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text && pendingAttachments.length === 0) return;

    const normalizedText = text || (t.apiKeyProductView?.attachmentOnlyPrompt || 'Analiza los archivos adjuntos y responde con hallazgos accionables.');

    const desiredCapability = detectPromptCapability(normalizedText);
    const routing = resolveRoutedModel(desiredCapability);

    if (!routing.modelId) {
      setErrorText(t.apiKeyProductView?.selectModelFirst || 'Debes seleccionar un modelo.');
      return;
    }

    setSelectedModel(routing.modelId);
    setChatMode(routing.mode);

    if (routing.fallbackNotice) {
      setStatusText(routing.fallbackNotice);
    }

    if (routing.mode === 'text' || routing.mode === 'search') {
      await runChat(normalizedText, false, routing.modelId);
      return;
    }

    await runCapabilityGeneration(routing.mode, normalizedText, false, routing.modelId);
  };

  const handleTestModel = async () => {
    const modelForTest =
      (testMode === 'image' ? selectedImageModelId : '') ||
      (testMode === 'text' || testMode === 'search' ? selectedTextModelId : '') ||
      ((testMode === 'audio' || testMode === 'video') ? selectedOtherModelId : '') ||
      selectedModel ||
      selectedTextModelId ||
      selectedImageModelId ||
      selectedOtherModelId;
    if (!modelForTest) { setErrorText(t.apiKeyProductView?.selectModelFirst || 'Debes seleccionar un modelo.'); return; }
    if (!availableTestModes.includes(testMode)) { setErrorText(t.apiKeyProductView?.invalidTestMode || 'Esta modalidad no está disponible.'); return; }
    setSelectedModel(modelForTest);
    await runCapabilityGeneration(
      testMode,
      testMode === 'image' ? 'Create a small test image with the word AIMAKER' : 'Reply only with OK',
      true,
      modelForTest
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
    if (!title || !behavior) { setErrorText(t.apiKeyProductView?.roleValidation || 'Debes completar título y comportamiento.'); return; }
    const newRole: RoleRecord = {
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, behavior,
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
    const title  = promptTitleInput.trim();
    const prompt = promptContentInput.trim();
    if (!title || !prompt) { setErrorText(t.apiKeyProductView?.promptValidation || 'Debes completar título y contenido.'); return; }
    const newPrompt: PromptRecord = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, prompt,
    };
    const nextPrompts = [newPrompt, ...prompts];
    setPrompts(nextPrompts);
    setShowPromptModal(false);
    setPromptTitleInput('');
    setPromptContentInput('');
    setStatusText(t.apiKeyProductView?.promptSaved || 'Prompt guardado.');
    if (product) await persistChat(product.id, { prompts: nextPrompts });
  };

  const handleUsePrompt = (prompt: PromptRecord) => {
    setMessageInput(prompt.prompt);
    setStatusText(t.apiKeyProductView?.promptApplied || 'Prompt aplicado al cuadro de chat.');
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
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusText('Conversación descargada.');
  };

  const handleExportWorkspace = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      config: {
        provider,
        baseUrl,
        selectedModel,
        selectedTextModelId,
        selectedImageModelId,
        selectedOtherModelId,
        systemPrompt,
        selectedRoleId,
        validatedModels: remoteModels,
      },
      chat: {
        roles,
        prompts,
        conversations,
        activeConversationId,
      },
      stats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `chatbot_llm_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatusText(t.apiKeyProductView?.exportSuccess || 'Exportación completada.');
  };

  const handleImportWorkspaceFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const nextProvider = parsed?.config?.provider as ApiRuntimeProvider | undefined;
      const nextBaseUrl = String(parsed?.config?.baseUrl || '');
      const nextModel = String(parsed?.config?.selectedModel || '');
      const nextTextModelId = String(parsed?.config?.selectedTextModelId || '');
      const nextImageModelId = String(parsed?.config?.selectedImageModelId || '');
      const nextOtherModelId = String(parsed?.config?.selectedOtherModelId || '');
      const nextSystemPrompt = String(parsed?.config?.systemPrompt || '');
      const nextSelectedRoleId = String(parsed?.config?.selectedRoleId || '');
      const nextRoles = Array.isArray(parsed?.chat?.roles) ? parsed.chat.roles as RoleRecord[] : [];
      const nextPrompts = Array.isArray(parsed?.chat?.prompts) ? parsed.chat.prompts as PromptRecord[] : [];
      const nextConversations = Array.isArray(parsed?.chat?.conversations)
        ? parsed.chat.conversations as ConversationRecord[]
        : [];
      const nextActiveConversationId = String(parsed?.chat?.activeConversationId || '');
      const nextStats = parsed?.stats && typeof parsed.stats === 'object'
        ? ({ ...EMPTY_STATS, ...(parsed.stats as RuntimeStats) })
        : EMPTY_STATS;
      const nextValidatedModels = Array.isArray(parsed?.config?.validatedModels)
        ? parsed.config.validatedModels as ProviderModelInfo[]
        : [];
      const nextLastValidatedAt = typeof parsed?.config?.lastValidatedAt === 'string'
        ? parsed.config.lastValidatedAt
        : (nextValidatedModels.length > 0 ? new Date().toISOString() : '');

      if (nextProvider) setProvider(nextProvider);
      setBaseUrl(nextBaseUrl);
      setSelectedModel(nextModel);
      setSelectedTextModelId(nextTextModelId);
      setSelectedImageModelId(nextImageModelId);
      setSelectedOtherModelId(nextOtherModelId);
      setSystemPrompt(nextSystemPrompt);
      setSelectedRoleId(nextSelectedRoleId);
      setRoles(nextRoles);
      setPrompts(nextPrompts);
      setConversations(nextConversations);
      setActiveConversationId(nextActiveConversationId || nextConversations[0]?.id || '');
      setStats(nextStats);
      setRemoteModels(nextValidatedModels);
      setHasValidatedKey(nextValidatedModels.length > 0);
      setLastValidatedAt(nextLastValidatedAt);

      if (product) {
        await Promise.all([
          persistConfig(product.id, {
            provider: nextProvider ?? provider,
            baseUrl: nextBaseUrl,
            selectedModel: nextModel,
            selectedTextModelId: nextTextModelId,
            selectedImageModelId: nextImageModelId,
            selectedOtherModelId: nextOtherModelId,
            systemPrompt: nextSystemPrompt,
            selectedRoleId: nextSelectedRoleId,
            validatedModels: nextValidatedModels,
            lastValidatedAt: nextLastValidatedAt,
          }),
          persistChat(product.id, {
            roles: nextRoles,
            prompts: nextPrompts,
            conversations: nextConversations,
            activeConversationId: nextActiveConversationId || nextConversations[0]?.id || '',
          }),
          persistStats(product.id, nextStats),
        ]);
      }

      setStatusText(t.apiKeyProductView?.importSuccess || 'Importación completada.');
      setErrorText('');
    } catch (err: any) {
      setErrorText(err?.message || t.apiKeyProductView?.importError || 'No se pudo importar el archivo.');
    }
  };

  const handleImportWorkspaceClick = () => {
    importInputRef.current?.click();
  };

  const handleImportWorkspaceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImportWorkspaceFile(file);
    event.target.value = '';
  };

  const readAttachment = async (file: File): Promise<{ contextLine: string; attachment?: PendingAttachment }> => {
    const mimeType = file.type || 'application/octet-stream';

    if (isTextLikeFile(file)) {
      const text = await file.text();
      return {
        contextLine: `${file.name}: ${text.replace(/\s+/g, ' ').trim().slice(0, 900)}`,
      };
    }

    const maxBinarySize = 6 * 1024 * 1024;
    if (file.size > maxBinarySize) {
      return {
        contextLine: `${file.name} (${mimeType}) - ${(file.size / (1024 * 1024)).toFixed(1)}MB (omitido por tamano)`,
      };
    }

    const data = await toBase64(file);
    const summary = `${file.name} (${mimeType}, ${Math.max(1, Math.round(file.size / 1024))}KB)`;

    return {
      contextLine: summary,
      attachment: {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType,
        data,
        summary,
      },
    };
  };

  const handleAttachClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const parsed = await Promise.all(files.map(readAttachment));
    const merged = parsed.map((item) => item.contextLine).filter(Boolean).join('\n');
    const newAttachments = parsed
      .map((item) => item.attachment)
      .filter((item): item is PendingAttachment => Boolean(item));

    setAttachedContext(prev => [prev, merged].filter(Boolean).join('\n').slice(0, 3000));
    setPendingAttachments((prev) => [...prev, ...newAttachments].slice(-8));
    setStatusText(t.apiKeyProductView?.attachmentReady || 'Contexto adjunto listo.');
    event.target.value = '';
  };

  const handleEnhanceMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput(optimizeShortText(messageInput, 400));
    setStatusText(t.apiKeyProductView?.inputOptimized || 'Texto optimizado.');
  };

  const handleOptimizeRoleBehavior = () => {
    if (!roleBehaviorInput.trim()) return;
    setRoleBehaviorInput(optimizeShortText(roleBehaviorInput, 400));
  };

  const handleOptimizePromptContent = () => {
    if (!promptContentInput.trim()) return;
    setPromptContentInput(optimizeShortText(promptContentInput, 400));
  };

  const handlePromptPickerToggle = () => {
    setShowPromptPicker((prev) => !prev);
  };

  const handleMicToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorText(t.apiKeyProductView?.voiceNotSupported || 'Tu navegador no soporta dictado por voz.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;
    speechRecognitionRef.current = recognition;

    recognition.onresult = (evt: any) => {
      const transcript = Array.from(evt.results)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setMessageInput((prev) => `${prev}${prev ? ' ' : ''}${transcript}`.slice(0, 3000));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setErrorText(t.apiKeyProductView?.voiceError || 'No se pudo procesar el dictado.');
    };

    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
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
  const selectCls = isDarkTheme
    ? 'text-[0.8rem] font-[inherit] px-2 py-1 border border-slate-600 rounded-md bg-slate-800 text-slate-100 cursor-pointer outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700'
    : 'text-[0.8rem] font-[inherit] px-2 py-1 border border-[#99e6d0] rounded-md bg-white text-[#0f2a24] cursor-pointer outline-none focus:border-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#ecfdf5]';
  const inputCls  = isDarkTheme
    ? 'font-[inherit] text-[0.9rem] px-3 py-2 border border-slate-600 rounded-lg outline-none bg-slate-800 text-slate-100 focus:border-cyan-400 transition-colors'
    : 'font-[inherit] text-[0.9rem] px-3 py-2 border border-[#99e6d0] rounded-lg outline-none bg-[#f8fffe] text-[#0f2a24] focus:border-[#6b8f84] transition-colors';
  const modalBtnCancelCls = isDarkTheme
    ? 'font-[inherit] text-[0.85rem] px-[18px] py-2 rounded-[10px] cursor-pointer bg-slate-700 text-slate-200 border-none hover:bg-slate-600 transition-colors'
    : 'font-[inherit] text-[0.85rem] px-[18px] py-2 rounded-[10px] cursor-pointer bg-[#ecfdf5] text-[#3d7a6d] border-none hover:bg-[#d1fae5] transition-colors';
  const modalBtnSaveCls   = 'font-[inherit] text-[0.85rem] px-[18px] py-2 rounded-[10px] cursor-pointer bg-[#0f766e] text-white border-none hover:opacity-85 transition-opacity';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={themeStyle}>

      {/* ── Sidebar toggle (fixed) ─────────────────────────────────────── */}
      <button
        onClick={() => setSidebarCollapsed(v => !v)}
        title={sidebarCollapsed ? (t.apiKeyProductView?.expandSidebar || 'Mostrar panel') : (t.apiKeyProductView?.collapseSidebar || 'Ocultar panel')}
        className={`fixed top-3 z-[100] border rounded-md p-1 cursor-pointer flex items-center justify-center transition-all duration-[250ms] ${
          isDarkTheme
            ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700'
            : 'bg-[#ecfdf5] border-[#99e6d0] text-[#6b8f84] hover:text-[#0f2a24] hover:bg-[#d1fae5]'
        }`}
        style={{ left: sidebarCollapsed ? 8 : 286 }}
      >
        <IconPanel />
      </button>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col border-r transition-all duration-[250ms] overflow-hidden ${
          isDarkTheme ? 'bg-[#111827] border-slate-700' : 'bg-[#ecfdf5] border-[#a7d7c5]'
        }`}
        style={{
          width:    sidebarCollapsed ? 0 : 300,
          minWidth: sidebarCollapsed ? 0 : 240,
          padding:  sidebarCollapsed ? '24px 0' : '24px 16px',
          opacity:  sidebarCollapsed ? 0 : 1,
          borderRightWidth: sidebarCollapsed ? 0 : 1,
        }}
      >
        {/* Header */}
        <h1 className={`text-[1.6rem] font-extrabold mb-1 flex items-center justify-center gap-2 tracking-[-0.02em] ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
          <KeyRound size={28} className="text-[#0f766e] flex-shrink-0" />
          <span className="whitespace-nowrap">FabLab AIMaker</span>
          <span className="text-[0.45em] font-semibold opacity-50 align-super">v2.3</span>
        </h1>
        <a
          href="#"
          className={`block text-center text-[0.7rem] no-underline mb-5 hover:underline transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-slate-100' : 'text-[#6b8f84] hover:text-[#0f2a24]'}`}
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
            isDark={isDarkTheme}
            onToggle={() => setIsRolesOpen(v => !v)}
            onAdd={() => setShowRoleModal(true)}
            addDisabled={!isOwner}
            addTitle={t.apiKeyProductView?.addRoleTitle || 'Crear rol'}
          >
            <div className="flex flex-col gap-0.5 mt-1">
              {roles.length === 0 && (
                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{t.apiKeyProductView?.emptyRoles || 'Sin roles guardados'}</p>
              )}
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRoleId(role.id);
                    if (product) persistConfig(product.id, { selectedRoleId: role.id }).catch(console.error);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[0.82rem] font-medium transition-colors cursor-pointer border-none ${selectedRoleId === role.id
                    ? (isDarkTheme ? 'bg-slate-700 text-slate-100' : 'bg-[#a7f3d0] text-[#0f2a24]')
                    : (isDarkTheme ? 'bg-transparent hover:bg-slate-700 text-slate-200' : 'bg-transparent hover:bg-[#d1fae5] text-[#0f2a24]')}`}
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
            isDark={isDarkTheme}
            onToggle={() => setIsPromptsOpen(v => !v)}
            onAdd={() => setShowPromptModal(true)}
            addDisabled={!isOwner}
            addTitle={t.apiKeyProductView?.addPromptTitle || 'Crear prompt'}
          >
            <div className="flex flex-col gap-0.5 mt-1">
              {prompts.length === 0 && (
                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{t.apiKeyProductView?.emptyPrompts || 'Sin prompts guardados'}</p>
              )}
              {prompts.map(prompt => (
                <div key={prompt.id} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-[#d1fae5]'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[0.82rem] font-medium truncate ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{prompt.title}</p>
                  </div>
                  <button
                    onClick={() => handleUsePrompt(prompt)}
                    className={`text-[0.7rem] underline whitespace-nowrap bg-transparent border-none cursor-pointer transition-colors ${isDarkTheme ? 'text-teal-300 hover:text-teal-200' : 'text-[#0f766e] hover:text-[#0a5a54]'}`}
                  >
                    {t.apiKeyProductView?.usePrompt || 'Usar'}
                  </button>
                </div>
              ))}
            </div>
          </SidebarSection>

          {/* Conversations */}
          <section className={`mt-4 border-t pt-3 flex-1 min-h-0 flex flex-col ${isDarkTheme ? 'border-slate-700' : 'border-[#a7d7c5]'}`}>
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => setIsConversationsOpen(v => !v)}
                className={`w-3.5 text-center text-sm leading-none select-none bg-transparent border-none cursor-pointer p-0 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}
              >
                {isConversationsOpen ? '▾' : '▸'}
              </button>
              <span className={`text-[0.8rem] font-semibold uppercase tracking-[0.03em] flex-1 ${isDarkTheme ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>
                {t.apiKeyProductView?.conversationsTitle || 'Conversaciones'}
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-0.5 pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#99d8c9] [&::-webkit-scrollbar-thumb]:rounded-sm transition-all duration-200"
              style={{ maxHeight: isConversationsOpen ? undefined : 0, opacity: isConversationsOpen ? 1 : 0, overflow: isConversationsOpen ? 'auto' : 'hidden' }}
            >
              {conversations.length === 0 && (
                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{t.apiKeyProductView?.emptyConversations || 'Sin conversaciones'}</p>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`flex items-start gap-0 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id
                    ? (isDarkTheme ? 'bg-slate-700' : 'bg-[#a7f3d0]')
                    : (isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-[#d1fae5]')}`}
                >
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className="flex-1 min-w-0 text-left px-3 py-2.5 bg-transparent border-none cursor-pointer"
                  >
                    <p className={`text-[0.85rem] font-medium truncate ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
                      {conv.title || 'Conversación sin título'}
                    </p>
                    <p className={`text-[0.7rem] mt-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
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
          <div className={`absolute -top-10 -left-4 -right-4 h-10 bg-gradient-to-b from-transparent pointer-events-none ${isDarkTheme ? 'to-[#111827]' : 'to-[#ecfdf5]'}`} />

          <div className="flex gap-1.5">
            <SidebarBtn isDark={isDarkTheme} className="flex-1" onClick={handleExportWorkspace}>⬆ {t.apiKeyProductView?.exportButton || 'Exportar'}</SidebarBtn>
            <SidebarBtn isDark={isDarkTheme} className="flex-1" onClick={handleImportWorkspaceClick}>⬇ {t.apiKeyProductView?.importButton || 'Importar'}</SidebarBtn>
          </div>
          <SidebarBtn
            isDark={isDarkTheme}
            onClick={() => { setIsConfigModalOpen(true); setConfigTab('budget'); }}
            className="flex items-center justify-center gap-1.5"
            >
            <IconBarChart /> {t.apiKeyProductView?.statsButton || 'Estadísticas'}
          </SidebarBtn>
          <SidebarBtn
            isDark={isDarkTheme}
            onClick={() => { setIsConfigModalOpen(true); setConfigTab('keys'); }}
            className="flex items-center justify-center gap-1.5"
          >
            <IconGear /> {t.apiKeyProductView?.apiConfigTitle || 'Configuración'}
          </SidebarBtn>
          <SidebarBtn
            isDark={isDarkTheme}
            className="flex items-center justify-center gap-1.5"
            onClick={() => setIsDarkTheme((prev) => !prev)}
          >
            {isDarkTheme ? <Sun size={12} /> : <Moon size={12} />} {isDarkTheme
              ? (t.apiKeyProductView?.lightTheme || 'Tema claro')
              : (t.apiKeyProductView?.darkTheme || 'Tema oscuro')}
          </SidebarBtn>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportWorkspaceChange}
          />
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative" style={{ backgroundColor: isDarkTheme ? '#0f172a' : '#f8fffe' }}>

        <div className="px-8 pt-4 pb-3 border-b border-[#ccfbf1] flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/context')}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border transition-colors ${
              isDarkTheme
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-[#99e6d0] text-[#3d7a6d] hover:bg-[#d1fae5]'
            }`}
            title={t.apiKeyProductView?.backToServer || 'Volver al servidor'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className={`text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{fixedTitle}</p>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{fixedDescription}</p>
          </div>
        </div>

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
              className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
            >
              {/* Bubble */}
              <div
                className={`px-[18px] py-3.5 text-[0.95rem] leading-relaxed break-words word-wrap-break-word ${
                  msg.role === 'user'
                    ? (isDarkTheme ? 'bg-emerald-100 rounded-[18px_18px_4px_18px]' : 'bg-[#ecfdf5] rounded-[18px_18px_4px_18px]')
                    : (isDarkTheme ? 'bg-emerald-200 rounded-[18px_18px_18px_4px]' : 'bg-[#d1fae5] rounded-[18px_18px_18px_4px]')
                }`}
              >
                <p className={`whitespace-pre-wrap ${isDarkTheme ? 'text-emerald-950' : 'text-[#0f2a24]'}`}>{msg.content}</p>
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
              <div className={`flex items-center gap-1 mt-0.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-[0.7rem] opacity-60 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
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
        <div className="flex items-center gap-2 px-8 py-2 border-t border-[#ccfbf1] flex-wrap z-[15] relative" style={{ backgroundColor: isDarkTheme ? '#0f172a' : '#f8fffe' }}>

          {/* Text model */}
          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.modelTextLabel || 'Modelo texto'}:
          </label>
          <select
            value={selectedTextModelId}
            onChange={e => {
              if (!e.target.value) return;
              setSelectedTextModelId(e.target.value);
              setSelectedModel(e.target.value);
            }}
            disabled={!isOwner || textModelOptions.length === 0}
            className={selectCls}
          >
            {textModelOptions.length === 0 && <option value="">—</option>}
            {textModelOptions.map(m => (
              <option key={m.id} value={m.id}>{m.displayLabel}</option>
            ))}
          </select>

          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.modelImageLabel || 'Modelo imagen'}:
          </label>
          <select
            value={selectedImageModelId}
            onChange={e => {
              if (!e.target.value) return;
              setSelectedImageModelId(e.target.value);
            }}
            disabled={!isOwner || imageModelOptions.length === 0}
            className={selectCls}
          >
            {imageModelOptions.length === 0 && <option value="">—</option>}
            {imageModelOptions.map(m => (
              <option key={m.id} value={m.id}>{m.displayLabel}</option>
            ))}
          </select>

          <label className="text-[0.8rem] text-[#6b8f84] whitespace-nowrap">
            {t.apiKeyProductView?.modelOtherLabel || 'Modelo otros'}:
          </label>
          <select
            value={selectedOtherModelId}
            onChange={e => {
              if (!e.target.value) return;
              setSelectedOtherModelId(e.target.value);
            }}
            disabled={!isOwner || otherModelOptions.length === 0}
            className={selectCls}
          >
            {otherModelOptions.length === 0 && <option value="">—</option>}
            {otherModelOptions.map(m => (
              <option key={m.id} value={m.id}>{m.displayLabel}</option>
            ))}
          </select>

          <div className={`text-[0.74rem] rounded-md px-2 py-1 border ${isDarkTheme ? 'border-slate-600 text-slate-300 bg-slate-800' : 'border-[#99e6d0] text-[#3d7a6d] bg-[#ecfdf5]'}`}>
            {t.apiKeyProductView?.autoRoutingLabel || 'Ruteo automático por prompt'}
          </div>

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
        <div className="flex justify-between px-8 py-[6px] text-[0.75rem] text-[#6b8f84] border-t border-[#ccfbf1] z-[15] tabular-nums" style={{ backgroundColor: isDarkTheme ? '#0f172a' : '#f8fffe' }}>
          <span>
            {(t.apiKeyProductView?.tokenBar || 'Tokens')} - {(t.apiKeyProductView?.tokensInput || 'entrada')}: {stats.totalInputTokens} | {(t.apiKeyProductView?.tokensOutput || 'salida')}: {stats.totalOutputTokens}
          </span>
          <span>
            {(t.apiKeyProductView?.costEstimatedLabel || 'Costo estimado')}: ${stats.totalEstimatedCost.toFixed(4)}
          </span>
        </div>

        {/* ── Input area ────────────────────────────────────────────── */}
        <div className="px-8 pb-6 pt-4 border-t border-[#ccfbf1] flex flex-col items-center gap-1.5 z-[15]" style={{ backgroundColor: isDarkTheme ? '#0f172a' : '#f8fffe' }}>
          <div className="flex flex-col gap-1.5 w-full max-w-[800px]">
            {/* Wrapper */}
            <div className={`flex items-center w-full border-2 rounded-[20px] py-2 pl-3 pr-2 gap-1.5 focus-within:border-[#0f766e] focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.10)] transition-all duration-200 ${isDarkTheme ? 'border-slate-600 bg-slate-800' : 'border-[#99e6d0] bg-white'}`}>

              {/* Attach */}
              <button
                onClick={handleAttachClick}
                disabled={!isOwner}
                title={t.apiKeyProductView?.attachButton || 'Adjuntar archivo'}
                className={`bg-transparent border rounded-full w-7 h-7 min-w-[28px] min-h-[28px] cursor-pointer flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-colors ${
                  isDarkTheme
                    ? 'border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700'
                    : 'border-[#99e6d0] text-[#6b8f84] hover:text-[#0f2a24]'
                }`}
              >
                <Plus size={14} />
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentChange}
              />

              {/* Web search toggle */}
              <button
                title={t.apiKeyProductView?.webSearchButton || 'Búsqueda web'}
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                className={`bg-transparent border rounded-md cursor-pointer p-[3px_5px] flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDarkTheme
                    ? (webSearchEnabled ? 'border-slate-500 bg-slate-700 text-slate-100' : 'border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700')
                    : (webSearchEnabled ? 'border-[#99e6d0] bg-[#d1fae5] text-[#0f2a24]' : 'border-[#99e6d0] text-[#6b8f84] hover:text-[#0f2a24] hover:bg-[#d1fae5]')
                }`}
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
                className={`flex-1 min-w-0 border-none outline-none text-[0.95rem] font-[inherit] resize-none max-h-[200px] leading-[1.5] py-1 bg-transparent align-middle ${
                  isDarkTheme ? 'text-slate-100 placeholder:text-slate-400' : 'text-[#0f2a24] placeholder:text-[#6b8f84]'
                }`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                }}
              />

              {/* Enhance prompt */}
              <button
                title={t.apiKeyProductView?.optimizeInputButton || 'Optimizar mensaje'}
                disabled={!isOwner || !messageInput.trim()}
                onClick={handleEnhanceMessage}
                className="bg-transparent border-none cursor-pointer p-1 text-[#6b8f84] flex-shrink-0 flex items-center justify-center hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconSparkle />
              </button>

              {/* Prompt picker */}
              <div className="relative">
                <button
                  title={t.apiKeyProductView?.promptPickerButton || 'Insertar prompt guardado'}
                  onClick={handlePromptPickerToggle}
                  className={`bg-transparent border-none cursor-pointer p-1 flex-shrink-0 flex items-center justify-center transition-colors ${isDarkTheme ? 'text-slate-300 hover:text-slate-100' : 'text-[#6b8f84] hover:text-[#0f2a24]'}`}
                >
                  <IconList />
                </button>
                {showPromptPicker && (
                  <div className={`absolute bottom-9 right-0 w-72 max-h-56 overflow-y-auto rounded-lg border shadow-lg z-20 p-1.5 ${isDarkTheme ? 'border-slate-600 bg-slate-800' : 'border-[#99e6d0] bg-white'}`}>
                    {prompts.length === 0 && (
                      <p className={`px-2 py-1 text-xs ${isDarkTheme ? 'text-slate-300' : 'text-[#6b8f84]'}`}>{t.apiKeyProductView?.emptyPrompts || 'Sin prompts guardados'}</p>
                    )}
                    {prompts.map((prompt) => (
                      <button
                        key={`picker-${prompt.id}`}
                        onClick={() => {
                          handleUsePrompt(prompt);
                          setShowPromptPicker(false);
                        }}
                        className={`w-full text-left rounded-md px-2 py-1.5 transition-colors ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-[#ecfdf5]'}`}
                      >
                        <p className={`text-xs font-semibold truncate ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{prompt.title}</p>
                        <p className={`text-[11px] truncate ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{prompt.prompt}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mic */}
              <button
                title={t.apiKeyProductView?.voiceButton || 'Dictar'}
                onClick={handleMicToggle}
                className={`bg-transparent border-none cursor-pointer p-1 flex-shrink-0 flex items-center justify-center mb-0.5 transition-colors ${
                  isListening ? 'text-red-500' : (isDarkTheme ? 'text-slate-300 hover:text-slate-100' : 'text-[#6b8f84] hover:text-[#0f2a24]')
                }`}
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
                {t.apiKeyProductView?.sendButton || 'Enviar'}
              </button>
            </div>

            {(attachedContext || pendingAttachments.length > 0) && (
              <div className={`w-full rounded-lg border px-3 py-2 text-xs flex items-start justify-between gap-2 ${isDarkTheme ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-[#a7d7c5] bg-[#ecfdf5] text-[#3d7a6d]'}`}>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2">{attachedContext || (t.apiKeyProductView?.binaryAttachmentReady || 'Archivos binarios listos para enviar')}</p>
                  {pendingAttachments.length > 0 && (
                    <p className={`mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
                      {(t.apiKeyProductView?.multimodalFilesReady || '{count} archivos multimodales listos').replace('{count}', String(pendingAttachments.length))}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAttachedContext('');
                    setPendingAttachments([]);
                  }}
                  className="text-[#6b8f84] hover:text-red-600 transition-colors"
                  title={t.apiKeyProductView?.clearAttachment || 'Limpiar adjunto'}
                >
                  ✕
                </button>
              </div>
            )}

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
            className={`rounded-2xl overflow-hidden flex flex-row shadow-[0_12px_40px_rgba(0,0,0,0.15)] ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}
            style={{ width: 620, maxWidth: '90vw', height: 520, maxHeight: '80vh' }}
          >
            {/* Tab rail */}
            <div className={`flex flex-col gap-0.5 p-5 min-w-[120px] rounded-l-2xl flex-shrink-0 border-r ${isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-[#99e6d0] bg-[#ecfdf5]'}`}>
              {(['keys', 'models', 'budget'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setConfigTab(tab)}
                  className={`text-left px-3 py-2 rounded-md text-[0.82rem] font-[inherit] cursor-pointer border-none transition-colors ${
                    configTab === tab
                      ? (isDarkTheme ? 'bg-slate-700 text-slate-100 font-semibold' : 'bg-white text-[#0f2a24] font-semibold')
                      : (isDarkTheme ? 'bg-transparent text-slate-300 hover:bg-slate-700 hover:text-slate-100' : 'bg-transparent text-[#6b8f84] hover:bg-[#d1fae5] hover:text-[#0f2a24]')
                  }`}
                >
                  {tab === 'keys'   ? (t.apiKeyProductView?.configTabKeys || 'Claves API') : ''}
                  {tab === 'models' ? (t.apiKeyProductView?.configTabModels || 'Modelos') : ''}
                  {tab === 'budget' ? (t.apiKeyProductView?.configTabStats || 'Estadísticas') : ''}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">

              {/* ── Keys tab ── */}
              {configTab === 'keys' && (
                <>
                  <h3 className={`text-[1.1rem] font-semibold mb-1 ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
                    {t.apiKeyProductView?.apiConfigTitle || 'Configuración de API'}
                  </h3>
                  <p className={`text-[0.8rem] leading-relaxed mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
                    {t.apiKeyProductView?.keysTabDescription || 'Agrega tu clave API para usar la IA directamente, sin límite de mensajes.'}
                  </p>

                  <div className="flex flex-col gap-3 flex-1">
                    {/* Provider + key */}
                    <div className="flex gap-2">
                      <select
                        value={provider}
                        onChange={e => {
                          setProvider(e.target.value as ApiRuntimeProvider);
                          setRemoteModels([]);
                          setSelectedModel('');
                          setSelectedTextModelId('');
                          setSelectedImageModelId('');
                          setSelectedOtherModelId('');
                          setHasValidatedKey(false);
                          setLastValidatedAt('');
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
                        placeholder={provider === 'ollama'
                          ? (t.apiKeyProductView?.localApiKeyOptional || 'Token local opcional')
                          : (PROVIDERS.find(p => p.value === provider)?.hint || 'API key')}
                        type={showApiKey ? 'text' : 'password'}
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        onClick={() => setShowApiKey(v => !v)}
                        className={`bg-transparent border rounded-lg px-2 py-2 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0 ${isDarkTheme ? 'border-slate-600 text-slate-300 hover:text-slate-100 hover:bg-slate-700' : 'border-[#99e6d0] text-[#6b8f84] hover:text-[#0f2a24] hover:bg-[#d1fae5]'}`}
                        title={t.apiKeyProductView?.toggleApiKeyVisibility || 'Mostrar/ocultar'}
                      >
                        <IconEye />
                      </button>
                    </div>

                    {provider === 'ollama' && (
                      <input
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                        disabled={!isOwner}
                        placeholder={t.apiKeyProductView?.localEndpointPlaceholder || 'http://localhost:11434'}
                        className={`${inputCls} w-full`}
                      />
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleValidateKey}
                        disabled={!isOwner || isValidatingKey || (requiresApiKey ? !apiKey.trim() : !baseUrl.trim())}
                        className="flex-1 bg-[#0f766e] text-white font-[inherit] text-[0.85rem] py-2 rounded-lg cursor-pointer font-semibold hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {isValidatingKey ? 'Validando...' : (t.apiKeyProductView?.validateKey || 'Validar key')}
                      </button>
                      <button
                        onClick={handleTestModel}
                        disabled={!isOwner || isSending || !selectedModel || (requiresApiKey ? !apiKey.trim() : !baseUrl.trim())}
                        className={`flex-1 bg-transparent border font-[inherit] text-[0.85rem] py-2 rounded-lg cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isDarkTheme ? 'border-teal-700 text-teal-300 hover:bg-slate-700' : 'border-[#0f766e] text-[#0f766e] hover:bg-[#ecfdf5]'}`}
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
                      <p className={`text-[0.8rem] ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
                        Rol activo: <strong className={isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}>{selectedRole.title}</strong>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── Models tab ── */}
              {configTab === 'models' && (
                <>
                  <h3 className={`text-[1.1rem] font-semibold mb-1 ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{t.apiKeyProductView?.validatedModelsHeading || 'Modelos validados'}</h3>
                  <p className={`text-[0.8rem] leading-relaxed mb-3 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
                    {hasValidatedKey
                      ? (t.apiKeyProductView?.modelsAvailableForAccount || 'Modelos disponibles para tu cuenta.')
                      : (t.apiKeyProductView?.validateKeyToListModels || 'Valida la API key para listar los modelos disponibles.')}
                  </p>
                  {validatedModelOptions.length > 0 && (
                    <div className={`rounded-lg overflow-hidden flex-1 overflow-y-auto ${isDarkTheme ? 'border border-slate-700' : 'border border-[#a7d7c5]'}`}>
                      {validatedModelOptions.map(model => (
                        <div key={model.id} className={`grid grid-cols-[1fr_auto_auto] gap-2 p-2.5 text-[0.8rem] border-b last:border-b-0 transition-colors ${isDarkTheme ? 'border-slate-700 hover:bg-slate-800' : 'border-[#e6f4f0] hover:bg-[#f3fbf9]'}`}>
                          <div className="min-w-0">
                            <p className={`font-semibold truncate ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{model.label}</p>
                            <p className={`truncate text-[0.7rem] ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{model.id}</p>
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
                  <h3 className={`text-[1.1rem] font-semibold mb-1 ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
                    {t.apiKeyProductView?.usageStatsTitle || 'Estadísticas de uso'}
                  </h3>
                  <p className={`text-[0.8rem] leading-relaxed mb-4 ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
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
                      <div key={item.label} className={`rounded-lg px-3 py-2.5 ${isDarkTheme ? 'bg-slate-800 border border-slate-700' : 'bg-[#f3fbf9] border border-[#a7d7c5]'}`}>
                        <p className={`text-[0.7rem] uppercase tracking-[0.04em] font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>{item.label}</p>
                        <p className={`text-[1rem] font-bold mt-0.5 tabular-nums ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 text-[0.8rem] ${isDarkTheme ? 'text-slate-400' : 'text-[#6b8f84]'}`}>
                    {t.apiKeyProductView?.providerValueLabel || 'Proveedor'}: <strong className={isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}>{provider}</strong> ·
                    {t.apiKeyProductView?.modelValueLabel || 'Modelo'}: <strong className={isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}>{selectedModel || '—'}</strong>
                  </div>
                </>
              )}

              {/* Footer actions */}
              <div className={`flex justify-end gap-2 mt-4 pt-3 border-t ${isDarkTheme ? 'border-slate-700' : 'border-[#ccfbf1]'}`}>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className={modalBtnCancelCls}
                >
                  {t.apiKeyProductView?.closeButton || 'Cerrar'}
                </button>
                {isOwner && configTab === 'keys' && (
                  <button
                    onClick={() => product && persistConfig(product.id).then(() => setStatusText(t.apiKeyProductView?.configSaved || 'Configuración guardada.'))}
                    className={modalBtnSaveCls}
                  >
                    {t.apiKeyProductView?.saveConfigButton || 'Guardar'}
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
          <div className={`rounded-2xl p-6 w-full max-w-[480px] max-h-[80vh] overflow-y-auto flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)] ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-[1.1rem] font-semibold m-0 ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
              {t.apiKeyProductView?.newRoleModalTitle || 'Nuevo rol'}
            </h3>
            <label className={`text-[0.8rem] font-medium ${isDarkTheme ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>{t.apiKeyProductView?.nameField || 'Nombre'}</label>
            <input
              value={roleTitleInput}
              onChange={e => setRoleTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.roleTitlePlaceholder || 'Ej: Asistente técnico'}
              className={inputCls}
            />
            <label className={`text-[0.8rem] font-medium ${isDarkTheme ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>{t.apiKeyProductView?.contentField || 'Contenido'}</label>
            <textarea
              value={roleBehaviorInput}
              onChange={e => setRoleBehaviorInput(e.target.value)}
              rows={8}
              placeholder={t.apiKeyProductView?.roleBehaviorPlaceholder || 'Eres un asistente...'}
              className={`${inputCls} resize-y min-h-[120px]`}
            />
            <div className="flex justify-between gap-2 mt-1">
              <button onClick={handleOptimizeRoleBehavior} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.optimizeButton || 'Optimizar'}
              </button>
              <div className="flex gap-2">
              <button onClick={() => setShowRoleModal(false)} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button onClick={handleCreateRole} className={modalBtnSaveCls}>
                {t.apiKeyProductView?.saveRoleButton || 'Guardar rol'}
              </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Prompt modal ──────────────────────────────────────────────── */}
      {showPromptModal && (
        <ModalOverlay>
          <div className={`rounded-2xl p-6 w-full max-w-[480px] max-h-[80vh] overflow-y-auto flex flex-col gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)] ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-[1.1rem] font-semibold m-0 ${isDarkTheme ? 'text-slate-100' : 'text-[#0f2a24]'}`}>
              {t.apiKeyProductView?.newPromptModalTitle || 'Nuevo Prompt'}
            </h3>
            <label className={`text-[0.8rem] font-medium ${isDarkTheme ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>{t.apiKeyProductView?.nameField || 'Nombre'}</label>
            <input
              value={promptTitleInput}
              onChange={e => setPromptTitleInput(e.target.value)}
              placeholder={t.apiKeyProductView?.promptTitlePlaceholder || 'Ej: Resume este texto'}
              className={inputCls}
            />
            <label className={`text-[0.8rem] font-medium ${isDarkTheme ? 'text-slate-300' : 'text-[#3d7a6d]'}`}>{t.apiKeyProductView?.contentField || 'Contenido'}</label>
            <textarea
              value={promptContentInput}
              onChange={e => setPromptContentInput(e.target.value)}
              rows={8}
              placeholder={t.apiKeyProductView?.promptContentPlaceholder || 'Resume el siguiente texto en 3 puntos...'}
              className={`${inputCls} resize-y min-h-[120px]`}
            />
            <div className="flex justify-between gap-2 mt-1">
              <button onClick={handleOptimizePromptContent} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.optimizeButton || 'Optimizar'}
              </button>
              <div className="flex gap-2">
              <button onClick={() => setShowPromptModal(false)} className={modalBtnCancelCls}>
                {t.apiKeyProductView?.cancelButton || 'Cancelar'}
              </button>
              <button onClick={handleCreatePrompt} className={modalBtnSaveCls}>
                {t.apiKeyProductView?.savePromptButton || 'Guardar prompt'}
              </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ApiKeyInspectorView;