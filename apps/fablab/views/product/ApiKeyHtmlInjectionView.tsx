import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Globe, KeyRound, Link as LinkIcon, Lock, Sparkles, Upload } from 'lucide-react';
import { createObject } from '@core/objects';
import { getOrCreateProductByType, getProduct, getPublicProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { tokenStorage } from '@core/api/http.client';
import { useLanguage } from '../../language/useLanguage';

type Provider = 'anthropic' | 'openai' | 'gemini';

type StoredState = {
  provider?: Provider;
  model?: string;
  apiKey?: string;
  deployedUrl?: string;
  deployedObjectName?: string;
  deployedObjectId?: string | number;
  updatedAt?: string;
};

const STEP_STATE = 1;

const MODEL_OPTIONS: Record<Provider, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-latest'],
  openai: ['gpt-4.1-mini', 'gpt-4o-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4.1-mini',
  gemini: 'gemini-2.0-flash',
};

const injectRuntimeBridge = (html: string, productId: number, provider: Provider): string => {
  const clean = html.replace(/<script[^>]*data-api-key-html-runtime=["']1["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

  const script = `<script data-api-key-html-runtime="1">\n(function () {\n  var FIXED_PROVIDER = ${JSON.stringify(provider)};\n  var PRODUCT_ID = ${JSON.stringify(productId)};\n  var PROXY_PATH = '/api/ai';\n\n  function isAiProxyUrl(url) {\n    var value = String(url || '');\n    return value === '/api/ai' || value.endsWith('/api/ai') || value.indexOf('/api/ai?') !== -1;\n  }\n\n  function parseBody(init) {\n    if (!init || !init.body) return {};\n    try {\n      return typeof init.body === 'string' ? JSON.parse(init.body) : init.body;\n    } catch (e) {\n      return {};\n    }\n  }\n\n  function applyDefaults(body) {\n    var payload = body && typeof body === 'object' ? body : {};\n    payload.provider = FIXED_PROVIDER;\n    payload.product_id = PRODUCT_ID;\n    if (!payload.max_tokens) payload.max_tokens = 1000;\n    if (!Array.isArray(payload.messages)) payload.messages = [];\n    return payload;\n  }\n\n  async function askAI(system, userMessage, options) {\n    options = options || {};\n    var res = await fetch(PROXY_PATH, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        provider: FIXED_PROVIDER,\n        product_id: PRODUCT_ID,\n        system: system || '',\n        messages: [{ role: 'user', content: userMessage || '' }],\n        max_tokens: options.maxTokens || 1000,\n      }),\n    });\n\n    var data = await res.json();\n    if (!data.ok) throw new Error(data.error || 'Error en el proxy');\n    return data.text;\n  }\n\n  var originalFetch = window.fetch.bind(window);\n  window.askAI = askAI;\n\n  window.fetch = async function (input, init) {\n    var url = typeof input === 'string' ? input : (input && input.url) || '';\n    if (!isAiProxyUrl(url)) {\n      return originalFetch(input, init);\n    }\n\n    var body = applyDefaults(parseBody(init));\n    var nextInit = Object.assign({}, init || {}, {\n      method: 'POST',\n      headers: Object.assign({ 'Content-Type': 'application/json' }, (init && init.headers) || {}),\n      body: JSON.stringify(body),\n    });\n\n    return originalFetch(input, nextInit);\n  };\n})();\n</script>`;

  if (clean.includes('</head>')) return clean.replace('</head>', `${script}\n</head>`);
  if (clean.includes('</body>')) return clean.replace('</body>', `${script}\n</body>`);
  return `${clean}\n${script}`;
};

const toAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const apiBase = String((import.meta as any)?.env?.VITE_API_URL || '').replace(/\/+$/, '');
  if (url.startsWith('/')) return apiBase ? `${apiBase}${url}` : `${window.location.origin}${url}`;
  if (apiBase) return `${apiBase}/${url.replace(/^\/+/, '')}`;
  return `${window.location.origin}/${url.replace(/^\/+/, '')}`;
};

const buildPromptTemplate = () => {
  const lines = [
    'Necesito que conviertas mi idea en un archivo HTML funcional que consuma IA usando nuestro backend proxy.',
    '',
    'Requisitos obligatorios:',
    '1. Usa exactamente esta funcion en el HTML (o en un script JS importado) para consumir IA:',
    '',
    "export async function askAI(system, userMessage, options = {}) {",
    "  const res = await fetch('/api/ai', {",
    "    method: 'POST',",
    "    headers: { 'Content-Type': 'application/json' },",
    '    body: JSON.stringify({',
    "      provider: options.provider || 'anthropic',",
    '      system,',
    "      messages: [{ role: 'user', content: userMessage }],",
    '      max_tokens: options.maxTokens || 1000,',
    '    }),',
    '  });',
    '',
    '  const data = await res.json();',
    "  if (!data.ok) throw new Error(data.error || 'Error en el proxy');",
    '  return data.text;',
    '}',
    '',
    '2. NO llames directamente APIs externas (OpenAI/Anthropic/Gemini). Todo debe pasar por /api/ai.',
    '3. Mantiene el HTML autocontenido y funcional en navegador moderno.',
    '4. Implementa manejo de errores visible para usuario (mensaje simple en UI).',
    '5. Solo agrega logica para el objetivo que te voy a dar; evita codigo innecesario.',
    '',
    'Objetivo funcional de la pagina:',
    '{{AQUI_EL_USUARIO_ESCRIBE_SU_OBJETIVO}}',
  ];

  return lines.join('\n');
};

const ApiKeyHtmlInjectionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = (t.apiKeyHtmlInjectionViewTranslations ?? {}) as Record<string, string>;

  const isAuthenticated = !!tokenStorage.get();
  const [product, setProduct] = useState<Product | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState<string>(DEFAULT_MODEL.anthropic);
  const [apiKey, setApiKey] = useState('');

  const [configStatus, setConfigStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validateStatus, setValidateStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [promptCopied, setPromptCopied] = useState(false);

  const [fileName, setFileName] = useState('');
  const [injectedHtml, setInjectedHtml] = useState('');
  const [saveObjectStatus, setSaveObjectStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedObjectUrl, setSavedObjectUrl] = useState('');
  const [savedObjectMessage, setSavedObjectMessage] = useState('');

  const promptTemplate = useMemo(() => buildPromptTemplate(), []);
  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

  const persistState = async (patch: Partial<StoredState>) => {
    if (!product?.id) return;

    const base: StoredState = {
      provider,
      model,
      apiKey,
      deployedUrl: savedObjectUrl,
      deployedObjectName: fileName || undefined,
    };

    const nextState: StoredState = {
      ...base,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await updateProductStepProgress({
      productId: product.id,
      stepId: STEP_STATE,
      status: 'success',
      resultText: nextState,
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        let targetId: number | null = id ? parseInt(id, 10) : null;
        if (!targetId) {
          const ensured = await getOrCreateProductByType('api_key_html_injector', {
            title: t.products.fixed.apiKeyHtmlTitle || 'Inyeccion de API key a HTML',
            description: t.products.fixed.apiKeyHtmlDesc || 'Configura API key por producto y despliega HTML conectado al proxy.',
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
        const state = progress.find((p) => p.stepId === STEP_STATE)?.resultText as StoredState | undefined;
        if (state) {
          if (state.provider && MODEL_OPTIONS[state.provider]) {
            setProvider(state.provider);
            const nextModel = state.model && MODEL_OPTIONS[state.provider].includes(state.model)
              ? state.model
              : DEFAULT_MODEL[state.provider];
            setModel(nextModel);
          }

          if (state.apiKey) setApiKey(state.apiKey);
          if (state.deployedUrl) {
            setSavedObjectUrl(state.deployedUrl);
            setSavedObjectMessage(tr.deployedSuccess || 'HTML desplegado y conectado correctamente a tu API key.');
            setSaveObjectStatus('saved');
          }
          if (state.deployedObjectName) setFileName(state.deployedObjectName);
        }
      } catch (error) {
        console.error('[ApiKeyHtmlInjectionView] Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated]);

  const handleProviderChange = (next: Provider) => {
    setProvider(next);
    setModel(DEFAULT_MODEL[next]);
    setConfigStatus('idle');
    setValidateStatus('idle');
    setStatusMessage('');
  };

  const handleSaveApiConfig = async () => {
    if (!product?.id) return;

    if (!apiKey.trim()) {
      setConfigStatus('error');
      setStatusMessage(tr.apiKeyRequired || 'Debes ingresar una API key.');
      return;
    }

    try {
      setConfigStatus('saving');
      setStatusMessage('');
      await persistState({ provider, model, apiKey: apiKey.trim() });
      setConfigStatus('saved');
      setStatusMessage(tr.savedConfig || 'Configuracion guardada en product_step_progress.');
    } catch (error) {
      setConfigStatus('error');
      setStatusMessage(error instanceof Error ? error.message : (tr.errorSaving || 'No se pudo guardar la configuracion.'));
    }
  };

  const handleValidateApiConfig = async () => {
    if (!product?.id) return;

    try {
      setValidateStatus('validating');
      await handleSaveApiConfig();

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          product_id: product.id,
          system: 'Responde exactamente OK',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 20,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || tr.invalidConfig || 'Validacion fallida.');
      }

      setValidateStatus('valid');
      setStatusMessage(tr.validConfig || 'API key validada correctamente.');
    } catch (error) {
      setValidateStatus('invalid');
      setStatusMessage(error instanceof Error ? error.message : (tr.invalidConfig || 'Configuracion invalida.'));
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptTemplate);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 1800);
    } catch (error) {
      console.error('[ApiKeyHtmlInjectionView] Copy prompt failed:', error);
    }
  };

  const handleHtmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!product?.id) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const rawHtml = await file.text();
    const transformed = injectRuntimeBridge(rawHtml, product.id, provider);

    setFileName(file.name);
    setInjectedHtml(transformed);
    setSaveObjectStatus('idle');
    setSavedObjectUrl('');
    setSavedObjectMessage('');
  };

  const handleDownloadHtml = () => {
    if (!injectedHtml) return;

    const blob = new Blob([injectedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = fileName ? fileName.replace(/\.html?$/i, '') : 'index';
    a.href = url;
    a.download = `${baseName}.proxy.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveObject = async () => {
    if (!injectedHtml || !product?.id) return;

    try {
      setSaveObjectStatus('saving');
      setSavedObjectMessage('');

      const baseName = fileName ? fileName.replace(/\.html?$/i, '') : 'index';
      const outputName = `${baseName}.proxy.html`;
      const htmlFile = new File([injectedHtml], outputName, { type: 'text/html' });

      const created = await createObject({
        title: outputName,
        type: 'HTML',
        file: htmlFile,
        product_type_for_assembly: 'api_key_html_injector',
        module_name_for_assembly: 'runtime_proxy_html',
      });

      const objectUrl = toAbsoluteUrl(String(created.url || created.relative_path || ''));
      setSavedObjectUrl(objectUrl);
      setSaveObjectStatus('saved');
      setSavedObjectMessage(tr.deployedSuccess || 'HTML desplegado y conectado correctamente a tu API key.');

      await persistState({
        deployedUrl: objectUrl,
        deployedObjectName: outputName,
        deployedObjectId: created.id,
      });
    } catch (error) {
      setSaveObjectStatus('error');
      setSavedObjectMessage(error instanceof Error ? error.message : (tr.errorSavingObject || 'No se pudo guardar el HTML.'));
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">{t.common.loading || 'Cargando...'}</div>;
  }

  if (!product) {
    return (
      <div className="p-6">
        <p className="text-red-600">{tr.notFound || 'Producto no encontrado o no es publico.'}</p>
      </div>
    );
  }

  const readOnly = !isOwner;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/products')}
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                title={tr.backToProducts || 'Volver a productos'}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-700/60 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
                  <Sparkles size={12} />
                  {t.products.fixed.productLabel || 'Producto fijo'}
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {tr.title || t.products.fixed.apiKeyHtmlTitle || 'Inyeccion de API key a HTML'}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {tr.subtitle || t.products.fixed.apiKeyHtmlDesc || 'Configura API key por producto, genera prompt guia y despliega HTML conectado al proxy.'}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {product.isPublic ? <Globe size={14} /> : <Lock size={14} />}
              {product.isPublic ? (tr.publicLabel || 'Publico') : (tr.privateLabel || 'Privado')}
            </div>
          </div>

          {readOnly && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {tr.publicReadOnlyNotice || 'Modo publico: solo lectura. La configuracion y el despliegue requieren sesion del propietario.'}
            </p>
          )}
        </div>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            1) {tr.sectionApiTitle || 'Configurar API key en product_step_progress'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tr.sectionApiDesc || 'Este producto guarda solo el ultimo estado en un unico registro de product_step_progress.'}
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{tr.providerLabel || 'Proveedor'}</label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
                disabled={readOnly}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{tr.modelLabel || 'Modelo'}</label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={readOnly}
              >
                {modelOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{tr.apiKeyLabel || 'API key'}</label>
              <input
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={tr.apiKeyPlaceholder || 'Pega tu API key'}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveApiConfig}
              disabled={readOnly || configStatus === 'saving'}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <KeyRound size={14} />
              {configStatus === 'saving' ? (tr.saving || 'Guardando...') : (tr.saveConfig || 'Guardar configuracion')}
            </button>

            <button
              onClick={handleValidateApiConfig}
              disabled={readOnly || validateStatus === 'validating'}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-60"
            >
              {validateStatus === 'validating' ? (tr.validating || 'Validando...') : (tr.validateConfig || 'Validar configuracion')}
            </button>

            {statusMessage && (
              <span className={`text-sm ${validateStatus === 'invalid' || configStatus === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {statusMessage}
              </span>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            2) {tr.sectionPromptTitle || 'Pega este prompt en tu idea (VibeCoding)'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tr.sectionPromptDesc || 'Solo agrega tu objetivo funcional al final. El prompt obliga a usar /api/ai con la funcion estandar askAI.'}
          </p>

          <textarea
            className="h-72 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-3 text-xs leading-5 text-slate-800 dark:text-slate-100"
            readOnly
            value={promptTemplate}
          />

          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            {promptCopied ? <Check size={14} /> : <Copy size={14} />}
            {promptCopied ? (tr.promptCopied || 'Prompt copiado') : (tr.copyPrompt || 'Copiar prompt')}
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3) {tr.sectionUploadTitle || 'Cargar HTML y desplegar'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tr.sectionUploadDesc || 'Sube el HTML generado, lo guardamos como objeto y te damos la URL desplegada lista para abrir.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".html,text/html"
              onChange={handleHtmlUpload}
              disabled={readOnly}
              className="text-sm"
            />

            <button
              onClick={handleDownloadHtml}
              disabled={!injectedHtml}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-60"
            >
              {tr.downloadInjected || 'Descargar HTML inyectado'}
            </button>

            <button
              onClick={handleSaveObject}
              disabled={readOnly || !injectedHtml || saveObjectStatus === 'saving'}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Upload size={14} />
              {saveObjectStatus === 'saving' ? (tr.savingObject || 'Guardando...') : (tr.saveObject || 'Guardar en objetos')}
            </button>
          </div>

          {fileName && (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {tr.uploadedFile || 'Archivo cargado'}: <strong>{fileName}</strong>
            </p>
          )}

          {savedObjectMessage && (
            <p className={`text-sm ${saveObjectStatus === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
              {savedObjectMessage}
            </p>
          )}

          {savedObjectUrl && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-800">
                {tr.deployedBanner || 'HTML desplegado y correctamente conectado a tu API key.'}
              </p>
              <button
                onClick={() => window.open(savedObjectUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                <LinkIcon size={14} />
                {tr.openDeployed || 'Abrir URL del HTML'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ApiKeyHtmlInjectionView;
