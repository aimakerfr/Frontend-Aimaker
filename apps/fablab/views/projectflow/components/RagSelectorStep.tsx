import React, { useEffect, useState } from 'react';
import { httpClient } from '@core/api/http.client';
import { Database, Check, ChevronLeft } from 'lucide-react';
import { postMakerPathVariable, getMakerPathVariables } from '@core/maker-path-variables/maker-path-variables.service';
import { useLanguage } from '../../../language/useLanguage';

type RagMultimodal = {
  id: number;
  tool: {
    title: string;
    description: string | null;
    language: string;
  };
  sources: RagSource[];
  cag: string | null;
  created_at: string;
};

type RagSource = {
  id: number;
  name: string;
  type: string;
  filePath: string | null;
  createdAt: string;
};

type RagSelectorStepProps = {
  makerPathId?: number;
  variableIndexNumber?: number;
  variableName?: string;
  stepId?: number;
  required?: boolean;
  onMarkStepComplete?: (stepId: number) => void;
};

const RagSelectorStep: React.FC<RagSelectorStepProps> = ({
  makerPathId,
  variableIndexNumber,
  variableName,
  stepId,
  required,
  onMarkStepComplete,
}) => {
  const { t } = useLanguage();
  const rs = t.projectFlow.ragSelector;
  const [step, setStep] = useState<'rag-list' | 'source-list'>('rag-list');
  const [rags, setRags] = useState<RagMultimodal[]>([]);
  const [selectedRag, setSelectedRag] = useState<RagMultimodal | null>(null);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRags();
    prefillSelection();
  }, []);

  const prefillSelection = async () => {
    if (!makerPathId || !variableIndexNumber) return;
    try {
      const variables = await getMakerPathVariables(makerPathId);
      const existing = variables.find(v => v.variableIndexNumber === variableIndexNumber);
      if (existing?.variableValue) {
        const value = existing.variableValue as any;
        if (value.ragSourceIds && Array.isArray(value.ragSourceIds)) {
          setSelectedSources(value.ragSourceIds);
        }
      }
    } catch (err) {
      console.error('Error prefilling:', err);
    }
  };

  const loadRags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<RagMultimodal[]>('/api/v1/rag-multimodal');
      setRags(response || []);
    } catch (err) {
      console.error('Error loading RAGs:', err);
      setError('Error loading RAG libraries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRag = async (rag: RagMultimodal) => {
    setIsLoading(true);
    setError(null);
    try {
      // Load full RAG details including sources
      const response = await httpClient.get<RagMultimodal>(`/api/v1/rag-multimodal/${rag.id}`);
      setSelectedRag(response);
      setStep('source-list');
    } catch (err) {
      console.error('Error loading RAG details:', err);
      setError('Error loading sources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSource = (sourceId: number) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const handleSaveSelection = async () => {
    if (!makerPathId || !variableIndexNumber || !variableName) {
      console.error('[RagSelectorStep] Missing required props:', { makerPathId, variableIndexNumber, variableName });
      return;
    }

    if (selectedSources.length === 0) {
      alert('Please select at least one source');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[RagSelectorStep] Saving:', {
        makerPathId,
        variableIndexNumber,
        variableName,
        ragSourceIds: selectedSources,
        firstSourceId: selectedSources[0],
      });

      // Save the first source ID as ragMultimodalSourceId (required by backend)
      // And all IDs in variableValue for later use
      await postMakerPathVariable({
        makerPathId,
        variableIndexNumber,
        variableName,
        variableValue: { ragSourceIds: selectedSources },
        ragMultimodalSourceId: selectedSources[0], // Backend requires a single ID
      });

      console.log('[RagSelectorStep] Saved successfully');

      if (stepId && onMarkStepComplete) {
        onMarkStepComplete(stepId);
      }
    } catch (err) {
      console.error('[RagSelectorStep] Error saving selection:', err);
      alert(rs.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => {
            if (step === 'rag-list') {
              loadRags();
            } else if (selectedRag) {
              handleSelectRag(selectedRag);
            }
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          {rs.retry}
        </button>
      </div>
    );
  }

  // ========== STEP 1: RAG List ==========
  if (step === 'rag-list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Database size={16} />
          <span className="text-xs font-medium">{rs.title}</span>
          {required && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 ml-auto">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {t.projectFlow.required}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {rs.infoSelectLibrary}
          </p>
        </div>

        {/* RAG List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {rags.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              {rs.noRags}
            </div>
          ) : (
            rags.map((rag) => (
              <button
                key={rag.id}
                onClick={() => handleSelectRag(rag)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <Database size={20} className="text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {rag.tool.title || 'Untitled RAG'}
                  </p>
                  {rag.tool.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {rag.tool.description}
                    </p>
                  )}
                  {rag.sources && rag.sources.length > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {rag.sources.length} source{rag.sources.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ChevronLeft size={16} className="text-gray-400 rotate-180" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ========== STEP 2: Source List ==========
  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setStep('rag-list');
            setSelectedRag(null);
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Database size={16} />
            <span className="text-xs font-medium">
              {selectedRag?.tool.title || rs.selectSources}
            </span>
          </div>
          {required && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {t.projectFlow.required}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {rs.infoSelectSources}
        </p>
      </div>

      {/* Sources List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!selectedRag?.sources || selectedRag.sources.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {rs.noSources}
          </div>
        ) : (
          selectedRag.sources.map((source) => {
            const isSelected = selectedSources.includes(source.id);
            const typeColor = {
              HTML: 'text-green-600',
              TEXT: 'text-blue-600',
              PDF: 'text-red-600',
              IMAGE: 'text-purple-600',
              VIDEO: 'text-orange-600',
              WEBSITE: 'text-cyan-600',
              CODE: 'text-yellow-600',
              DOC: 'text-indigo-600',
            }[source.type] || 'text-gray-600';
            
            return (
              <button
                key={source.id}
                onClick={() => handleToggleSource(source.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {source.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${typeColor}`}>
                      {source.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Database size={16} className="text-gray-400" />
              </button>
            );
          })
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSaveSelection}
          disabled={selectedSources.length === 0 || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {rs.saving}
            </>
          ) : (
            <>
              <Check size={16} />
              {rs.confirm} ({selectedSources.length})
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RagSelectorStep;
