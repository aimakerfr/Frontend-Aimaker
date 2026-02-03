
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SourcePanel from './components/SourcePanel.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import { Source, ChatMessage, SourceType, StructuredSummary, Language } from './types.ts';
import { generateChatResponse, generateSourceSummary } from './services/geminiService.ts';
import { Layout, Menu, Globe, ChevronDown, ArrowLeft, Star, ExternalLink, Lock } from 'lucide-react';
import { getNotebookSources, postNoteBookSource, deleteNotebookSource, type NotebookSourceItem } from '@core/notebooks';
import { getTool, updateTool } from '@core/creation-tools/creation-tools.service.ts';

enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

interface NotebookProps {
  isPublicView?: boolean;
}

const App: React.FC<NotebookProps> = ({ isPublicView = false }) => {
    const navigate = useNavigate();
    const { id: urlId } = useParams<{ id: string }>();
    const [id, setId] = useState<string | undefined>(urlId);
    const [searchParams] = useSearchParams();
    const [sources, setSources] = useState<Source[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [summary, setSummary] = useState<StructuredSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [language, setLanguage] = useState<Language>('es');
    const [notebookName, setNotebookName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Marketing');
    const [isFavorite, setIsFavorite] = useState(false);
    const [visibility, setVisibility] = useState<Visibility>(Visibility.PRIVATE);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [toolLanguage, setToolLanguage] = useState<'fr' | 'en' | 'es'>('es');
    
    const publicUrl = id ? `${window.location.origin}/public/notebook/${id}` : '';

    useEffect(() => {
        if (urlId) {
            setId(urlId);
        }
    }, [urlId]);

    useEffect(() => {
        // Intentar obtener el título del query param primero
        const titleFromParam = searchParams.get('title');
        if (titleFromParam) {
            setNotebookName(decodeURIComponent(titleFromParam));
        }
        
        if (id) {
            loadNotebookData(parseInt(id), titleFromParam);
        }
    }, [id, searchParams]);

    const mapApiSourceType = (type: string): SourceType => {
        switch (type?.toUpperCase()) {
            case 'PDF':
                return 'pdf';
            case 'IMAGE':
                return 'image';
            case 'VIDEO':
                return 'video';
            case 'TEXT':
                return 'text';
            case 'WEBSITE':
                return 'url';
            case 'HTML':
                return 'html';
            default:
                return 'text';
        }
    };

    const mapApiSourceToLocal = (apiSource: NotebookSourceItem): Source => {
        const filePath = apiSource.filePath || undefined;

        return {
            id: apiSource.id.toString(),
            title: apiSource.name,
            type: mapApiSourceType(apiSource.type),
            content: filePath ?? '',
            url: filePath,
            previewUrl: filePath,
            dateAdded: apiSource.createdAt ? new Date(apiSource.createdAt) : new Date(),
            selected: false,
        };
    };

    const loadNotebookSources = async (notebookId: number) => {
        try {
            const apiSources = await getNotebookSources(notebookId);
            const mappedSources = apiSources.map(mapApiSourceToLocal);

            setSources((prev) => {
                const existingIds = new Set(prev.map((s) => s.id));
                const merged = [...prev];

                mappedSources.forEach((source) => {
                    if (!existingIds.has(source.id)) {
                        merged.push(source);
                    }
                });

                return merged;
            });
        } catch (error) {
            console.error('Error cargando fuentes del notebook:', error);
        }
    };

    useEffect(() => {
        if (!id) return;

        loadNotebookSources(parseInt(id));
    }, [id]);

    const loadNotebookData = async (notebookId: number, fallbackTitle?: string | null) => {
        try {
            const tool = await getTool(notebookId);
            setNotebookName(tool.title || fallbackTitle || 'Sin título');
            setDescription(tool.description || '');
            setCategory(tool.category || 'Marketing');
            setIsFavorite(tool.isFavorite || false);
            setVisibility(tool.hasPublicStatus ? Visibility.PUBLIC : Visibility.PRIVATE);
            setToolLanguage((tool.language as 'fr' | 'en' | 'es') || 'es');
            setLanguage((tool.language as Language) || 'es');
        } catch (error) {
            console.error('Error cargando notebook:', error);
            if (!fallbackTitle) {
                setNotebookName('Sin título');
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
        navigate('/dashboard', { state: { view: 'library' } });
    };

    // Memoizar las fuentes seleccionadas para evitar recalcular en cada render
    const selectedSources = useMemo(() => {
        const selected = sources.filter(s => s.selected);
        console.log('[Notebook] Selected sources:', selected.length, selected);
        return selected;
    }, [sources]);

    useEffect(() => {
        console.log('[Notebook] useEffect triggered - selectedSources:', selectedSources.length);
        if (selectedSources.length > 0) {
            console.log('[Notebook] Calling updateSummary with sources:', selectedSources.map(s => ({ title: s.title, hasContent: !!s.content, contentLength: s.content?.length })));
            updateSummary(selectedSources, language);
        } else {
            setSummary(null);
        }
    }, [selectedSources.length, language]);

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

    const uploadSource = async (apiType: string, title: string, file?: File, url?: string) => {
        if (!id) throw new Error('Notebook ID is missing');

        // WEBSITE, HTML, TEXT, and VIDEO can be sent without a file
        // TEXT can come from textarea (direct text input)
        // VIDEO can come from YouTube URLs
        const formData = new FormData();
        formData.append('note_book_id', id.toString());
        formData.append('name', title);
        formData.append('type', apiType);
        
        // Include file only if provided (optional for WEBSITE, HTML, TEXT, VIDEO from URLs)
        if (file) {
            formData.append('stream_file', file);
        }
        
        // Include URL if provided (for WEBSITE and VIDEO types)
        if (url) {
            formData.append('url', url);
        }
        
        return await postNoteBookSource(formData);
    };

    const processSourceLocally = (
        response: any, 
        type: SourceType, 
        content: string, 
        url?: string,
        previewUrl?: string
    ) => {
        const absoluteUrl = response?.filePath || previewUrl || url;
        console.log('[Notebook] processSourceLocally - Creating new source:', { 
            title: response.name, 
            type, 
            hasContent: !!content, 
            contentLength: content?.length 
        });
        const newSource: Source = {
            id: response.id.toString(),
            title: response.name,
            type,
            content,
            url: absoluteUrl,
            previewUrl: absoluteUrl,
            dateAdded: new Date(response.createdAt),
            selected: true,
        };
        console.log('[Notebook] New source created:', newSource);
        setSources(prev => {
            console.log('[Notebook] Previous sources:', prev.length, 'Adding new source');
            return [...prev, newSource];
        });
    };

    const handleAddSource = async (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => {
        if (!id) return;

        try {
            // Map frontend types to backend types
            let apiType = type.toUpperCase();
            if (apiType === 'URL') apiType = 'WEBSITE';
            // Keep HTML, PDF, TEXT, VIDEO, IMAGE as is (already uppercase)

            const response = await uploadSource(apiType, title, file, url);
            processSourceLocally(response, type, content, url, previewUrl);
        } catch (error) {
            console.error('Error adding source to backend:', error);
        }
    };

    const handleToggleSource = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
    };

    const handleDeleteSource = async (id: string) => {
        try {
            // Eliminar del backend primero
            await deleteNotebookSource(parseInt(id));
            
            // Si fue exitoso, eliminar del estado local
            setSources(prev => {
                const source = prev.find(s => id === s.id);
                if (source?.previewUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(source.previewUrl);
                }
                return prev.filter(s => s.id !== id);
            });
        } catch (error) {
            console.error('Error eliminando fuente:', error);
            alert('Error al eliminar la fuente. Por favor intente de nuevo.');
        }
    };

    const handleSendMessage = async (content: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setChatLoading(true);

        const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
        const responseText = await generateChatResponse(historyForApi, sources.filter(s => s.selected), content, language);

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
                            <span className="text-sm font-bold tracking-wide">RAG MULTIMODAL</span>
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
                {/* Sidebar de fuentes */}
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
                            lang={language}
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
                                    <input
                                        type="text"
                                        value={notebookName}
                                        onChange={(e) => setNotebookName(e.target.value)}
                                        onBlur={handleSave}
                                        disabled={isPublicView}
                                        className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 px-0 placeholder:text-gray-300 disabled:cursor-not-allowed"
                                        placeholder="Título del Notebook..."
                                    />
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onBlur={handleSave}
                                        disabled={isPublicView}
                                        className="w-full mt-1 text-sm text-gray-600 bg-transparent border-none outline-none focus:ring-0 px-0 placeholder:text-gray-300 disabled:cursor-not-allowed"
                                        placeholder="Agrega una descripción..."
                                    />
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
                                        <span>Privado</span>
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
                                        <span>Público</span>
                                    </button>
                                    {visibility === Visibility.PUBLIC && (
                                        <button
                                            onClick={() => window.open(publicUrl, '_blank')}
                                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all"
                                            title="Abrir enlace público"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Badges de metadatos */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Categoría */}
                                <div className="relative group">
                                    <select
                                        value={category}
                                        onChange={(e) => { setCategory(e.target.value); handleSave(); }}
                                        disabled={isPublicView}
                                        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="Marketing">📊 Marketing</option>
                                        <option value="Desarrollo">💻 Development</option>
                                        <option value="Investigación">🔬 Research</option>
                                        <option value="Análisis">📈 Analysis</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                                </div>

                                {/* Idioma */}
                                <div className="relative group">
                                    <select
                                        value={toolLanguage}
                                        onChange={(e) => { 
                                            const newLang = e.target.value as 'fr' | 'en' | 'es';
                                            setToolLanguage(newLang); 
                                            setLanguage(newLang as Language);
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
                                    <span>{isFavorite ? 'Favorito' : 'Agregar a favoritos'}</span>
                                </button>

                                {/* Indicador de estado si es público */}
                                {visibility === Visibility.PUBLIC && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span>Visible públicamente</span>
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
                            lang={language}
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
                                {visibility === Visibility.PUBLIC ? '¿Hacer privado?' : '¿Publicar notebook?'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-8 font-medium">
                                {visibility === Visibility.PUBLIC 
                                    ? 'El notebook ya no será accesible públicamente'
                                    : 'El notebook será accesible mediante URL pública'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Confirmar
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
