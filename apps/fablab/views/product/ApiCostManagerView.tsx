import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react';
import { getOrCreateProductByType, getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { providerUsageSummary, validateProviderKey, type ApiRuntimeProvider, type ProviderModelInfo } from '@core/api-key-runtime';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type ModelCapability = 'text' | 'image' | 'audio' | 'video' | 'search' | 'unknown';

type CatalogModel = {
  id: string;
  label: string;
  inputPer1M?: number;
  outputPer1M?: number;
  imageOutput?: number;
  prix?: string;
  capabilities: ModelCapability[];
};

type LinkedUsageStats = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCost: number;
  chatRequests: number;
  imageRequests: number;
  otherRequests: number;
  source?: string;
  lastRequestAt?: string | null;
};

type CostReport = {
  id: string;
  createdAt: string;
  provider: ApiRuntimeProvider;
  totalModels: number;
  textModels: number;
  imageModels: number;
  otherModels: number;
  pricedModels: number;
  usageTotalTokens: number;
  usageEstimatedCost: number;
  providerUsageSupported: boolean;
  providerTotalTokens: number;
  providerTotalCostUsd: number;
};

type ProviderUsageSnapshot = {
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
  fetchedAt: string;
};

type CostCapsule = {
  id: string;
  label: string;
  provider: ApiRuntimeProvider;
  apiKey: string;
  models: ProviderModelInfo[];
  reports: CostReport[];
  lastValidatedAt: string;
  usageWindowDays: number;
  linkedUsage: LinkedUsageStats;
  providerUsage: ProviderUsageSnapshot;
};

type PersistedCapsule = {
  id: string;
  label: string;
  provider: ApiRuntimeProvider;
  apiKeyEncoded: string;
  models: ProviderModelInfo[];
  lastValidatedAt: string;
  usageWindowDays?: number;
  linkedUsage?: LinkedUsageStats;
  providerUsage?: ProviderUsageSnapshot;
};

const STEP_CONFIG = 1;
const STEP_REPORTS = 2;
const STEP_USAGE_STATS = 3;

const EMPTY_LINKED_USAGE: LinkedUsageStats = {
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalEstimatedCost: 0,
  chatRequests: 0,
  imageRequests: 0,
  otherRequests: 0,
  source: 'app.api_key_usage',
  lastRequestAt: null,
};

const emptyProviderUsage = (
  provider: ApiRuntimeProvider,
  message = 'Genera un resumen para consultar el uso histórico del proveedor.'
): ProviderUsageSnapshot => ({
  supported: false,
  provider,
  totalRequests: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalCostUsd: 0,
  currency: 'USD',
  message,
  fetchedAt: '',
});

const PROVIDERS: Array<{ value: ApiRuntimeProvider; label: string; hint: string }> = [
  { value: 'google', label: 'Google', hint: 'AIza...' },
  { value: 'openai', label: 'OpenAI', hint: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic', hint: 'sk-ant-...' },
  { value: 'mistral', label: 'Mistral', hint: 'Key token' },
  { value: 'perplexity', label: 'Perplexity', hint: 'pplx-...' },
];

const normalizeModelId = (value: string): string => value.replace(/^models\//, '').trim().toLowerCase();

const inferCapabilitiesFromId = (modelId: string): ModelCapability[] => {
  const v = normalizeModelId(modelId);
  if (v.includes('veo') || v.includes('video')) return ['video'];
  if (v.includes('image') || v.includes('imagen') || v.includes('nano-banana')) return ['image'];
  if (v.includes('whisper') || v.includes('tts') || v.includes('stt') || v.includes('audio') || v.includes('voxtral')) return ['audio'];
  if (v.includes('sonar') || v.includes('search')) return ['search'];
  if (v.length > 0) return ['text'];
  return ['unknown'];
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
          label: String(item.label ?? item.id ?? ''),
          inputPer1M: Number(item.inputPer1M ?? 0),
          outputPer1M: Number(item.outputPer1M ?? 0),
          imageOutput: Number(item.imageOutput ?? 0),
          prix: typeof item.prix === 'string' ? item.prix : undefined,
          capabilities: categoryCapabilities[category] ?? inferCapabilitiesFromId(id),
        });
      }
    }
    return models;
  } catch {
    return [];
  }
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

