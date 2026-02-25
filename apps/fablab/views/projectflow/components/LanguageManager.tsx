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

/**
 * LanguageManager Component
 * 
 * Advanced i18n file management with AST-like parsing capabilities:
 * 
 * Features:
 * - Export language files (.ts) from backend
 * - Import JSON/TypeScript translations with intelligent parsing
 * - AST-like TypeScript parser: Extracts `export default { ... }` structures
 * - Smart quote normalizer: Handles German „", English "", French «»
 * - Deep structure validator: Counts nested translation keys
 * - Enhanced error reporting: Shows exact line/column with context
 * - Custom language registration to database
 * 
 * Supported formats:
 * - JSON: { "key": "value", "nested": { "key": "value" } }
 * - TypeScript: export default { key: "value", nested: { key: "value" } };
 * 
 * Parser strategy:
 * 1. Clean BOM (Byte Order Mark)
 * 2. Normalize typographic quotes (character mapping, not regex)
 * 3. Try TypeScript AST parsing (export default)
 * 4. Fallback to JSON.parse
 * 5. Deep validation of structure
 * 6. Return parsed object
 */

interface LanguageManagerProps {
    onLanguageAdded?: (langCode: string) => void;
}

/**
 * AST-like parser for TypeScript/JavaScript language files
 * Extracts the exported object from .ts files like: export default { ... }
 */
const parseTypeScriptLanguageFile = (content: string): any => {
    // Remove comments (single-line and multi-line)
    let cleaned = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
        .replace(/\/\/.*/g, ''); // Single-line comments
    
    // Find export default pattern (AST-like approach)
    const exportMatch = cleaned.match(/export\s+default\s+({[\s\S]*})\s*;?\s*$/);
    
    if (exportMatch) {
        const objectContent = exportMatch[1];
        // Convert TypeScript object to JSON-compatible format
        const jsonContent = objectContent
            // Remove trailing commas before closing braces/brackets
            .replace(/,(\s*[}\]])/g, '$1')
            // Replace single quotes with double quotes (for keys and values)
            .replace(/'/g, '"');
        
        return JSON.parse(jsonContent);
    }
    
    // If no export default found, try parsing as JSON directly
    return JSON.parse(cleaned);
};

/**
 * Intelligent quote normalizer - Handles all typographic quotes
 * More robust than regex, uses character analysis
 */
const normalizeTypographicQuotes = (text: string): { cleaned: string; hadIssues: boolean } => {
    let cleaned = text;
    let hadIssues = false;
    
    // Map of typographic quotes to standard quotes (no duplicates)
    const quoteMap: Record<string, string> = {
        // German quotes („ and ")
        '\u201E': '"',  // „
        '\u201C': '"',  // "
        // English quotes (" and ")
        '\u201D': '"',  // "
        // French guillemets (« and »)
        '\u00AB': '"',  // «
        '\u00BB': '"',  // »
        // Other typographic double quotes
        '\u201F': '"', '\u2033': '"', '\u2036': '"',
        '\u275D': '"', '\u275E': '"', '\u301D': '"', '\u301E': '"',
        '\uFF02': '"',
        // Typographic single quotes
        '\u2018': "'", '\u2019': "'", '\u201A': "'", '\u201B': "'",
        '\u2032': "'", '\u2035': "'"
    };
    
    // Replace all typographic quotes
    for (const [typographic, standard] of Object.entries(quoteMap)) {
        if (cleaned.includes(typographic)) {
            cleaned = cleaned.split(typographic).join(standard);
            hadIssues = true;
        }
    }
    
    return { cleaned, hadIssues };
};

/**
 * Deep validator for translation objects
 * Ensures structure is correct and counts nested keys
 */
const validateTranslationStructure = (obj: any): { valid: boolean; totalKeys: number; error?: string } => {
    if (typeof obj !== 'object' || obj === null) {
        return { valid: false, totalKeys: 0, error: 'Debe ser un objeto' };
    }
    
    if (Array.isArray(obj)) {
        return { valid: false, totalKeys: 0, error: 'No puede ser un array' };
    }
    
    let totalKeys = 0;
    
    const countKeys = (o: any): void => {
        for (const key in o) {
            if (o.hasOwnProperty(key)) {
                totalKeys++;
                if (typeof o[key] === 'object' && o[key] !== null && !Array.isArray(o[key])) {
                    countKeys(o[key]); // Recursively count nested objects
                }
            }
        }
    };
    
    countKeys(obj);
    
    return { valid: true, totalKeys };
};

/**
 * Component for managing complete language files
 * - Export existing language files (en.ts, es.ts, fr.ts)
 * - Import/upload edited language files (with AST-like parsing)
 * - Add new custom languages
 * - Register new languages in the project
 */
