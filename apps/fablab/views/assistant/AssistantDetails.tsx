import React, { useCallback, useEffect, useState } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getAssistantByToolId, updateAssistant } from '@core/assistants/assistants.service';
import { Check, Loader2, XCircle } from 'lucide-react';

type Props = {
  toolId: number;
};

const AssistantDetails: React.FC<Props> = ({ toolId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Assistant-specific fields from assistants table
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  // Save status
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load assistant data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // 1) Validate type with getTool
        const data = await getTool(toolId);
        if (cancelled) return;
        if (data.type !== 'assistant') {
          setError("El recurso solicitado no es un asistente.");
          return;
        }

        // 2) Load assistant-specific data from assistants table via /tools/{id}/assistant
        const assistantRes = await getAssistantByToolId(toolId);
        if (cancelled) return;
        // Load assistant fields
        setPlatform((assistantRes as any).platform || '');
        setUrl((assistantRes as any).url || '');
        setBaseUrl((assistantRes as any).baseUrl || '');
        setError(null);
      } catch (e) {
        if (!cancelled) setError("No se pudieron cargar los detalles del asistente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId]);

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      // Update assistant via PATCH /tools/{id}/assistant with all assistant fields
      await updateAssistant(toolId, { platform, url, baseUrl });
      setSaveStatus('success');
    } catch (e) {
      setSaveStatus('error');
      setError("Ocurrió un error al guardar la configuración del asistente.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [toolId, platform, url, baseUrl]);

  const getIcon = () => {
    if (saving) return <Loader2 size={18} className="animate-spin" />;
    if (saveStatus === 'success') return <Check size={18} />;
    if (saveStatus === 'error') return <XCircle size={18} />;
    return <Check size={18} />;
  };

  const getButtonClasses = () => {
    if (saveStatus === 'success') return 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100';
    if (saveStatus === 'error') return 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100';
    return 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50';
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Configuración del Asistente</h2>
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PLATAFORMA</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder="OpenAI, Claude, Gemini..."
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">URL DEL ASISTENTE</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder="https://..."
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">BASE URL</label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder="https://api..."
            disabled={saving}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-semibold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${getButtonClasses()}`}
        >
          {getIcon()}
        </button>
      </div>
    </div>
  );
};

export default AssistantDetails;
