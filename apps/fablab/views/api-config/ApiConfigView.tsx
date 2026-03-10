import React, { useEffect, useState } from 'react';
import { KeyRound, CheckCircle2, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { fetchGeminiConfig, validateApiKey } from './apiConfigService';
import type { GeminiModel, GeminiConfig } from './apiConfigService';

// ─── Exported variable ────────────────────────────────────────────────────────
// This is the active configuration that other modules can consume.
// Pass an `onConfigChange` prop to receive updates, or import `useApiConfig`
// if you build a context wrapper around this component.
export interface ApiConfigState {
  /** null = use backend default (from .env) */
  activeApiKey: string | null;
  /** null = no specific model selected (backend default) */
  activeModel: string | null;
}

interface ApiConfigViewProps {
  /**
   * Called every time the active key or model changes.
   * Other components can store this value and pass it to Gemini calls.
   */
  onConfigChange?: (cfg: ApiConfigState) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ApiConfigView: React.FC<ApiConfigViewProps> = ({ onConfigChange }) => {
  // ── Default key from .env (fetched once) ──────────────────────────────────
  const [defaultConfig, setDefaultConfig] = useState<GeminiConfig | null>(null);
  const [loadingDefault, setLoadingDefault] = useState(true);

  // ── Custom key input ──────────────────────────────────────────────────────
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Models returned by validation ─────────────────────────────────────────
  const [models, setModels] = useState<GeminiModel[]>([]);

  // ── Active configuration (THIS IS THE EXPORTED STATE) ────────────────────
  // activeApiKey: null  → backend uses its own .env key
  // activeApiKey: "..." → backend should use this key (pass it in requests)
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  // Notify parent whenever the config changes
  useEffect(() => {
    onConfigChange?.({ activeApiKey, activeModel });
  }, [activeApiKey, activeModel]);

  // Load default config on mount
  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchGeminiConfig();
        setDefaultConfig(cfg);
      } catch {
        setDefaultConfig({ defaultKeyConfigured: false, maskedKey: '(error al cargar)' });
      } finally {
        setLoadingDefault(false);
      }
    })();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleValidate = async () => {
    if (!customKeyInput.trim()) return;
    setValidating(true);
    setValidationError(null);
    setModels([]);
    setActiveApiKey(null);
    setActiveModel(null);

    try {
      const result = await validateApiKey(customKeyInput.trim());
      setModels(result.models);
      setActiveApiKey(customKeyInput.trim()); // key is now active
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'API key inválida';
      setValidationError(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setActiveModel(modelId === activeModel ? null : modelId);
  };

  const handleReset = () => {
    setCustomKeyInput('');
    setModels([]);
    setActiveApiKey(null);
    setActiveModel(null);
    setValidationError(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const usingDefault = activeApiKey === null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
          <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">API Config — Gemini</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Configura la API key y el modelo de Gemini a usar</p>
        </div>
      </div>

      {/* Default key section */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Clave predeterminada</p>
        {loadingDefault ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Cargando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {defaultConfig?.defaultKeyConfigured ? (
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle size={14} className="text-red-400 flex-shrink-0" />
            )}
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {defaultConfig?.maskedKey ?? '—'}
            </code>
            {usingDefault && defaultConfig?.defaultKeyConfigured && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                En uso
              </span>
            )}
          </div>
        )}
      </div>

      {/* Custom key input */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          API key personalizada
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ingresa otra clave para validarla y ver los modelos disponibles. Si la dejas vacía se usará la predeterminada.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={customKeyInput}
            onChange={(e) => setCustomKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            placeholder="AIzaSy..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleValidate}
            disabled={!customKeyInput.trim() || validating}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {validating ? 'Validando...' : 'Validar'}
          </button>
        </div>

        {validationError && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{validationError}</p>
          </div>
        )}

        {/* Active custom key badge */}
        {!usingDefault && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Clave personalizada activa
              </p>
            </div>
            <button
              onClick={handleReset}
              title="Volver a la clave predeterminada"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-red-500 transition-colors"
            >
              <RotateCcw size={12} />
              Restablecer
            </button>
          </div>
        )}
      </div>

      {/* Model list */}
      {models.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Modelos disponibles ({models.length})
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Haz clic en un modelo para seleccionarlo. Si no seleccionas ninguno, se usa el predeterminado del sistema.
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {models.map((m) => {
              const isActive = activeModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all text-xs ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.displayName}</p>
                    <p className="text-gray-400 dark:text-gray-500 truncate">{m.id}</p>
                  </div>
                  {isActive && <CheckCircle2 size={14} className="flex-shrink-0 text-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current active config summary */}
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Configuración activa
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400 w-14">API Key:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {usingDefault ? '(predeterminada del sistema)' : `${activeApiKey?.substring(0, 10)}…`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400 w-14">Modelo:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {activeModel
              ? models.find((m) => m.id === activeModel)?.displayName ?? activeModel
              : '(predeterminado del sistema)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigView;

// ─── How to use this module ───────────────────────────────────────────────────
//
// 1. Render the component anywhere:
//    <ApiConfigView onConfigChange={(cfg) => setGeminiConfig(cfg)} />
//
// 2. Store the result in your parent state:
//    const [geminiConfig, setGeminiConfig] = useState<ApiConfigState>({
//      activeApiKey: null,
//      activeModel: null,
//    });
//
// 3. Pass the active key/model to Gemini calls:
//    generateChatResponse(history, sources, message, 'es', instruction, geminiConfig)
//
// NOTE: When activeApiKey is null → backend uses its default .env key.
//       When activeApiKey is set  → you must pass it to the backend request
//       so it knows to use that key instead (a future enhancement to the chat endpoint).
