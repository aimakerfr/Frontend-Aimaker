import React, { useCallback, useEffect, useState, useRef } from 'react';
import { getTool } from '@core/creation-tools/creation-tools.service';
import { getAssistantByToolId, updateAssistant } from '@core/assistants/assistants.service';
import { Check, Loader2, XCircle, Plus, X, Upload, FileText, Trash2, Image as ImageIcon } from 'lucide-react';
import type { KnowledgeFile } from '../public/assistant/types';
import { useLanguage } from '../../language/useLanguage';

type Props = {
  toolId: number;
};

const AssistantDetails: React.FC<Props> = ({ toolId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Assistant-specific fields from assistants table
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  // New fields
  const [instructions, setInstructions] = useState('');
  const [starters, setStarters] = useState<string[]>(['']);
  const [capabilities, setCapabilities] = useState<{ imageGen?: boolean }>({ imageGen: false });
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          setError(t.assistantDetails.errorNotAssistant);
          return;
        }

        // 2) Load assistant-specific data from assistants table via /tools/{id}/assistant
        const assistantRes = await getAssistantByToolId(toolId);
        if (cancelled) return;
        // Load assistant fields
        setPlatform((assistantRes as any).platform || '');
        setUrl((assistantRes as any).url || '');
        setBaseUrl((assistantRes as any).baseUrl || '');
        setInstructions((assistantRes as any).instructions || '');
        setStarters((assistantRes as any).starters || ['']);
        setCapabilities((assistantRes as any).capabilities || { imageGen: false });
        setKnowledgeFiles((assistantRes as any).knowledgeFiles || []);
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
  }, [toolId]);

  // Handlers for new fields
  const handleStarterChange = (index: number, value: string) => {
    const newStarters = [...starters];
    newStarters[index] = value;
    setStarters(newStarters);
  };

  const removeStarter = (index: number) => {
    const newStarters = starters.filter((_, i) => i !== index);
    setStarters(newStarters.length > 0 ? newStarters : ['']);
  };

  const addStarter = () => {
    setStarters([...starters, '']);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newKnowledgeFiles: KnowledgeFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string || '');
        reader.readAsText(file);
      });

      newKnowledgeFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        content: content
      });
    }

    setKnowledgeFiles([...knowledgeFiles, ...newKnowledgeFiles]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const updated = knowledgeFiles.filter((_, i) => i !== index);
    setKnowledgeFiles(updated);
  };

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      // Update assistant via PATCH /tools/{id}/assistant with all assistant fields
      await updateAssistant(toolId, { 
        platform, 
        url, 
        baseUrl,
        instructions,
        starters: starters.filter(s => s.trim() !== ''),
        capabilities,
        knowledgeFiles
      });
      setSaveStatus('success');
    } catch (e) {
      setSaveStatus('error');
      setError(t.assistantDetails.errorSaving);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [toolId, platform, url, baseUrl, instructions, starters, capabilities, knowledgeFiles]);

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
      <h2 className="text-lg font-bold text-slate-900">{t.assistantDetails.title}</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Instructions */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.systemInstructions}</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t.assistantDetails.instructionsPlaceholder}
            rows={8}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white resize-none font-mono"
            disabled={saving}
          />
          <p className="text-[10px] text-slate-400 italic mt-1">{t.assistantDetails.instructionsHint}</p>
        </div>

        {/* Conversation Starters */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.conversationStarters}</label>
          <div className="space-y-2">
            {starters.map((starter, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={starter}
                  onChange={(e) => handleStarterChange(idx, e.target.value)}
                  placeholder={`${t.assistantDetails.optionPlaceholder} ${idx + 1}`}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
                  disabled={saving}
                />
                {starters.length > 1 && (
                  <button 
                    onClick={() => removeStarter(idx)}
                    className="p-2.5 text-slate-300 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-all"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            onClick={addStarter}
            className="mt-2 text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-2 font-bold uppercase tracking-wider"
            disabled={saving}
          >
            <Plus className="w-3.5 h-3.5" /> {t.assistantDetails.addOption}
          </button>
        </div>

        {/* Knowledge Base */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.knowledgeBase}</label>
          {knowledgeFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {knowledgeFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(idx)} 
                    className="p-2 text-slate-300 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-all"
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div 
            onClick={() => !saving && fileInputRef.current?.click()} 
            className="p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-300 transition-all"
          >
            <div className="p-3 bg-white rounded-lg shadow-sm text-slate-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-600">{t.assistantDetails.uploadDocuments}</p>
              <p className="text-[10px] text-slate-400 mt-1">{t.assistantDetails.uploadHint}</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple 
              className="hidden" 
              accept=".txt,.pdf,.docx,.md,.json" 
              disabled={saving}
            />
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.capabilities}</label>
          <label className="flex items-center justify-between p-4 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${capabilities.imageGen ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-semibold transition-colors ${capabilities.imageGen ? 'text-slate-900' : 'text-slate-500'}`}>
                {t.assistantDetails.imageGeneration}
              </span>
            </div>
            <div 
              onClick={(e) => { 
                e.preventDefault(); 
                if (!saving) setCapabilities({ ...capabilities, imageGen: !capabilities.imageGen }); 
              }} 
              className={`w-10 h-6 rounded-full relative transition-all ${capabilities.imageGen ? 'bg-blue-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${capabilities.imageGen ? 'left-5' : 'left-1'}`} />
            </div>
          </label>
        </div>

        <div className="border-t border-slate-200 my-4"></div>

        {/* Original fields */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.platform}</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={t.assistantDetails.platformPlaceholder}
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.assistantUrl}</label>
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
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.assistantDetails.baseUrl}</label>
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
