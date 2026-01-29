import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Globe, Bot, Plus, ArrowUp, X, FileText, Info } from 'lucide-react';
import { getPublicCreationTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { httpClient } from '@core/api/http.client';
import { geminiService, type AssistantConfig, type Message } from '@core/gemini/gemini.service';
import type { Attachment } from './assistant/types';
import { getTranslation, type Language } from './assistant/i18n';

const PublicAssistant: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assistant, setAssistant] = useState<CreationTool | null>(null);
  const [assistantData, setAssistantData] = useState<AssistantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const language: Language = (assistant?.language || 'es') as Language;
  const t = (key: Parameters<typeof getTranslation>[1], params?: any) => getTranslation(language, key, params);

  useEffect(() => {
    const loadAssistant = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getPublicCreationTool(parseInt(id));
        
        // Verificar que sea público
        if (!data.hasPublicStatus) {
          setError('Este asistente es privado y no está disponible públicamente.');
          return;
        }
        
        // Verificar que sea tipo assistant
        if (data.type !== 'assistant') {
          setError('El recurso solicitado no es un asistente.');
          return;
        }
        
        setAssistant(data);
        
        // Cargar datos específicos del asistente desde la tabla assistants
        try {
          const assistantRes = await httpClient.get<AssistantConfig>(
            `/api/v1/tools/${id}/assistant`,
            { requiresAuth: false }
          );
          setAssistantData(assistantRes);
        } catch (assistantErr) {
          console.error('Error cargando datos del asistente:', assistantErr);
          // No es error crítico, puede no tener datos específicos aún
        }
      } catch (err) {
        console.error('Error cargando asistente:', err);
        setError('No se pudo cargar el asistente. Puede que no exista o no sea público.');
      } finally {
        setLoading(false);
      }
    };

    loadAssistant();
  }, [id]);

  // Auto-scroll cuando cambian los mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoadingResponse]);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Handle envío de mensaje
  const handleSendMessage = async (message: string, atts?: Attachment[]) => {
    if ((!message.trim() && !atts?.length) || isLoadingResponse || !assistantData) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      attachments: atts
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoadingResponse(true);

    try {
      const response = await geminiService.chatWithAssistant(
        assistantData,
        [...messages, userMessage]
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        image: response.image
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al obtener respuesta:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje.'
      }]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({
        mimeType: file.type,
        data: base64.split(',')[1],
        name: file.name
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if ((inputValue.trim() || attachments.length > 0) && !isLoadingResponse) {
      handleSendMessage(inputValue, attachments);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando asistente...</p>
        </div>
      </div>
    );
  }

  if (error || !assistant || !assistantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/10 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Asistente no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se encontró el asistente solicitado.'}
          </p>
        </div>
      </div>
    );
  }

  const starters = assistantData.starters || [];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between px-8 bg-white dark:bg-gray-800 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">{assistant.title}</h1>
            <div className="flex items-center gap-2 text-[10px]">
              <Globe size={10} className="text-green-500" />
              <span className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Vista Pública</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          {t('preview.statusBar')}
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 relative flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/50 mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {assistant.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                {assistant.description || t('preview.emptyDesc')}
              </p>
            </div>
            {starters.length > 0 && (
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-12 px-4">
                {starters.slice(0, 4).filter(Boolean).map((starter, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSendMessage(starter)}
                    className="p-4 text-left bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                  >
                    <span className="group-hover:text-blue-500 transition-colors">{starter}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 pb-40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] text-[13px] leading-relaxed font-medium ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 rounded-[20px] rounded-tr-none px-5 py-3 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30' 
                    : 'text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-[20px] rounded-tl-none px-5 py-3 shadow-sm'
                }`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 rounded-lg px-2 py-1 text-[10px] uppercase font-bold">
                          {att.mimeType.startsWith('image/') ? (
                            <img src={`data:${att.mimeType};base64,${att.data}`} className="w-16 h-16 rounded object-cover" alt="attachment" />
                          ) : (
                            <><FileText className="w-3 h-3" /> {t('chatInput.file')}</>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
                  {msg.image && <div className={msg.content ? 'mt-3' : ''}><img src={msg.image} alt="Generated" className="rounded-xl w-full h-auto shadow-sm border border-slate-100 dark:border-gray-700" /></div>}
                </div>
              </div>
            ))}
            {isLoadingResponse && (
              <div className="flex justify-start gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="text-slate-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-widest py-3 italic">
                  {t('preview.thinking')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent">
          <div className="max-w-3xl mx-auto space-y-3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 truncate max-w-[100px] uppercase tracking-tight">{att.name}</span>
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} 
                      className="p-1 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg text-slate-400 hover:text-pink-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative flex items-end gap-3 w-full border border-slate-200 dark:border-gray-700 rounded-[24px] bg-white dark:bg-gray-800 p-2.5 shadow-xl shadow-slate-200/40 dark:shadow-gray-900/40 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-2xl transition-colors text-slate-400 hover:text-blue-500"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple />
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={t('preview.placeholder', { name: assistant.title })}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium py-2.5 resize-none max-h-[200px] overflow-y-auto text-slate-700 dark:text-gray-200 placeholder:text-slate-300 dark:placeholder:text-gray-500"
              />
              <button 
                onClick={handleSend} 
                disabled={(!inputValue.trim() && attachments.length === 0) || isLoadingResponse} 
                className={`p-2.5 rounded-2xl transition-all shadow-md ${
                  (inputValue.trim() || attachments.length > 0) 
                    ? 'bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-900/30' 
                    : 'bg-slate-100 dark:bg-gray-700 text-slate-300 dark:text-gray-500'
                } active:scale-95 disabled:opacity-50`}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAssistant;