const newCapsule = (index: number): CostCapsule => ({
  id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: `API ${index}`,
  provider: 'google',
  apiKey: '',
  models: [],
  reports: [],
  lastValidatedAt: '',
  usageWindowDays: 30,
  linkedUsage: EMPTY_LINKED_USAGE,
  providerUsage: emptyProviderUsage('google'),
});

const ApiCostManagerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();

  const tr = (t as any).apiCostManager || {};

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [catalogModels, setCatalogModels] = useState<CatalogModel[]>([]);

  const [capsules, setCapsules] = useState<CostCapsule[]>([]);
  const [activeCapsuleId, setActiveCapsuleId] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogModel>();
    for (const model of catalogModels) {
      map.set(model.id, model);
      map.set(normalizeModelId(model.id), model);
    }
    return map;
  }, [catalogModels]);

  const activeCapsule = useMemo(
    () => capsules.find((item) => item.id === activeCapsuleId) ?? capsules[0] ?? null,
    [capsules, activeCapsuleId]
  );

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/view-ApiKey/models.js');
        if (!response.ok) return;
        const text = await response.text();
        setCatalogModels(parseCatalogModels(text));
      } catch {
        // Optional catalog.
      }
    })();
  }, []);

  const loadLinkedUsageStats = async (): Promise<LinkedUsageStats> => {
    if (!isAuthenticated) return EMPTY_LINKED_USAGE;
    try {
      const linkedProduct = await getOrCreateProductByType('api_key_maker', {
        title: t.products.fixed.apiKeyTitle || 'Chatbot con gestor de LLM',
        description: t.products.fixed.apiKeyDesc || 'Valida formato y conectividad de API keys por proveedor en un flujo guiado.',
      });
      const linkedProgress = await getProductStepProgress(linkedProduct.id);
      const rawStats = linkedProgress.find((p) => p.stepId === STEP_USAGE_STATS)?.resultText as Record<string, unknown> | undefined;
      if (!rawStats) return EMPTY_LINKED_USAGE;
      return {
        totalRequests: Number(rawStats.totalRequests ?? 0),
        totalInputTokens: Number(rawStats.totalInputTokens ?? 0),
        totalOutputTokens: Number(rawStats.totalOutputTokens ?? 0),
        totalTokens: Number(rawStats.totalTokens ?? 0),
        totalEstimatedCost: Number(rawStats.totalEstimatedCost ?? 0),
        chatRequests: 0,
        imageRequests: 0,
        otherRequests: 0,
        source: 'legacy.chatbot_stats',
        lastRequestAt: null,
      };
    } catch {
      return EMPTY_LINKED_USAGE;
    }
  };

  const persistState = async (productId: number, nextCapsules: CostCapsule[], nextActiveCapsuleId: string) => {
    const persistedCapsules: PersistedCapsule[] = nextCapsules.map((capsule) => ({
      id: capsule.id,
      label: capsule.label,
      provider: capsule.provider,
      apiKeyEncoded: encodeSecret(capsule.apiKey),
      models: capsule.models,
      lastValidatedAt: capsule.lastValidatedAt,
      usageWindowDays: capsule.usageWindowDays,
      linkedUsage: capsule.linkedUsage,
      providerUsage: capsule.providerUsage,
    }));

    const reportsByCapsule: Record<string, CostReport[]> = {};
    nextCapsules.forEach((capsule) => {
      reportsByCapsule[capsule.id] = capsule.reports;
    });

    await Promise.all([
      updateProductStepProgress({
        productId,
        stepId: STEP_CONFIG,
        status: 'success',
        resultText: {
          activeCapsuleId: nextActiveCapsuleId,
          capsules: persistedCapsules,
          updatedAt: new Date().toISOString(),
        },
      }),
      updateProductStepProgress({
        productId,
        stepId: STEP_REPORTS,
        status: 'success',
        resultText: {
          activeCapsuleId: nextActiveCapsuleId,
          reportsByCapsule,
          updatedAt: new Date().toISOString(),
        },
      }),
    ]);
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);

        let targetId: number | null = id ? parseInt(id, 10) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('api_cost_manager' as any, {
            title: t.products.fixed.apiCostManagerTitle || 'Gestor de costos API',
            description: t.products.fixed.apiCostManagerDesc || 'Analiza costos, modelos y resumen de uso de una API key.',
          });
          targetId = ensured.id;
        }

        let loaded: Product;
        if (isAuthenticated) {
          try {
            loaded = await getProduct(targetId);
            setIsOwner(true);
          } catch {
            loaded = await getPublicProduct(targetId);
            setIsOwner(false);
          }
        } else {
          loaded = await getPublicProduct(targetId);
          setIsOwner(false);
        }

        setProduct(loaded);

        const progress = await getProductStepProgress(loaded.id);
        const config = progress.find((p) => p.stepId === STEP_CONFIG)?.resultText as Record<string, unknown> | undefined;
        const reportState = progress.find((p) => p.stepId === STEP_REPORTS)?.resultText as Record<string, unknown> | undefined;

        const usageSnapshot = await loadLinkedUsageStats();

        let nextCapsules: CostCapsule[] = [];
        let nextActiveCapsuleId = '';

        const reportsByCapsule = reportState && typeof reportState.reportsByCapsule === 'object'
          ? (reportState.reportsByCapsule as Record<string, CostReport[]>)
          : {};

        if (config && Array.isArray(config.capsules)) {
          nextCapsules = (config.capsules as PersistedCapsule[]).map((capsule, index) => ({
            id: capsule.id || `cap-legacy-${index}`,
            label: capsule.label || `API ${index + 1}`,
            provider: capsule.provider || 'google',
            apiKey: decodeSecret(capsule.apiKeyEncoded || ''),
            models: Array.isArray(capsule.models) ? capsule.models : [],
            reports: Array.isArray(reportsByCapsule[capsule.id]) ? reportsByCapsule[capsule.id] : [],
            lastValidatedAt: capsule.lastValidatedAt || '',
            usageWindowDays: Number(capsule.usageWindowDays ?? 30) || 30,
            linkedUsage: capsule.linkedUsage || usageSnapshot,
            providerUsage: capsule.providerUsage || emptyProviderUsage(capsule.provider || 'google'),
          }));
          nextActiveCapsuleId = String(config.activeCapsuleId || nextCapsules[0]?.id || '');
        } else {
          const legacyProvider = typeof config?.provider === 'string' ? (config.provider as ApiRuntimeProvider) : 'google';
          const legacyApiKey = typeof config?.apiKeyEncoded === 'string' ? decodeSecret(config.apiKeyEncoded) : '';
          const legacyModels = Array.isArray(config?.models) ? (config?.models as ProviderModelInfo[]) : [];
          const legacyReports = Array.isArray(reportState?.reports) ? (reportState?.reports as CostReport[]) : [];

          const fallback = newCapsule(1);
          fallback.provider = legacyProvider;
          fallback.apiKey = legacyApiKey;
          fallback.models = legacyModels;
          fallback.reports = legacyReports;
          fallback.lastValidatedAt = typeof config?.lastValidatedAt === 'string' ? config.lastValidatedAt : '';
          fallback.usageWindowDays = Number(config?.usageWindowDays ?? 30) || 30;
          fallback.linkedUsage = usageSnapshot;
          fallback.providerUsage = emptyProviderUsage(legacyProvider);

          nextCapsules = [fallback];
          nextActiveCapsuleId = fallback.id;
        }

        if (nextCapsules.length === 0) {
          const first = newCapsule(1);
          first.linkedUsage = usageSnapshot;
          nextCapsules = [first];
          nextActiveCapsuleId = first.id;
        }

        setCapsules(nextCapsules);
        setActiveCapsuleId(nextActiveCapsuleId || nextCapsules[0].id);
      } catch (err) {
        console.error('[ApiCostManagerView] load error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, isAuthenticated, t.products.fixed.apiCostManagerDesc, t.products.fixed.apiCostManagerTitle]);

  const classifyModel = (modelId: string): ModelCapability[] => {
    const fromCatalog = catalogMap.get(modelId) ?? catalogMap.get(normalizeModelId(modelId));
    return fromCatalog?.capabilities?.length ? fromCatalog.capabilities : inferCapabilitiesFromId(modelId);
  };

  const capabilityLabel = (capability: ModelCapability): string => {
    if (capability === 'text') return tr.capabilityText || 'Texto';
    if (capability === 'image') return tr.capabilityImage || 'Imagen';
    if (capability === 'audio') return tr.capabilityAudio || 'Audio';
    if (capability === 'video') return tr.capabilityVideo || 'Video';
    if (capability === 'search') return tr.capabilitySearch || 'Búsqueda';
    return tr.capabilityUnknown || 'Desconocido';
  };

  const modelPriceLabel = (modelId: string): string => {
    const catalog = catalogMap.get(modelId) ?? catalogMap.get(normalizeModelId(modelId));
    if (!catalog) return tr.priceUnknown || 'N/A';
    if (catalog.prix?.trim()) return catalog.prix.trim();

    const imagePrice = Number(catalog.imageOutput ?? 0);
    if (imagePrice > 0) return `$${imagePrice.toFixed(3)}/img`;

    const input = Number(catalog.inputPer1M ?? 0);
    const output = Number(catalog.outputPer1M ?? 0);
    if (input <= 0 && output <= 0) return tr.priceUnknown || 'N/A';

    return `$${input}/$${output} /1M`;
  };

  const normalizeProviderUsageMessage = (provider: ApiRuntimeProvider, rawMessage?: string): string => {
    const sourceMessage = String(rawMessage || '').trim();
    const normalized = sourceMessage.toLowerCase();

    if (provider === 'openai' && (normalized.includes('missing scopes') || normalized.includes('api.usage.read') || normalized.includes('insufficient permissions'))) {
      return tr.providerUsageOpenAiScopeRequired || 'Tu API key de OpenAI es valida, pero para ver el consumo historico necesitas una Admin API key con scope api.usage.read.';
    }

    if (provider === 'perplexity') {
      return tr.providerUsagePerplexityUnavailable || 'Perplexity no expone consumo historico por API key en este flujo. Puedes usar estimacion local con los datos del chatbot.';
    }

    if (normalized.includes('response body is empty')) {
      return tr.providerUsageEmptyBody || 'El proveedor no devolvio un cuerpo util para consumo historico. Intenta de nuevo o cambia el rango.';
    }

    return sourceMessage || tr.providerUsageError || 'No se pudo consultar el histórico del proveedor.';
  };

  const updateActiveCapsule = (updater: (capsule: CostCapsule) => CostCapsule) => {
    if (!activeCapsule) return;
    setCapsules((prev) => prev.map((item) => (item.id === activeCapsule.id ? updater(item) : item)));
  };

  const handleAddCapsule = async () => {
    if (!product || !isOwner) return;
    const created = newCapsule(capsules.length + 1);
    const usageSnapshot = await loadLinkedUsageStats();
    created.linkedUsage = usageSnapshot;

    const nextCapsules = [...capsules, created];
    setCapsules(nextCapsules);
    setActiveCapsuleId(created.id);
    await persistState(product.id, nextCapsules, created.id);
  };

  const handleDeleteCapsule = async (capsuleId: string) => {
    if (!product || !isOwner) return;
    if (capsules.length <= 1) return;

    const nextCapsules = capsules.filter((item) => item.id !== capsuleId);
    const nextActiveId = activeCapsuleId === capsuleId ? nextCapsules[0].id : activeCapsuleId;

    setCapsules(nextCapsules);
    setActiveCapsuleId(nextActiveId);
    await persistState(product.id, nextCapsules, nextActiveId);
  };

  const handleGenerateReport = async () => {
    if (!product || !activeCapsule) return;
    if (!activeCapsule.apiKey.trim()) {
      setErrorText(tr.missingKey || 'Debes ingresar una API key.');
      return;
    }

    setIsGenerating(true);
    setStatusText('');
    setErrorText('');

    try {
      const validated = await validateProviderKey({ provider: activeCapsule.provider, apiKey: activeCapsule.apiKey.trim() });
      const validatedModels = Array.isArray(validated.models) ? validated.models : [];

      let providerUsage = emptyProviderUsage(activeCapsule.provider);
      let usageSnapshot = await loadLinkedUsageStats();
      try {
        const usageResponse = await providerUsageSummary({
          provider: activeCapsule.provider,
          apiKey: activeCapsule.apiKey.trim(),
          days: activeCapsule.usageWindowDays,
        });
        providerUsage = {
          supported: Boolean(usageResponse.supported),
          provider: activeCapsule.provider,
          totalRequests: Number(usageResponse.totalRequests ?? 0),
          totalInputTokens: Number(usageResponse.totalInputTokens ?? 0),
          totalOutputTokens: Number(usageResponse.totalOutputTokens ?? 0),
          totalTokens: Number(usageResponse.totalTokens ?? 0),
          totalCostUsd: Number(usageResponse.totalCostUsd ?? 0),
          currency: usageResponse.currency || 'USD',
          source: usageResponse.source,
          reasonCode: usageResponse.reasonCode,
          requiresScope: usageResponse.requiresScope,
          message: normalizeProviderUsageMessage(activeCapsule.provider, usageResponse.message),
          range: usageResponse.range,
          fetchedAt: new Date().toISOString(),
        };

        if (usageResponse.localTracked) {
          usageSnapshot = {
            totalRequests: Number(usageResponse.localTracked.totalRequests ?? 0),
            totalInputTokens: Number(usageResponse.localTracked.totalInputTokens ?? 0),
            totalOutputTokens: Number(usageResponse.localTracked.totalOutputTokens ?? 0),
            totalTokens: Number(usageResponse.localTracked.totalTokens ?? 0),
            totalEstimatedCost: Number(usageResponse.localTracked.estimatedCostUsd ?? 0),
            chatRequests: Number(usageResponse.localTracked.chatRequests ?? 0),
            imageRequests: Number(usageResponse.localTracked.imageRequests ?? 0),
            otherRequests: Number(usageResponse.localTracked.otherRequests ?? 0),
            source: usageResponse.localTracked.source || 'app.api_key_usage',
            lastRequestAt: usageResponse.localTracked.lastRequestAt ?? null,
          };
        }
      } catch (usageErr: any) {
        providerUsage = emptyProviderUsage(
          activeCapsule.provider,
          normalizeProviderUsageMessage(activeCapsule.provider, usageErr?.message)
        );
      }

      let textModels = 0;
      let imageModels = 0;
      let otherModels = 0;
      let pricedModels = 0;

      for (const model of validatedModels) {
        const capabilities = classifyModel(model.id);
        if (capabilities.includes('text') || capabilities.includes('search')) textModels += 1;
        else if (capabilities.includes('image')) imageModels += 1;
        else otherModels += 1;

        const catalog = catalogMap.get(model.id) ?? catalogMap.get(normalizeModelId(model.id));
        if (catalog && (Number(catalog.inputPer1M ?? 0) > 0 || Number(catalog.outputPer1M ?? 0) > 0 || Number(catalog.imageOutput ?? 0) > 0 || !!catalog.prix)) {
          pricedModels += 1;
        }
      }

      const report: CostReport = {
        id: `rep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        provider: activeCapsule.provider,
        totalModels: validatedModels.length,
        textModels,
        imageModels,
        otherModels,
        pricedModels,
        usageTotalTokens: usageSnapshot.totalTokens,
        usageEstimatedCost: usageSnapshot.totalEstimatedCost,
        providerUsageSupported: providerUsage.supported,
        providerTotalTokens: providerUsage.totalTokens,
        providerTotalCostUsd: providerUsage.totalCostUsd,
      };

      const nextCapsules = capsules.map((item) => {
        if (item.id !== activeCapsule.id) return item;
        return {
          ...item,
          models: validatedModels,
          reports: [report, ...item.reports].slice(0, 50),
          lastValidatedAt: new Date().toISOString(),
          linkedUsage: usageSnapshot,
          providerUsage,
        };
      });

      setCapsules(nextCapsules);
      await persistState(product.id, nextCapsules, activeCapsule.id);

      setStatusText(tr.reportReady || 'Resumen generado correctamente.');
    } catch (err: any) {
      setErrorText(err?.message || tr.reportError || 'No se pudo generar el resumen.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-teal-600" size={34} />
      </div>
    );
  }

  if (!product || !activeCapsule) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{tr.notFound || 'Producto no encontrado o no es público.'}</p>
          <button
            onClick={() => navigate('/dashboard/context')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {tr.back || 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  const latestReport = activeCapsule.reports[0];
  const providerUsage = activeCapsule.providerUsage;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/dashboard/context')}
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-teal-600" />
                {t.products.fixed.apiCostManagerTitle || 'Gestor de costos API'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t.products.fixed.apiCostManagerDesc || 'Analiza costos, modelos y resumen de uso de una API key.'}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {product.isPublic ? (tr.publicLabel || 'Público') : (tr.privateLabel || 'Privado')}
          </div>
        </div>

        <section className="rounded-2xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/60 dark:bg-teal-950/30 p-4">
          <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">{tr.flowTitle || 'Flujo recomendado'}</p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-teal-700 dark:text-teal-300">01</span> {tr.flowStep1 || 'Configura proveedor y API key en la cápsula activa.'}
            </div>
            <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-teal-700 dark:text-teal-300">02</span> {tr.flowStep2 || 'Genera análisis para validar modelos y refrescar consumo.'}
            </div>
            <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-teal-700 dark:text-teal-300">03</span> {tr.flowStep3 || 'Compara consumo real del proveedor vs estimación local.'}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{tr.capsulesTitle || 'Cápsulas API monitoreadas'}</h2>
            {isOwner && (
              <button
                onClick={handleAddCapsule}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
              >
                <Plus size={14} />
                {tr.addCapsule || 'Agregar cápsula'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {capsules.map((capsule, index) => {
              const isActive = capsule.id === activeCapsule.id;
              return (
                <button
                  key={capsule.id}
                  onClick={() => setActiveCapsuleId(capsule.id)}
                  className={`text-left border rounded-xl p-3 transition-colors ${isActive ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 hover:border-teal-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{capsule.label || `${tr.capsuleLabel || 'Cápsula'} ${index + 1}`}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{capsule.provider.toUpperCase()} · {capsule.models.length} {tr.modelsSuffix || 'modelos'}</p>
                    </div>
                    {isOwner && capsules.length > 1 && (
                      <span
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteCapsule(capsule.id);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                        title={tr.removeCapsule || 'Eliminar cápsula'}
                      >
                        <Trash2 size={14} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{tr.configTitle || 'Configuración de API key'}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{tr.configSubtitle || 'Cada cápsula puede monitorear un proveedor y una API key distinta.'}</p>
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr_130px] gap-3">
            <input
              value={activeCapsule.label}
              onChange={(event) => updateActiveCapsule((item) => ({ ...item, label: event.target.value }))}
              disabled={!isOwner}
              placeholder={tr.capsuleNamePlaceholder || 'Nombre de cápsula'}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={activeCapsule.provider}
              onChange={(event) => updateActiveCapsule((item) => {
                const nextProvider = event.target.value as ApiRuntimeProvider;
                return {
                  ...item,
                  provider: nextProvider,
                  models: [],
                  providerUsage: emptyProviderUsage(nextProvider),
                };
              })}
              disabled={!isOwner}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              {PROVIDERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <input
              value={activeCapsule.apiKey}
              onChange={(event) => updateActiveCapsule((item) => ({ ...item, apiKey: event.target.value }))}
              placeholder={PROVIDERS.find((item) => item.value === activeCapsule.provider)?.hint || 'API key'}
              disabled={!isOwner}
              type="password"
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <select
              value={activeCapsule.usageWindowDays}
              onChange={(event) => updateActiveCapsule((item) => ({ ...item, usageWindowDays: Number(event.target.value) || 30 }))}
              disabled={!isOwner}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value={7}>{tr.days7 || '7 días'}</option>
              <option value={30}>{tr.days30 || '30 días'}</option>
              <option value={90}>{tr.days90 || '90 días'}</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={!isOwner || isGenerating || !activeCapsule.apiKey.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              {tr.generateReport || 'Generar resumen'}
            </button>
          </div>

          {(statusText || errorText) && (
            <div className={`rounded-lg px-3 py-2 text-sm ${errorText ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {errorText || statusText}
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: tr.modelsTotal || 'Modelos totales', value: activeCapsule.models.length },
            { label: tr.modelsText || 'Texto/Búsqueda', value: latestReport?.textModels ?? 0 },
            { label: tr.modelsImage || 'Imagen', value: latestReport?.imageModels ?? 0 },
            { label: tr.modelsOther || 'Otros', value: latestReport?.otherModels ?? 0 },
            { label: tr.modelsPriced || 'Con tarifa conocida', value: latestReport?.pricedModels ?? 0 },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {(tr.providerUsageTitle || 'Consumo real del proveedor')} ({activeCapsule.usageWindowDays}d)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {providerUsage.supported
              ? (tr.providerUsageSubtitle || 'Datos obtenidos directamente del proveedor con tu API key.')
              : (providerUsage.message || tr.providerUsageUnavailable || 'Este proveedor no expone consumo histórico por API key en este flujo.')}
          </p>

          <div className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
            {tr.providerUsageSource || 'Fuente de datos'}: {providerUsage.supported ? (providerUsage.source || 'provider.api') : (providerUsage.source || 'provider.unsupported')}
          </div>

          {providerUsage.supported ? (
            <>
              {providerUsage.range && (
                <p className="text-xs text-teal-700 dark:text-teal-300 mb-3 font-medium">
                  {tr.providerUsageRange || 'Rango'}: {new Date(providerUsage.range.from).toLocaleDateString()} - {new Date(providerUsage.range.to).toLocaleDateString()} ({providerUsage.range.days}d)
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: tr.providerRequests || 'Requests proveedor', value: providerUsage.totalRequests },
                  { label: tr.providerInputTokens || 'Tokens entrada proveedor', value: providerUsage.totalInputTokens },
                  { label: tr.providerOutputTokens || 'Tokens salida proveedor', value: providerUsage.totalOutputTokens },
                  { label: tr.providerTotalTokens || 'Tokens totales proveedor', value: providerUsage.totalTokens },
                  { label: tr.providerTotalCost || 'Costo real proveedor', value: `$${providerUsage.totalCostUsd.toFixed(6)}` },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 break-all">{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {providerUsage.message || tr.providerUsageUnavailable || 'Sin datos reales del proveedor para esta clave.'}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{tr.usageTitle || 'Uso registrado global (app)'}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {tr.usageSubtitle || 'Estos valores se calculan con el tracking interno por API key en todo el proyecto.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: tr.usageRequests || 'Requests', value: activeCapsule.linkedUsage.totalRequests },
              { label: tr.usageInputTokens || 'Tokens entrada', value: activeCapsule.linkedUsage.totalInputTokens },
              { label: tr.usageOutputTokens || 'Tokens salida', value: activeCapsule.linkedUsage.totalOutputTokens },
              { label: tr.usageTotalTokens || 'Tokens totales', value: activeCapsule.linkedUsage.totalTokens },
              { label: tr.usageEstimatedCost || 'Costo estimado', value: `$${activeCapsule.linkedUsage.totalEstimatedCost.toFixed(6)}` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 break-all">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <p>
              {tr.usageBreakdown || 'Desglose'}: {tr.usageChatRequests || 'chat'} {activeCapsule.linkedUsage.chatRequests} · {tr.usageImageRequests || 'imagen'} {activeCapsule.linkedUsage.imageRequests} · {tr.usageOtherRequests || 'otros'} {activeCapsule.linkedUsage.otherRequests}
            </p>
            <p>
              {tr.usageSource || 'Fuente'}: {activeCapsule.linkedUsage.source || 'app.api_key_usage'}
              {activeCapsule.linkedUsage.lastRequestAt ? ` · ${tr.usageLastRequest || 'Última petición'}: ${new Date(activeCapsule.linkedUsage.lastRequestAt).toLocaleString()}` : ''}
            </p>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{tr.modelsListTitle || 'Modelos disponibles detectados'}</h2>
          {activeCapsule.models.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{tr.modelsListEmpty || 'Valida la API key para listar los modelos.'}</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeCapsule.models.map((model) => {
                const caps = classifyModel(model.id);
                return (
                  <div key={model.id} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white break-all">{model.label || model.id}</p>
                      <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold">{modelPriceLabel(model.id)}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all mt-0.5">{model.id}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {caps.map((cap) => (
                        <span key={`${model.id}-${cap}`} className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px]">
                          {capabilityLabel(cap)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{tr.historyTitle || 'Historial de análisis'}</h2>
          {activeCapsule.reports.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{tr.historyEmpty || 'Aún no hay reportes generados.'}</p>
          ) : (
            <div className="space-y-2">
              {activeCapsule.reports.map((report) => (
                <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{report.provider.toUpperCase()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {tr.historyLine || 'Total modelos'}: {report.totalModels} · {tr.modelsText || 'Texto/Búsqueda'}: {report.textModels} · {tr.modelsImage || 'Imagen'}: {report.imageModels} · {tr.modelsOther || 'Otros'}: {report.otherModels}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {tr.providerHistoryLine || 'Proveedor'}: {report.providerUsageSupported ? `${report.providerTotalTokens} tokens · $${report.providerTotalCostUsd.toFixed(6)}` : (tr.providerHistoryUnavailable || 'sin datos históricos')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ApiCostManagerView;
