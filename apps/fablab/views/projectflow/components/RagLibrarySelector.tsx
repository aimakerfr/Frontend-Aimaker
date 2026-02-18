import React, { useEffect, useMemo, useState } from 'react';
import { getNotebookSources } from '@core/notebooks';
import { Database } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

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
  required_sources?: string[];
  input_source_type?: SourceType; // default 'HTML'
};

const RagLibrarySelector: React.FC<RagLibrarySelectorProps> = ({
  required_sources = [],
  input_source_type = 'HTML',
}) => {
  const { t } = useLanguage();

  const [sources, setSources] = useState<HTMLSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Holds the selected mapping per required variable name
  const [selectionMap, setSelectionMap] = useState<Record<string, number | ''>>({});

  // Final saved array
  const [filesSources, setFilesSources] = useState<FilesSourceItem[]>([]);

  // Initialize selection map whenever the list of required sources changes
  useEffect(() => {
    const next: Record<string, number | ''> = {};
    for (const v of required_sources) next[v] = selectionMap[v] ?? '';
    setSelectionMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required_sources.join('|')]);

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

  const handleChange = (variableName: string, value: string) => {
    setSelectionMap((prev) => ({ ...prev, [variableName]: value ? Number(value) : '' }));
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

  const hasRequirements = required_sources.length > 0;

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
        {hasRequirements && required_sources.map((variable) => (
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
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          {t?.common?.save}
        </button>
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
