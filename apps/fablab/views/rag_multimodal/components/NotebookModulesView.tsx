import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getRagMultimodalModules,
    assignRagMultimodalModule,
    unassignRagMultimodalModule,
    downloadRagMultimodalIndex,
    type RagMultimodalModule,
    type ModuleType
} from '@core/rag_multimodal';
import { getRagMultimodalSources, type RagMultimodalSourceItem } from '@core/rag_multimodal';
import { getTool } from '@core/creation-tools/creation-tools.service.ts';
import { 
    Layout, ArrowLeft, Download, Globe, FileText, 
    Plus, X, Check, RefreshCw, ExternalLink, Trash2
} from 'lucide-react';

const MODULE_TYPES: { type: ModuleType; label: string; color: string; bg: string; icon: string; multi: boolean }[] = [
    { type: 'HEADER', label: 'Header', color: 'text-purple-600', bg: 'bg-purple-50', icon: '🟣', multi: false },
    { type: 'BODY',   label: 'Body',   color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '🔵', multi: true },
    { type: 'FOOTER', label: 'Footer', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🟢', multi: false },
];

/** Build proper URL from sourceFilePath (may already contain full URL or relative path) */
const resolveUrl = (sourceFilePath: string | null, apiUrl: string): string => {
    if (!sourceFilePath) return '';
    return sourceFilePath.startsWith('http') ? sourceFilePath : `${apiUrl}${sourceFilePath}`;
};

const RagMultimodalModulesView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const ragMultimodalId = parseInt(id || '0');

    const [modules, setModules] = useState<RagMultimodalModule[]>([]);
    const [htmlSources, setHtmlSources] = useState<RagMultimodalSourceItem[]>([]);
    const [notebookTitle, setNotebookTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<ModuleType | null>(null);
    const [selectorOpen, setSelectorOpen] = useState<ModuleType | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (ragMultimodalId) loadData();
    }, [ragMultimodalId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [modulesData, sourcesData, toolData] = await Promise.all([
                getRagMultimodalModules(ragMultimodalId),
                getRagMultimodalSources(ragMultimodalId),
                getTool(ragMultimodalId),
            ]);
            setModules(modulesData);
            setHtmlSources(sourcesData.filter((s) => s.type === 'HTML'));
            setNotebookTitle(toolData.title || 'RAG Multimodal');
        } catch (err) {
            console.error('Error loading modules data:', err);
        }
        setLoading(false);
    };

    /** Get modules by type — returns array (for BODY: multiple, for HEADER/FOOTER: 0-1) */
    const getModulesByType = (type: ModuleType): RagMultimodalModule[] => {
        return modules.filter(m => m.moduleType === type);
    };

    const handleAssign = async (moduleType: ModuleType, sourceId: number) => {
        setAssigning(moduleType);
        try {
            await assignRagMultimodalModule(ragMultimodalId, moduleType, sourceId);
            await loadData();
            // Para HEADER/FOOTER cerrar selector; para BODY dejar abierto para seguir agregando
            if (moduleType !== 'BODY') setSelectorOpen(null);
        } catch (err) {
            console.error('Error assigning module:', err);
        }
        setAssigning(null);
    };

    const handleUnassignAll = async (moduleType: ModuleType) => {
        setAssigning(moduleType);
        try {
            await unassignRagMultimodalModule(ragMultimodalId, moduleType);
            await loadData();
        } catch (err) {
            console.error('Error unassigning module:', err);
        }
        setAssigning(null);
    };

    const handleUnassignOne = async (moduleType: ModuleType, moduleId: number) => {
        setAssigning(moduleType);
        try {
            await unassignRagMultimodalModule(ragMultimodalId, moduleType, moduleId);
            await loadData();
        } catch (err) {
            console.error('Error unassigning module:', err);
        }
        setAssigning(null);
    };

    const handleDownloadIndex = async () => {
        setDownloading(true);
        try {
            await downloadRagMultimodalIndex(ragMultimodalId);
        } catch (err) {
            console.error('Error downloading index:', err);
        }
        setDownloading(false);
    };

    const apiUrl = import.meta.env.VITE_API_URL || '';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando módulos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/dashboard/rag_multimodal/${ragMultimodalId}`)} 
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-black text-gray-900 text-lg tracking-tight flex items-center gap-2">
                                <Layout size={20} className="text-indigo-600" />
                                Módulos — {notebookTitle}
                            </h1>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                Configura Header, Body y Footer
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadIndex}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {downloading ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <Download size={14} />
                        )}
                        Descargar Index.html
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm mb-1">¿Cómo funciona?</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Asigna fuentes HTML de tu RAG a cada módulo (Header, Body, Footer). 
                                El Body permite agregar múltiples fuentes que se mostrarán en orden.
                                Al descargar el Index.html, se conectará automáticamente a los módulos de este notebook.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Módulos */}
                {MODULE_TYPES.map(({ type, label, color, bg, icon, multi }) => {
                    const assignedModules = getModulesByType(type);
                    const hasAssigned = assignedModules.length > 0;
                    const isSelecting = selectorOpen === type;
                    const isAssigning = assigning === type;

                    return (
                        <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Module Header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{icon}</span>
                                    <div>
                                        <h3 className={`font-black text-sm ${color}`}>
                                            {label}
                                            {multi && hasAssigned && (
                                                <span className="ml-2 text-[9px] font-bold text-gray-400">
                                                    ({assignedModules.length})
                                                </span>
                                            )}
                                        </h3>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            {hasAssigned ? (multi ? `${assignedModules.length} asignado(s)` : 'Asignado') : 'Sin asignar'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasAssigned && !multi && (
                                        <a
                                            href={resolveUrl(assignedModules[0].sourceFilePath, apiUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-all"
                                            title="Ver módulo"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                    {hasAssigned && !multi && (
                                        <button
                                            onClick={() => handleUnassignAll(type)}
                                            disabled={isAssigning}
                                            className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                                            title="Desasignar"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectorOpen(isSelecting ? null : type)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isSelecting 
                                                ? 'bg-gray-100 text-gray-600' 
                                                : `${bg} ${color}`
                                        }`}
                                    >
                                        {isSelecting ? <X size={12} /> : <Plus size={12} />}
                                        {hasAssigned && !multi ? 'Cambiar' : 'Agregar'}
                                    </button>
                                </div>
                            </div>

                            {/* Assigned Sources List */}
                            {hasAssigned && !isSelecting && (
                                <div className={`${bg} border-b border-gray-50`}>
                                    {assignedModules.map((mod, idx) => (
                                        <div key={mod.id} className="px-6 py-3 flex items-center gap-2 border-b border-white/60 last:border-0">
                                            {multi && (
                                                <span className="text-[9px] font-black text-gray-400 w-5 shrink-0">
                                                    {idx + 1}.
                                                </span>
                                            )}
                                            <FileText size={14} className={color} />
                                            <span className="text-xs font-bold text-gray-700 flex-1">{mod.sourceName}</span>
                                            <span className="text-[8px] font-black bg-white px-1.5 py-0.5 rounded-md text-gray-400 border border-gray-100 uppercase">
                                                {mod.sourceType}
                                            </span>
                                            {multi && (
                                                <>
                                                    <a
                                                        href={resolveUrl(mod.sourceFilePath, apiUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleUnassignOne(type, mod.id)}
                                                        disabled={isAssigning}
                                                        className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                                        title="Quitar"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Source Selector */}
                            {isSelecting && (
                                <div className="px-6 py-4 bg-gray-50/50 space-y-2">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        Selecciona una fuente HTML de tu RAG
                                    </span>
                                    {htmlSources.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400">
                                            <Globe size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-xs font-bold">No hay fuentes HTML</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Sube archivos HTML desde el panel de fuentes del RAG</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {htmlSources.map(source => {
                                                const alreadyAssigned = assignedModules.some(m => m.sourceId === source.id);
                                                // Para HEADER/FOOTER no re-asignar la misma; para BODY permitir siempre
                                                const isDisabled = !multi && alreadyAssigned;
                                                return (
                                                    <button
                                                        key={source.id}
                                                        onClick={() => !isDisabled && handleAssign(type, source.id)}
                                                        disabled={isAssigning || isDisabled}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                                            isDisabled
                                                                ? 'bg-indigo-50 border-indigo-200 cursor-default'
                                                                : alreadyAssigned
                                                                    ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 cursor-pointer'
                                                                    : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer'
                                                        }`}
                                                    >
                                                        <Globe size={16} className={isDisabled || alreadyAssigned ? 'text-indigo-600' : 'text-gray-300'} />
                                                        <span className={`text-xs font-bold flex-1 ${isDisabled || alreadyAssigned ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                            {source.name}
                                                        </span>
                                                        {isDisabled && (
                                                            <Check size={14} className="text-indigo-600" />
                                                        )}
                                                        {alreadyAssigned && multi && (
                                                            <span className="text-[8px] font-black text-blue-500 uppercase">Ya agregado</span>
                                                        )}
                                                        {isAssigning && (
                                                            <RefreshCw size={14} className="text-gray-300 animate-spin" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Preview - inyección directa de HTML como path-creation-modules */}
                {modules.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50">
                            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                                <ExternalLink size={16} className="text-indigo-600" />
                                Vista previa del Index
                            </h3>
                        </div>
                        <div className="bg-gray-50 p-4">
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                                {/* Header */}
                                <PreviewModule 
                                    modules={getModulesByType('HEADER')} 
                                    apiUrl={apiUrl} 
                                    tag="header"
                                />
                                {/* Body */}
                                <PreviewModule 
                                    modules={getModulesByType('BODY')} 
                                    apiUrl={apiUrl} 
                                    tag="main"
                                    style={{ flex: 1 }}
                                />
                                {/* Footer */}
                                <PreviewModule 
                                    modules={getModulesByType('FOOTER')} 
                                    apiUrl={apiUrl} 
                                    tag="footer"
                                    style={{ marginTop: 'auto' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Componente que descarga HTML usando el endpoint de la API y lo inyecta directamente (sin iframe).
 * Mismo patrón que path-creation-modules/PreviewSection.
 */
interface PreviewModuleProps {
    modules: RagMultimodalModule[];
    apiUrl: string;
    tag: 'header' | 'main' | 'footer';
    style?: React.CSSProperties;
}

const PreviewModule: React.FC<PreviewModuleProps> = ({ modules, apiUrl, tag, style }) => {
    const [htmlContent, setHtmlContent] = useState('');
    const [cssContent, setCssContent] = useState('');

    useEffect(() => {
        const fetchHtmlModules = async () => {
            let allHtml = '';
            let allCss = '';

            for (const mod of modules) {
                if (!mod.id) continue;

                // Usar el endpoint de la API que tiene CORS configurado
                const url = `${apiUrl}/api/v1/rag-multimodal-modules/module/${mod.id}/html`;

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const html = await res.text();

                    // Parsear el HTML
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extraer estilos
                    doc.querySelectorAll('style').forEach(s => {
                        allCss += s.textContent + '\n';
                    });

                    // Extraer contenido del body
                    allHtml += doc.body.innerHTML;
                } catch (err) {
                    console.warn(`Error fetching module ${mod.id}:`, err);
                }
            }

            setCssContent(allCss);
            setHtmlContent(allHtml);
        };

        if (modules.length > 0) {
            fetchHtmlModules();
        } else {
            setHtmlContent('');
            setCssContent('');
        }
    }, [modules, apiUrl]);

    if (!htmlContent) return null;

    const Tag = tag;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssContent }} />
            <Tag style={style} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </>
    );
};

export default RagMultimodalModulesView;
