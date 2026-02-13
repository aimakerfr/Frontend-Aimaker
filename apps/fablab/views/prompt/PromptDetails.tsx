import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getPromptByToolId, updatePrompt } from '@core/prompts/prompts.service';
import PromptBodySection from './PromptBodySection';
import { useToolView } from '../tool/ToolViewCard';
import { useLanguage } from '../../language/useLanguage';

/** Valid ENUM values for output_format in DB */
const OUTPUT_FORMAT_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'plain_text', label: 'Plain Text' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
] as const;

type Props = {
  toolId: number | null;
};

const PromptDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  const tp = t.promptEditor;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [promptBody, setPromptBody] = useState<string>('');
  
  // Try to access ToolView context if this component is rendered inside ToolViewCard
  const toolView = useToolView();

  // Use a ref for the initial body fallback so it doesn't trigger re-fetches
  const initialBodyRef = useRef(toolView?.state.promptBody ?? '');

  // Named loader so effect only calls a function — NO reactive deps that change while typing
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

      // 2) Load body and fields from prompts service (source of truth)
      // Context (cag) and outputFormat only exist in prompts table, not in tools table
      const promptRes = await getPromptByToolId(currentToolId);
      if (cancelledRef()) return;
      const bodyFromService = (promptRes as any)?.prompt || '';
      setPromptBody(bodyFromService || initialBodyRef.current || '');
      setContext((promptRes as any)?.cag || '');
      setOutputFormat((promptRes as any)?.outputFormat || '');
      setError(null);
    } catch (e) {
      if (!cancelledRef()) setError(tp.errorLoading);
    } finally {
      if (!cancelledRef()) setLoading(false);
    }
  }, [tp.errorNotPrompt, tp.errorLoading]); // Stable deps only — NO contextInitialBody

  useEffect(() => {
    // Skip loading if toolId is null (new mode)
    if (toolId === null) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    const isCancelled = () => cancelled;
    fetchPromptDetails(toolId, isCancelled);
    return () => {
      cancelled = true;
    };
  }, [toolId, fetchPromptDetails]);

  // Unified save handler function - saves prompt body, context, and outputFormat
  const handleSave = useCallback(async () => {
    // Skip if toolId is null (creation mode - tool will be created by ToolViewCard)
    if (toolId === null) {
      // Just update the context state, actual save happens in ToolViewCard
      if (toolView) {
        toolView.update({ 
          promptBody: promptBody,
          context: context,
          outputFormat: outputFormat
        });
      }
      return;
    }
    
    try {
      // Update all prompt fields at once
      await updatePrompt(toolId, {
        prompt: promptBody || '',
        cag: context || '',
        outputFormat: outputFormat || ''
      });
      // Keep local values - don't refresh to avoid losing user's text
      // The save was successful, so the values are now persisted
      if (toolView) {
        toolView.update({ 
          promptBody: promptBody,
          context: context,
          outputFormat: outputFormat
        });
      }
    } catch (e) {
      setError((e as Error).message || tp.errorSavingBody);
      throw e; // Re-throw para que ToolViewCard también maneje el error
    }
  }, [toolId, promptBody, context, outputFormat, toolView, tp.errorSavingBody]);

  // Register the save handler with ToolViewCard so main "Save Changes" button can trigger it
  useEffect(() => {
    if (toolView?.registerDetailSave) {
      toolView.registerDetailSave(handleSave);
    }
  }, [toolView, handleSave]);

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
            onBodyChange={setPromptBody}
            disabled={loading}
          />
        )}
      </div>
      {/* Error below the box if exists */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Configuration fields - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.extraContext}</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={loading}
            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white disabled:opacity-60"
            placeholder={tp.extraContextPlaceholder}
          ></textarea>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.outputFormat}</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white disabled:opacity-60"
          >
            {OUTPUT_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
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
