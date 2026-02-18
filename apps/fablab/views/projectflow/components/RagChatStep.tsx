import React, { useEffect, useState, useRef } from 'react';
import { getMakerPathVariables } from '@core/maker-path-variables/maker-path-variables.service';
import { getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { Bot, User, Send, Loader2, MessageSquare } from 'lucide-react';
import { generateChatResponse } from '../../rag_multimodal/services/geminiService';
import type { Source } from '../../rag_multimodal/types';

type Message = {
  role: 'user' | 'model';
  content: string;
};

type RagChatStepProps = {
  makerPathId?: number;
  variableIndexNumber?: number;
  stepId?: number;
  onMarkStepComplete?: (stepId: number) => void;
};

const RagChatStep: React.FC<RagChatStepProps> = ({
  makerPathId,
  variableIndexNumber,
}) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadRagSources();
  }, [makerPathId, variableIndexNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const loadRagSources = async () => {
    if (!makerPathId || !variableIndexNumber) {
      console.error('[RagChatStep] Missing config:', { makerPathId, variableIndexNumber });
      setError('Missing required configuration');
      setIsLoadingSources(false);
      return;
    }

    setIsLoadingSources(true);
    setError(null);
    
    try {
      // Get the variable that contains the selected RAG IDs
      console.log('[RagChatStep] Loading variables for:', { makerPathId, variableIndexNumber });
      const variables = await getMakerPathVariables(makerPathId);
      console.log('[RagChatStep] All variables:', variables);
      
      const targetVariable = variables.find(
        (v) => v.makerPathId === makerPathId && v.variableIndexNumber === variableIndexNumber
      );
      console.log('[RagChatStep] Target variable:', targetVariable);

      if (!targetVariable) {
        setError('No knowledge sources found. Please complete the previous step.');
        setIsLoadingSources(false);
        return;
      }

      // Extract RAG source IDs
      const variableValue = targetVariable.variableValue as any;
      const ragSourceIds: number[] = variableValue?.ragSourceIds || [];
      console.log('[RagChatStep] RAG source IDs:', ragSourceIds);

      if (ragSourceIds.length === 0) {
        setError('No knowledge sources selected.');
        setIsLoadingSources(false);
        return;
      }

      // Load content for each RAG source
      const loadedSources: Source[] = [];
      for (const sourceId of ragSourceIds) {
        try {
          console.log('[RagChatStep] Loading source:', sourceId);
          const sourceData = await getRagMultimodalSourceContent(sourceId);
          loadedSources.push({
            id: sourceId.toString(),
            title: sourceData.name || `Source ${sourceId}`,
            type: 'html' as const,
            content: sourceData.content || '',
            dateAdded: new Date(),
            selected: true,
          });
        } catch (err) {
          console.error(`[RagChatStep] Error loading source ${sourceId}:`, err);
        }
      }

      console.log('[RagChatStep] Loaded sources:', loadedSources.length);
      if (loadedSources.length === 0) {
        setError('Could not load any knowledge sources.');
      } else {
        setSources(loadedSources);
      }
    } catch (err) {
      console.error('[RagChatStep] Error loading RAG sources:', err);
      setError('Error loading knowledge sources. Please try again.');
    } finally {
      setIsLoadingSources(false);
    }
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
        'es'
      );

      const botMessage: Message = {
        role: 'model',
        content: response,
      };

      setMessages((prev) => [...prev, botMessage]);
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

  if (isLoadingSources) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading knowledge sources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <MessageSquare size={48} className="mx-auto text-red-300 dark:text-red-600" />
        <div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-sm">{error}</p>
          <button
            onClick={loadRagSources}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            RAG Chat Assistant
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {sources.length} source{sources.length !== 1 ? 's' : ''} loaded
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3">
            <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Start a conversation
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ask questions about the selected knowledge sources
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
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
      </div>
    </div>
  );
};

export default RagChatStep;
