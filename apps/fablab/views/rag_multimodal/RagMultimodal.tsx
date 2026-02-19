
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SourcePanel from './components/SourcePanel.tsx';
import ImportSourceModal from './components/ImportSourceModal.tsx';
import UploadSourceModal from './components/UploadSourceModal.tsx';
import { Source, ChatMessage, SourceType, StructuredSummary, Language } from './types.ts';
import { generateChatResponse, generateSourceSummary } from './services/geminiService.ts';
import { ChevronDown, Star, ExternalLink, Lock, AlertCircle, Settings, Globe } from 'lucide-react';
import { getRagMultimodalSources, postRagMultimodalSource, deleteRagMultimodalSource, type RagMultimodalSourceItem } from '@core/rag_multimodal';
import { copyObjectToRag } from '@core/objects';
import { getTool, updateTool } from '@core/creation-tools/creation-tools.service.ts';
import { markToolAsSaved } from '@core/creation-tools/unsavedTools.service';
import { useLanguage } from '../../language/useLanguage';
import HeaderBar from './components/HeaderBar.tsx';
import PublishModal from './components/PublishModal.tsx';
import ValidationModal from './components/ValidationModal.tsx';
import { UI_TRANSLATIONS } from './constants/translations.ts';
import ChatInterface from "@apps/fablab/views/notebook/components/ChatInterface.tsx";

enum Visibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

interface RagMultimodalProps {
  isPublicView?: boolean;
}

