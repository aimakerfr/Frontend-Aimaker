
import React, { useState, useEffect } from 'react';
import SourcePanel from './components/SourcePanel';
import ChatInterface from './components/ChatInterface';
import { Source, ChatMessage, SourceType, StructuredSummary, Language } from './types';
import { generateChatResponse, generateSourceSummary } from './services/geminiService';
import { Layout, Menu, Globe, ChevronDown, Edit2 } from 'lucide-react';
import { UI_TRANSLATIONS } from './constants/translations';

const App: React.FC = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [summary, setSummary] = useState<StructuredSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [language, setLanguage] = useState<Language>('es');
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [notebookName, setNotebookName] = useState('NoteRAG AI LAB');

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

    const handleAddSource = (type: SourceType, content: string, title: string, url?: string, previewUrl?: string) => {
        const newSource: Source = {
            id: Math.random().toString(36).substring(7),
            title,
            type,
            content,
            url,
            previewUrl,
            dateAdded: new Date(),
            selected: true,
        };
        setSources(prev => [...prev, newSource]);
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
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden font-inter">
            {/* Cabecera con Z-Index controlado */}
            <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white z-20 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                            <Layout size={20} />
                        </div>
                        <div className="flex flex-col min-w-[140px] md:min-w-[180px]">
                            <input
                                type="text"
                                value={notebookName}
                                onChange={(e) => setNotebookName(e.target.value)}
                                className="bg-transparent font-black text-base md:text-lg tracking-tighter leading-none text-gray-900 border-none outline-none focus:ring-0 w-full p-0"
                                placeholder="Nombre del Notebook"
                            />
                            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">PROYECTO ACTIVO</span>
                                <Edit2 size={8} className="text-indigo-400" />
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

            <div className="flex-1 flex overflow-hidden">
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
