
import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, ChevronDown, ChevronUp, Target, Layers } from 'lucide-react';
import { ChatMessage, StructuredSummary } from '../types.ts';
import { useLanguage } from '../../../language/useLanguage';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
    sourceSummary: StructuredSummary | null;
    isSummaryLoading: boolean;
    onBack?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, sourceSummary, isSummaryLoading }) => {
    const { t } = useLanguage();
    const tc = t.notebook.chat;
    const [input, setInput] = React.useState('');
    const [showSummary, setShowSummary] = React.useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    const handleSuggestedClick = (q: string) => { onSendMessage(q); };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 space-y-6 no-scrollbar">
                {(sourceSummary || isSummaryLoading) && (
                    <div className="max-w-5xl mx-auto w-full mb-10">
                        <div className={`bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 transition-all duration-500 ${!showSummary ? 'max-h-16' : 'max-h-[3000px]'}`}>
                            <button onClick={() => setShowSummary(!showSummary)} className="w-full flex items-center justify-between p-5 bg-indigo-600 text-white transition-all hover:bg-indigo-700">
                                <div className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.15em]"><BookOpen size={18} className="text-indigo-200" />{tc.overview}</div>
                                <div className="flex items-center gap-2 bg-indigo-500/50 px-3 py-1 rounded-full text-[10px] font-bold">
                                    {isSummaryLoading ? tc.analyzing : `${sourceSummary?.sourcesAnalysis.length} ${tc.sourcesCount}`}
                                    {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>
                            <div className="p-8 space-y-10">
                                {isSummaryLoading ? <div className="space-y-6 animate-pulse"><div className="h-6 bg-gray-100 rounded-full w-3/4"></div></div> : sourceSummary && (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest"><Target size={16} /> {tc.synthesis}</div>
                                            <div className="bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100/50">
                                                <p className="text-gray-800 text-base font-medium">{sourceSummary.globalOverview}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest"><Layers size={16} /> {tc.breakdown}</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {sourceSummary.sourcesAnalysis.map((source, idx) => (
                                                    <div key={idx} className="flex flex-col border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-bold text-gray-900 text-sm truncate pr-4">{source.title}</h4>
                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md border border-gray-100">{source.type}</span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm mb-6">{source.summary}</p>
                                                        <div className="mt-auto space-y-6">
                                                            <div><div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{tc.topics}</div>
                                                                 <div className="flex flex-wrap gap-2">{source.keyTopics.map((topic, i) => <span key={i} className="text-[10px] px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full font-bold border border-gray-100">{topic}</span>)}</div>
                                                            </div>
                                                            <div className="pt-4 border-t border-gray-50">
                                                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{tc.questions}</div>
                                                                <div className="space-y-2">
                                                                    {source.suggestedQuestions.map((q, i) => (
                                                                        <button key={i} onClick={() => handleSuggestedClick(q)} className="flex items-start gap-2 w-full text-left text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">
                                                                            <span className="mt-1 w-1 h-1 rounded-full bg-indigo-300"></span><span className="flex-1">{q}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30">
                        <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12"><Sparkles className="text-indigo-500 w-12 h-12" /></div>
                        <h3 className="text-2xl font-black text-gray-800 tracking-tighter">{tc.start}</h3>
                        <p className="text-sm text-gray-500 text-center mt-3 font-medium">{tc.startSub}</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-5 max-w-4xl mx-auto w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100 border-2 border-white text-white"><Bot size={20} /></div>}
                            <div className={`max-w-[85%] rounded-[2rem] p-6 text-sm shadow-sm border ${msg.role === 'user' ? 'bg-gray-900 border-gray-800 text-white rounded-tr-none' : 'bg-white border-gray-100 text-gray-700 rounded-tl-none'}`}>
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap font-medium">{msg.content}</div>
                            </div>
                            {msg.role === 'user' && <div className="w-10 h-10 rounded-2xl bg-gray-200 flex items-center justify-center shadow-md border-2 border-white text-gray-600"><User size={20} /></div>}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-5 justify-start animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto w-full">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-400"><Bot size={20} /></div>
                        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-4">
                            <div className="flex gap-1.5"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></span></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{tc.synthesizing}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-8 border-t border-gray-50 bg-white/80 backdrop-blur-xl">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <input type="text" className="w-full pl-8 pr-16 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500/20 focus:bg-white transition-all shadow-inner text-sm font-semibold" placeholder={tc.placeholder} value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
                    <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-3 top-3 p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-200 active:scale-95 disabled:bg-gray-100 disabled:text-gray-300"><Send size={22} /></button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