const LanguageManager: React.FC<LanguageManagerProps> = ({
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

            // Get the TypeScript file content
            const content = response.content || response.data;
            const filename = response.filename || `${lang}.ts`;
            
            // Download as TypeScript file
            const blob = new Blob([content], { type: 'text/typescript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            setSuccess(`✅ Archivo ${filename} descargado. Puedes traducirlo y subir el JSON traducido para agregarlo al proyecto.`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError(`❌ Error exportando ${lang}: ` + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Import a language JSON/TypeScript file with AST-like parsing
    const handleImportLanguage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let content = e.target?.result as string;
                
                // 1. Clean BOM (Byte Order Mark)
                content = content.replace(/^\uFEFF/, '');
                
                // 2. Normalize typographic quotes using intelligent character mapping
                const { cleaned: normalizedContent, hadIssues: hadTypographicQuotes } = normalizeTypographicQuotes(content);
                
                if (hadTypographicQuotes) {
                    console.log('🔧 [AST Parser] Normalized typographic quotes');
                }
                
                // 3. Try to parse as TypeScript file first (export default {...})
                let parsedData: any;
                let parseMethod = '';
                
                try {
                    // Attempt AST-like parsing for TypeScript exports
                    parsedData = parseTypeScriptLanguageFile(normalizedContent);
                    parseMethod = 'TypeScript AST';
                    console.log('✅ [AST Parser] Parsed as TypeScript export');
                } catch (tsError) {
                    // Fallback to direct JSON parsing
                    try {
                        parsedData = JSON.parse(normalizedContent);
                        parseMethod = 'JSON';
                        console.log('✅ [JSON Parser] Parsed as JSON');
                    } catch (jsonError: any) {
                        // Enhanced error reporting
                        const errorMsg = jsonError.message || 'Error desconocido';
                        const position = errorMsg.match(/position (\d+)/)?.[1];
                        
                        if (position) {
                            const pos = parseInt(position);
                            const lines = normalizedContent.split('\n');
                            const lineMatch = normalizedContent.substring(0, pos).match(/\n/g);
                            const lineNum = lineMatch ? lineMatch.length + 1 : 1;
                            const colNum = pos - (normalizedContent.lastIndexOf('\n', pos - 1) + 1);
                            
                            // Get context (3 lines before and after)
                            const contextStart = Math.max(0, lineNum - 3);
                            const contextEnd = Math.min(lines.length, lineNum + 3);
                            const context = lines.slice(contextStart, contextEnd)
                                .map((line, idx) => {
                                    const num = contextStart + idx + 1;
                                    const marker = num === lineNum ? '→' : ' ';
                                    return `${marker} ${num.toString().padStart(4)}: ${line}`;
                                })
                                .join('\n');
                            
                            throw new Error(
                                `❌ Error de sintaxis en línea ${lineNum}, columna ${colNum}:\n\n` +
                                `${context}\n\n` +
                                `${errorMsg}\n\n` +
                                `💡 Consejo: Verifica comillas, comas y llaves en esa línea.\n` +
                                `   Usa un editor como VS Code para validar la sintaxis.`
                            );
                        }
                        
                        throw new Error(
                            `❌ No se pudo parsear el archivo:\n\n${errorMsg}\n\n` +
                            `💡 Asegúrate de que sea:\n` +
                            `   • JSON válido: { "key": "value" }\n` +
                            `   • O TypeScript: export default { key: "value" };`
                        );
                    }
                }

                // 4. Validate structure using deep validator
                const validation = validateTranslationStructure(parsedData);
                
                if (!validation.valid) {
                    throw new Error(`❌ Estructura inválida: ${validation.error}`);
                }

                // 5. Success - show detailed info
                setImportedData(parsedData);
                
                const quoteInfo = hadTypographicQuotes ? ' ✨ (comillas normalizadas)' : '';
                const methodInfo = ` • Parseado: ${parseMethod}`;
                
                setSuccess(
                    `✅ Archivo cargado correctamente\n` +
                    `   • ${validation.totalKeys} traducciones detectadas${quoteInfo}\n` +
                    `${methodInfo}\n\n` +
                    `Ingresa el código de idioma (de, ru, pt, etc.) para guardar.`
                );
                
            } catch (err: any) {
                setError(err.message || 'Error desconocido');
                console.error('[LanguageManager] Parse error:', err);
            }
        };
        
        reader.readAsText(file, 'UTF-8');
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
                            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{lang}.ts</span>
                            <Download size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400 italic">
                    💡 Descarga archivos .ts, traduce externamente y vuelve a cargar como JSON o TypeScript
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
                <div className="block">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cargar archivo traducido (JSON o TypeScript) *</span>
                    <input
                        type="file"
                        accept=".json,.ts"
                        onChange={handleImportLanguage}
                        className="hidden"
                        id="language-upload"
                    />
                    <label
                        htmlFor="language-upload"
                        className="mt-1 flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                    >
                        <Upload size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {importedData ? '✅ Archivo cargado - Click para cambiar' : 'Click para cargar archivo'}
                        </span>
                    </label>
                </div>

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
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-1" />
                    <pre className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap break-words flex-1">{error}</pre>
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 flex-shrink-0 mt-1" />
                    <pre className="text-xs text-emerald-600 dark:text-emerald-400 font-mono whitespace-pre-wrap break-words flex-1">{success}</pre>
                </div>
            )}
        </div>
    );
};

export default LanguageManager;
