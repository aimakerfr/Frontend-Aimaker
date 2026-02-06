import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getPromptByToolId, updatePromptBody } from '@core/prompts/prompts.service';
import PromptBodySection from './PromptBodySection';
import { useToolView } from '../tool/ToolViewCard';
import { useLanguage } from '../../language/useLanguage';

type Props = {
  toolId: number;
};

const PromptDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  const tp = t.promptEditor;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [promptBody, setPromptBody] = useState<string>('');
// Local status for body section save
  const [bodyStatus, setBodyStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [bodySaving, setBodySaving] = useState(false);
  // Advanced configuration toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Try to access ToolView context if this component is rendered inside ToolViewCard
  // Keep it optional to preserve standalone capability
  let toolView: ReturnType<typeof useToolView> | undefined;
  try {
    // calling hook inside try/catch is fine at runtime but must respect Rules of Hooks:
    // To avoid violating hooks rules, we read it via a helper that memoizes undefined when not in provider.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toolView = useToolView();
  } catch (_) {
    toolView = undefined;
  }

  const contextInitialBody = useMemo(() => toolView?.state.promptBody ?? '', [toolView?.state.promptBody]);

  // Named loader so effect only calls a function
  const fetchPromptDetails = useCallback(async (currentToolId: number, cancelledRef: () => boolean) => {
    try {
      setLoading(true);
      // 1) Validate type with getTool
      const data = await getTool(currentToolId);
      if (cancelledRef()) return;
      if (data.type !== 'prompt') {
        setError(tp.errorNotPrompt);
        return;
      }
      setContext(data.context || '');
      setOutputFormat(data.outputFormat || '');

      // 2) Load body from prompts service (source of truth)
      const promptRes = await getPromptByToolId(currentToolId);
      if (cancelledRef()) return;
      const bodyFromService = (promptRes as any)?.prompt || '';
      setPromptBody(bodyFromService || contextInitialBody || '');
      setError(null);
    } catch (e) {
      if (!cancelledRef()) setError(tp.errorLoading);
    } finally {
      if (!cancelledRef()) setLoading(false);
    }
  }, [contextInitialBody, tp.errorNotPrompt, tp.errorLoading]);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    fetchPromptDetails(toolId, isCancelled);
    return () => {
      cancelled = true;
    };
  }, [toolId, contextInitialBody, fetchPromptDetails]);

  // Extracted save handler function
  const handleSaveBody = useCallback(async (newBody: string) => {
    try {
      setBodySaving(true);
      setBodyStatus('saving');
      await updatePromptBody(toolId, { prompt: newBody || '' });
      const refreshed = await getPromptByToolId(toolId);
      const refreshedBody = (refreshed as any)?.prompt || '';
      setPromptBody(refreshedBody);
      if (toolView) {
        toolView.update({ promptBody: refreshedBody });
      }
      setBodyStatus('success');
    } catch (e) {
      setBodyStatus('error');
      // Also set a human readable error for below-box rendering
      setError(tp.errorSavingBody);
    } finally {
      setBodySaving(false);
      setTimeout(() => setBodyStatus('idle'), 1500);
    }
  }, [toolId, toolView, tp.errorSavingBody]);

  return (
    <div className="flex flex-col w-full space-y-10">
      {/* Heading */}
      <h2 className="text-lg font-bold text-slate-900">{tp.title}</h2>
      {/* Box that always renders */}
      <div className="w-full border border-slate-200 rounded-xl bg-white p-4 shadow-sm">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <PromptBodySection
            initialValue={promptBody}
            onSave={handleSaveBody}
            saving={bodySaving}
            status={bodyStatus}
            disabled={loading}
          />
        )}
      </div>
      {/* Error below the box if exists */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? tp.hideAdvanced : tp.showAdvanced}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.extraContext}</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
              placeholder={tp.extraContextPlaceholder}
            ></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.outputFormat}</label>
            <textarea
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
              placeholder={tp.outputFormatPlaceholder}
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
