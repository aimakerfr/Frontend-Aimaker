/**
 * RagChatPage — Chat libre con Gemini.
 *
 * Los archivos que cargues (local o desde RAG) se usan como
 * instrucción interna del sistema (system instruction).
 * Todo el contenido se concatena y se envía como contexto a Gemini.
 *
 * Ruta: /dashboard/rag-chat
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, User, Send, Loader2, X, Upload, Database, FileText,
  MessageSquare, Trash2, ArrowLeft, RefreshCw,
} from 'lucide-react';
import { httpClient } from '@core/api/http.client';
import { getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { generateChatResponse } from '../rag_multimodal/services/geminiService';

// ─── Types (v2) ────────────────────────────────────────────────────────────────────

type Message = { role: 'user' | 'model'; content: string };

type LoadedFile = {
  id: string;
  name: string;
  content: string;
  sizeChars: number;
};

type RagSummary = { id: number; name?: string; title?: string; sources?: unknown[] };

// ─── Helper: build system instruction from all files ─────────────────────────

function buildSystemInstruction(files: LoadedFile[]): string {
  if (files.length === 0) return '';
  if (files.length === 1) return files[0].content.trim();
  return files
    .map((f) => `=== ${f.name} ===\n${f.content.trim()}`)
    .join('\n\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

const RagChatPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Loaded files → system instruction ────────────────────────────────────
  const [files, setFiles] = useState<LoadedFile[]>([]);

  // ── RAG picker ────────────────────────────────────────────────────────────
  const [availableRags, setAvailableRags]     = useState<RagSummary[]>([]);
  const [showRagPicker, setShowRagPicker]     = useState(false);
  const [loadingRags, setLoadingRags]         = useState(false);
  const [loadingRagFiles, setLoadingRagFiles] = useState(false);
  const [ragError, setRagError]               = useState<string | null>(null);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [chatError, setChatError]   = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height =
      `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [inputValue]);

  // ── File loading (local) ──────────────────────────────────────────────────

  const addFiles = (rawFiles: File[]) => {
    rawFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string ?? '';
        if (!content.trim()) return;
        setFiles((prev) => {
          if (prev.find((f) => f.name === file.name)) return prev;
          return [
            ...prev,
            { id: `${Date.now()}-${Math.random()}`, name: file.name, content, sizeChars: content.length },
          ];
        });
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ── RAG loading ───────────────────────────────────────────────────────────

  const fetchRags = async () => {
    setLoadingRags(true);
    setRagError(null);
    try {
      const data = await httpClient.get<any>('/api/v1/rag-multimodal');
      const list: RagSummary[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAvailableRags(list);
      setShowRagPicker(true);
    } catch {
      setRagError('Error al cargar RAGs. Verifica tu conexión.');
    } finally {
      setLoadingRags(false);
    }
  };

  const loadFromRag = async (ragId: number) => {
    setLoadingRagFiles(true);
    setRagError(null);
    setShowRagPicker(false);
    try {
      const ragData = await httpClient.get<any>(`/api/v1/rag-multimodal/${ragId}`);
      const ragSources: any[] = ragData.sources ?? [];
      for (const src of ragSources) {
        try {
          const sourceData = await getRagMultimodalSourceContent(src.id);
          if (!sourceData.content?.trim()) continue;
          const name = sourceData.name || `fuente-${src.id}`;
          setFiles((prev) => {
            if (prev.find((f) => f.name === name)) return prev;
            return [
              ...prev,
              {
                id: `rag-${src.id}`,
                name,
                content: sourceData.content,
                sizeChars: sourceData.content.length,
              },
            ];
          });
        } catch {
          // skip individual failed sources
        }
      }
    } catch {
      setRagError('Error al cargar las fuentes del RAG.');
    } finally {
      setLoadingRagFiles(false);
    }
  };

  // ── Derived: system instruction (all files concatenated) ─────────────────

  const systemInstruction = buildSystemInstruction(files);
  const totalChars = files.reduce((acc, f) => acc + f.sizeChars, 0);

  // ── Chat ──────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const msg = inputValue.trim();
    if (!msg || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setChatError(null);

    try {
      const history = newMessages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      // Files become the system instruction; no RAG sources array
      const response = await generateChatResponse(
        history,
        [],
        msg,
        'es',
        systemInstruction || undefined,
      );
      setMessages([...newMessages, { role: 'model', content: response }]);
    } catch (err: any) {
      setChatError(`Error al consultar Gemini: ${err.message ?? 'Inténtalo de nuevo'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-5 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">RAG Chat</h1>
        </div>

        <div className="flex items-center gap-3">
          {files.length > 0 && (
            <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full">
              {files.length} archivo{files.length !== 1 ? 's' : ''} como instrucción
              &nbsp;·&nbsp;~{Math.round(totalChars / 1000)}k chars
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setChatError(null); }}
              title="Limpiar conversación"
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
            >
              <RefreshCw size={17} />
            </button>
          )}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Files panel ────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Instrucción interna</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              El contenido de estos archivos se envía como instrucción del sistema a Gemini
            </p>
          </div>

          {/* Load buttons */}
          <div className="flex flex-col gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            >
              <Upload size={15} className="text-violet-500" />
              Archivo local
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,.md,.csv,.xml,.html,.js,.ts,.py"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={fetchRags}
              disabled={loadingRags || loadingRagFiles}
              className="flex items-center gap-2 text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200 disabled:opacity-60"
            >
              {(loadingRags || loadingRagFiles) ? (
                <Loader2 size={15} className="animate-spin text-violet-500" />
              ) : (
                <Database size={15} className="text-violet-500" />
              )}
              {loadingRagFiles ? 'Cargando…' : 'Desde RAG'}
            </button>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="text-[11px] text-center text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              arrastra archivos aquí
            </div>
          </div>

          {ragError && <p className="text-xs text-red-500 px-3 py-2">{ragError}</p>}

          {/* RAG list picker */}
          {showRagPicker && availableRags.length > 0 && (
            <div className="border-b border-gray-100 dark:border-gray-700 px-3 py-2 bg-violet-50 dark:bg-violet-900/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Elige un RAG</span>
                <button onClick={() => setShowRagPicker(false)}>
                  <X size={13} className="text-gray-400" />
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {availableRags.map((rag) => (
                  <button
                    key={rag.id}
                    onClick={() => loadFromRag(rag.id)}
                    className="text-left text-xs px-2 py-1.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-700 dark:text-gray-200 truncate"
                  >
                    <span className="font-medium">{rag.name ?? rag.title ?? `RAG #${rag.id}`}</span>
                    {rag.sources && (
                      <span className="ml-1 text-gray-400">
                        ({(rag.sources as any[]).length} fuentes)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files list */}
          <div className="flex-1 overflow-y-auto p-2">
            {files.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8 px-4">
                Sin archivos aún.{' '}
                <button className="underline text-violet-400" onClick={() => fileInputRef.current?.click()}>
                  Carga uno
                </button>{' '}
                o importa desde un RAG.
              </p>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group"
                >
                  <FileText size={13} className="flex-shrink-0 text-violet-400" />
                  <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-[10px] text-gray-400 hidden group-hover:inline">
                    {Math.round(f.sizeChars / 100) / 10}k
                  </span>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Right: Chat ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 gap-3">
                <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
                  <MessageSquare size={28} className="text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400 text-sm">Chat con instrucción personalizada</p>
                  <p className="text-xs mt-1 max-w-64">
                    {files.length === 0
                      ? 'Carga archivos en el panel izquierdo. Su contenido se usará como instrucción interna de Gemini.'
                      : `${files.length} archivo${files.length !== 1 ? 's' : ''} cargado${files.length !== 1 ? 's' : ''} como instrucción. Escribe tu pregunta.`}
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Bot size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-violet-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Bot size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Loader2 size={16} className="animate-spin text-violet-500" />
                </div>
              </div>
            )}

            {chatError && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {chatError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje… (Enter para enviar)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none py-1"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RagChatPage;

