import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Layers,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  providerTestModel,
  providerUsageSummary,
  validateProviderKey,
  type ApiRuntimeProvider,
  type ProviderModelCapability,
  type ProviderModelInfo,
  type ProviderUsageSummaryResponse,
} from '@core/api-key-runtime';
import {
  decodeModelBindingId,
  decodeSecret,
  encodeModelBindingId,
  encodeSecret,
  loadFablabChatRuntimeState,
  resolveRuntimeFromConfig,
  saveFablabChatRuntimeConfig,
  type FablabChatRuntimeConfig,
  type RuntimeProviderProfile,
} from '@core/fablab-chat';
import { useLanguage } from '../../language/useLanguage';

type ConfigTab = 'apiKeys' | 'models';

type ModelBindingKey =
  | 'selectedTextModelId'
  | 'selectedProjectAuditModelId'
  | 'selectedImageModelId'
  | 'selectedOtherModelId'
  | 'selectedSearchModelId'
  | 'selectedSummaryModelId'
  | 'selectedPromptOptimizerModelId'
  | 'selectedRoleOptimizerModelId'
  | 'selectedSpeechSynthesisModelId'
  | 'selectedSpeechTranscriptionModelId';

type ModelBindings = Record<ModelBindingKey, string>;

type ModelOption = {
  bindingId: string;
  modelId: string;
  label: string;
  provider: ApiRuntimeProvider;
  profileLabel: string;
  capabilities: ProviderModelCapability[];
};

