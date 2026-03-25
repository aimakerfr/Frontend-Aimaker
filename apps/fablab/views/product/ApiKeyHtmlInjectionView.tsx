import React, { useMemo, useState } from 'react';
import { createObject } from '@core/objects';

type Provider = 'anthropic' | 'openai' | 'gemini';

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

const stripInjectedRuntimeScripts = (html: string): string => {
  let cleaned = html;

  cleaned = cleaned.replace(/<script[^>]*data-ai-proxy-runtime=["']1["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

  cleaned = cleaned.replace(
    /<script[^>]*>[\s\S]*?window\.askAI\s*=\s*askAI;[\s\S]*?api\.openai\.com\/v1\/chat\/completions[\s\S]*?<\/script>\s*/gi,
    ''
  );

  return cleaned;
};

const injectScript = (html: string, script: string): string => {
  const base = stripInjectedRuntimeScripts(html);
  const payload = `<script data-ai-proxy-runtime="1">\n${script}\n</script>`;

  if (base.includes('</head>')) {
    return base.replace('</head>', `${payload}\n</head>`);
  }

  if (base.includes('</body>')) {
    return base.replace('</body>', `${payload}\n</body>`);
  }

  return `${base}\n${payload}`;
};

const applyAutomaticFixes = (html: string): string => {
  let transformed = html;

  transformed = transformed.replace(/\/\/\s*TODO:\s*conectar\s+con\s+el\s+servicio\s+de\s+IA.*$/gim, '');

  transformed = transformed.replace(
    /const\s+respuesta\s*=\s*['"`]\s*['"`]\s*;?/g,
    "const respuesta = await window.askAI('Eres un asistente útil y responde en español.', (typeof tema !== 'undefined' && tema ? String(tema) : 'Hola'), { maxTokens: 500 });"
  );

  transformed = transformed.replace(
    /const\s+respuesta\s*=\s*''\s*;\s*\/\/\s*reemplazar\s+con\s+la\s+respuesta\s+real\s+del\s+servicio/gim,
    "const respuesta = await window.askAI('Eres un asistente útil y responde en español.', (typeof tema !== 'undefined' && tema ? String(tema) : 'Hola'), { maxTokens: 500 });"
  );

  transformed = transformed.replace(
    /const\s+respuesta\s*=\s*await\s*window\.askAI\('Eres\s+un\s+asistente\s+útil\s+y\s+responde\s+en\s+español\.'\s*,\s*\(typeof\s+tema\s*!==\s*'undefined'\s*&&\s*tema\s*\?\s*String\(tema\)\s*:\s*'Hola'\)\s*,\s*\{\s*maxTokens:\s*500\s*\}\s*\)\s*;?/gim,
    "const system = `Eres ${famoso}. Habla en primera persona, mantén su estilo y responde en español.`;\n        const mensaje = tema ? `Habla sobre: ${tema}` : 'Preséntate y cuéntame algo importante de tu vida o trabajo.';\n        const respuesta = await window.askAI(system, mensaje, { maxTokens: 500 });"
  );

  return transformed;
};

const buildRuntimeScript = (provider: Provider, apiEndpoint: string) => {
  return `(function () {
  var DEFAULT_PROVIDER = ${JSON.stringify(provider)};
  var FIXED_PROVIDER = true;
  var API_ENDPOINT = ${JSON.stringify(apiEndpoint)};

  function resolveApiEndpoint() {
    if (API_ENDPOINT && /^https?:\/\//i.test(API_ENDPOINT)) return API_ENDPOINT;
    if (window.location && /^https?:$/i.test(window.location.protocol || '')) {
      return window.location.origin.replace(/\/$/, '') + '/api/ai';
    }
    return 'http://127.0.0.1:8000/api/ai';
  }

  async function askAI(system, userMessage, options) {
    options = options || {};
    var res = await fetch(resolveApiEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: DEFAULT_PROVIDER,
        system: system || '',
        messages: [{ role: 'user', content: userMessage || '' }],
        max_tokens: options.maxTokens || 1000,
      }),
    });

    var data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error en proxy IA');
    return data.text;
  }

  async function callProxy(provider, system, messages, maxTokens) {
    var res = await fetch(resolveApiEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: FIXED_PROVIDER ? DEFAULT_PROVIDER : provider,
        system: system || '',
        messages: Array.isArray(messages) ? messages : [],
        max_tokens: maxTokens || 1000,
      }),
    });

    var data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error en proxy IA');
    return data.text;
  }

  function jsonHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  function toResponse(obj) {
    return new Response(JSON.stringify(obj), {
      status: 200,
      headers: jsonHeaders(),
    });
  }

  function getBody(init) {
    if (!init || !init.body) return {};
    try {
      return typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    } catch (e) {
      return {};
    }
  }

  function normalizeMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages
      .filter(function (m) { return m && typeof m.content === 'string'; })
      .map(function (m) {
        var role = m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user';
        return { role: role, content: m.content };
      });
  }

  var originalFetch = window.fetch.bind(window);

  window.askAI = askAI;

  window.fetch = async function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var lower = String(url || '').toLowerCase();
    var body = getBody(init);

    try {
      if (lower.indexOf('api.openai.com/v1/chat/completions') !== -1) {
        var list = normalizeMessages(body.messages || []);
        var sys = '';
        var msgs = [];
        for (var i = 0; i < list.length; i++) {
          if (list[i].role === 'system' && !sys) {
            sys = list[i].content;
          } else {
            msgs.push(list[i]);
          }
        }
        var text = await callProxy(DEFAULT_PROVIDER, sys, msgs, body.max_tokens || 1000);
        return toResponse({ choices: [{ message: { content: text } }] });
      }

      if (lower.indexOf('api.anthropic.com/v1/messages') !== -1) {
        var anthropicMsgs = normalizeMessages(body.messages || []);
        var anthropicText = await callProxy(DEFAULT_PROVIDER, body.system || '', anthropicMsgs, body.max_tokens || 1000);
        return toResponse({ content: [{ text: anthropicText }] });
      }

      if (lower.indexOf('generativelanguage.googleapis.com') !== -1 && lower.indexOf('generatecontent') !== -1) {
        var sysInstruction = (((body.systemInstruction || {}).parts || [])[0] || {}).text || '';
        var last = '';
        var contents = Array.isArray(body.contents) ? body.contents : [];
        if (contents.length > 0) {
          var parts = contents[contents.length - 1].parts || [];
          last = (parts[0] && parts[0].text) || '';
        }
        var geminiText = await callProxy(DEFAULT_PROVIDER, sysInstruction, [{ role: 'user', content: last }], (body.generationConfig || {}).maxOutputTokens || 1000);
        return toResponse({ candidates: [{ content: { parts: [{ text: geminiText }] } }] });
      }
    } catch (e) {
      return toResponse({ error: { message: e && e.message ? e.message : 'Error de proxy IA' } });
    }

    return originalFetch(input, init);
  };
})();`;
};

const ApiKeyHtmlInjectionView: React.FC = () => {
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState<string>(DEFAULT_MODEL.anthropic);
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validateStatus, setValidateStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [injectedHtml, setInjectedHtml] = useState('');
  const [saveObjectStatus, setSaveObjectStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedObjectUrl, setSavedObjectUrl] = useState('');
  const [savedObjectMessage, setSavedObjectMessage] = useState('');

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

  const handleProviderChange = (next: Provider) => {
    setProvider(next);
    setModel(DEFAULT_MODEL[next]);
    setSaveStatus('idle');
    setValidateStatus('idle');
    setStatusMessage('');
  };

  const saveKey = async () => {
    setSaveStatus('saving');
    setStatusMessage('');

    try {
      const res = await fetch('/api/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar la API key');
      }

      setSaveStatus('saved');
      setStatusMessage('✓ key guardada');
    } catch (err) {
      setSaveStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Error guardando key');
    }
  };

  const validateKey = async () => {
    setValidateStatus('validating');
    setStatusMessage('');

    try {
      await saveKey();

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          system: 'Responde exactamente OK',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 20,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Validación fallida');
      }

      setValidateStatus('valid');
      setStatusMessage('✓ key validada correctamente');
    } catch (err) {
      setValidateStatus('invalid');
      setStatusMessage(err instanceof Error ? err.message : 'Key inválida');
    }
  };

  const onHtmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const rawHtml = await file.text();
    const maybeApiBase = (import.meta as any)?.env?.VITE_API_URL || '';
    const normalizedApiBase = String(maybeApiBase).replace(/\/+$/, '');
    const apiEndpoint = normalizedApiBase.endsWith('/api')
      ? `${normalizedApiBase}/ai`
      : `${normalizedApiBase}/api/ai`;

    const fixedHtml = applyAutomaticFixes(rawHtml);
    const runtime = buildRuntimeScript(provider, apiEndpoint);
    const transformed = injectScript(fixedHtml, runtime);
    setInjectedHtml(transformed);
    setFileName(file.name);
    setSaveObjectStatus('idle');
    setSavedObjectUrl('');
    setSavedObjectMessage('');
  };

  const downloadHtml = () => {
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

  const saveToObjects = async () => {
    if (!injectedHtml) return;

    setSaveObjectStatus('saving');
    setSavedObjectMessage('');

    try {
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

      const objectUrl = created.url || '';
      setSavedObjectUrl(objectUrl);
      setSaveObjectStatus('saved');
      setSavedObjectMessage(objectUrl ? '✓ guardado en Objects y publicado en backend' : '✓ guardado en Objects');
    } catch (err) {
      setSaveObjectStatus('error');
      setSavedObjectMessage(err instanceof Error ? err.message : 'No se pudo guardar en Objects');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Inyección de API key a HTML</h1>
          <p className="mt-2 text-sm text-slate-600">
            Configura proveedor + modelo fijo, guarda/valida la key y después carga un HTML para inyectar automáticamente
            un runtime que conecta la IA al backend por `/api/ai`.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Este HTML queda bloqueado al proveedor seleccionado para que siempre use una API key válida de ese proveedor.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">1) Configuración de API</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Provider</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {modelOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">API key</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega tu key"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={saveKey}
              disabled={saveStatus === 'saving'}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveStatus === 'saving' ? 'guardando...' : 'Guardar key'}
            </button>

            <button
              onClick={validateKey}
              disabled={validateStatus === 'validating'}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
            >
              {validateStatus === 'validating' ? 'validando...' : 'Validar key'}
            </button>

            {statusMessage && (
              <span className={`text-sm ${validateStatus === 'invalid' || saveStatus === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {statusMessage}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">2) Inyección automática a HTML</h2>
          <p className="mt-2 text-sm text-slate-600">
            Carga un archivo HTML y generamos una versión modificada que añade `window.askAI(...)` y modo compatibilidad
            automática para `fetch` hacia OpenAI/Anthropic/Gemini.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            También aplicamos auto-fixes para placeholders comunes (ej: `const respuesta = ''`) y TODOs sin conexión real.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input type="file" accept=".html,text/html" onChange={onHtmlUpload} className="text-sm" />

            <button
              onClick={downloadHtml}
              disabled={!injectedHtml}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Descargar HTML inyectado
            </button>

            <button
              onClick={saveToObjects}
              disabled={!injectedHtml || saveObjectStatus === 'saving'}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveObjectStatus === 'saving' ? 'guardando...' : 'Guardar en Objects'}
            </button>
          </div>

          {fileName && (
            <p className="mt-3 text-sm text-slate-700">
              Archivo cargado: <strong>{fileName}</strong>
            </p>
          )}

          {savedObjectMessage && (
            <p className={`mt-3 text-sm ${saveObjectStatus === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
              {savedObjectMessage}
            </p>
          )}

          {savedObjectUrl && (
            <a
              href={savedObjectUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-semibold text-blue-700 underline"
            >
              Abrir HTML publicado en backend
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyHtmlInjectionView;
