import React, { useEffect, useState } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getPromptByToolId, updatePromptBody } from '@core/prompts/prompts.service';
import PromptBodySection from './PromptBodySection';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';

type Props = {
  toolId: number;
};

const PromptDetails: React.FC<Props> = ({ toolId }) => {
  const [tool, setTool] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
// Local status for body section save
  const [bodyStatus, setBodyStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [bodySaving, setBodySaving] = useState(false);
  // Advanced configuration toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getTool(toolId);
        if (!cancelled) {
          if (data.type !== 'prompt') {
            setError("La ressource demandée n'est pas un prompt.");
            setTool(null);
            return;
          }
          setTool(data);
          setContext(data.context || '');
          setOutputFormat(data.outputFormat || '');
        }
      } catch (e) {
        if (!cancelled) setError("Impossible de charger les détails du prompt.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId]);
  if (loading) return null;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="flex flex-col w-full space-y-10">
      {/* Heading */}
      <h2 className="text-lg font-bold text-slate-900">Détails du prompt</h2>
      {/* Prompt body section (moved here from PromptView) */}
      <PromptBodySection
          initialValue={(tool as any)?.promptBody || ''}
          onSave={async (newBody) => {
            try {
              setBodySaving(true);
              setBodyStatus('saving');
              await updatePromptBody(toolId, { prompt: newBody || '' });
              // Refresh prompt body from backend to ensure consistency
              await getPromptByToolId(toolId);
              // Also refresh tool in case it's mirrored there
              const refreshedTool = await getTool(toolId);
              setTool(refreshedTool);
              // Optionally could verify refreshed.promptBody
              setBodyStatus('success');
            } catch (e) {
              setBodyStatus('error');
            } finally {
              setBodySaving(false);
              setTimeout(() => setBodyStatus('idle'), 1500);
            }
          }}
          saving={bodySaving}
          status={bodyStatus}
          disabled={loading}
      />
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? 'Masquer la configuration avancée' : 'Afficher la configuration avancée'}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CONTEXTE SUPPLÉMENTAIRE</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
              placeholder="Fournissez un contexte supplémentaire..."
            ></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">FORMAT DE SORTIE</label>
            <textarea
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
              placeholder="Précisez le format de sortie souhaité..."
            ></textarea>
          </div>
        </div>
      )}
      
      {/*<div className="flex justify-end">*/}
      {/*  <button*/}
      {/*    type="button"*/}
      {/*    onClick={saveDetails}*/}
      {/*    disabled={saving}*/}
      {/*    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"*/}
      {/*  >*/}
      {/*    {saving ? 'Guardando…' : 'Guardar Detalles'}*/}
      {/*  </button>*/}
      {/*</div>*/}


    </div>
  );
};

export default PromptDetails;
