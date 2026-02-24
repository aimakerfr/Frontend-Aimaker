import React, { useState, useEffect } from 'react';
import {
    Languages,
    Download,
    Check,
    Loader2,
    AlertCircle,
    FileCode,
    FileJson,
    Sparkles
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';
import { getMakerPathVariables, putMakerPathVariable } from '@core/maker-path-variables';
import { extractTextFromCode, extractTextFromHTML } from '../utils/astExtractor';

interface TranslationProcessorProps {
    makerPathId?: number;
    variableIndexNumber?: number;
    stepId?: number;
    onMarkStepComplete?: (stepId: number) => void;
    onNextStep?: (currentStepId: number) => void;
    required?: boolean;
}

const TranslationProcessor: React.FC<TranslationProcessorProps> = ({
    makerPathId,
    variableIndexNumber,
    stepId,
    onMarkStepComplete,
    onNextStep: _onNextStep,
    required: _required,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [sourceData, setSourceData] = useState<{ content: string; name: string; type: string } | null>(null);
    const [extractedKeys, setExtractedKeys] = useState<Record<string, string>>({});
    const [translations, setTranslations] = useState<Record<string, any>>({});

    // Load source from maker path variables
    useEffect(() => {
        if (!makerPathId) return;

        const loadSource = async () => {
            setLoading(true);
            try {
                const variables = await getMakerPathVariables(makerPathId);
                // Step 1 usually saves to index 1 or 'uploaded_file_content'
                const sourceVar = variables.find(v => v.variableName === 'uploaded_file_content' || v.variableIndexNumber === 1);

                if (sourceVar && sourceVar.variableValue) {
                    const val = sourceVar.variableValue as any;
                    const content = val.content || '';
                    const name = val.fileName || 'source.tsx';
                    const type = val.fileType || 'CODE';

                    setSourceData({ content, name, type });

                    // Extract keys immediately
                    const keys = type === 'HTML' ? extractTextFromHTML(content) : extractTextFromCode(content, name);
                    setExtractedKeys(keys);

                    // Save extracted keys to variable Index 2 (or whatever this step is) for Step 3 to use
                    if (variableIndexNumber !== undefined) {
                        await putMakerPathVariable({
                            makerPathId,
                            variableIndexNumber,
                            variableName: 'extracted_keys',
                            variableValue: keys
                        });
                    }
                }
            } catch (err: any) {
                setError('Error cargando fuente: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadSource();
    }, [makerPathId, variableIndexNumber]);

    const handleTranslateAll = async () => {
        if (!extractedKeys || Object.keys(extractedKeys).length === 0) {
            setError('No hay llaves para traducir');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.post<any>('/api/v1/translation/translate-json', {
                variables: extractedKeys,
                target_lang: null // Null triggers all 3 (es, en, fr) in backend
            });

            const rawTranslations = response.raw_translations;
            setTranslations(rawTranslations);

            // Save all 3 to variables for Box 3
            if (makerPathId && variableIndexNumber !== undefined) {
                const langs: ('es' | 'en' | 'fr')[] = ['es', 'en', 'fr'];
                for (const lang of langs) {
                    await putMakerPathVariable({
                        makerPathId,
                        variableIndexNumber: variableIndexNumber + (lang === 'es' ? 1 : lang === 'en' ? 2 : 3),
                        variableName: `translation_${lang}`,
                        variableValue: rawTranslations[lang]
                    });
                }
            }

            setSuccess('Traducciones ES, EN y FR listas. Ahora genera el código.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(`Error en traducción masiva: ` + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };


    const downloadOriginalJson = () => {
        const blob = new Blob([JSON.stringify(extractedKeys, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extracted_original.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAutoI18n = async () => {
        if (!sourceData || !extractedKeys) return;

        setLoading(true);
        try {
            let modifiedCode = sourceData.content;
            const isJSX = sourceData.name.endsWith('.tsx') || sourceData.name.endsWith('.jsx');
            const isTS = sourceData.name.endsWith('.ts') || sourceData.name.endsWith('.js');

            // Sort keys by value length (desc) to avoid partial replacements
            const sortedKeys = Object.entries(extractedKeys).sort((a, b) => b[1].length - a[1].length);

            for (const [key, value] of sortedKeys) {
                const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                if (isJSX) {
                    // 1. Text inside tags: >Value< -> >{t.makerPathTranslations?.['text_N']}<
                    const tagRegex = new RegExp(`>\\s*${escapedValue}\\s*<`, 'g');
                    modifiedCode = modifiedCode.replace(tagRegex, `>{t.makerPathTranslations?.['${key}']}<`);

                    // 2. Attributes: attr="Value" -> attr={t.makerPathTranslations?.['text_N']}
                    const attrRegex = new RegExp(`=\\s*["']${escapedValue}["']`, 'g');
                    modifiedCode = modifiedCode.replace(attrRegex, `={t.makerPathTranslations?.['${key}']}`);

                    // 3. Simple strings in quotes inside JSX logic/props
                    const quoteRegex = new RegExp(`(?<=[\\s({[:])["']${escapedValue}["'](?=[\\s)},;?])`, 'g');
                    modifiedCode = modifiedCode.replace(quoteRegex, `t.makerPathTranslations?.['${key}']`);
                } else if (isTS) {
                    // For TS/JS files (like data objects), we must ensure it's valid syntax.
                    // Replace 'Value' with t.makerPathTranslations?.['key'] ?? 'Value'
                    // but ONLY if it's not a key itself.
                    const tsQuoteRegex = new RegExp(`(?<=:\\s*)["']${escapedValue}["']`, 'g');
                    modifiedCode = modifiedCode.replace(tsQuoteRegex, `t.makerPathTranslations?.['${key}'] ?? '${value}'`);
                } else {
                    // HTML / other simple replacement
                    const genericRegex = new RegExp(escapedValue, 'g');
                    modifiedCode = modifiedCode.replace(genericRegex, `{{t.makerPathTranslations?.['${key}']}}`);
                }
            }

            // Inject useLanguage context handling or Refactor .ts to function
            if (isJSX) {
                // Add import if missing
                if (!modifiedCode.includes('useLanguage')) {
                    modifiedCode = `import { useLanguage } from '@apps/fablab/language/useLanguage';\n` + modifiedCode;
                }

                // Inject const { t } = useLanguage() INSIDE the component
                if (!modifiedCode.includes('const { t } = useLanguage()')) {
                    // Try to find the start of a functional component
                    const componentMatch = modifiedCode.match(/(?:export\s+)?(?:const|function)\s+\w+.*?\s*=>\s*{\s*|function\s+\w+\s*\(.*?\)\s*{\s*/);
                    if (componentMatch) {
                        const match = componentMatch[0];
                        modifiedCode = modifiedCode.replace(match, `${match}\n  const { t } = useLanguage();`);
                    }
                }
            } else if (isTS) {
                // Robust refactoring for .ts data files
                // 1. Convert "export const INITIAL_MAKERPATHS: ... = {" into "export const getInitialMakerPaths = (t: any): ... => ({"
                const staticExportRegex = /export\s+const\s+(\w+)(?::\s*([^=]+))?\s*=\s*{/;
                const match = modifiedCode.match(staticExportRegex);

                if (match) {
                    const varName = match[1];
                    const typePart = match[2] ? `: ${match[2].trim()}` : '';

                    // Generate a better function name (e.g., getInitialMakerPaths)
                    const funcName = varName.startsWith('INITIAL_')
                        ? 'get' + varName.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
                        : `get${varName.charAt(0).toUpperCase()}${varName.slice(1)}`;

                    // Replace the start of the export
                    modifiedCode = modifiedCode.replace(match[0], `export const ${funcName} = (t: any)${typePart} => ({`);

                    // Replace the closing brace at the end of the file if it matches
                    // This is simple but works for most config objects
                    if (modifiedCode.trim().endsWith('};')) {
                        modifiedCode = modifiedCode.replace(/};\s*$/, '});');
                    }
                }

                // Ensure a safety check for 't' if not already refactored
                if (!modifiedCode.includes('(t: any)') && modifiedCode.includes('t.makerPathTranslations')) {
                    modifiedCode = `/* NOTE: This file depends on 't'. Ensure it is passed as a param. */\n` + modifiedCode;
                }
            }

            // Download it
            const blob = new Blob([modifiedCode], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `i18n_${sourceData.name}`;
            a.click();
            URL.revokeObjectURL(url);

            // Save to variables for Box 3 to save to library
            if (makerPathId && variableIndexNumber !== undefined) {
                await putMakerPathVariable({
                    makerPathId,
                    variableIndexNumber: variableIndexNumber + 4, // unique index for i18n code
                    variableName: 'i18n_modified_code',
                    variableValue: {
                        fileName: `i18n_${sourceData.name}`,
                        content: modifiedCode,
                        fileType: sourceData.type
                    }
                });
            }

            setSuccess('Código con Auto-i18n generado y descargado');
            setTimeout(() => setSuccess(null), 3000);

            // Auto complete this step
            if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);

        } catch (err: any) {
            setError('Error en Auto-i18n: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Languages className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Paso 2: Procesar Traducciones</h3>
                    <p className="text-xs text-gray-500">Analiza, traduce y prepara el código para i18n.</p>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                    <p className="text-sm text-gray-500">Sincronizando fuente...</p>
                </div>
            )}

            {!loading && sourceData && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Extracción AST</p>
                            <div className="flex items-center gap-2">
                                <FileCode size={14} className="text-indigo-500" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    {Object.keys(extractedKeys).length} variables
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={downloadOriginalJson}
                            className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all group"
                        >
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-left">Referencia</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileJson size={14} className="text-amber-500" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Original JSON</span>
                                </div>
                                <Download size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    </div>

                    {/* Translation Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">1. Traducir Contenido</h4>
                            {Object.keys(translations).length > 0 && (
                                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                    <Check size={10} /> Listas
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleTranslateAll}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
                            <span>Traducir a ES, EN y FR</span>
                        </button>

                        {/* Individual buttons removed to simplify workflow as requested */}
                    </div>

                    {/* Auto-i18n Section */}
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">2. Preparar Código</h4>
                        <button
                            onClick={handleAutoI18n}
                            disabled={loading || Object.keys(extractedKeys).length === 0}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            <Sparkles size={20} className="group-hover:animate-pulse" />
                            <span>Generar Código con Auto-i18n</span>
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                            Reemplaza textos por variables y añade hooks automáticamente.
                        </p>
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
                    <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-medium">{success}</p>
                </div>
            )}
        </div>
    );
};

export default TranslationProcessor;
