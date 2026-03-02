
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SourcePanel from './components/SourcePanel.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import { Source, ChatMessage, SourceType, StructuredSummary, Language } from './types.ts';
import { generateChatResponse, generateSourceSummary } from './services/geminiService.ts';
import { Layout, Menu, Globe, ChevronDown, ArrowLeft, Star, ExternalLink, Lock, AlertCircle } from 'lucide-react';
import { getTool, updateTool } from '@core/creation-tools/creation-tools.service.ts';
import { markToolAsSaved } from '@core/creation-tools/unsavedTools.service';
import { getMakerPaths } from '@core/maker-path';
import { useLanguage } from '../../language/useLanguage';

enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

interface NotebookProps {
  isPublicView?: boolean;
}

const App: React.FC<NotebookProps> = ({ isPublicView = false }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { id: urlId } = useParams<{ id: string }>();
    const [id, setId] = useState<string | undefined>(urlId);
    const [sources, setSources] = useState<Source[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [summary, setSummary] = useState<StructuredSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notebookName, setNotebookName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Marketing');
    const [isFavorite, setIsFavorite] = useState(false);
    const [visibility, setVisibility] = useState<Visibility>(Visibility.PRIVATE);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [toolLanguage, setToolLanguage] = useState<'fr' | 'en' | 'es'>('es');
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        title?: boolean;
        description?: boolean;
        category?: boolean;
    }>({});
    
    const publicUrl = id ? `${window.location.origin}/product/notebook/${id}` : '';

    useEffect(() => {
        if (urlId) {
            setId(urlId);
        }
    }, [urlId]);

    useEffect(() => {
        // Solo cargar datos del notebook si el ID existe y es valido
        if (id && id !== 'new' && !isNaN(parseInt(id))) {
            loadNotebookData(parseInt(id), null);
        }
    }, [id]);

    // Redirect to ProductView if this notebook is part of a maker path (product)
    useEffect(() => {
        const checkForMakerPath = async () => {
            if (!id || id === 'new' || isNaN(parseInt(id))) return;
            
            try {
                const makerPaths = await getMakerPaths();
                const toolId = parseInt(id);
                
                // Find if any maker path has this tool associated
                // Note: This assumes maker paths might have a collection of tools
                // If there's a maker path, redirect to ProductView for full source + chat support
                const makerPath = makerPaths.find((mp: any) => 
                    mp.rag && mp.rag.tool && mp.rag.tool.id === toolId
                );
                
                if (makerPath) {
                    console.log('[Notebook] Found associated maker path, redirecting to ProductView:', makerPath.id);
                    navigate(`/product/notebook/${makerPath.id}`, { replace: true });
                }
            } catch (error) {
                console.error('[Notebook] Error checking for maker path:', error);
            }
        };
        
        checkForMakerPath();
    }, [id, navigate]);

    const loadNotebookData = async (notebookId: number, fallbackTitle?: string | null) => {
        try {
            const tool = await getTool(notebookId);
            setNotebookName(tool.title || fallbackTitle || '');
            setDescription(tool.description || '');
            setCategory(tool.category || 'Marketing');
            setIsFavorite(tool.isFavorite || false);
            setVisibility(tool.hasPublicStatus ? Visibility.PUBLIC : Visibility.PRIVATE);
            setToolLanguage((tool.language as 'fr' | 'en' | 'es') || 'es');
        } catch (error) {
            console.error('Error cargando notebook:', error);
            if (!fallbackTitle) {
                setNotebookName('');
            }
        }
    };

    const handleSave = async () => {
        if (!id) return;
        
        try {
            await updateTool(parseInt(id), {
                title: notebookName,
                description: description,
                category: category,
                language: toolLanguage,
                hasPublicStatus: visibility === Visibility.PUBLIC,
            });
            
            // Marcar como guardado para que aparezca en biblioteca
            markToolAsSaved(parseInt(id));
        } catch (error) {
            console.error('Error guardando notebook:', error);
        }
    };

    const handlePublish = async () => {
        if (!id) return;
        
        const newVisibility = visibility === Visibility.PUBLIC ? Visibility.PRIVATE : Visibility.PUBLIC;
        setVisibility(newVisibility);
        setShowPublishModal(false);
        
        try {
            await updateTool(parseInt(id), {
                hasPublicStatus: newVisibility === Visibility.PUBLIC
            });
        } catch (error) {
            console.error('Error cambiando visibilidad:', error);
            setVisibility(visibility);
        }
    };

    const handleToggleFavorite = async () => {
        if (!id) return;
        
        const newFavorite = !isFavorite;
        setIsFavorite(newFavorite);
        
        try {
            await updateTool(parseInt(id), {
                isFavorite: newFavorite
            });
        } catch (error) {
            console.error('Error cambiando favorito:', error);
            setIsFavorite(!newFavorite);
        }
    };

    const handleBackToLibrary = () => {
        // Validar campos obligatorios
        const errors: typeof validationErrors = {};
        if (!notebookName || notebookName.trim() === '') errors.title = true;
        if (!description || description.trim() === '') errors.description = true;
        if (!category || category.trim() === '') errors.category = true;
        
        setValidationErrors(errors);
        
        if (Object.keys(errors).length === 0) {
            // Sin errores, navegar
            navigate('/dashboard', { state: { view: 'library' } });
        } else {
            // Con errores, mostrar modal
            setIsValidationModalOpen(true);
        }
    };
    
    const handleDeleteAndExit = async () => {
        if (id) {
            try {
                // Aquí podrías agregar lógica para eliminar el notebook si lo deseas
                // await deleteTool(parseInt(id));
            } catch (error) {
                console.error('Error eliminando notebook:', error);
            }
        }
        navigate('/dashboard', { state: { view: 'library' } });
    };

    const selectedSources = useMemo(() => {
        const selected = sources.filter(s => s.selected);
        console.log('[Notebook] Selected sources:', selected.length, selected);
        return selected;
    }, [sources]);

    useEffect(() => {
        console.log('[Notebook] useEffect triggered - selectedSources:', selectedSources.length);
        if (selectedSources.length > 0) {
            console.log('[Notebook] Calling updateSummary with sources:', selectedSources.map(s => ({ title: s.title, hasContent: !!s.content, contentLength: s.content?.length })));
            updateSummary(selectedSources, language as Language);
        } else {
            setSummary(null);
        }
    }, [selectedSources.length, language, selectedSources]);

    const updateSummary = async (activeSources: Source[], lang: Language) => {
        console.log('[Notebook] updateSummary called with', activeSources.length, 'sources');
        setSummaryLoading(true);
        try {
            const res = await generateSourceSummary(activeSources, lang);
            console.log('[Notebook] Summary result:', res);
            setSummary(res);
        } catch (e) {
            console.error('[Notebook] Error generating summary:', e);
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    };

    // Note: Source management is now handled through ProductView (RAG system)
    // Notebooks redirect to ProductView if they have an associated RAG module
    const handleAddSource = async (_type: SourceType, _content: string, _title: string, _url?: string, _previewUrl?: string, _file?: File) => {
        console.warn('[Notebook] Source management should be done through ProductView');
    };

    const handleToggleSource = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
    };

    const handleDeleteSource = async (_id: string) => {
        console.warn('[Notebook] Source management should be done through ProductView');
    };

    const handleSendMessage = async (content: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setChatLoading(true);

        const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
        const responseText = await generateChatResponse(historyForApi, sources.filter(s => s.selected), content, language as Language);

        const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: responseText };
        setMessages(prev => [...prev, botMsg]);
        setChatLoading(false);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900 overflow-hidden font-inter">
            {/* Header minimalista */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-20 shrink-0">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToLibrary}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                            <ArrowLeft size={16} />
                            <span>Volver</span>
                        </button>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Layout size={16} />
                            <span className="text-sm font-bold tracking-wide">NOTEBOOK</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2.5 rounded-xl transition-all ${
                            sidebarOpen 
                                ? 'bg-indigo-100 text-indigo-600 shadow-sm' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden w-full">
                {/* Sidebar - Basic notebook info (sources managed in ProductView if RAG enabled) */}
                <aside className={`
                    ${sidebarOpen ? 'w-80 md:w-96 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                    transition-all duration-300 ease-in-out flex-shrink-0 z-30 border-r border-gray-200/50
                `}>
                    <div className="h-full w-full">
                        <SourcePanel
                            sources={sources}
                            onAddSource={handleAddSource}
                            onToggleSource={handleToggleSource}
                            onDeleteSource={handleDeleteSource}
                        />
                    </div>
                </aside>

                {/* Área principal con formulario integrado */}
                <main className="flex-1 min-w-0 relative z-0 overflow-hidden flex flex-col">
                    {/* Tarjeta de configuración flotante */}
                    <div className="px-6 py-6 border-b border-gray-200/50 bg-white/60 backdrop-blur-sm">
                        <div className="max-w-7xl mx-auto">
                            {/* Header de la tarjeta con título y estado */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={notebookName}
                                            onChange={(e) => {
                                                setNotebookName(e.target.value);
                                                setValidationErrors({ ...validationErrors, title: false });
                                            }}
                                            onBlur={handleSave}
                                            disabled={isPublicView}
                                            className={`flex-1 text-2xl font-bold text-gray-900 bg-transparent border-b-2 outline-none focus:ring-0 px-0 placeholder:text-gray-300 disabled:cursor-not-allowed transition-all ${
                                                validationErrors.title ? 'border-red-500' : 'border-transparent focus:border-blue-500'
                                            }`}
                                            placeholder={t.notebook.settings.titlePlaceholder}
                                        />
                                        {(!notebookName || notebookName.trim() === '') && (
                                            <span title="Required field">
                                                <AlertCircle size={16} className="text-amber-500" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <textarea
                                            value={description}
                                            onChange={(e) => {
                                                setDescription(e.target.value);
                                                setValidationErrors({ ...validationErrors, description: false });
                                            }}
                                            onBlur={handleSave}
                                            disabled={isPublicView}
                                            rows={2}
                                            className={`flex-1 text-base text-gray-700 bg-transparent border-2 rounded-lg outline-none focus:ring-0 px-3 py-2 placeholder:text-gray-400 placeholder:text-base placeholder:font-medium disabled:cursor-not-allowed transition-all resize-none ${
                                                validationErrors.description ? 'border-red-500' : 'border-gray-200 focus:border-blue-400'
                                            }`}
                                            placeholder={t.notebook.settings.descriptionPlaceholder}
                                        />
                                        {(!description || description.trim() === '') && (
                                            <span title="Required field">
                                                <AlertCircle size={16} className="text-amber-500" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Toggle de visibilidad visual y claro */}
                                <div className="flex items-center gap-3 bg-white rounded-xl border-2 border-gray-200 p-1 shadow-sm">
                                    <button
                                        onClick={() => {
                                            if (visibility === Visibility.PUBLIC) {
                                                setShowPublishModal(true);
                                            }
                                        }}
                                        disabled={isPublicView || visibility === Visibility.PRIVATE}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                            visibility === Visibility.PRIVATE
                                                ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Lock size={16} />
                                        <span>{t.notebook.settings.private}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (visibility === Visibility.PRIVATE) {
                                                setShowPublishModal(true);
                                            }
                                        }}
                                        disabled={isPublicView || visibility === Visibility.PUBLIC}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                            visibility === Visibility.PUBLIC
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-200'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Globe size={16} />
                                        <span>{t.notebook.settings.public}</span>
                                    </button>
                                    {visibility === Visibility.PUBLIC && (
                                        <button
                                            onClick={() => window.open(publicUrl, '_blank')}
                                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all"
                                            title={t.notebook.settings.openPublicLink}
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Badges de metadatos */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Categoría */}
                                <div className="relative group flex items-center gap-1">
                                    <select
                                        value={category}
                                        onChange={(e) => { 
                                            setCategory(e.target.value);
                                            setValidationErrors({ ...validationErrors, category: false });
                                            handleSave();
                                        }}
                                        disabled={isPublicView}
                                        className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                            validationErrors.category ? 'bg-red-50 text-red-700 border-red-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                        }`}
                                    >
                                        <option value="Marketing">{t.notebook.settings.categories.marketing}</option>
                                        <option value="Desarrollo">{t.notebook.settings.categories.development}</option>
                                        <option value="Investigación">{t.notebook.settings.categories.research}</option>
                                        <option value="Análisis">{t.notebook.settings.categories.analysis}</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                                </div>
                                {(!category || category.trim() === '') && (
                                    <span title="Required field">
                                        <AlertCircle size={12} className="text-amber-500" />
                                    </span>
                                )}

                                {/* Idioma */}
                                <div className="relative group">
                                    <select
                                        value={toolLanguage}
                                        onChange={(e) => { 
                                            const newLang = e.target.value as 'fr' | 'en' | 'es';
                                            setToolLanguage(newLang); 
                                            handleSave(); 
                                        }}
                                        disabled={isPublicView}
                                        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded-full border border-purple-200 cursor-pointer hover:bg-purple-100 transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    >
                                        <option value="es">🇪🇸 Español</option>
                                        <option value="en">🇬🇧 English</option>
                                        <option value="fr">🇫🇷 Français</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                                </div>

                                {/* Favorito */}
                                <button
                                    onClick={handleToggleFavorite}
                                    disabled={isPublicView}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isFavorite 
                                            ? 'bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-300 shadow-sm' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
                                    <span>{isFavorite ? t.notebook.settings.favorite : t.notebook.settings.addFavorite}</span>
                                </button>

                                {/* Indicador de estado si es público */}
                                {visibility === Visibility.PUBLIC && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span>{t.notebook.settings.visiblePublicly}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Área de chat */}
                    <div className="flex-1 overflow-hidden">
                        <ChatInterface
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={chatLoading}
                            sourceSummary={summary}
                            isSummaryLoading={summaryLoading}
                        />
                    </div>
                </main>
            </div>

            {/* Modal de publicación */}
            {showPublishModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowPublishModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-indigo-50 text-indigo-600">
                                <Globe size={28} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">
                                {visibility === Visibility.PUBLIC ? t.notebook.publishModal.makePrivate : t.notebook.publishModal.publish}
                            </h3>
                            <p className="text-gray-500 text-sm mb-8 font-medium">
                                {visibility === Visibility.PUBLIC 
                                    ? t.notebook.publishModal.makePrivateDesc
                                    : t.notebook.publishModal.publishDesc}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    {t.notebook.publishModal.confirm}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Validación */}
            {isValidationModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                Campos incompletos
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">
                                No has completado todos los campos obligatorios. ¿Qué deseas hacer?
                            </p>
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => setIsValidationModalOpen(false)}
                                    className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                >
                                    Seguir editando
                                </button>
                                <button
                                    onClick={handleDeleteAndExit}
                                    className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Anular y salir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
