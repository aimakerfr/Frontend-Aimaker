import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createMakerPath, getMakerPath, updateMakerPath } from '@core/maker-path/maker-path.service';
import { getAssemblerTemplates, downloadAssembledProduct } from '@core/assembler/assembler.service';
import type { AssemblerTemplate } from '@core/assembler/assembler.types';
import { saveIdentityAssembler } from '@core/notebook-setup/notebook-setup.service';

type FormState = {
  title: string;
  description: string;
  attachRags: boolean;
  systemPromptEnabled: boolean;
  systemPrompt: string;
  customApiEnabled: boolean;
  customApiUrl: string;
  templateEnabled: boolean;
  templateSlug: string;
};

const DEFAULT_TEMPLATE = 'notebook-v1';

const AssemblerWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const makerPathId = useMemo(() => (id ? Number(id) : null), [id]);

  const [templates, setTemplates] = useState<AssemblerTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<FormState>({
    title: '',
    description: '',
    attachRags: false,
    systemPromptEnabled: true,
    systemPrompt: 'Eres un asistente basado en las fuentes RAG proporcionadas.',
    customApiEnabled: false,
    customApiUrl: '',
    templateEnabled: true,
    templateSlug: DEFAULT_TEMPLATE,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      getAssemblerTemplates().catch(() => [] as AssemblerTemplate[]),
      makerPathId ? getMakerPath(makerPathId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([tpl, mp]) => {
        if (!mounted) return;
        setTemplates(tpl);
        if (mp) {
          setState((prev) => ({
            ...prev,
            title: mp.title || '',
            description: mp.description || '',
            templateSlug: (mp as any).templateSlug || prev.templateSlug,
            customApiUrl: (mp as any).customApiUrl || prev.customApiUrl,
          }));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('Error cargando datos');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [makerPathId]);

  const set = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));

  const ensureMakerPath = useCallback(async (): Promise<number> => {
    if (makerPathId) return makerPathId;

    const created = await createMakerPath({
      title: state.title,
      description: state.description,
      type: 'assembled' as any,
      status: 'draft' as any,
    });

    navigate(`/dashboard/assembler/${created.id}`);
    return created.id;
  }, [makerPathId, navigate, state.description, state.title]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const id = await ensureMakerPath();

      await updateMakerPath(id, {
        title: state.title,
        description: state.description,
        status: 'configured' as any,
        templateSlug: state.templateEnabled ? state.templateSlug : undefined,
        customApiUrl: state.customApiEnabled ? state.customApiUrl : undefined,
      } as any);

      await saveIdentityAssembler({
        makerPathId: id,
        systemPrompt: state.systemPromptEnabled ? state.systemPrompt : null,
        modelName: 'gemini',
        provider: 'google',
        settings: { language: 'es' },
      });
    } catch (e) {
      setError('Error guardando');
    } finally {
      setSaving(false);
    }
  }, [ensureMakerPath, state.customApiEnabled, state.customApiUrl, state.description, state.systemPrompt, state.systemPromptEnabled, state.templateEnabled, state.templateSlug, state.title]);

  const handleDownload = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const id = await ensureMakerPath();
      await handleSave();

      const blob = await downloadAssembledProduct(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-${id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Error descargando');
    } finally {
      setSaving(false);
    }
  }, [ensureMakerPath, handleSave]);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Ensamblador</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            onClick={handleDownload}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
          >
            Descargar
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Datos básicos</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Título</label>
              <input
                value={state.title}
                onChange={(e) => set({ title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Descripción</label>
              <textarea
                value={state.description}
                onChange={(e) => set({ description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg h-24"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Instrucciones (System Prompt)</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
            <input
              type="checkbox"
              checked={state.systemPromptEnabled}
              onChange={(e) => set({ systemPromptEnabled: e.target.checked })}
            />
            Habilitar
          </label>
          <textarea
            disabled={!state.systemPromptEnabled}
            value={state.systemPrompt}
            onChange={(e) => set({ systemPrompt: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg h-32 disabled:opacity-50"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">API propia (deuda técnica)</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
            <input
              type="checkbox"
              checked={state.customApiEnabled}
              onChange={(e) => set({ customApiEnabled: e.target.checked })}
            />
            Habilitar
          </label>
          <input
            disabled={!state.customApiEnabled}
            value={state.customApiUrl}
            onChange={(e) => set({ customApiUrl: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
            placeholder="https://..."
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Template visual</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
            <input
              type="checkbox"
              checked={state.templateEnabled}
              onChange={(e) => set({ templateEnabled: e.target.checked })}
            />
            Usar template
          </label>

          <select
            disabled={!state.templateEnabled}
            value={state.templateSlug}
            onChange={(e) => set({ templateSlug: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
          >
            {(templates.length ? templates : [{ slug: DEFAULT_TEMPLATE, name: 'Notebook IA', description: null, version: '1.0', hasPreview: false }]).map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name ?? t.slug}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AssemblerWizard;
