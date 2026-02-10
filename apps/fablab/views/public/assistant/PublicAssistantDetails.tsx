import React, { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import type { KnowledgeFile } from './types';
import { useLanguage } from '../../../language/useLanguage';

type Props = {
  toolId: number;
};

const PublicAssistantDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Assistant-specific fields from assistants table
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [starters, setStarters] = useState<string[]>(['']);
  const [capabilities, setCapabilities] = useState<{ imageGen?: boolean }>({ imageGen: false });
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  // Tool metadata
  const [toolTitle, setToolTitle] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolCategory, setToolCategory] = useState('');
  const [toolLanguage, setToolLanguage] = useState('');

  // Load assistant data from public endpoint
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // Load tool data
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}`);
        if (!response.ok) {
          throw new Error('Failed to load tool');
        }
        const data = await response.json();
        if (cancelled) return;
        
        if (data.type !== 'assistant') {
          setError(t.assistantDetails.errorNotAssistant);
          return;
        }

        // Save tool metadata
        setToolTitle(data.title || '');
        setToolDescription(data.description || '');
        setToolCategory(data.category || '');
        setToolLanguage(data.language || '');

        // Load assistant-specific data
        const assistantResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/tools/${toolId}/assistant`);
        if (!assistantResponse.ok) {
          throw new Error('Failed to load assistant');
        }
        const assistantRes = await assistantResponse.json();
        if (cancelled) return;
        
        setPlatform(assistantRes.platform || '');
        setUrl(assistantRes.url || '');
        setBaseUrl(assistantRes.baseUrl || '');
        setInstructions(assistantRes.instructions || '');
        setStarters(assistantRes.starters || ['']);
        setCapabilities(assistantRes.capabilities || { imageGen: false });
        setKnowledgeFiles(assistantRes.knowledgeFiles || []);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(t.assistantDetails.errorLoadingDetails);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId, t.assistantDetails]);

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
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="flex flex-col w-full space-y-6">
        {/* Header Section with Tool Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-3xl font-bold text-slate-900">{toolTitle || 'Assistant'}</h1>
          <div className="flex gap-2">
            {toolCategory && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                {toolCategory}
              </span>
            )}
            {toolLanguage && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full uppercase">
                {toolLanguage}
              </span>
            )}
          </div>
        </div>
        {toolDescription && (
          <p className="text-slate-600 text-sm leading-relaxed">{toolDescription}</p>
        )}
      </div>

      <h2 className="text-lg font-bold text-slate-900">{t.assistantDetails.title}</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Instructions - READ ONLY */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.systemInstructions}</label>
          <textarea
            value={instructions}
            readOnly
            disabled
            rows={8}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 resize-none font-mono cursor-not-allowed opacity-80"
          />
          <p className="text-[10px] text-slate-400 italic mt-1">{t.assistantDetails.instructionsHint}</p>
        </div>

        {/* Conversation Starters - READ ONLY */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.conversationStarters}</label>
          <div className="space-y-2">
            {starters.map((starter, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={starter}
                  readOnly
                  disabled
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Base - READ ONLY */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.knowledgeBase}</label>
          {knowledgeFiles.length > 0 ? (
            <div className="space-y-2">
              {knowledgeFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-center text-sm text-slate-400">
              No hay documentos cargados
            </div>
          )}
        </div>

        {/* Capabilities - READ ONLY */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.capabilities}</label>
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${capabilities.imageGen ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-semibold transition-colors ${capabilities.imageGen ? 'text-slate-900' : 'text-slate-500'}`}>
                {t.assistantDetails.imageGeneration}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full relative ${capabilities.imageGen ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm ${capabilities.imageGen ? 'left-5' : 'left-1'}`} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 my-4"></div>

        {/* Original fields - READ ONLY */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.platform}</label>
          <input
            type="text"
            value={platform}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.assistantUrl}</label>
          <input
            type="url"
            value={url}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.baseUrl}</label>
          <input
            type="url"
            value={baseUrl}
            readOnly
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed opacity-80"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      )}
    </div>
    </div>
  );
};

export default PublicAssistantDetails;