const PROVIDERS: Array<{ value: ApiRuntimeProvider; label: string; keyHint: string; needsBaseUrl?: boolean }> = [
  { value: 'google', label: 'Google', keyHint: 'AIza...' },
  { value: 'openai', label: 'OpenAI', keyHint: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic', keyHint: 'sk-ant-...' },
  { value: 'mistral', label: 'Mistral', keyHint: 'API key' },
  { value: 'perplexity', label: 'Perplexity', keyHint: 'pplx-...' },
  { value: 'ollama', label: 'OLLAMA / Local', keyHint: 'Optional local token', needsBaseUrl: true },
];

const NON_CHAT_UTILITY_MODEL_REGEX = /\b(embedding|embeddings|rerank|re-rank|ranker|moderation|safety|classifier)\b/i;
const VOLATILE_MODEL_REGEX = /\b(preview|experimental|exp|beta|alpha|rc|nightly|dev|canary|snapshot)\b/i;
const GENERIC_OBSOLETE_MODEL_REGEX = /\b(legacy|deprecated|obsolete|retired|sunset|decommissioned|old)\b/i;

const PROVIDER_OBSOLETE_MODEL_PATTERNS: Record<ApiRuntimeProvider, RegExp[]> = {
  google: [
    /\bgemini-(1\.0|1\.5)\b/i,
    /\bgemini-pro(-vision)?\b/i,
    /\b(text|chat|code)-bison\b/i,
    /\bpalm\b/i,
  ],
  openai: [
    /\bgpt-3\.5\b/i,
    /\btext-(davinci|curie|babbage|ada)\b/i,
    /\bgpt-4-(0314|0613|32k|vision-preview|turbo-preview)\b/i,
  ],
  anthropic: [
    /\bclaude-(instant|1|2)\b/i,
  ],
  mistral: [
    /\bmistral-(tiny|small|medium)\b/i,
    /\bopen-mistral-(7b|8x7b)\b/i,
  ],
  perplexity: [
    /\bpplx-(7b|70b)\b/i,
    /\bllama-?2\b/i,
  ],
  ollama: [],
};

const emptyBindings = (): ModelBindings => ({
  selectedTextModelId: '',
  selectedProjectAuditModelId: '',
  selectedImageModelId: '',
  selectedOtherModelId: '',
  selectedSearchModelId: '',
  selectedSummaryModelId: '',
  selectedPromptOptimizerModelId: '',
  selectedRoleOptimizerModelId: '',
  selectedSpeechSynthesisModelId: '',
  selectedSpeechTranscriptionModelId: '',
});

const providerLabel = (provider: ApiRuntimeProvider): string => {
  return PROVIDERS.find((item) => item.value === provider)?.label || provider;
};

const inferCapabilities = (modelId: string): Array<'text' | 'image' | 'audio' | 'video' | 'search'> => {
  const id = modelId.toLowerCase();

  if (NON_CHAT_UTILITY_MODEL_REGEX.test(id)) return [];

  if (
    id.includes('search')
    || id.includes('deep-research')
    || id.includes('sonar')
  ) return ['search'];

  if (
    id.includes('veo')
    || id.includes('video')
    || id.includes('sora')
  ) return ['video'];

  if (
    id.includes('audio')
    || id.includes('tts')
    || id.includes('stt')
    || id.includes('speech')
    || id.includes('transcrib')
    || id.includes('whisper')
    || id.includes('voxtral')
  ) return ['audio'];

  if (
    id.includes('image')
    || id.includes('imagen')
    || id.includes('dall-e')
    || id.includes('gpt-image')
    || id.includes('sdxl')
    || id.includes('stable-diffusion')
    || id.includes('flux')
    || id.includes('nano-banana')
  ) return ['image'];

  return ['text'];
};

const resolveModelCapabilities = (model: ProviderModelInfo): ProviderModelCapability[] => {
  const explicit = Array.isArray(model.capabilities) ? model.capabilities : [];
  return explicit.length > 0 ? explicit : inferCapabilities(model.id);
};

const getModelHaystack = (model: ProviderModelInfo): string => {
  const id = String(model.id || '').toLowerCase();
  const label = String(model.label || '').toLowerCase();
  return `${id} ${label}`.trim();
};

const getRuntimeErrorStatus = (error: any): number | null => {
  const direct = Number(error?.status ?? error?.response?.status ?? error?.details?.status ?? error?.cause?.status);
  if (Number.isFinite(direct) && direct >= 100 && direct <= 599) {
    return Math.trunc(direct);
  }

  const message = String(error?.message || '');
  const match = message.match(/\b(?:status|http)\s*(?:code)?\s*[:=]?\s*(\d{3})\b/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const shouldHideModelFromRuntime = (provider: ApiRuntimeProvider, model: ProviderModelInfo): boolean => {
  const id = String(model.id || '').toLowerCase();
  const haystack = getModelHaystack(model);
  const capabilities = resolveModelCapabilities(model);
  const isMultimedia = capabilities.some((capability) => (
    capability === 'image' || capability === 'video' || capability === 'audio'
  ));

  if (!id) return true;
  if (NON_CHAT_UTILITY_MODEL_REGEX.test(haystack)) return true;
  if (GENERIC_OBSOLETE_MODEL_REGEX.test(haystack)) return true;
  if (VOLATILE_MODEL_REGEX.test(haystack) && !isMultimedia) return true;

  return (PROVIDER_OBSOLETE_MODEL_PATTERNS[provider] || []).some((pattern) => pattern.test(haystack));
};

const pruneProviderModelList = (provider: ApiRuntimeProvider, models: ProviderModelInfo[]): ProviderModelInfo[] => {
  const seen = new Set<string>();

  const normalized = (Array.isArray(models) ? models : [])
    .map((model) => {
      const id = String(model?.id || '').trim();
      const label = String(model?.label || id).trim() || id;
      if (!id) return null;

      const key = id.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key);

      const capabilities = Array.isArray(model?.capabilities)
        ? Array.from(new Set(model.capabilities)) as ProviderModelCapability[]
        : undefined;

      return {
        id,
        label,
        ...(capabilities && capabilities.length > 0 ? { capabilities } : {}),
      } as ProviderModelInfo;
    })
    .filter((model): model is ProviderModelInfo => Boolean(model));

  const pruned = normalized.filter((model) => !shouldHideModelFromRuntime(provider, model));
  const withCapabilities = pruned.filter((model) => resolveModelCapabilities(model).length > 0);

  if (withCapabilities.length > 0) {
    return withCapabilities;
  }

  // Fallback: if aggressive pruning removed too much, keep only non-utility models with known capabilities.
  return normalized.filter((model) => resolveModelCapabilities(model).length > 0);
};

const FIELD_CAPABILITIES: Record<ModelBindingKey, ProviderModelCapability[]> = {
  selectedTextModelId: ['text'],
  selectedProjectAuditModelId: ['text', 'search'],
  selectedImageModelId: ['image'],
  selectedOtherModelId: ['video'],
  selectedSearchModelId: ['search'],
  selectedSummaryModelId: ['text'],
  selectedPromptOptimizerModelId: ['text'],
  selectedRoleOptimizerModelId: ['text'],
  selectedSpeechSynthesisModelId: ['audio'],
  selectedSpeechTranscriptionModelId: ['audio'],
};

// Anthropic model lists can include aliases that are valid for selection but may fail
// direct probe calls depending on account entitlements/gateway behavior. Keep full
// validated list instead of pruning it via auto-test probes.
const PROBE_PROVIDERS = new Set<ApiRuntimeProvider>(['google', 'openai', 'mistral', 'perplexity', 'ollama']);
const MODEL_PROBE_LIMIT = 8;
const MODEL_PROBE_SUCCESS_TARGET = 3;
const MODEL_PROBE_TRANSIENT_STOP = 2;
const TRANSIENT_PROBE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const defaultConfig = (): FablabChatRuntimeConfig => ({
  provider: 'google',
  baseUrl: '',
  profileLabel: '',
  selectedModel: '',
  selectedTextModelId: '',
  selectedProjectAuditModelId: '',
  selectedImageModelId: '',
  selectedOtherModelId: '',
  selectedSearchModelId: '',
  selectedSummaryModelId: '',
  selectedPromptOptimizerModelId: '',
  selectedRoleOptimizerModelId: '',
  selectedSpeechSynthesisModelId: '',
  selectedSpeechTranscriptionModelId: '',
  providerProfiles: [],
  validatedModels: [],
  apiKeyEncoded: '',
  systemPrompt: '',
  lastValidatedAt: '',
  updatedAt: '',
});

const ProfileChatRuntimeConfig: React.FC = () => {
  const { t } = useLanguage();

  const [tab, setTab] = useState<ConfigTab>('apiKeys');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshingUsage, setRefreshingUsage] = useState(false);

  const [errorText, setErrorText] = useState('');
  const [statusText, setStatusText] = useState('');

  const [showKey, setShowKey] = useState(false);

  const [runtimeConfig, setRuntimeConfig] = useState<FablabChatRuntimeConfig>(defaultConfig());
  const [provider, setProvider] = useState<ApiRuntimeProvider>('google');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [providerProfiles, setProviderProfiles] = useState<RuntimeProviderProfile[]>([]);
  const [validatedModels, setValidatedModels] = useState<ProviderModelInfo[]>([]);
  const [modelBindings, setModelBindings] = useState<ModelBindings>(emptyBindings());

  const [localStats, setLocalStats] = useState({
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalEstimatedCost: 0,
    lastLatencyMs: 0,
  });
  const [usageSummary, setUsageSummary] = useState<ProviderUsageSummaryResponse | null>(null);

  const requiresBaseUrl = provider === 'ollama';

  const modelOptions = useMemo<ModelOption[]>(() => {
    const options: ModelOption[] = [];
    for (const profile of providerProfiles) {
      for (const model of profile.validatedModels || []) {
        options.push({
          bindingId: encodeModelBindingId(profile.id, model.id),
          modelId: model.id,
          label: model.label || model.id,
          provider: profile.provider,
          profileLabel: profile.label || providerLabel(profile.provider),
          capabilities: resolveModelCapabilities(model),
        });
      }
    }
    return options;
  }, [providerProfiles]);

  const selectedPrimaryBinding = useMemo(() => {
    return (
      modelBindings.selectedTextModelId
      || modelBindings.selectedProjectAuditModelId
      || modelBindings.selectedSearchModelId
      || modelBindings.selectedSummaryModelId
      || modelBindings.selectedImageModelId
      || modelBindings.selectedOtherModelId
      || ''
    );
  }, [modelBindings]);

  const modelOptionsByField = useMemo<Record<ModelBindingKey, ModelOption[]>>(() => {
    const byBindingId = new Map(modelOptions.map((option) => [option.bindingId, option]));
    const map = {} as Record<ModelBindingKey, ModelOption[]>;

    (Object.keys(FIELD_CAPABILITIES) as ModelBindingKey[]).forEach((fieldKey) => {
      const allowedCapabilities = FIELD_CAPABILITIES[fieldKey];

      const filtered = modelOptions.filter((option) => {
        const capabilities = option.capabilities;
        return capabilities.some((capability) => allowedCapabilities.includes(capability));
      });

      const selectedBindingId = modelBindings[fieldKey];
      if (selectedBindingId) {
        const selectedOption = byBindingId.get(selectedBindingId);
        const alreadyPresent = filtered.some((option) => option.bindingId === selectedBindingId);

        if (selectedOption && !alreadyPresent) {
          filtered.unshift({
            ...selectedOption,
            label: `${selectedOption.label} (actual)`,
          });
        }
      }

      map[fieldKey] = filtered;
    });

    return map;
  }, [modelOptions, modelBindings]);

  const modelFields: Array<{ key: ModelBindingKey; label: string }> = [
    { key: 'selectedTextModelId', label: t?.fablabChat?.profile?.modelFields?.text || 'Text model' },
    { key: 'selectedProjectAuditModelId', label: (t as any)?.fablabChat?.profile?.modelFields?.projectAudit || 'Project audit model' },
    { key: 'selectedImageModelId', label: t?.fablabChat?.profile?.modelFields?.image || 'Image model' },
    { key: 'selectedOtherModelId', label: t?.fablabChat?.profile?.modelFields?.video || 'Video/other model' },
    { key: 'selectedSearchModelId', label: t?.fablabChat?.profile?.modelFields?.search || 'Search model' },
    { key: 'selectedSummaryModelId', label: t?.fablabChat?.profile?.modelFields?.summary || 'Summary model' },
    { key: 'selectedPromptOptimizerModelId', label: t?.fablabChat?.profile?.modelFields?.promptOptimizer || 'Prompt optimizer' },
    { key: 'selectedRoleOptimizerModelId', label: t?.fablabChat?.profile?.modelFields?.roleOptimizer || 'Role optimizer' },
    { key: 'selectedSpeechSynthesisModelId', label: t?.fablabChat?.profile?.modelFields?.speechSynthesis || 'Speech synthesis' },
    { key: 'selectedSpeechTranscriptionModelId', label: t?.fablabChat?.profile?.modelFields?.speechTranscription || 'Speech transcription' },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const state = await loadFablabChatRuntimeState();
        if (cancelled) return;

        const cfg = state.config || defaultConfig();
        const rawProfiles = Array.isArray(cfg.providerProfiles) ? cfg.providerProfiles : [];
        const profiles = rawProfiles.map((profile) => ({
          ...profile,
          validatedModels: pruneProviderModelList(profile.provider, profile.validatedModels || []),
        }));
        const sanitizedValidatedModels = pruneProviderModelList(cfg.provider || 'google', cfg.validatedModels || []);

        const validBindingIds = new Set(
          profiles.flatMap((profile) => (profile.validatedModels || []).map((model) => encodeModelBindingId(profile.id, model.id)))
        );
        const sanitizeBinding = (binding: string) => (validBindingIds.has(binding) ? binding : '');
        const nextBindings = {
          selectedTextModelId: sanitizeBinding(String(cfg.selectedTextModelId || '')),
          selectedProjectAuditModelId: sanitizeBinding(String(cfg.selectedProjectAuditModelId || '')),
          selectedImageModelId: sanitizeBinding(String(cfg.selectedImageModelId || '')),
          selectedOtherModelId: sanitizeBinding(String(cfg.selectedOtherModelId || '')),
          selectedSearchModelId: sanitizeBinding(String(cfg.selectedSearchModelId || '')),
          selectedSummaryModelId: sanitizeBinding(String(cfg.selectedSummaryModelId || '')),
          selectedPromptOptimizerModelId: sanitizeBinding(String(cfg.selectedPromptOptimizerModelId || '')),
          selectedRoleOptimizerModelId: sanitizeBinding(String(cfg.selectedRoleOptimizerModelId || '')),
          selectedSpeechSynthesisModelId: sanitizeBinding(String(cfg.selectedSpeechSynthesisModelId || '')),
          selectedSpeechTranscriptionModelId: sanitizeBinding(String(cfg.selectedSpeechTranscriptionModelId || '')),
        } as ModelBindings;

        const sanitizedConfig: FablabChatRuntimeConfig = {
          ...cfg,
          providerProfiles: profiles,
          validatedModels: sanitizedValidatedModels,
          selectedTextModelId: nextBindings.selectedTextModelId,
          selectedProjectAuditModelId: nextBindings.selectedProjectAuditModelId,
          selectedImageModelId: nextBindings.selectedImageModelId,
          selectedOtherModelId: nextBindings.selectedOtherModelId,
          selectedSearchModelId: nextBindings.selectedSearchModelId,
          selectedSummaryModelId: nextBindings.selectedSummaryModelId,
          selectedPromptOptimizerModelId: nextBindings.selectedPromptOptimizerModelId,
          selectedRoleOptimizerModelId: nextBindings.selectedRoleOptimizerModelId,
          selectedSpeechSynthesisModelId: nextBindings.selectedSpeechSynthesisModelId,
          selectedSpeechTranscriptionModelId: nextBindings.selectedSpeechTranscriptionModelId,
        };

        sanitizedConfig.selectedModel =
          nextBindings.selectedTextModelId
          || nextBindings.selectedProjectAuditModelId
          || nextBindings.selectedSearchModelId
          || nextBindings.selectedSummaryModelId
          || nextBindings.selectedImageModelId
          || nextBindings.selectedOtherModelId
          || '';

        setRuntimeConfig(sanitizedConfig);
        setProvider(sanitizedConfig.provider || 'google');
        setApiKey(decodeSecret(sanitizedConfig.apiKeyEncoded || ''));
        setBaseUrl(sanitizedConfig.baseUrl || '');
        setProviderProfiles(profiles);
        setValidatedModels(sanitizedValidatedModels);
        setModelBindings(nextBindings);

        setLocalStats({
          totalRequests: Number(state.stats.totalRequests || 0),
          totalInputTokens: Number(state.stats.totalInputTokens || 0),
          totalOutputTokens: Number(state.stats.totalOutputTokens || 0),
          totalTokens: Number(state.stats.totalTokens || 0),
          totalEstimatedCost: Number(state.stats.totalEstimatedCost || 0),
          lastLatencyMs: Number(state.stats.lastLatencyMs || 0),
        });
      } catch (error: any) {
        if (!cancelled) {
          setErrorText(error?.message || (t?.fablabChat?.errors?.loadRuntime || 'Could not load runtime configuration.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadState();

    return () => {
      cancelled = true;
    };
  }, [t?.fablabChat?.errors?.loadRuntime]);

  const persistConfig = async (
    nextConfig: FablabChatRuntimeConfig,
    successMessage?: string
  ): Promise<void> => {
    setSaving(true);
    setErrorText('');
    try {
      await saveFablabChatRuntimeConfig({
        ...nextConfig,
        updatedAt: new Date().toISOString(),
      });
      setRuntimeConfig(nextConfig);
      if (successMessage) setStatusText(successMessage);
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.errors?.saveFailed || 'Could not save configuration.'));
    } finally {
      setSaving(false);
    }
  };

  const autoBindModels = (profileId: string, models: ProviderModelInfo[]): ModelBindings => {
    const firstBy = (matcher: (id: string) => boolean): string => {
      const found = models.find((item) => matcher(item.id));
      return found ? encodeModelBindingId(profileId, found.id) : '';
    };

    const firstText = firstBy((id) => {
      const model = models.find((entry) => entry.id === id);
      const caps = model ? resolveModelCapabilities(model) : inferCapabilities(id);
      return caps.includes('text') || caps.includes('search');
    });
    const firstImage = firstBy((id) => {
      const model = models.find((entry) => entry.id === id);
      const caps = model ? resolveModelCapabilities(model) : inferCapabilities(id);
      return caps.includes('image');
    });
    const firstVideo = firstBy((id) => {
      const model = models.find((entry) => entry.id === id);
      const caps = model ? resolveModelCapabilities(model) : inferCapabilities(id);
      return caps.includes('video');
    });
    const firstAudio = firstBy((id) => {
      const model = models.find((entry) => entry.id === id);
      const caps = model ? resolveModelCapabilities(model) : inferCapabilities(id);
      return caps.includes('audio');
    });
    const firstSearch = firstBy((id) => {
      const model = models.find((entry) => entry.id === id);
      const caps = model ? resolveModelCapabilities(model) : inferCapabilities(id);
      return caps.includes('search');
    });

    return {
      selectedTextModelId: firstText,
      selectedProjectAuditModelId: firstText || firstSearch,
      selectedImageModelId: firstImage,
      selectedOtherModelId: firstVideo,
      selectedSearchModelId: firstSearch || firstText,
      selectedSummaryModelId: firstText,
      selectedPromptOptimizerModelId: firstText,
      selectedRoleOptimizerModelId: firstText,
      selectedSpeechSynthesisModelId: firstAudio,
      selectedSpeechTranscriptionModelId: firstAudio,
    };
  };

  const handleValidateProfile = async () => {
    setErrorText('');
    setStatusText('');

    if (requiresBaseUrl && !baseUrl.trim()) {
      setErrorText(t?.fablabChat?.profile?.errors?.baseUrlRequired || 'Base URL is required for OLLAMA.');
      return;
    }
    if (!requiresBaseUrl && provider !== 'google' && !apiKey.trim()) {
      setErrorText(t?.fablabChat?.profile?.errors?.apiKeyRequired || 'API key is required for this provider.');
      return;
    }

    setValidating(true);
    try {
      const result = await validateProviderKey({
        provider,
        apiKey: apiKey.trim(),
        baseUrl: requiresBaseUrl ? baseUrl.trim() : undefined,
      });

      const verifyOperationalModels = async (models: ProviderModelInfo[]): Promise<ProviderModelInfo[]> => {
        if (!PROBE_PROVIDERS.has(provider)) {
          return models;
        }

        const probeCandidates = models
          .filter((model) => {
            const caps = resolveModelCapabilities(model);
            return caps.includes('text') || caps.includes('search');
          })
          .sort((left, right) => {
            const leftVolatile = VOLATILE_MODEL_REGEX.test(getModelHaystack(left)) ? 1 : 0;
            const rightVolatile = VOLATILE_MODEL_REGEX.test(getModelHaystack(right)) ? 1 : 0;
            return leftVolatile - rightVolatile;
          })
          .slice(0, MODEL_PROBE_LIMIT);

        if (probeCandidates.length === 0) {
          return models;
        }

        const passingIds = new Set<string>();
        const hardFailedIds = new Set<string>();
        let transientFailureCount = 0;

        for (let index = 0; index < probeCandidates.length; index += 1) {
          if (passingIds.size >= MODEL_PROBE_SUCCESS_TARGET) {
            break;
          }

          const model = probeCandidates[index];
          const caps = resolveModelCapabilities(model);
          const capability: ProviderModelCapability = caps.includes('search') ? 'search' : 'text';

          setStatusText(`Verifying ${providerLabel(provider)} models (${index + 1}/${probeCandidates.length})...`);

          try {
            const probeResult = await providerTestModel({
              provider,
              apiKey: apiKey.trim(),
              baseUrl: requiresBaseUrl ? baseUrl.trim() : undefined,
              model: model.id,
              capability,
              prompt: 'Reply only with: ok',
            });

            if (probeResult.ok) {
              passingIds.add(model.id);
              transientFailureCount = 0;
            } else {
              hardFailedIds.add(model.id);
            }
          } catch (error: any) {
            const status = getRuntimeErrorStatus(error);
            if (status && TRANSIENT_PROBE_STATUS_CODES.has(status)) {
              transientFailureCount += 1;

              if (transientFailureCount >= MODEL_PROBE_TRANSIENT_STOP) {
                setStatusText(`Model verification paused by provider limits (${status}). Keeping remaining models as candidates.`);
                break;
              }

              continue;
            }

            hardFailedIds.add(model.id);
          }
        }

        if (hardFailedIds.size === 0) {
          return models;
        }

        const filtered = models.filter((model) => {
          return !hardFailedIds.has(model.id);
        });

        const hasUsableTextModel = filtered.some((model) => {
          const caps = resolveModelCapabilities(model);
          return caps.includes('text') || caps.includes('search');
        });

        return hasUsableTextModel ? filtered : models;
      };

      const validatedProviderModels = Array.isArray(result.models) ? result.models : [];
      const prunedModels = pruneProviderModelList(provider, validatedProviderModels);
      const operationalModels = await verifyOperationalModels(prunedModels);

      const encoded = encodeSecret(apiKey.trim());
      const now = new Date().toISOString();
      const existing = providerProfiles.find((item) =>
        item.provider === provider
        && (item.baseUrl || '') === (baseUrl.trim() || '')
        && item.apiKeyEncoded === encoded
      );

      const sameProviderCount = providerProfiles.filter((item) => item.provider === provider).length;
      const profileId = existing?.id || `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const label = existing?.label || `${providerLabel(provider)} ${sameProviderCount + 1}`;

      const profile: RuntimeProviderProfile = {
        id: profileId,
        label,
        provider,
        apiKeyEncoded: encoded,
        baseUrl: baseUrl.trim(),
        validatedModels: operationalModels,
        lastValidatedAt: now,
      };

      const nextProfiles = existing
        ? providerProfiles.map((item) => (item.id === existing.id ? profile : item))
        : [profile, ...providerProfiles];

      const suggested = autoBindModels(profileId, operationalModels);
      const nextBindings: ModelBindings = {
        ...modelBindings,
        ...suggested,
      };

      const nextSelectedModel =
        nextBindings.selectedTextModelId
        || nextBindings.selectedProjectAuditModelId
        || nextBindings.selectedSearchModelId
        || nextBindings.selectedSummaryModelId
        || nextBindings.selectedImageModelId
        || nextBindings.selectedOtherModelId
        || '';

      setProviderProfiles(nextProfiles);
      setValidatedModels(operationalModels);
      setModelBindings(nextBindings);

      const nextConfig: FablabChatRuntimeConfig = {
        ...runtimeConfig,
        provider,
        profileLabel: label,
        baseUrl: baseUrl.trim(),
        apiKeyEncoded: encoded,
        validatedModels: operationalModels,
        providerProfiles: nextProfiles,
        selectedModel: nextSelectedModel,
        selectedTextModelId: nextBindings.selectedTextModelId,
        selectedProjectAuditModelId: nextBindings.selectedProjectAuditModelId,
        selectedImageModelId: nextBindings.selectedImageModelId,
        selectedOtherModelId: nextBindings.selectedOtherModelId,
        selectedSearchModelId: nextBindings.selectedSearchModelId,
        selectedSummaryModelId: nextBindings.selectedSummaryModelId,
        selectedPromptOptimizerModelId: nextBindings.selectedPromptOptimizerModelId,
        selectedRoleOptimizerModelId: nextBindings.selectedRoleOptimizerModelId,
        selectedSpeechSynthesisModelId: nextBindings.selectedSpeechSynthesisModelId,
        selectedSpeechTranscriptionModelId: nextBindings.selectedSpeechTranscriptionModelId,
        lastValidatedAt: now,
      };

      await persistConfig(
        nextConfig,
        `${t?.fablabChat?.profile?.status?.validated || 'API key validated and models loaded.'} ${operationalModels.length}/${validatedProviderModels.length} models kept.`
      );
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.profile?.errors?.validateFailed || 'Could not validate this provider profile.'));
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const nextProfiles = providerProfiles.filter((item) => item.id !== profileId);

    const clearIfDeleted = (binding: string): string => {
      const decoded = decodeModelBindingId(binding);
      if (!decoded) return '';
      return decoded.profileId === profileId ? '' : binding;
    };

    const nextBindings: ModelBindings = {
      selectedTextModelId: clearIfDeleted(modelBindings.selectedTextModelId),
      selectedProjectAuditModelId: clearIfDeleted(modelBindings.selectedProjectAuditModelId),
      selectedImageModelId: clearIfDeleted(modelBindings.selectedImageModelId),
      selectedOtherModelId: clearIfDeleted(modelBindings.selectedOtherModelId),
      selectedSearchModelId: clearIfDeleted(modelBindings.selectedSearchModelId),
      selectedSummaryModelId: clearIfDeleted(modelBindings.selectedSummaryModelId),
      selectedPromptOptimizerModelId: clearIfDeleted(modelBindings.selectedPromptOptimizerModelId),
      selectedRoleOptimizerModelId: clearIfDeleted(modelBindings.selectedRoleOptimizerModelId),
      selectedSpeechSynthesisModelId: clearIfDeleted(modelBindings.selectedSpeechSynthesisModelId),
      selectedSpeechTranscriptionModelId: clearIfDeleted(modelBindings.selectedSpeechTranscriptionModelId),
    };

    const nextSelectedModel =
      nextBindings.selectedTextModelId
      || nextBindings.selectedProjectAuditModelId
      || nextBindings.selectedSearchModelId
      || nextBindings.selectedSummaryModelId
      || nextBindings.selectedImageModelId
      || nextBindings.selectedOtherModelId
      || '';

    setProviderProfiles(nextProfiles);
    setModelBindings(nextBindings);

    const nextConfig: FablabChatRuntimeConfig = {
      ...runtimeConfig,
      providerProfiles: nextProfiles,
      selectedModel: nextSelectedModel,
      selectedTextModelId: nextBindings.selectedTextModelId,
      selectedProjectAuditModelId: nextBindings.selectedProjectAuditModelId,
      selectedImageModelId: nextBindings.selectedImageModelId,
      selectedOtherModelId: nextBindings.selectedOtherModelId,
      selectedSearchModelId: nextBindings.selectedSearchModelId,
      selectedSummaryModelId: nextBindings.selectedSummaryModelId,
      selectedPromptOptimizerModelId: nextBindings.selectedPromptOptimizerModelId,
      selectedRoleOptimizerModelId: nextBindings.selectedRoleOptimizerModelId,
      selectedSpeechSynthesisModelId: nextBindings.selectedSpeechSynthesisModelId,
      selectedSpeechTranscriptionModelId: nextBindings.selectedSpeechTranscriptionModelId,
    };

    await persistConfig(nextConfig, t?.fablabChat?.profile?.status?.profileDeleted || 'Profile deleted.');
  };

  const handleLoadProfile = (profile: RuntimeProviderProfile) => {
    setProvider(profile.provider);
    setApiKey(decodeSecret(profile.apiKeyEncoded || ''));
    setBaseUrl(profile.baseUrl || '');
    setValidatedModels(profile.validatedModels || []);
    setStatusText(t?.fablabChat?.profile?.status?.profileLoaded || 'Profile loaded in editor.');
    setErrorText('');
  };

  const handleModelBindingChange = (key: ModelBindingKey, value: string) => {
    setModelBindings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveModelSelections = async () => {
    const nextSelectedModel =
      modelBindings.selectedTextModelId
      || modelBindings.selectedProjectAuditModelId
      || modelBindings.selectedSearchModelId
      || modelBindings.selectedSummaryModelId
      || modelBindings.selectedImageModelId
      || modelBindings.selectedOtherModelId
      || '';

    if (!nextSelectedModel) {
      setErrorText(t?.fablabChat?.profile?.errors?.modelRequired || 'Select at least one model.');
      return;
    }

    const nextConfig: FablabChatRuntimeConfig = {
      ...runtimeConfig,
      provider,
      baseUrl,
      apiKeyEncoded: encodeSecret(apiKey.trim()),
      providerProfiles,
      validatedModels,
      selectedModel: nextSelectedModel,
      selectedTextModelId: modelBindings.selectedTextModelId,
      selectedProjectAuditModelId: modelBindings.selectedProjectAuditModelId,
      selectedImageModelId: modelBindings.selectedImageModelId,
      selectedOtherModelId: modelBindings.selectedOtherModelId,
      selectedSearchModelId: modelBindings.selectedSearchModelId,
      selectedSummaryModelId: modelBindings.selectedSummaryModelId,
      selectedPromptOptimizerModelId: modelBindings.selectedPromptOptimizerModelId,
      selectedRoleOptimizerModelId: modelBindings.selectedRoleOptimizerModelId,
      selectedSpeechSynthesisModelId: modelBindings.selectedSpeechSynthesisModelId,
      selectedSpeechTranscriptionModelId: modelBindings.selectedSpeechTranscriptionModelId,
    };

    await persistConfig(nextConfig, t?.fablabChat?.profile?.status?.modelSaved || 'Models saved.');
  };

  const getRuntimeFromBinding = (bindingId: string) => {
    if (!bindingId) return null;
    return resolveRuntimeFromConfig({
      provider,
      selectedModel: bindingId,
      profileLabel: runtimeConfig.profileLabel,
      providerProfiles,
      apiKeyEncoded: encodeSecret(apiKey.trim()),
      baseUrl,
    });
  };

  const handleTestModel = async () => {
    const bindingToTest = selectedPrimaryBinding;
    if (!bindingToTest) {
      setErrorText(t?.fablabChat?.profile?.errors?.modelRequired || 'Select a model before testing.');
      return;
    }

    const runtime = getRuntimeFromBinding(bindingToTest);
    if (!runtime) {
      setErrorText(t?.fablabChat?.profile?.errors?.runtimeIncomplete || 'Runtime is incomplete.');
      return;
    }

    setTesting(true);
    setErrorText('');
    setStatusText('');
    try {
      const response = await providerTestModel({
        provider: runtime.provider,
        apiKey: runtime.apiKey,
        baseUrl: runtime.provider === 'ollama' ? runtime.baseUrl : undefined,
        model: runtime.modelId,
        capability: 'text',
        prompt: t?.fablabChat?.profile?.testPrompt || 'Reply with: model test ok',
      });
      setStatusText(response.message || (t?.fablabChat?.profile?.status?.testOk || 'Model test completed.'));
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.profile?.errors?.testFailed || 'Model test failed.'));
    } finally {
      setTesting(false);
    }
  };

  const refreshUsage = async () => {
    const bindingToUse = selectedPrimaryBinding;
    if (!bindingToUse) {
      setErrorText(t?.fablabChat?.profile?.errors?.modelRequired || 'Select a model first.');
      return;
    }

    const runtime = getRuntimeFromBinding(bindingToUse);
    if (!runtime) {
      setErrorText(t?.fablabChat?.profile?.errors?.runtimeIncomplete || 'Runtime is incomplete.');
      return;
    }

    setRefreshingUsage(true);
    setErrorText('');
    setStatusText('');
    try {
      const summary = await providerUsageSummary({
        provider: runtime.provider,
        apiKey: runtime.apiKey,
        baseUrl: runtime.provider === 'ollama' ? runtime.baseUrl : undefined,
        days: 30,
      });
      setUsageSummary(summary);
      setStatusText(t?.fablabChat?.profile?.status?.usageUpdated || 'Usage summary updated.');
    } catch (error: any) {
      setErrorText(error?.message || (t?.fablabChat?.profile?.errors?.usageFailed || 'Could not load usage summary.'));
    } finally {
      setRefreshingUsage(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Loader2 size={16} className="animate-spin" />
          {t?.fablabChat?.profile?.loading || 'Loading chat runtime configuration...'}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t?.fablabChat?.profile?.title || 'Fablab Chat Configuration'}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t?.fablabChat?.profile?.subtitle || 'Configure provider profiles and model routing for the main chat page.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('apiKeys')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'apiKeys'
                  ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-300'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <KeyRound size={13} />
              <span>{t?.fablabChat?.profile?.tabs?.apiKeys || 'API Keys'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('models')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'models'
                  ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-300'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Layers size={13} />
              <span>{t?.fablabChat?.profile?.tabs?.models || 'Model selection'}</span>
            </button>
          </div>

          {tab === 'apiKeys' && (
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600 dark:text-gray-300">
                  {t?.fablabChat?.profile?.labels?.provider || 'Provider'}
                </span>
                <select
                  value={provider}
                  onChange={(event) => setProvider(event.target.value as ApiRuntimeProvider)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  {PROVIDERS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              {requiresBaseUrl && (
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600 dark:text-gray-300">
                    {t?.fablabChat?.profile?.labels?.baseUrl || 'Base URL'}
                  </span>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder={t?.fablabChat?.profile?.placeholders?.baseUrl || 'http://localhost:11434'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>
              )}

              <label className="block text-sm">
                <span className="mb-1 block text-gray-600 dark:text-gray-300">
                  {t?.fablabChat?.profile?.labels?.apiKey || 'API key'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={PROVIDERS.find((item) => item.value === provider)?.keyHint || 'API key'}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => !prev)}
                    className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleValidateProfile}
                  disabled={validating || saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                >
                  {validating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{t?.fablabChat?.profile?.actions?.validate || 'Validate profile'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t?.fablabChat?.profile?.labels?.configuredProfiles || 'Configured profiles'}
                </p>

                {providerProfiles.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t?.fablabChat?.profile?.empty?.profiles || 'No validated profiles yet.'}
                  </p>
                )}

                <div className="space-y-2">
                  {providerProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {profile.label || providerLabel(profile.provider)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {providerLabel(profile.provider)} - {(profile.validatedModels || []).length} model(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleLoadProfile(profile)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                        >
                          {t?.fablabChat?.profile?.actions?.load || 'Load'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'models' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="grid gap-3 md:grid-cols-2">
                  {modelFields.map((field) => {
                    const fieldOptions = modelOptionsByField[field.key] || [];
                    const emptyLabel = field.key === 'selectedOtherModelId'
                      ? (t as any)?.fablabChat?.profile?.placeholders?.noVideoModels || 'No video models available for current profiles.'
                      : (t as any)?.fablabChat?.profile?.placeholders?.noModelsForField || 'No compatible models available.';

                    return (
                      <label key={field.key} className="text-sm">
                        <span className="mb-1 block text-gray-600 dark:text-gray-300">{field.label}</span>
                        <select
                          value={modelBindings[field.key]}
                          onChange={(event) => handleModelBindingChange(field.key, event.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        >
                          <option value="">
                            {fieldOptions.length > 0
                              ? (t?.fablabChat?.profile?.placeholders?.selectModel || 'Select model...')
                              : emptyLabel}
                          </option>
                          {fieldOptions.map((option) => (
                            <option key={`${field.key}-${option.bindingId}`} value={option.bindingId}>
                              {option.profileLabel} - {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveModelSelections}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{t?.fablabChat?.profile?.actions?.saveModel || 'Save model routing'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestModel}
                  disabled={testing || !selectedPrimaryBinding}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
                >
                  {testing ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
                  <span>{t?.fablabChat?.profile?.actions?.testModel || 'Test model'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <h4 className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <Activity size={14} />
            {t?.fablabChat?.profile?.tabs?.stats || 'Statistics'}
          </h4>

          <div className="grid gap-2">
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t?.fablabChat?.stats?.requests || 'Requests'}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{localStats.totalRequests}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t?.fablabChat?.stats?.tokens || 'Total tokens'}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{localStats.totalTokens}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t?.fablabChat?.stats?.latency || 'Last latency'}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{localStats.lastLatencyMs} ms</p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshUsage}
            disabled={refreshingUsage || !selectedPrimaryBinding}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
          >
            {refreshingUsage ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{t?.fablabChat?.profile?.actions?.refreshUsage || 'Refresh provider usage'}</span>
          </button>

          {usageSummary && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <p>{t?.fablabChat?.profile?.labels?.provider || 'Provider'}: <strong>{providerLabel(usageSummary.provider)}</strong></p>
              <p>{t?.fablabChat?.stats?.requests || 'Requests'}: <strong>{usageSummary.totalRequests}</strong></p>
              <p>{t?.fablabChat?.stats?.tokens || 'Total tokens'}: <strong>{usageSummary.totalTokens}</strong></p>
              <p>{t?.fablabChat?.profile?.labels?.estimatedCost || 'Estimated cost'}: <strong>{Number(usageSummary.totalCostUsd || 0).toFixed(4)} {usageSummary.currency || 'USD'}</strong></p>
            </div>
          )}
        </aside>
      </div>

      {(errorText || statusText) && (
        <div className="mt-4 space-y-2">
          {errorText && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              {errorText}
            </div>
          )}
          {statusText && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
              {statusText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileChatRuntimeConfig;
