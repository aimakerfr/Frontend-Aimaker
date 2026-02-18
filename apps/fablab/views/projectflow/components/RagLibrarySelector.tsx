import React, {useEffect, useMemo, useState} from 'react';
import {getRagMultimodalSources} from '@core/rag_multimodal';
import {Database} from 'lucide-react';
import {useLanguage} from '../../../language/useLanguage';
import {putMakerPathVariable, getMakerPathVariables, postMakerPathVariable} from '@core/maker-path-variables/maker-path-variables.service';

type SourceType = 'HTML';

type HTMLSource = {
    id: number;
    name: string;
    filePath: string | null;
    createdAt: string;
};

// Removed FilesSourceItem debug type as a preview panel was removed

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
    onMarkStepComplete?: (stepId: number) => void;
    // Optional persistence parameters for POST /api/v1/maker_path_variables
    makerPathId?: number;
    inputFileVariableIndexNumber?: number; // 1-based index to persist variable order (directly used)
};

const RagLibrarySelector: React.FC<RagLibrarySelectorProps> = ({
                                                                   input_file_variable,
                                                                   required_sources = [],
                                                                   input_source_type = 'HTML',
                                                                   step_id,
                                                                   onNext,
                                                                   onMarkStepComplete,
                                                                   makerPathId,
                                                                   inputFileVariableIndexNumber,
                                                               }) => {
    const {t} = useLanguage();

    const [sources, setSources] = useState<HTMLSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Holds the selected mapping per required variable name
    const [selectionMap, setSelectionMap] = useState<Record<string, number | ''>>({});
    // Idempotency guard: remember last successfully posted selection per variable
    const [lastPosted, setLastPosted] = useState<Record<string, number | undefined>>({});
    const [didAutoComplete, setDidAutoComplete] = useState<boolean>(false);

    // Removed debug/preview array to simplify component per new requirement

    // (Removed duplicate persisted selections loader to avoid double GET and undefined state refs)

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
                const allSources = await getRagMultimodalSources(undefined, input_source_type);
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

    // Prefill selection from the backend (GET /api/v1/maker_path_variables) when makerPathId provided
    useEffect(() => {
        const prefillFromServer = async () => {
            try {
                if (!makerPathId || makerPathId <= 0) return;

                const variablesToCheck: string[] = input_file_variable
                    ? [input_file_variable]
                    : required_sources;
                if (!variablesToCheck || variablesToCheck.length === 0) return;

                const list = await getMakerPathVariables(makerPathId);
                if (!Array.isArray(list)) return;

                // Build next maps based on server values
                const nextSelection: Record<string, number | ''> = { ...selectionMap };
                const nextLastPosted: Record<string, number | undefined> = { ...lastPosted };

                for (const variableName of variablesToCheck) {
                    const found = list.find((item) => {
                        const nameMatch = item.variableName === variableName;
                        const indexMatch =
                            typeof inputFileVariableIndexNumber === 'number'
                                ? item.variableIndexNumber === inputFileVariableIndexNumber
                                : true;
                        return nameMatch && indexMatch;
                    });
                    if (found && typeof found.ragMultimodalSourceId === 'number') {
                        nextSelection[variableName] = found.ragMultimodalSourceId;
                        nextLastPosted[variableName] = found.ragMultimodalSourceId;
                    }
                }

                setSelectionMap(nextSelection);
                setLastPosted(nextLastPosted);
                // If we successfully prefilled at least one selection, mark step as complete once
                const hasAnyPrefill = Object.values(nextSelection).some((v) => typeof v === 'number');
                if (hasAnyPrefill && !didAutoComplete && step_id && onMarkStepComplete) {
                    onMarkStepComplete(step_id);
                    setDidAutoComplete(true);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to prefill maker path variables', e);
            }
        };

        prefillFromServer();
        // We intentionally do not include selectionMap/lastPosted as deps to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [makerPathId, input_file_variable || '', required_sources.join('|')]);

    const handleChange = async (variableName: string, value: string) => {
        // Normalize selection value
        const numericOrEmpty = value !== '' ? Number(value) : '';
        setSelectionMap((prev) => ({...prev, [variableName]: numericOrEmpty}));

        // Only persist when we have a valid makerPathId and a valid numeric selection
        const hasMakerPath = typeof makerPathId === 'number' && makerPathId > 0;
        const isNumber = typeof numericOrEmpty === 'number' && !Number.isNaN(numericOrEmpty);
        if (!hasMakerPath || !isNumber) return;

        const selectedId = numericOrEmpty as number;

        // Idempotency: avoid re-posting the same exact value for the same variable
        if (lastPosted[variableName] === selectedId) return;

        try {
            const indexNumber = inputFileVariableIndexNumber as number;

            const selectedSource = sources.find((s) => s.id === selectedId);
            const payload = {
                makerPathId: makerPathId as number,
                variableIndexNumber: indexNumber,
                ragMultimodalSourceId: selectedId,
                variableName,
                variableValue: {
                    sourceType: input_source_type,
                    sourceName: selectedSource?.name ?? null,
                    stepId: step_id ?? null,
                },
            } as const;

            // If the step is completed (chip shown), use PUT; otherwise POST
            if (didAutoComplete) {
                await putMakerPathVariable(payload as any);
            } else {
                await postMakerPathVariable(payload as any);
            }

            // Mark as posted
            setLastPosted((prev) => ({...prev, [variableName]: selectedId}));
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to create maker path variable', err);
        }
    };

    // Removed recomputeFilesSources – we no longer render a debug preview

    const hasRequirements = !!input_file_variable || required_sources.length > 0;

    const anySelectionMade = useMemo(() => {
        return Object.values(selectionMap).some((v) => v !== '' && v !== undefined && v !== null);
    }, [selectionMap]);

    // When user makes a selection manually, also mark complete (without auto-advance)
    useEffect(() => {
        if (anySelectionMade && !didAutoComplete && step_id && onMarkStepComplete) {
            onMarkStepComplete(step_id);
            setDidAutoComplete(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anySelectionMade]);

    const sourceOptions = useMemo(() => sources, [sources]);

    // Next button should only advance; persistence happens on selection change
    const handleNextClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onNext?.();
    };

    return (
        <div className="space-y-3">
            {/* Header row (icon only to avoid literal strings) */}
            <div className="flex items-center gap-2 text-slate-400">
                <Database size={16}/>
                {/* Avoid raw strings to comply with i18n lint; using a common key if available */}
                <span className="text-xs font-medium">{t?.common?.select}</span>
            </div>

            {/* Lightweight loading indicator to use isLoading state and inform user */}
            {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs" aria-live="polite">
                    <Database size={12} className="animate-spin"/>
                    <span>{t?.common?.loading}</span>
                </div>
            )}

            {/* Required selectors */}
            <div className="space-y-2">
                {hasRequirements && (input_file_variable ? [input_file_variable] : required_sources).map((variable) => (
                    <div key={variable} className="flex items-center gap-2">
                        <code
                            className="text-[11px] px-2 py-1 rounded bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200">
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
                {/* Next button replaces Save and shows only when a selection exists */}
                {anySelectionMade && (
                    <button
                        type="button"
                        onClick={handleNextClick}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        {t?.common?.next}
                    </button>
                )}
            </div>

            {/* Debug preview removed per simplification requirement */}

            {/* Error (kept silent visually except a small indicator using i18n-safe key) */}
            {error && <div className="sr-only">{error}</div>}
        </div>
    );
};

export default RagLibrarySelector;
