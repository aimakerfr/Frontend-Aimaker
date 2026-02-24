import React, { useState } from 'react';
import {
    Globe,
    Download,
    Upload,
    FileJson,
    Check,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';

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
    const [langCode, setLangCode] = useState('');
    const [langName, setLangName] = useState('');
    const [importedData, setImportedData] = useState<any | null>(null);

    // Export a complete language file from the project as JSON
    const handleExportLanguage = async (lang: 'es' | 'en' | 'fr') => {
        setLoading(true);
        setError(null);
        try {
            const response = await httpClient.post<any>('/api/v1/translation/export-language-json', {
                language: lang
            });

            // Response should contain the JSON data directly
            const jsonData = response.data || response.translations;
            const jsonString = JSON.stringify(jsonData, null, 2);
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${lang}.json`;
            a.click();
            URL.revokeObjectURL(url);

            setSuccess(`✅ Archivo ${lang}.json descargado. Tradúcelo y súbelo de nuevo para agregarlo al proyecto.`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(`❌ Error exportando ${lang}: ` + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Import a language JSON file
    const handleImportLanguage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                
                // Parse JSON directly
                let parsedData;
                try {
                    parsedData = JSON.parse(content);
                } catch {
                    throw new Error('Formato JSON inválido. Verifica que el archivo sea JSON válido.');
                }

                setImportedData(parsedData);
                setSuccess(`✅ JSON cargado correctamente (${Object.keys(parsedData).length} traducciones). Completa el código y nombre del idioma para guardar.`);
            } catch (err: any) {
                setError('❌ ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Save the new language to database
    const handleSaveLanguage = async () => {
        if (!langCode || langCode.length !== 2) {
            setError('❌ El código de idioma debe tener 2 letras (ej: pt, de, it)');
            return;
        }

        if (!importedData) {
            setError('❌ Primero debes cargar un archivo JSON con las traducciones');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await httpClient.post('/api/v1/translation/add-language', {
                language: langCode.toLowerCase(),
                languageName: langName || langCode.toUpperCase(),
                translations: importedData
            });

            setSuccess(`✅ ¡Idioma ${langCode.toUpperCase()} guardado exitosamente! Ya está disponible en tu perfil.`);
            
            if (onLanguageAdded) {
                onLanguageAdded(langCode.toLowerCase());
            }

            // Reset form
            setLangCode('');
            setLangName('');
            setImportedData(null);
            
            // Clear file input
            const fileInput = document.getElementById('language-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError('❌ Error guardando idioma: ' + err.message);
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
                    Descargar Idiomas como JSON
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    {(['es', 'en', 'fr'] as const).map(lang => (
                        <button
                            key={lang}
                            onClick={() => handleExportLanguage(lang)}
                            disabled={loading}
                            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                        >
                            <FileJson size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{lang}.json</span>
                            <Download size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400 italic">
                    💡 Descarga, traduce externamente y vuelve a cargar
                </p>
            </div>

            {/* Import Language File */}
            <div className="space-y-3 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Upload size={12} />
                    Agregar Nuevo Idioma al Proyecto
                </h4>
                
                {/* Step 1: Language Code and Name */}
                <div className="space-y-2">
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Código del idioma (2 letras) *</span>
                        <input
                            type="text"
                            placeholder="ej: pt, de, it, ja"
                            value={langCode}
                            onChange={(e) => setLangCode(e.target.value.toLowerCase().slice(0, 2))}
                            maxLength={2}
                            className="mt-1 w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-400 dark:focus:border-blue-600 outline-none text-sm font-medium text-gray-900 dark:text-white"
                        />
                    </label>
                    <label className="block">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Nombre del idioma (opcional)</span>
                        <input
                            type="text"
                            placeholder="ej: Português, Deutsch, Italiano"
                            value={langName}
                            onChange={(e) => setLangName(e.target.value)}
                            className="mt-1 w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-400 dark:focus:border-blue-600 outline-none text-sm font-medium text-gray-900 dark:text-white"
                        />
                    </label>
                </div>

                {/* Step 2: Upload JSON */}
                <label className="block">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cargar archivo JSON traducido *</span>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImportLanguage}
                        className="hidden"
                        id="language-upload"
                    />
                    <div
                        onClick={() => document.getElementById('language-upload')?.click()}
                        className="mt-1 flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                    >
                        <Upload size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {importedData ? '✅ JSON cargado - Click para cambiar' : 'Click para cargar JSON'}
                        </span>
                    </div>
                </label>

                {/* Step 3: Save Button */}
                {importedData && langCode.length === 2 && (
                    <button
                        onClick={handleSaveLanguage}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        <span>Guardar Idioma {langCode.toUpperCase()} en el Proyecto</span>
                    </button>
                )}

                <p className="text-xs text-gray-400 italic">
                    💡 El idioma se guardará y aparecerá automáticamente en tu perfil
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
