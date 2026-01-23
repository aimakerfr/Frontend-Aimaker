
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SourcePanel from './components/SourcePanel';
import ChatInterface from './components/ChatInterface';
import { Source, ChatMessage, SourceType, StructuredSummary, Language } from './types';
import { generateChatResponse, generateSourceSummary } from './services/geminiService';
import { Layout, Menu, Globe, ChevronDown, Edit2, ArrowLeft, Save } from 'lucide-react';
import { UI_TRANSLATIONS } from './constants/translations';
import { postNoteBookSource, NotebookService } from '@core/notebooks';

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
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [notebookName, setNotebookName] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isSavingTitle, setIsSavingTitle] = useState(false);
    // const [isPublic, setIsPublic] = useState(false); // Unused

    useEffect(() => {
        if (urlId) {
            setId(urlId);
        }
    }, [urlId]);

    const notebookService = new NotebookService();

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

    const loadNotebookData = async (notebookId: number, fallbackTitle?: string | null) => {
        try {
            const notebook = await notebookService.getNotebook(notebookId);
            setNotebookName(notebook.title || fallbackTitle || 'Sin título');
            setLanguage(notebook.tool.language as Language);
            // setIsPublic(notebook.hasPublicStatus || false);
        } catch (error) {
            console.error('Error cargando notebook:', error);
            // Si falla la carga pero tenemos el título del param, lo usamos
            if (!fallbackTitle) {
                setNotebookName('Sin título');
            }
            // Si falla, asumimos que es privado por defecto
            // setIsPublic(false);
        }
    };

    const handleSaveTitle = async () => {
        if (!id) return;
        
        setIsSavingTitle(true);
        try {
            await notebookService.updateNotebook(parseInt(id), { title: notebookName });
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Error guardando título:', error);
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleBackToLibrary = () => {
        navigate('/dashboard', { state: { view: 'library' } });
    };

    useEffect(() => {
        const selectedSources = sources.filter(s => s.selected);
        if (selectedSources.length > 0) {
            updateSummary(selectedSources, language);
        } else {
            setSummary(null);
        }
    }, [sources.filter(s => s.selected).length, language]);

    const updateSummary = async (activeSources: Source[], lang: Language) => {
        setSummaryLoading(true);
        try {
            const res = await generateSourceSummary(activeSources, lang);
            setSummary(res);
        } catch (e) {
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    };

    const uploadSource = async (apiType: string, title: string, file?: File) => {
        if (!id) throw new Error('Notebook ID is missing');

        if (apiType === 'WEBSITE') {
            return await postNoteBookSource({
                note_book_id: parseInt(id),
                type: apiType,
                name: title
            });
        } else {
            const formData = new FormData();
            formData.append('note_book_id', id.toString());
            formData.append('name', title);
            formData.append('type', apiType);
            if (file) {
                formData.append('stream_file', file);
            }
            return await postNoteBookSource(formData);
        }
    };

    const processSourceLocally = (
        response: any, 
        type: SourceType, 
        content: string, 
        url?: string, 
        previewUrl?: string
    ) => {
        const newSource: Source = {
            id: response.data.id.toString(),
            title: response.data.name,
            type,
            content,
            url,
            previewUrl,
            dateAdded: new Date(response.data.createdAt),
            selected: true,
        };
        setSources(prev => [...prev, newSource]);
    };

    const handleAddSource = async (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => {
        if (!id) return;

        try {
            let apiType = type.toUpperCase();
            if (apiType === 'URL') apiType = 'WEBSITE';

            const response = await uploadSource(apiType, title, file);
            processSourceLocally(response, type, content, url, previewUrl);
        } catch (error) {
            console.error('Error adding source to backend:', error);
        }
    };

    const handleToggleSource = (id: string) => {
        setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
    };

    const handleDeleteSource = (id: string) => {
        setSources(prev => {
            const source = prev.find(s => id === s.id);
            if (source?.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(source.previewUrl);
            }
            return prev.filter(s => s.id !== id);
        });
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

    const langLabels = { es: 'ES', en: 'EN', fr: 'FR' };
    const t = UI_TRANSLATIONS[language].app;

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden font-inter">
            {/* Cabecera con Z-Index controlado */}
            <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-20 shrink-0">
                <div className="flex items-center gap-5">
                    {/* Botón de regreso */}
                    <button
                        onClick={handleBackToLibrary}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-600 hover:text-gray-900"
                        title="Volver a Library"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                            <Layout size={20} />
                        </div>
                        <div className="flex flex-col min-w-[140px] md:min-w-[180px]">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={notebookName}
                                        onChange={(e) => setNotebookName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                        className="bg-gray-50 font-black text-base md:text-lg tracking-tighter leading-none text-gray-900 border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1 w-full"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveTitle}
                                        disabled={isSavingTitle}
                                        className="p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className={`flex items-center gap-2 ${!isPublicView ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                    onClick={() => !isPublicView && setIsEditingTitle(true)}
                                    title={isPublicView ? 'No puedes editar el título de un notebook público' : 'Haz clic para editar'}
                                >
                                    <h1 className="font-black text-base md:text-lg tracking-tighter leading-none text-gray-900">
                                        {notebookName}
                                    </h1>
                                    {!isPublicView && <Edit2 size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                            )}
                            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity mt-0.5">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">PROYECTO ACTIVO</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-gray-100 mx-2 hidden lg:block"></div>
                    <span className="text-xs font-bold text-gray-400 hidden lg:block uppercase tracking-wider">{t.title}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setLangMenuOpen(!langMenuOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100 group shadow-sm"
                        >
                            <Globe size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-black text-gray-600">{langLabels[language]}</span>
                            <ChevronDown size={12} className={`text-gray-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {langMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5 animate-in zoom-in-95 duration-150 origin-top-right">
                                {(['es', 'en', 'fr'] as Language[]).map(l => (
                                    <button
                                        key={l}
                                        onClick={() => { setLanguage(l); setLangMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black transition-all ${language === l ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {l === 'es' ? 'Español' : l === 'en' ? 'English' : 'Français'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2 rounded-xl transition-all ${sidebarOpen ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden w-full">
                <aside className={`
                ${sidebarOpen ? 'w-80 md:w-96 translate-x-0' : 'w-0 -translate-x-full opacity-0 pointer-events-none'} 
                transition-all duration-300 ease-in-out flex-shrink-0 z-30 border-r border-gray-100
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

                <main className="flex-1 min-w-0 bg-white relative z-0 overflow-hidden">
                    <ChatInterface
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={chatLoading}
                        sourceSummary={summary}
                        isSummaryLoading={summaryLoading}
                        lang={language}
                    />
                </main>
            </div>
        </div>
    );
};

export default App;