const RagMultimodal: React.FC<RagMultimodalProps> = ({ isPublicView = false }) => {
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
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [notebookName, setNotebookName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Marketing');
    const [isFavorite, setIsFavorite] = useState(false);
    const [visibility, setVisibility] = useState<Visibility>(Visibility.PRIVATE);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedObjects, setSelectedObjects] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [toolLanguage, setToolLanguage] = useState<'fr' | 'en' | 'es'>('es');
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        title?: boolean;
        description?: boolean;
        category?: boolean;
    }>({});
    const languageOptions = useMemo(
        () => ([
            { value: 'es', label: UI_TRANSLATIONS.es.languages.es },
            { value: 'en', label: UI_TRANSLATIONS.en.languages.en },
            { value: 'fr', label: UI_TRANSLATIONS.fr.languages.fr },
        ]),
        []
    );
    const uiTranslations = useMemo(
        () => UI_TRANSLATIONS[toolLanguage] || UI_TRANSLATIONS.es,
        [toolLanguage]
    );
    
    const publicUrl = id ? `${window.location.origin}/public/rag_multimodal/${id}` : '';

    useEffect(() => {
        if (urlId) {
            setId(urlId);
        }
    }, [urlId]);

    useEffect(() => {
        // Solo cargar datos del notebook si el ID existe y es valido
        if (id && id !== 'new' && !isNaN(parseInt(id))) {
            loadRagMultimodalData(parseInt(id), null);
        }
    }, [id]);

    const mapApiSourceType = (type: string): SourceType => {
        switch (type?.toUpperCase()) {
            case 'DOC':
            case 'PDF': // legacy fallback
                return 'pdf';
            case 'IMAGE':
                return 'image';
            case 'VIDEO':
                return 'video';
            case 'TEXT':
                return 'text';
            case 'CODE':
                return 'code';
            case 'WEBSITE':
                return 'url';
            case 'HTML':
                return 'html';
            case 'CONFIG':
                return 'config';
            default:
                return 'text';
        }
    };

    const mapApiSourceToLocal = (apiSource: RagMultimodalSourceItem): Source => {
        const filePath = apiSource.filePath || undefined;
        const content = (apiSource as any)?.text ?? filePath ?? '';

        return {
            id: apiSource.id.toString(),
            title: apiSource.name,
            type: mapApiSourceType(apiSource.type),
            backendType: apiSource.type,
            content,
            url: filePath,
            previewUrl: filePath,
            dateAdded: apiSource.createdAt ? new Date(apiSource.createdAt) : new Date(),
            selected: false,
        };
    };

    const loadRagMultimodalSources = async (notebookId: number) => {
        try {
            const apiSources = await getRagMultimodalSources(notebookId);
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

        loadRagMultimodalSources(parseInt(id));
    }, [id]);

    const refreshSources = async () => {
        if (!id) return;
        await loadRagMultimodalSources(parseInt(id));
    };

    const loadRagMultimodalData = async (notebookId: number, fallbackTitle?: string | null) => {
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
            navigate('/dashboard/library');
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
        navigate('/dashboard/library');
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

    const uploadSource = async (apiType: string, title: string, file?: File, url?: string, text?: string) => {
        if (!id) throw new Error('Notebook ID is missing');

        // WEBSITE, HTML, TEXT, and VIDEO can be sent without a file
        // TEXT can come from textarea (direct text input)
        // VIDEO can come from YouTube URLs
        const formData = new FormData();
        formData.append('rag_multimodal_id', id.toString());
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

        // Include plain text content if provided (allowed in combination with file/url)
        if (text) {
            formData.append('text', text);
        }
        
        return await postRagMultimodalSource(formData);
    };

    const processSourceLocally = (
        response: any, 
        type: SourceType, 
        content: string, 
        url?: string,
        previewUrl?: string,
        backendType?: string,
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
            backendType: response?.type || backendType || type.toUpperCase(),
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
            // Map legacy PDF to DOC for API
            if (apiType === 'PDF') apiType = 'DOC';
            // Keep HTML, TEXT, VIDEO, IMAGE as is (already uppercase)

            const response = await uploadSource(apiType, title, file, url, content);
            processSourceLocally(response, type, content, url, previewUrl, apiType);
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
            await deleteRagMultimodalSource(parseInt(id));
            
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
        const responseText = await generateChatResponse(historyForApi, sources.filter(s => s.selected), content, language as Language);

        const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: responseText };
        setMessages(prev => [...prev, botMsg]);
        setChatLoading(false);
    };

    const handleImportObjects = async () => {
        if (!id || id === 'new') {
            console.error('RAG id is required to import objects');
            return;
        }

        if (!selectedObjects.length) {
            setIsImportModalOpen(false);
            return;
        }

        try {
            setIsImporting(true);
            await Promise.all(
                selectedObjects.map((object) =>
                    copyObjectToRag({
                        object_id: Number(object.id),
                        rag_id: parseInt(id),
                    })
                )
            );
            await refreshSources();
            setSelectedObjects([]);
            setIsImportModalOpen(false);
        } catch (error) {
            console.error('Error importing objects to RAG:', error);
            alert(t.common.error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900 overflow-hidden font-inter">
            {/* Header */}
            <HeaderBar
                onBack={handleBackToLibrary}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                t={t}
            />

            <div className="flex-1 flex overflow-hidden w-full">
                {/* Sidebar de fuentes - Expandido */}
                <aside className={`
                    ${sidebarOpen ? 'w-96 md:w-[420px] translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                    transition-all duration-300 ease-in-out flex-shrink-0 z-30 border-r border-gray-200/50
                `}>
                    <div className="h-full w-full">
                        <SourcePanel
                            sources={sources}
                            onToggleSource={handleToggleSource}
                            onDeleteSource={handleDeleteSource}
                            onOpenImportModal={() => setIsImportModalOpen(true)}
                            onOpenUploadModal={() => setIsUploadModalOpen(true)}
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
                                            className={`flex-1 text-2xl font-bold text-gray-900 bg-transparent border-b-2 outline-none focus:ring-0 px-0 placeholder:text-gray-400 disabled:cursor-not-allowed transition-all ${
                                                validationErrors.title ? 'border-red-500' : 'border-transparent focus:border-blue-500'
                                            }`}
                                            placeholder={t.notebook.settings.titlePlaceholder}
                                        />
                                        {(!notebookName || notebookName.trim() === '') && (
                                            <span title="Required field">
                                                <AlertCircle size={16} className="text-amber-600" />
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
                                            className={`flex-1 text-base text-gray-700 bg-transparent border-2 rounded-lg outline-none focus:ring-0 px-3 py-2 placeholder:text-gray-600 placeholder:text-base placeholder:font-medium disabled:cursor-not-allowed transition-all resize-none ${
                                                validationErrors.description ? 'border-red-500' : 'border-gray-200 focus:border-blue-400'
                                            }`}
                                            placeholder={t.notebook.settings.descriptionPlaceholder}
                                        />
                                        {(!description || description.trim() === '') && (
                                            <span title="Required field">
                                                <AlertCircle size={16} className="text-amber-600" />
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
                                        {languageOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
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

                    {/* Área principal - Panel de Herramientas o Chat */}
                    <div className="flex-1 overflow-hidden">
                        {showChatPanel ? (
                            <ChatInterface
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isLoading={chatLoading}
                                sourceSummary={summary}
                                isSummaryLoading={summaryLoading}
                                onBack={() => setShowChatPanel(false)}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center p-8">
                                <div className="max-w-5xl w-full">
                                    <div className="text-center mb-12">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                                            <Settings size={40} className="text-white" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900 mb-3">{uiTranslations.toolPicker.title}</h2>
                                        <p className="text-gray-600 text-lg">{uiTranslations.toolPicker.subtitle}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <PublishModal
                isOpen={showPublishModal}
                visibility={visibility === Visibility.PUBLIC ? 'public' : 'private'}
                onCancel={() => setShowPublishModal(false)}
                onConfirm={handlePublish}
                t={t}
            />
            
            <ValidationModal
                isOpen={isValidationModalOpen}
                onContinueEditing={() => setIsValidationModalOpen(false)}
                onDiscardAndExit={handleDeleteAndExit}
            />
            <ImportSourceModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportObjects}
                selectedObjects={selectedObjects}
                onSelectionChange={setSelectedObjects}
                isImporting={isImporting}
                tp={t.notebook.sourcePanel}
                t={t}
            />
            <UploadSourceModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onAddSource={handleAddSource}
                tp={t.notebook.sourcePanel}
                t={t}
            />
        </div>
    );
};

export default RagMultimodal;
