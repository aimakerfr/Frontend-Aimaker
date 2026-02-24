import React, { useState } from 'react';
import {
    Globe,
    Download,
    Upload,
    Plus,
    FileJson,
    Check,
    Loader2,
    AlertCircle,
    Trash2,
    Code
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';
import { putMakerPathVariable } from '@core/maker-path-variables';

interface LanguageManagerProps {
    makerPathId?: number;
    variableIndexNumber?: number;
    onLanguageAdded?: (langCode: string) => void;
}

/**
 * Component for managing complete language files
 * - Export existing language files (en.ts, es.ts, fr.ts)
 * - Import/upload edited language files
 * - Add new custom languages
 * - Register new languages in the project
 */
const LanguageManager: React.FC<LanguageManagerProps> = ({
    makerPathId,
    variableIndexNumber,
    onLanguageAdded
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newLangCode, setNewLangCode] = useState('');
    const [importedLanguage, setImportedLanguage] = useState<{ code: string; data: any } | null>(null);

    // Export a complete language file from the project
    const handleExportLanguage = async (lang: 'es' | 'en' | 'fr') => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.post<any>('/api/v1/translation/export-language', {
                language: lang
            });

            const content = response.content;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${lang}.ts`;
            a.click();
            URL.revokeObjectURL(url);

            setSuccess(`Archivo ${lang}.ts descargado correctamente`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(`Error exportando ${lang}: ` + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Import a language file (can be edited or a new language)
    const handleImportLanguage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                
                // Extract language code from filename (e.g., "pt.ts" -> "pt")
                const langCode = file.name.replace(/\.tsx?$/, '');
                
                // Parse the TypeScript file to extract the translation object
                // This is a simplified parser - in production you might want to use AST
                const match = content.match(/export\s+const\s+\w+\s*:\s*Translations\s*=\s*(\{[\s\S]*\});?$/m);
                
                if (!match) {
                    throw new Error('Formato de archivo inválido. Debe ser un archivo TypeScript con export const.');
                }

                const translationData = match[1];
                
                // Try to parse as JSON (after converting TS object to JSON)
                // Note: This is simplified - real implementation should use proper TS parser
                let parsedData;
                try {
                    // Quick hack: eval in safe context (in production use proper parser)
                    parsedData = eval(`(${translationData})`);
                } catch {
                    throw new Error('No se pudo parsear el contenido del archivo');
                }

                setImportedLanguage({ code: langCode, data: parsedData });
                setSuccess(`Archivo ${file.name} cargado. Revisa y confirma para aplicar.`);
                setTimeout(() => setSuccess(null), 3000);
            } catch (err: any) {
                setError('Error al leer archivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Apply imported language to the project
    const handleApplyImportedLanguage = async () => {
        if (!importedLanguage) return;

        setLoading(true);
        setError(null);
        try {
            // Save to maker path variables
            if (makerPathId && variableIndexNumber !== undefined) {
                await putMakerPathVariable({
                    makerPathId,
                    variableIndexNumber: variableIndexNumber + 10, // unique offset
                    variableName: `language_${importedLanguage.code}`,
                    variableValue: importedLanguage.data
                });
            }

            // Send to backend to save in project files
            await httpClient.post('/api/v1/translation/add-language', {
                language: importedLanguage.code,
                translations: importedLanguage.data
            });

            setSuccess(`Idioma ${importedLanguage.code} agregado correctamente al proyecto`);
            
            if (onLanguageAdded) {
                onLanguageAdded(importedLanguage.code);
            }

            setImportedLanguage(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Error aplicando idioma: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add a new empty language
    const handleAddNewLanguage = async () => {
        if (!newLangCode || newLangCode.length !== 2) {
            setError('El código de idioma debe tener 2 letras (ej: pt, de, it)');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await httpClient.post('/api/v1/translation/add-language', {
                language: newLangCode.toLowerCase(),
                translations: {} // Empty translations - will copy from 'en' as template
            });

            setSuccess(`Idioma ${newLangCode} creado correctamente`);
            
            if (onLanguageAdded) {
                onLanguageAdded(newLangCode.toLowerCase());
            }

            setNewLangCode('');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Error creando idioma: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Globe className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gestión de Idiomas</h3>
                    <p className="text-xs text-gray-500">Exportar, importar y agregar idiomas al proyecto</p>
                </div>
            </div>

            {/* Export Existing Languages */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Download size={12} />
                    Exportar Idiomas Actuales
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    {(['es', 'en', 'fr'] as const).map(lang => (
                        <button
                            key={lang}
                            onClick={() => handleExportLanguage(lang)}
                            disabled={loading}
                            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                        >
                            <Code size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{lang}.ts</span>
                            <Download size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Import Language File */}
            <div className="space-y-3 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Upload size={12} />
                    Importar Idioma Editado
                </h4>
                <label className="block">
                    <input
                        type="file"
                        accept=".ts,.tsx"
                        onChange={handleImportLanguage}
                        className="hidden"
                        id="language-upload"
                    />
                    <div
                        onClick={() => document.getElementById('language-upload')?.click()}
                        className="flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                    >
                        <Upload size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cargar archivo .ts
                        </span>
                    </div>
                </label>

                {importedLanguage && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileJson size={16} className="text-blue-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {importedLanguage.code}.ts cargado
                                </span>
                            </div>
                            <button
                                onClick={() => setImportedLanguage(null)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                                <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                        <button
                            onClick={handleApplyImportedLanguage}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            <span>Aplicar al Proyecto</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Add New Language */}
            <div className="space-y-3 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Plus size={12} />
                    Crear Nuevo Idioma
                </h4>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Código (ej: pt, de, it)"
                        value={newLangCode}
                        onChange={(e) => setNewLangCode(e.target.value.toLowerCase().slice(0, 2))}
                        maxLength={2}
                        className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-400 dark:focus:border-blue-600 outline-none text-sm font-medium text-gray-900 dark:text-white"
                    />
                    <button
                        onClick={handleAddNewLanguage}
                        disabled={loading || newLangCode.length !== 2}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:scale-100"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 italic">
                    Se creará un archivo vacío que podrás editar y traducir después
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                </div>
            )}
        </div>
    );
};

export default LanguageManager;
