import React, { useEffect, useMemo, useState } from 'react';
import { getNotebookSources } from '@core/notebooks';
import { Database } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';
import { createMakerPathVariable } from '@core/maker-path-variables/maker-path-variables.service';

type SourceType = 'HTML';

type HTMLSource = {
  id: number;
  name: string;
  filePath: string | null;
  createdAt: string;
};

type FilesSourceItem = {
  variable_name: string;
  rag_multimodal_source_id: number;
};

type RagLibrarySelectorProps = {
  // Single-variable mode: if provided, the component renders one selector for this variable
  input_file_variable?: string;
  // Multi-variable mode: optional list of variable names to render multiple selectors
  required_sources?: string[];
  input_source_type?: SourceType; // default 'HTML'
  // Flow control
  required?: boolean;
  step_id?: number;
  onNext?: () => void;
  // Optional persistence parameters for POST /api/v1/maker_path_variables
  makerPathId?: number;
  variableIndexOffset?: number; // if provided, index starts from this offset for multi-select
};

const RagLibrarySelector: React.FC<RagLibrarySelectorProps> = ({
  input_file_variable,
  required_sources = [],
  input_source_type = 'HTML',
  required = false,
  step_id,
  onNext,
  makerPathId,
  variableIndexOffset = 1,
}) => {
  const { t } = useLanguage();

  const [sources, setSources] = useState<HTMLSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Holds the selected mapping per required variable name
  const [selectionMap, setSelectionMap] = useState<Record<string, number | ''>>({});

  // Final saved array
  const [filesSources, setFilesSources] = useState<FilesSourceItem[]>([]);

  // Initialize selection map whenever the list of required sources or single var changes
  useEffect(() => {
    const next: Record<string, number | ''> = {};
    const variables: string[] = input_file_variable
      ? [input_file_variable]
      : required_sources;
    for (const v of variables) next[v] = selectionMap[v] ?? '';
    setSelectionMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input_file_variable || '', required_sources.join('|')]);

  // Load available sources from backend (copy of HTMLSourcePicker.loadHTMLSources)
  useEffect(() => {
    const loadHTMLSources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allSources = await getNotebookSources(undefined, input_source_type);
        const htmlSources: HTMLSource[] = (allSources || []).map((source: any) => ({
          id: source.id,
          name: source.name,
          filePath: source.filePath || null,
          createdAt: source.createdAt,
        }));
        setSources(htmlSources);
      } catch (e: any) {
        // Keep UI resilient
        setSources([]);
        setError('load_error');
        // eslint-disable-next-line no-console
        console.error('Error loading sources:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadHTMLSources();
  }, [input_source_type]);

  const handleChange = async (variableName: string, value: string) => {
    const numeric = value ? Number(value) : '';
    setSelectionMap((prev) => ({ ...prev, [variableName]: numeric }));

    // Persist immediately when we have enough information
    if (makerPathId && numeric !== '') {
      try {
        const indexNumber = (() => {
          // Compute variable index based on order in required_sources or 1 for single var
          if (input_file_variable) return variableIndexOffset;
          const idx = required_sources.findIndex((v) => v === variableName);
          return (variableIndexOffset || 1) + (idx >= 0 ? idx : 0);
        })();

        const selectedSource = sources.find((s) => s.id === Number(numeric));
        await createMakerPathVariable({
          makerPathId,
          variableIndexNumber: indexNumber,
          ragMultimodalSourceId: Number(numeric),
          variableName: variableName,
          variableValue: {
            sourceType: input_source_type,
            sourceName: selectedSource?.name ?? null,
            stepId: step_id ?? null,
          },
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to create maker path variable', err);
      }
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result: FilesSourceItem[] = Object.entries(selectionMap)
      .filter(([, id]) => id !== '')
      .map(([variable_name, id]) => ({
        variable_name,
        rag_multimodal_source_id: Number(id),
      }));
    setFilesSources(result);
    // Print state as requested
    // eslint-disable-next-line no-console
    console.log('Files_sources', result);
  };

  const hasRequirements = !!input_file_variable || required_sources.length > 0;

  const anySelectionMade = useMemo(() => {
    return Object.values(selectionMap).some((v) => v !== '' && v !== undefined && v !== null);
  }, [selectionMap]);

  const sourceOptions = useMemo(() => sources, [sources]);

  return (
    <div className="space-y-3">
      {/* Header row (icon only to avoid literal strings) */}
      <div className="flex items-center gap-2 text-slate-400">
        <Database size={16} />
        {/* Avoid raw strings to comply with i18n lint; using a common key if available */}
        <span className="text-xs font-medium">{t?.common?.select}</span>
      </div>

      {/* Lightweight loading indicator to use isLoading state and inform user */}
      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-xs" aria-live="polite">
          <Database size={12} className="animate-spin" />
          <span>{t?.common?.loading}</span>
        </div>
      )}

      {/* Required selectors */}
      <div className="space-y-2">
        {hasRequirements && (input_file_variable ? [input_file_variable] : required_sources).map((variable) => (
          <div key={variable} className="flex items-center gap-2">
            <code className="text-[11px] px-2 py-1 rounded bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200">
              {`{{${variable}}}`}
            </code>
            <select
              className={`flex-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
              value={selectionMap[variable] ?? ''}
              onChange={(e) => handleChange(variable, e.target.value)}
            >
              <option value="">{t?.common?.select}</option>
              {sourceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end pt-1 gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t?.common?.save}
        </button>

        {/* Show NEXT only when step is required and a selection exists */}
        {required && anySelectionMade && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            {t?.common?.next}
          </button>
        )}
      </div>

      {/* Printed state */}
      {filesSources.length > 0 && (
        <pre className="mt-2 max-h-40 overflow-auto text-[11px] bg-slate-900/40 text-slate-300 p-2 rounded">
          {JSON.stringify(filesSources, null, 2)}
        </pre>
      )}

      {/* Error (kept silent visually except a small indicator using i18n-safe key) */}
      {error && <div className="sr-only">{error}</div>}
    </div>
  );
};

export default RagLibrarySelector;
