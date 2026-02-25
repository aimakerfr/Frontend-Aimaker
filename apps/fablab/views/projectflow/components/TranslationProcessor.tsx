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

            // Determinar el nombre del objeto de traducción según el archivo fuente
            // Always camelCase (lowercase first letter) so it matches the language file keys
            const fileBaseName = sourceData.name.replace(/\.[^.]+$/, '');
            const translationObject = fileBaseName.charAt(0).toLowerCase() + fileBaseName.slice(1) + 'Translations';

            // Sort keys by value length (desc) to avoid partial replacements
            const sortedKeys = Object.entries(extractedKeys).sort((a, b) => b[1].length - a[1].length);

            for (const [key, value] of sortedKeys) {
                // Escape special regex characters properly
                const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                if (isJSX) {
                    // 1. Text inside tags: >Value< -> >{t.[obj]?.['text_N']}<
                    const tagRegex = new RegExp(`>\\s*${escapedValue}\\s*<`, 'g');
                    modifiedCode = modifiedCode.replace(tagRegex, `>{t.${translationObject}?.['${key}']}<`);

                    // 2. Attributes: attr="Value" -> attr={t.[obj]?.['text_N']}
                    const attrDoubleQuote = new RegExp(`=\\s*"${escapedValue}"`, 'g');
                    const attrSingleQuote = new RegExp(`=\\s*'${escapedValue}'`, 'g');
                    modifiedCode = modifiedCode.replace(attrDoubleQuote, `={t.${translationObject}?.['${key}']}`);
                    modifiedCode = modifiedCode.replace(attrSingleQuote, `={t.${translationObject}?.['${key}']}`);

                    // 3. TypeScript/JavaScript logic (NOT in JSX context)
                    const varAssignDoubleQuote = new RegExp(`(?<=(let|const|var)\\s+\\w+\\s*=\\s*)"${escapedValue}"`, 'g');
                    const varAssignSingleQuote = new RegExp(`(?<=(let|const|var)\\s+\\w+\\s*=\\s*)'${escapedValue}'`, 'g');
                    modifiedCode = modifiedCode.replace(varAssignDoubleQuote, `t.${translationObject}?.['${key}'] ?? "${value}"`);
                    modifiedCode = modifiedCode.replace(varAssignSingleQuote, `t.${translationObject}?.['${key}'] ?? '${value}'`);

                    // Object property values: key: "value"
                    const objPropDoubleQuote = new RegExp(`(?<=:\\s*)"${escapedValue}"(?=\\s*[,}])`, 'g');
                    const objPropSingleQuote = new RegExp(`(?<=:\\s*)'${escapedValue}'(?=\\s*[,}])`, 'g');
                    modifiedCode = modifiedCode.replace(objPropDoubleQuote, `t.${translationObject}?.['${key}'] ?? "${value}"`);
                    modifiedCode = modifiedCode.replace(objPropSingleQuote, `t.${translationObject}?.['${key}'] ?? '${value}'`);

                    // Function arguments and array elements
                    const funcArgDoubleQuote = new RegExp(`(?<=[,(\[]\\s*)"${escapedValue}"(?=\\s*[,)\]])`, 'g');
                    const funcArgSingleQuote = new RegExp(`(?<=[,(\[]\\s*)'${escapedValue}'(?=\\s*[,)\]])`, 'g');
                    modifiedCode = modifiedCode.replace(funcArgDoubleQuote, `t.${translationObject}?.['${key}'] ?? "${value}"`);
                    modifiedCode = modifiedCode.replace(funcArgSingleQuote, `t.${translationObject}?.['${key}'] ?? '${value}'`);
                } else if (isTS) {
                    // Para archivos TS/JS
                    const tsValueDoubleQuote = new RegExp(`(?<=:\\s*)"${escapedValue}"(?=\\s*[,}])`, 'g');
                    const tsValueSingleQuote = new RegExp(`(?<=:\\s*)'${escapedValue}'(?=\\s*[,}])`, 'g');
                    modifiedCode = modifiedCode.replace(tsValueDoubleQuote, `t.${translationObject}?.['${key}'] ?? "${value}"`);
                    modifiedCode = modifiedCode.replace(tsValueSingleQuote, `t.${translationObject}?.['${key}'] ?? '${value}'`);
                } else {
                    // HTML / otros
                    const genericRegex = new RegExp(escapedValue, 'g');
                    modifiedCode = modifiedCode.replace(genericRegex, `{{t.${translationObject}?.['${key}']}}`);
                }

                // ── Catch-all for JSX/TS ──────────────────────────────────────────────
                // Replaces any remaining occurrences not covered by the patterns above.
                // Covers: ternary expressions, return statements, default parameters, etc.
                // Negative lookahead (?!\s*:) prevents replacing object property KEYS.
                if (isJSX || isTS) {
                    const safeValue = value.replace(/"/g, '\\"');
                    const safeValueSingle = value.replace(/'/g, "\\'");
                    const catchAllDouble = new RegExp(`"${escapedValue}"(?!\\s*:)`, 'g');
                    const catchAllSingle = new RegExp(`'${escapedValue}'(?!\\s*:)`, 'g');
                    modifiedCode = modifiedCode.replace(catchAllDouble, `(t.${translationObject}?.['${key}'] ?? "${safeValue}")`);
                    modifiedCode = modifiedCode.replace(catchAllSingle, `(t.${translationObject}?.['${key}'] ?? '${safeValueSingle}')`);
                }
            }

            // Inject useLanguage context handling or Refactor .ts to function
            if (isJSX) {
                // Add import if missing
                if (!modifiedCode.includes('useLanguage')) {
                    // Find first import statement to add after it, or add at the beginning
                    const firstImportMatch = modifiedCode.match(/^import\s+.*?;/m);
                    if (firstImportMatch) {
                        const importIndex = modifiedCode.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
                        modifiedCode = modifiedCode.slice(0, importIndex) + 
                                      `\nimport { useLanguage } from '@apps/fablab/language/useLanguage';` + 
                                      modifiedCode.slice(importIndex);
                    } else {
                        modifiedCode = `import { useLanguage } from '@apps/fablab/language/useLanguage';\n\n` + modifiedCode;
                    }
                }

                // Inject const { t } = useLanguage() INSIDE the component
                if (!modifiedCode.includes('const { t } = useLanguage()')) {
                    // Try to find the start of a functional component - more robust regex
                    const componentMatches = [
                        /(?:export\s+default\s+)?(?:const|function)\s+(\w+)(?:<[^>]*>)?\s*(?::\s*React\.FC[^=]*?)?\s*=\s*\([^)]*\)\s*=>\s*\{/,
                        /(?:export\s+default\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/,
                        /(?:export\s+)?const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/
                    ];
                    
                    for (const regex of componentMatches) {
                        const componentMatch = modifiedCode.match(regex);
                        if (componentMatch) {
                            const fullMatch = componentMatch[0];
                            const replacement = fullMatch + '\n  const { t } = useLanguage();\n';
                            modifiedCode = modifiedCode.replace(fullMatch, replacement);
                            break;
                        }
                    }
                }
            } else if (isTS) {
                // Robust refactoring for .ts data files
                // 1. Convert "export const INITIAL_MAKERPATHS: ... = {" into "export const getInitialMakerPaths = (t: any): ... => ({"
                const staticExportRegex = /export\s+const\s+(\w+)(?::\s*([^=]+))?\s*=\s*\{/;
                const match = modifiedCode.match(staticExportRegex);

                if (match) {
                    const varName = match[1];
                    const typePart = match[2] ? `: ${match[2].trim()}` : '';

                    // Generate a better function name (e.g., getInitialMakerPaths)
                    const funcName = varName.startsWith('INITIAL_')
                        ? 'get' + varName.toLowerCase().split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('')
                        : `get${varName.charAt(0).toUpperCase()}${varName.slice(1)}`;

                    // Replace the start of the export - ensure proper spacing
                    modifiedCode = modifiedCode.replace(match[0], `export const ${funcName} = (t: any)${typePart} => ({`);

                    // Replace the closing brace at the end of the file if it matches
                    // More robust - handle different whitespace patterns
                    const closingPattern = /\};\s*$/;
                    if (closingPattern.test(modifiedCode.trim())) {
                        modifiedCode = modifiedCode.replace(closingPattern, '});');
                    }
                    
                    // Also handle case where file ends with just }
                    const altClosingPattern = /\}\s*$/;
                    if (altClosingPattern.test(modifiedCode.trim()) && !modifiedCode.trim().endsWith('});')) {
                        modifiedCode = modifiedCode.replace(altClosingPattern, '});');
                    }
                }

                // Ensure a safety check for 't' if not already refactored
                if (!modifiedCode.includes('(t: any)') && modifiedCode.includes('t.makerPathTranslations')) {
                    modifiedCode = `/* NOTE: This file depends on 't' parameter. Ensure it is passed correctly. */\n\n` + modifiedCode;
                }
            }

            // Final syntax validation - check for common issues
            const syntaxIssues: string[] = [];
            
            // Check for unmatched braces/brackets/parentheses
            const openBraces = (modifiedCode.match(/\{/g) || []).length;
            const closeBraces = (modifiedCode.match(/\}/g) || []).length;
            const openBrackets = (modifiedCode.match(/\[/g) || []).length;
            const closeBrackets = (modifiedCode.match(/\]/g) || []).length;
            const openParens = (modifiedCode.match(/\(/g) || []).length;
            const closeParens = (modifiedCode.match(/\)/g) || []).length;
            
            if (openBraces !== closeBraces) {
                syntaxIssues.push(`Unmatched braces: ${openBraces} open vs ${closeBraces} close`);
            }
            if (openBrackets !== closeBrackets) {
                syntaxIssues.push(`Unmatched brackets: ${openBrackets} open vs ${closeBrackets} close`);
            }
            if (openParens !== closeParens) {
                syntaxIssues.push(`Unmatched parentheses: ${openParens} open vs ${closeParens} close`);
            }
            
            // Check for consecutive operators that might indicate syntax errors
            if (/[=<>!]{3,}/.test(modifiedCode)) {
                syntaxIssues.push('Potential invalid operators detected');
            }
            
            // Warn if issues found but don't block
            if (syntaxIssues.length > 0) {
                console.warn('⚠️ Potential syntax issues detected:', syntaxIssues);
                modifiedCode = `/* ⚠️ WARNING: Potential syntax issues detected:\n${syntaxIssues.map(issue => ` * - ${issue}`).join('\n')}\n * Please review the code carefully before using.\n */\n\n` + modifiedCode;
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

            setSuccess('Código con Auto-i18n generado y descargado (opcional - puedes continuar sin aplicarlo)');
            setTimeout(() => setSuccess(null), 3000);

            // Don't auto-complete - let user decide when to move forward
            // if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);

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
                        <h4 className="text-xs font-bold text-gray-400 uppercase">2. Preparar Código (Opcional)</h4>
                        <button
                            onClick={handleAutoI18n}
                            disabled={loading || Object.keys(extractedKeys).length === 0}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            <Sparkles size={20} className="group-hover:animate-pulse" />
                            <span>Generar Código con Auto-i18n</span>
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                            Opcional: Reemplaza textos por variables. Puedes omitir este paso.
                        </p>
                    </div>

                    {/* Manual Step Complete */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => {
                                if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);
                                setSuccess('¡Paso completado! Puedes continuar.');
                                setTimeout(() => setSuccess(null), 2000);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            <Check size={16} />
                            <span>Continuar al siguiente paso</span>
                        </button>
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
