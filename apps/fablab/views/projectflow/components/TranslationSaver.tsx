import React, { useState, useEffect } from 'react';
import {
    Save,
    Check,
    Database,
    Loader2,
    AlertCircle,
    FileCode,
    Globe,
    ArrowRight,
    Download,
    Undo2
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';
import { getMakerPathVariables } from '@core/maker-path-variables';

interface TranslationSaverProps {
    makerPathId?: number;
    variableIndexNumber?: number;
    stepId?: number;
    onMarkStepComplete?: (stepId: number) => void;
    required?: boolean;
}

const TranslationSaver: React.FC<TranslationSaverProps> = ({
    makerPathId,
    variableIndexNumber: _variableIndexNumber,
    stepId,
    onMarkStepComplete,
}) => {
    const [loading, setLoading] = useState(false);
    const [savingToProject, setSavingToProject] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [projectPath, setProjectPath] = useState<string | null>(null);
    const [previousContent, setPreviousContent] = useState<any>(null);

    const [results, setResults] = useState<{
        es: any;
        en: any;
        fr: any;
        i18n_code: any;
    }>({ es: null, en: null, fr: null, i18n_code: null });

    // Load results from maker path variables
    useEffect(() => {
        if (!makerPathId) return;

        const loadResults = async () => {
            setLoading(true);
            try {
                const variables = await getMakerPathVariables(makerPathId);

                const es = variables.find(v => v.variableName === 'translation_es')?.variableValue;
                const en = variables.find(v => v.variableName === 'translation_en')?.variableValue;
                const fr = variables.find(v => v.variableName === 'translation_fr')?.variableValue;
                const i18n_code = variables.find(v => v.variableName === 'i18n_modified_code')?.variableValue;

                setResults({ es, en, fr, i18n_code });
            } catch (err: any) {
                setError('Error cargando resultados: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [makerPathId]);

    const saveToLibrary = async (type: 'es' | 'en' | 'fr' | 'code') => {
        const data = type === 'code' ? results.i18n_code : results[type];
        if (!data) return;

        setError(null);
        try {
            const payload = new FormData();
            if (type === 'code') {
                payload.append('title', data.fileName);
                payload.append('type', data.fileType || 'CODE');
                payload.append('data', JSON.stringify({ content: data.content }));
            } else {
                payload.append('title', `Translation ${type.toUpperCase()}`);
                payload.append('type', 'JSON');
                payload.append('data', JSON.stringify({ content: data }));
            }

            await httpClient.post('/api/v1/objects/upload', payload);
            setSuccess(`Guardado en biblioteca (${type.toUpperCase()})`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(`Error guardando ${type.toUpperCase()}: ` + err.message);
        }
    };

    const downloadJson = (lang: 'es' | 'en' | 'fr') => {
        const data = results[lang];
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation_${lang}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleApplyToProject = async () => {
        if (!results.es && !results.en && !results.fr && !results.i18n_code) {
            setError('No hay traducciones ni código para aplicar');
            return;
        }

        setSavingToProject(true);
        setError(null);
        try {
            // Obtener el nombre del archivo fuente
            const sourceFileName = results.i18n_code?.fileName
                ? results.i18n_code.fileName.replace(/^i18n_/, '')
                : 'source.tsx';

            const response = await httpClient.post<any>('/api/v1/translation/save-to-project', {
                translations: {
                    es: results.es,
                    en: results.en,
                    fr: results.fr
                },
                source_file_name: sourceFileName, // Enviar nombre del archivo
                i18n_code: results.i18n_code ? {
                    content: results.i18n_code.content,
                    fileName: sourceFileName
                } : null
            });

            // Guardar el contenido previo para poder revertir
            setPreviousContent(response.previousContent || null);
            
            setSuccess('¡Todo aplicado correctamente!');
            setProjectPath(response.path || 'apps/fablab/language/locales/');

            if (stepId && onMarkStepComplete) onMarkStepComplete(stepId);
        } catch (err: any) {
            setError('Error al aplicar al proyecto: ' + (err.message || 'Error desconocido'));
        } finally {
            setSavingToProject(false);
        }
    };

    const handleRevertChanges = async () => {
        if (!previousContent) {
            setError('No hay contenido previo para revertir');
            return;
        }

        setReverting(true);
        setError(null);
        try {
            await httpClient.post('/api/v1/translation/revert-changes', {
                previousContent
            });

            setSuccess('Cambios revertidos correctamente');
            setProjectPath(null);
            setPreviousContent(null);
            
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err: any) {
            setError('Error al revertir cambios: ' + (err.message || 'Error desconocido'));
        } finally {
            setReverting(false);
        }
    };

    const canApply = results.es || results.en || results.fr || results.i18n_code;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Save className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Paso 3: Guardar y Aplicar</h3>
                    <p className="text-xs text-gray-500">Finaliza el proceso guardando en la biblioteca o el proyecto.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Important Notice */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            <strong>💡 Todas las opciones son opcionales:</strong><br/>
                            • Puedes guardar solo los JSON de traducciones<br/>
                            • Puedes descargar sin aplicar al proyecto<br/>
                            • Aplicar al proyecto modificará los archivos de idioma
                        </p>
                    </div>

                    {/* Results Summary */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Opción 1: Descargar JSONs de Traducción</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {(['es', 'en', 'fr'] as const).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => saveToLibrary(lang)}
                                    disabled={!results[lang]}
                                    className={`
                    flex items-center justify-between p-3 rounded-xl border-2 transition-all group
                    ${results[lang]
                                            ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                                            : 'bg-gray-50 dark:bg-gray-800/20 border-gray-50 dark:border-gray-800/50 opacity-50 cursor-not-allowed'}
                  `}
                                >
                                    <div className="flex items-center gap-2">
                                        <Globe size={14} className={results[lang] ? "text-blue-500" : "text-gray-400"} />
                                        <span className="text-xs font-bold uppercase">{lang}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); saveToLibrary(lang); }}
                                            className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                            title="Guardar en Biblioteca"
                                        >
                                            <Database size={14} className="text-gray-400 hover:text-emerald-500 transition-colors" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); downloadJson(lang); }}
                                            className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            title="Descargar JSON"
                                        >
                                            <Download size={14} className="text-gray-400 hover:text-blue-500 transition-colors" />
                                        </button>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={() => saveToLibrary('code')}
                                disabled={!results.i18n_code}
                                className={`
                  flex items-center justify-between p-3 rounded-xl border-2 transition-all group
                  ${results.i18n_code
                                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                                        : 'bg-gray-50 dark:bg-gray-800/20 border-gray-50 dark:border-gray-800/50 opacity-50 cursor-not-allowed'}
                `}
                            >
                                <div className="flex items-center gap-2">
                                    <FileCode size={14} className={results.i18n_code ? "text-purple-500" : "text-gray-400"} />
                                    <span className="text-xs font-bold uppercase">Código i18n</span>
                                </div>
                                <Database size={14} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Apply to Project Button */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Opción 2: Aplicar al Proyecto (Modifica Archivos)</h4>
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                            ⚠️ Esta opción modificará los archivos de idioma del proyecto
                        </p>
                        {projectPath ? (
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-500/30 rounded-3xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-500/5">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none animate-bounce">
                                    <Check size={32} strokeWidth={3} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">¡Misión Completada!</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Se han actualizado las traducciones y el código fuente.
                                    </p>
                                </div>
                                <div className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                                    <Database size={16} className="text-emerald-500" />
                                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 break-all text-left">
                                        {projectPath}
                                    </span>
                                </div>
                                <div className="flex gap-3 w-full">
                                    {previousContent && (
                                        <button
                                            onClick={handleRevertChanges}
                                            disabled={reverting}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                        >
                                            {reverting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="text-sm">Revirtiendo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Undo2 size={16} />
                                                    <span className="text-sm">Revertir Cambios</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 py-3 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex items-center justify-center gap-1"
                                    >
                                        Nueva Traducción <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleApplyToProject}
                                disabled={savingToProject || !canApply}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all group disabled:opacity-50 disabled:scale-100"
                            >
                                {savingToProject ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        <span>Aplicando Cambios...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={24} />
                                        <span>Aplicar TODO al Proyecto</span>
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && !projectPath && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {success && !projectPath && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                </div>
            )}
        </div>
    );
};

export default TranslationSaver;
