import React, { useState } from 'react';

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4.1-mini',
  gemini: 'gemini-2.0-flash',
};

const ApiKeyManager = () => {
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(DEFAULT_MODELS.anthropic);
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const onProviderChange = (event) => {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    setModel(DEFAULT_MODELS[nextProvider]);
    setStatus('idle');
    setError('');
  };

  const saveKey = async () => {
    setStatus('saving');
    setError('');

    try {
      const response = await fetch('/api/save-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Error al guardar la API key');
      }

      setStatus('saved');
      setApiKey('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error al guardar la API key');
    }
  };

  return (
    <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">ApiKey Manager</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor</label>
          <select
            value={provider}
            onChange={onProviderChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            placeholder="Nombre del modelo"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">API key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            placeholder="Pega aquí tu API key"
          />
        </div>

        <button
          type="button"
          onClick={saveKey}
          disabled={status === 'saving'}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Guardar key
        </button>

        <div className="text-sm">
          {status === 'saving' && <span className="text-slate-600">guardando...</span>}
          {status === 'saved' && <span className="text-emerald-600">✓ guardada</span>}
          {status === 'error' && <span className="text-red-600">error: {error}</span>}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
