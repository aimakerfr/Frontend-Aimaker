import React, { useEffect, useState, useRef } from 'react';
import { getMakerPathVariables, postMakerPathVariable } from '@core/maker-path-variables/maker-path-variables.service';
import { saveMakerPathStepProgress, getMakerPathStepProgress } from '@core/maker-path-step-progress';
import { getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { httpClient } from '@core/api/http.client';
import { Bot, User, Send, Loader2, MessageSquare, Check, Wand2, FileSearch, ListOrdered, RefreshCw, Code2, X, Upload } from 'lucide-react';
import { generateChatResponse } from '../../rag_multimodal/services/geminiService';
import type { Source } from '../../rag_multimodal/types';
import { useLanguage } from '../../../language/useLanguage';

type Message = {
  role: 'user' | 'model';
  content: string;
};

type RagChatStepProps = {
  makerPathId?: number;
  variableIndexNumber?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
  showImagePromptButton?: boolean; // Only show for image generator workflows
};

const RagChatStep: React.FC<RagChatStepProps> = ({
  makerPathId,
  variableIndexNumber,
  stepId,
  onMarkStepComplete,
  showImagePromptButton = false,
}) => {
  const { t } = useLanguage();
  const rc = t.projectFlow.ragChat;
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  const [isStepCompleted, setIsStepCompleted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Instruction from RAG source ─────────────────────────────────────────
  const [showInstructionPanel, setShowInstructionPanel] = useState(false);
  const [showSourcePickerModal, setShowSourcePickerModal] = useState(false);
  const [instructionFileName, setInstructionFileName] = useState<string | null>(null);
  const [parsedInstruction, setParsedInstruction] = useState<string | null>(null);
  const [instructionError, setInstructionError] = useState<string | null>(null);
  // ─────────────────────────────────────────────────────────────────────────

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadRagSources();
    loadPreviousConversation();
  }, [makerPathId, stepId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const saveConversation = async (conversationMessages: Message[]) => {
    if (!makerPathId || !stepId) {
      console.warn('[RagChatStep] Cannot save - missing makerPathId or stepId');
      return;
    }

    try {
      await saveMakerPathStepProgress({
        makerPathId,
        stepId,
        status: 'success',
        resultText: {
          conversation: conversationMessages,
          messagesCount: conversationMessages.length,
          lastMessageAt: new Date().toISOString()
        }
      });
      console.log('[RagChatStep] Conversation saved successfully with', conversationMessages.length, 'messages');
      
      // Auto-complete step on first message exchange
      if (!isStepCompleted && onMarkStepComplete && stepId) {
        onMarkStepComplete(stepId);
        setIsStepCompleted(true);
        console.log('[RagChatStep] Step auto-completed');
      }
    } catch (err) {
      console.error('[RagChatStep] Error saving conversation:', err);
    }
  };

  const loadPreviousConversation = async () => {
    console.log('[RagChatStep] loadPreviousConversation called with:', { makerPathId, stepId });
    
    if (!makerPathId || !stepId) {
      console.log('[RagChatStep] Skipping conversation load - missing makerPathId or stepId');
      return;
    }
    
    try {
      console.log('[RagChatStep] Fetching progress for makerPathId:', makerPathId);
      const progressData = await getMakerPathStepProgress(makerPathId);
      console.log('[RagChatStep] Received progress data:', progressData);
      
      // Find step progress (try both with and without status filter)
      let stepProgress = progressData.find(p => p.stepId === stepId && p.status === 'success');
      if (!stepProgress) {
        stepProgress = progressData.find(p => p.stepId === stepId);
      }
      console.log('[RagChatStep] Found step progress:', stepProgress);
      
      if (stepProgress?.resultText?.conversation && Array.isArray(stepProgress.resultText.conversation)) {
        console.log('[RagChatStep] Loading previous conversation with', stepProgress.resultText.conversation.length, 'messages');
        setMessages(stepProgress.resultText.conversation);
        setIsStepCompleted(true);
      } else {
        console.log('[RagChatStep] No conversation found in progress data');
      }
    } catch (err) {
      console.error('[RagChatStep] Error loading previous conversation:', err);
    }
  };

  const loadRagSources = async () => {
    if (!makerPathId) {
      console.error('[RagChatStep] Missing makerPathId');
      setError('Missing required configuration');
      setIsLoadingSources(false);
      return;
    }

    setIsLoadingSources(true);
    setError(null);
    
    try {
      // Load maker_path to get its rag_id
      console.log('[RagChatStep] Loading maker path:', makerPathId);
      const makerPath = await httpClient.get<any>(`/api/v1/maker-paths/${makerPathId}`);
      
      if (!makerPath?.rag?.id) {
        setError('No se encontró biblioteca RAG. Complete el paso anterior primero.');
        setIsLoadingSources(false);
        return;
      }

      console.log('[RagChatStep] RAG ID:', makerPath.rag.id);
      
      // Load RAG with sources - ALWAYS fetch fresh data
      const ragData = await httpClient.get<any>(`/api/v1/rag-multimodal/${makerPath.rag.id}?t=${Date.now()}`);
      const ragSources = ragData.sources || [];
      
      console.log('[RagChatStep] RAG sources from API:', ragSources.length, 'sources');
      
      if (ragSources.length === 0) {
        // Show friendly message - chat is accessible but cannot function without sources
        setError('No se pudieron cargar fuentes con contenido válido. Por favor agrega fuentes en el paso anterior para comenzar el chat.');
        setIsLoadingSources(false);
        setSources([]); // Clear sources
        return;
      }

      // Load content for each source
      const loadedSources: Source[] = [];
      for (const source of ragSources) {
        try {
          console.log('[RagChatStep] Loading source:', source.id, source.name);
          const sourceData = await getRagMultimodalSourceContent(source.id);
          
          // For PDFs and DOCs, allow empty content - they may be processed on-demand by the backend
          const isPdfOrDoc = sourceData.type === 'doc' || sourceData.type === 'PDF' || sourceData.type === 'DOC';
          const hasContent = sourceData.content && sourceData.content.trim() !== '';
          
          // Skip sources with empty content UNLESS they are PDFs/DOCs (which may be processed on-demand)
          if (!hasContent && !isPdfOrDoc) {
            console.warn('[RagChatStep] Skipping source with empty content:', {
              id: source.id,
              name: sourceData.name,
              type: sourceData.type
            });
            continue;
          }
          
          // Map backend type to frontend type
          const mapSourceType = (backendType: string): 'html' | 'text' | 'pdf' | 'url' => {
            const normalized = backendType.toLowerCase();
            if (normalized === 'pdf' || normalized === 'doc') return 'pdf';
            if (normalized === 'html' || normalized === 'website') return 'html';
            if (normalized === 'text') return 'text';
            if (normalized === 'url') return 'url';
            return 'html'; // default fallback
          };

          // Add source (even if PDF/DOC with empty content - backend will extract on-demand)
          loadedSources.push({
            id: source.id.toString(),
            title: sourceData.name || `Source ${source.id}`,
            type: mapSourceType(sourceData.type),
            backendType: sourceData.type,   // Keep original backend type for filters
            content: hasContent ? sourceData.content : `[${sourceData.name} - Documento pendiente de procesamiento. El contenido se extraerá automáticamente cuando lo uses en el chat.]`,
            dateAdded: new Date(),
            selected: true,
          });
          console.log('[RagChatStep] Successfully loaded source:', source.id, hasContent ? `(content length: ${sourceData.content.length})` : '(pending extraction)');
        } catch (err) {
          console.error(`[RagChatStep] Error loading source ${source.id}:`, err);
        }
      }

      console.log('[RagChatStep] Total loaded sources:', loadedSources.length, 'out of', ragSources.length);
      
      if (loadedSources.length === 0) {
        setError(`Se encontraron ${ragSources.length} fuente(s) pero ninguna tiene contenido válido. Verifica que las fuentes se hayan procesado correctamente.`);
        setSources([]);
      } else {
        setSources(loadedSources);
        setError(null);
        console.log('[RagChatStep] Sources ready:', loadedSources.map(s => ({ id: s.id, title: s.title, contentLength: s.content.length })));
      }
    } catch (err) {
      console.error('[RagChatStep] Error loading RAG sources:', err);
      setError('Error al cargar fuentes. Por favor intenta de nuevo.');
    } finally {
      setIsLoadingSources(false);
    }
  };

  /**
   * RAG sources that can be used as instruction (JSON / TXT / plain text).
   *
   * How it works:
   * 1. The RAG already loaded all sources and stored them in `sources` (with their content).
   * 2. We filter by title extension (.json / .txt) OR by backendType
   *    (text, txt, json, code, config — in any casing).
   * 3. The user picks one from the modal → its content is read from memory (no extra fetch).
   * 4. If the source is JSON, we parse it and extract the instruction key.
   *    If it’s TXT/text, the whole content becomes the instruction.
   * 5. The instruction is sent to the backend on every chat call as `systemInstruction`,
   *    replacing the default hardcoded system prompt in GeminiService.php.
   */
  const INSTRUCTION_TYPES = new Set(['text', 'txt', 'json', 'code', 'config']);
  const instructionSources = sources.filter((s) => {
    const name  = s.title.toLowerCase();
    const btype = (s.backendType ?? s.type ?? '').toLowerCase();
    return (
      name.endsWith('.json') ||
      name.endsWith('.txt')  ||
      s.type === 'text'      ||
      s.type === 'code'      ||
      s.type === 'config'    ||
      INSTRUCTION_TYPES.has(btype)
    );
  });

  /** Extract instruction text from a source's content based on title extension. */
  const extractInstructionFromContent = (content: string, title: string): string | null => {
    const name = title.toLowerCase();
    // Plain text: use content as-is
    if (!name.endsWith('.json')) {
      const trimmed = content.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    // JSON: look for known instruction keys
    try {
      const parsed = JSON.parse(content);
      const keys = ['instruction', 'systemInstruction', 'system_instruction', 'prompt', 'text', 'content'];
      for (const key of keys) {
        if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim() !== '') {
          return parsed[key].trim();
        }
      }
      return null;
    } catch {
      // Not valid JSON — try using the raw content
      const trimmed = content.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  };

  const handleSelectSource = (source: Source) => {
    setInstructionError(null);
    const extracted = extractInstructionFromContent(source.content, source.title);
    if (extracted) {
      setParsedInstruction(extracted);
      setInstructionFileName(source.title);
      setInstructionError(null);
    } else {
      setInstructionError(`No se encontró instrucción en "${source.title}". Verifica que el contenido sea válido.`);
    }
    setShowSourcePickerModal(false);
  };

  const handleClearInstruction = () => {
    setParsedInstruction(null);
    setInstructionFileName(null);
    setInstructionError(null);
  };

  const handleRefreshSources = async () => {
    setIsRefreshing(true);
    await loadRagSources();
    setIsRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || sources.length === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Convert messages to the format expected by generateChatResponse
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // ═══════════════════════════════════════════════════════════════
      // BACKEND LOGIC: All chat processing happens in the backend
      // ═══════════════════════════════════════════════════════════════
      // Endpoint: POST /api/v1/gemini/chat
      // Controller: GeminiController.php → chat()
      // Service: GeminiService.php → generateChatResponse()
      // 
      // What the backend does:
      // 1. Receives: { history, sources, message, language }
      // 2. Combines RAG sources content as context
      // 3. Sends to Gemini API with system prompt
      // 4. Returns: { response: "..." }
      // ═══════════════════════════════════════════════════════════════
      const response = await generateChatResponse(
        history,
        sources,
        userMessage.content,
        'es',
        parsedInstruction ?? undefined
      );

      const botMessage: Message = {
        role: 'model',
        content: response,
      };

      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);
      
      // Auto-save conversation to database after each exchange (real-time)
      await saveConversation(updatedMessages);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        role: 'model',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleArtifactClick = async (prompt: string) => {
    if (isLoading || sources.length === 0) {
      console.log('[RagChatStep] Cannot process artifact - isLoading:', isLoading, 'sourcesLength:', sources.length);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: prompt,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log('[RagChatStep] Sending artifact prompt:', prompt);
      const response = await generateChatResponse(
        history,
        sources.filter((s) => s.selected),
        prompt,
        'es',
        parsedInstruction ?? undefined
      );

      const modelMessage: Message = {
        role: 'model',
        content: response,
      };

      const updatedMessages = [...messages, userMessage, modelMessage];
      setMessages(updatedMessages);
      
      // Save conversation with real-time update
      await saveConversation(updatedMessages);
      console.log('[RagChatStep] Artifact response completed successfully');
    } catch (err) {
      console.error('[RagChatStep] Error in artifact send:', err);
      const errorMessage: Message = {
        role: 'model',
        content: 'Error al generar respuesta. Por favor intenta de nuevo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // Save even error messages
      const messagesWithError = [...messages, userMessage, errorMessage];
      await saveConversation(messagesWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const savePromptAndComplete = async (prompt: string) => {
    if (!makerPathId || !stepId || !variableIndexNumber) {
      console.error('[RagChatStep] Missing required data to save prompt');
      return;
    }

    setIsSavingPrompt(true);
    
    try {
      // Get the ragMultimodalSourceId from the previous step
      const variables = await getMakerPathVariables(makerPathId);
      const targetVariable = variables.find(
        (v) => v.makerPathId === makerPathId && v.variableIndexNumber === variableIndexNumber
      );
      const ragMultimodalSourceId = targetVariable?.ragMultimodalSourceId || null;

      // Save the prompt as a maker path variable
      await postMakerPathVariable({
        makerPathId,
        variableIndexNumber, // Use the same variable index as the RAG selector step
        variableName: 'image_prompt',
        variableValue: { prompt },
        ragMultimodalSourceId, // Include the RAG source reference
      });

      console.log('[RagChatStep] Prompt saved successfully');
      setSavedPrompt(prompt);

      // Save progress to database (preserve conversation)
      const currentProgress = await getMakerPathStepProgress(makerPathId);
      const existingProgress = currentProgress.find(p => p.stepId === stepId);
      
      await saveMakerPathStepProgress({
        makerPathId,
        stepId,
        status: 'success',
        resultText: {
          ...existingProgress?.resultText, // Preserve existing data (like conversation)
          prompt,
          ragMultimodalSourceId,
          messagesCount: messages.length
        }
      });

      // Mark step as complete after a short delay
      setIsStepCompleted(true);
      setTimeout(() => {
        if (onMarkStepComplete && stepId) {
          onMarkStepComplete(stepId);
        }
      }, 500);
    } catch (err) {
      console.error('[RagChatStep] Error saving prompt:', err);
      setError(rc.failedSave);
    } finally {
      setIsSavingPrompt(false);
    }
  };


  const getLastModelMessage = (): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') {
        return messages[i].content;
      }
    }
    return null;
  };

  if (isLoadingSources) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{rc.loadingSources}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <MessageSquare size={48} className="mx-auto text-red-300 dark:text-red-600" />
        <div className="space-y-2">
          <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Asegúrate de agregar fuentes en el paso anterior, luego recarga aquí.
          </p>
        </div>
        <button
          onClick={handleRefreshSources}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Recargando...' : rc.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rc.title}</span>
          {parsedInstruction && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Code2 size={10} />
              Instrucción activa
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {sources.length} {rc.sourcesLoaded}
          </div>
          <button
            onClick={() => setShowInstructionPanel((v) => !v)}
            title="Cargar instrucción desde archivo (.json / .txt)"
            className={`p-1.5 rounded-lg transition-all ${
              showInstructionPanel
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            <Code2 size={16} />
          </button>
          <button
            onClick={handleRefreshSources}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Recargar fuentes del RAG"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Instruction from RAG Panel */}
      {showInstructionPanel && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-950/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Code2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                Instrucción desde RAG
              </span>
            </div>
            <button
              onClick={() => setShowInstructionPanel(false)}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>

          {!parsedInstruction ? (
            <div>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-2">
                Elige una fuente de tipo <strong>texto / JSON</strong> del RAG actual para usarla como instrucción del sistema.
              </p>
              <button
                onClick={() => setShowSourcePickerModal(true)}
                disabled={instructionSources.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:border-indigo-500 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                {instructionSources.length === 0
                  ? 'No hay fuentes .json / .txt en este RAG'
                  : `Elegir fuente (${instructionSources.length} disponible${instructionSources.length > 1 ? 's' : ''})`}
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <Check size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate">{instructionFileName}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 line-clamp-2 whitespace-pre-wrap">{parsedInstruction}</p>
              </div>
              <button
                onClick={handleClearInstruction}
                className="flex-shrink-0 p-0.5 rounded text-emerald-500 hover:text-red-500 transition-colors"
                title="Quitar instrucción"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {instructionError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{instructionError}</p>
          )}

          {parsedInstruction && (
            <button
              onClick={() => setShowSourcePickerModal(true)}
              className="mt-2 w-full py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
            >
              Cambiar fuente
            </button>
          )}
        </div>
      )}

      {/* Source Picker Modal */}
      {showSourcePickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-indigo-600" />
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Elegir fuente de instrucción
                </span>
              </div>
              <button
                onClick={() => setShowSourcePickerModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fuentes disponibles en este RAG ({instructionSources.length}). Elige la que contiene la instrucción del sistema.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto px-5 pb-4 space-y-2">
              {instructionSources.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  No hay fuentes .json, .txt o de tipo texto en este RAG.
                </p>
              ) : (
                instructionSources.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSource(s)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                      <Code2 size={13} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {s.type} · {s.content.length} chars
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3">
            <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {rc.emptyTitle}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rc.emptySubtitle}
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{rc.thinking}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 space-y-3">
        {/* Artifact Buttons */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => handleArtifactClick(rc.artifacts?.analyzeSources || 'Analiza las fuentes')}
            disabled={isLoading || sources.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FileSearch size={14} />
            <span>{rc.artifacts?.analyzeSources || 'Analiza las fuentes'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleArtifactClick(rc.artifacts?.summarizeIdeas || 'Resume las ideas principales')}
            disabled={isLoading || sources.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 border border-blue-200 dark:border-blue-700 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <ListOrdered size={14} />
            <span>{rc.artifacts?.summarizeIdeas || 'Resume las ideas principales'}</span>
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={rc.sendPlaceholder}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Use as Image Prompt Button - Only for image generator workflows */}
        {showImagePromptButton && messages.length > 0 && getLastModelMessage() && !savedPrompt && (
          <button
            onClick={() => {
              const lastPrompt = getLastModelMessage();
              if (lastPrompt) {
                savePromptAndComplete(lastPrompt);
              }
            }}
            disabled={isSavingPrompt}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isSavingPrompt ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {rc.savingPrompt}
              </>
            ) : (
              <>
                <Wand2 size={16} />
                {rc.useLastResponse}
              </>
            )}
          </button>
        )}

        {/* Prompt Saved Confirmation - Only for image generator workflows */}
        {showImagePromptButton && savedPrompt && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
            <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {rc.savedPrompt}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RagChatStep;
