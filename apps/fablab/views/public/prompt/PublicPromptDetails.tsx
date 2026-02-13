import React, {  useEffect, useState } from 'react';
import PromptBodySection from '../../prompt/PromptBodySection';
import { useLanguage } from '../../../language/useLanguage';

type Props = {
  toolId: number;
};

const PublicPromptDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  const tp = t.promptEditor;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [promptBody, setPromptBody] = useState<string>('');
  // Tool metadata
  const [toolTitle, setToolTitle] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolCategory, setToolCategory] = useState('');
  const [toolLanguage, setToolLanguage] = useState('');

  // Load prompt data (using public endpoint without authentication)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // Load tool data from public endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}`);
        if (!response.ok) {
          throw new Error('Failed to load tool');
        }
        const data = await response.json();
        if (cancelled) return;
        
        if (data.type !== 'prompt') {
          setError(tp.errorNotPrompt);
          return;
        }

        // Save tool metadata
        setToolTitle(data.title || '');
        setToolDescription(data.description || '');
        setToolCategory(data.category || '');
        setToolLanguage(data.language || '');

        // Load prompt-specific data
        const promptResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}/prompt`);
        if (!promptResponse.ok) {
          throw new Error('Failed to load prompt');
        }
        const promptRes = await promptResponse.json();
        if (cancelled) return;
        
        setPromptBody(promptRes?.prompt || '');
        setContext(promptRes?.cag || '');
        setOutputFormat(promptRes?.outputFormat || '');
        setError(null);
      } catch (e) {
        if (!cancelled) setError(tp.errorLoading);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId, tp.errorNotPrompt, tp.errorLoading]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex flex-col w-full space-y-6">
        {/* Header Section with Tool Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-3xl font-bold text-slate-900">{toolTitle || 'Prompt'}</h1>
          <div className="flex gap-2">
            {toolCategory && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {toolCategory}
              </span>
            )}
            {toolLanguage && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase">
                {toolLanguage}
              </span>
            )}
          </div>
        </div>
        {toolDescription && (
          <p className="text-slate-600 text-sm leading-relaxed">{toolDescription}</p>
        )}
      </div>

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
            onBodyChange={() => {}} // No-op for read-only
            disabled={true} // Always disabled in public view
          />
        )}
      </div>
      {/* Error below the box if exists */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Configuration fields - always visible and disabled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.extraContext}</label>
          <textarea
            value={context}
            readOnly
            disabled
            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
            placeholder={tp.extraContextPlaceholder}
          ></textarea>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tp.outputFormat}</label>
          <textarea
            value={outputFormat}
            readOnly
            disabled
            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
            placeholder={tp.outputFormatPlaceholder}
          ></textarea>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PublicPromptDetails;
