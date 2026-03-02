import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Copy, Check, ArrowLeft, BookOpen } from 'lucide-react';
import RagSourcePanel, { type RagSource } from '../projectflow/components/RagSourcePanel';
import ChatInterface from '../notebook/components/ChatInterface.tsx';
import UploadSourceModal from '../rag_multimodal/components/UploadSourceModal.tsx';
import { Source, SourceType } from '../rag_multimodal/types';
import { ChatMessage } from '../notebook/types.ts';
import { generateChatResponse } from '../notebook/services/geminiService.ts';
import { getMakerPath, updateMakerPath } from '@core/maker-path';
import { getMakerPathStepProgress, saveMakerPathStepProgress } from '@core/maker-path-step-progress';
import { getRagMultimodalSources, postRagMultimodalSource, deleteRagMultimodalSource, getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { useLanguage } from '../../language/useLanguage';

// Step IDs for maker_path steps (matching the workflow configuration)
// const RAG_SELECTOR_STEP_ID = 1; // Sources selection (not used in ProductView)
const RAG_CHAT_STEP_ID = 2;     // Chat conversation

interface MakerPath {
  id: number;
  title: string;
  description: string;
  productLink?: string;
  productStatus: 'public' | 'private';
  rag?: {
    id: number;
    tool: {
      id: number;
      title: string;
    };
  };
}

const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [makerPath, setMakerPath] = useState<MakerPath | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadRagSources = async (ragId: number) => {
    try {
      console.log('[ProductView] Loading RAG sources for RAG ID:', ragId);
      const apiSources = await getRagMultimodalSources(ragId);
      
      if (apiSources.length === 0) {
        console.log('[ProductView] No sources found');
        setSources([]);
        return;
      }

      // Load content for each source (same logic as RagChatStep)
      const loadedSources: Source[] = [];
      for (const source of apiSources) {
        try {
          console.log('[ProductView] Loading content for source:', source.id);
          const sourceData = await getRagMultimodalSourceContent(source.id);
          
          // For PDFs and DOCs, allow empty content - they may be processed on-demand by the backend
          const isPdfOrDoc = sourceData.type === 'doc' || sourceData.type === 'PDF' || sourceData.type === 'DOC';
          const hasContent = sourceData.content && sourceData.content.trim() !== '';
          
          // Skip sources with empty content UNLESS they are PDFs/DOCs (which may be processed on-demand)
          if (!hasContent && !isPdfOrDoc) {
            console.warn('[ProductView] Skipping source with empty content:', {
              id: source.id,
              name: sourceData.name,
              type: sourceData.type
            });
            continue;
          }
          
          loadedSources.push({
            id: source.id.toString(),
            title: sourceData.name || `Source ${source.id}`,
            type: mapApiSourceType(sourceData.type),
            backendType: sourceData.type,
            content: hasContent ? sourceData.content : `[${sourceData.name} - Documento pendiente de procesamiento]`,  // CRITICAL: Load actual content or placeholder
            url: source.filePath || '',  // Use filePath from original source
            previewUrl: source.filePath || '',  // Use filePath from original source
            dateAdded: source.createdAt ? new Date(source.createdAt) : new Date(),
            selected: true,  // Auto-select all sources like RagChatStep
          });
        } catch (err) {
          console.error(`[ProductView] Error loading source ${source.id}:`, err);
        }
      }
      
      console.log('[ProductView] Loaded sources with content:', loadedSources.length);
      console.log('[ProductView] Sources ready:', loadedSources.map(s => ({ 
        id: s.id, 
        title: s.title, 
        contentLength: s.content.length,
        selected: s.selected 
      })));
      setSources(loadedSources);
    } catch (error) {
      console.error('[ProductView] Error loading RAG sources:', error);
    }
  };

  const uploadSource = async (ragId: number, apiType: string, title: string, file?: File, url?: string, text?: string) => {
    const formData = new FormData();
    formData.append('rag_multimodal_id', ragId.toString());
    formData.append('name', title);
    formData.append('type', apiType);
    
    if (file) {
      formData.append('stream_file', file);
    }
    if (url) {
      formData.append('url', url);
    }
    if (text) {
      formData.append('text', text);
    }
    
    return await postRagMultimodalSource(formData);
  };

  const handleAddSource = async (type: SourceType, content: string, title: string, url?: string, _previewUrl?: string, file?: File) => {
    if (!makerPath?.rag?.id) {
      console.error('[ProductView] No RAG associated with this maker path');
      return;
    }

    try {
      let apiType = type.toUpperCase();
      if (apiType === 'URL') apiType = 'WEBSITE';
      if (apiType === 'PDF') apiType = 'DOC';

      await uploadSource(makerPath.rag.id, apiType, title, file, url, content);
      
      // Reload all sources with content from database (ensures consistency)
      await loadRagSources(makerPath.rag.id);
      console.log('[ProductView] Source added and reloaded');
    } catch (error) {
      console.error('[ProductView] Error adding source:', error);
      alert('Error al agregar la fuente. Por favor intente de nuevo.');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!makerPath?.rag?.id) return;
    
    try {
      await deleteRagMultimodalSource(parseInt(sourceId));
      
      // Reload all sources from database (ensures consistency)
      await loadRagSources(makerPath.rag.id);
      console.log('[ProductView] Source deleted and reloaded');
    } catch (error) {
      console.error('[ProductView] Error deleting source:', error);
      alert('Error al eliminar la fuente. Por favor intente de nuevo.');
    }
  };

  const saveChatHistory = async (makerPathId: number, messages: ChatMessage[]) => {
    try {
      // Save with real-time update - use same format as RagChatStep
      await saveMakerPathStepProgress({
        makerPathId,
        stepId: RAG_CHAT_STEP_ID,
        status: 'success',
        resultText: {
          conversation: messages,
          messagesCount: messages.length,
          lastMessageAt: new Date().toISOString()
        },
      });
      console.log('[ProductView] Chat history saved with', messages.length, 'messages');
    } catch (error) {
      console.error('[ProductView] Error saving chat history:', error);
    }
  };

  const loadChatHistory = async (makerPathId: number) => {
    try {
      console.log('[ProductView] Loading chat history for maker path:', makerPathId);
      const progress = await getMakerPathStepProgress(makerPathId);
      
      // Load chat from step 2 (rag_chat step in maker_path flow)
      let chatStep = progress.find(p => p.stepId === RAG_CHAT_STEP_ID && p.status === 'success');
      if (!chatStep) {
        chatStep = progress.find(p => p.stepId === RAG_CHAT_STEP_ID);
      }
      
      if (chatStep && chatStep.resultText) {
        // Check if resultText has conversation property (RagChatStep format)
        let history: any[] = [];
        
        if (chatStep.resultText.conversation && Array.isArray(chatStep.resultText.conversation)) {
          history = chatStep.resultText.conversation;
        } else if (Array.isArray(chatStep.resultText)) {
          history = chatStep.resultText;
        } else if (chatStep.resultText.messages && Array.isArray(chatStep.resultText.messages)) {
          history = chatStep.resultText.messages;
        }
        
        // Add IDs if they don't exist (for React rendering)
        const messagesWithIds = history.map((msg, idx) => ({
          ...msg,
          id: msg.id || `${msg.role}-${idx}-${Date.now()}`
        }));
        
        console.log('[ProductView] Chat history loaded:', messagesWithIds.length, 'messages');
        setMessages(messagesWithIds);
      } else {
        console.log('[ProductView] No chat history found');
      }
    } catch (error) {
      console.error('[ProductView] Error loading chat history:', error);
    }
  };

  // Load maker path and RAG data
  useEffect(() => {
    if (!id) return;

    const loadProductData = async () => {
      try {
        setIsLoading(true);
        console.log('[ProductView] Loading maker path for ID:', id);
        const path = await getMakerPath(parseInt(id));
        console.log('[ProductView] Maker path loaded:', path);
        console.log('[ProductView] - Title:', path.title);
        console.log('[ProductView] - Description:', path.description);
        console.log('[ProductView] - Product Link:', (path as any).productLink);
        console.log('[ProductView] - Product Status:', (path as any).productStatus);
        console.log('[ProductView] - RAG:', (path as any).rag);
        
        setMakerPath(path as any); // Type assertion since API response includes rag

        // Load chat history
        await loadChatHistory(parseInt(id));

        // Load RAG sources if available
        if ((path as any).rag?.id) {
          console.log('[ProductView] RAG ID found:', (path as any).rag.id);
          await loadRagSources((path as any).rag.id);
        } else {
          console.warn('[ProductView] No RAG associated with this maker path');
        }
      } catch (error) {
        console.error('[ProductView] Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [id]);

  const mapApiSourceType = (type: string): SourceType => {
    switch (type?.toUpperCase()) {
      case 'DOC':
      case 'PDF':
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

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || chatLoading || !makerPath) return;

    // Use sources with content (already loaded and selected)
    const selectedSources = sources.filter((s) => s.selected);
    
    console.log('[ProductView] Sending message with sources:', {
      sourcesCount: selectedSources.length,
      sourcesWithContent: selectedSources.filter(s => s.content && s.content.length > 0).length
    });

    // Message format matching RagChatStep (id only for React rendering)
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatLoading(true);

    try {
      // Same API call as RagChatStep
      const response = await generateChatResponse(
        messages,
        selectedSources,
        message,
        'es'
      );

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: response,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save chat history to maker_path_step_progress (same format as RagChatStep - without IDs)
      const messagesToSave = finalMessages.map(({ role, content }) => ({ role, content }));
      await saveChatHistory(makerPath.id, messagesToSave);
    } catch (error) {
      console.error('[ProductView] Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje.',
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      const messagesToSave = finalMessages.map(({ role, content }) => ({ role, content }));
      await saveChatHistory(makerPath.id, messagesToSave);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleCopyUrl = () => {
    if (makerPath?.productLink) {
      navigator.clipboard.writeText(makerPath.productLink);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  // Convert Source to RagSource for RagSourcePanel compatibility
  const convertToRagSources = (sources: Source[]): RagSource[] => {
    return sources.map(source => ({
      id: parseInt(source.id),
      name: source.title,
      type: source.backendType || source.type,
      createdAt: source.dateAdded.toISOString(),
      selected: source.selected,
      url: source.url,
    }));
  };

  // Adapter handlers for RagSourcePanel (number ID -> string ID)
  const handleToggleSourceAdapter = (id: number) => {
    handleToggleSource(id.toString());
  };

  const handleDeleteSourceAdapter = (id: number) => {
    handleDeleteSource(id.toString());
  };

  const handleTitleChange = (newTitle: string) => {
    if (!makerPath) return;
    // Solo actualizar el estado local en onChange
    setMakerPath({ ...makerPath, title: newTitle });
  };

  const handleTitleBlur = async () => {
    if (!makerPath) return;
    try {
      // Guardar a la BD solo cuando pierde el foco
      await updateMakerPath(makerPath.id, { title: makerPath.title });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    if (!makerPath) return;
    // Solo actualizar el estado local en onChange
    setMakerPath({ ...makerPath, description: newDescription });
  };

  const handleDescriptionBlur = async () => {
    if (!makerPath) return;
    try {
      // Guardar a la BD solo cuando pierde el foco
      await updateMakerPath(makerPath.id, { description: makerPath.description });
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!makerPath) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Producto no encontrado</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-auto flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Top Row - Back button, Title/Description, Status Badge */}
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          {/* Left side - Back button + Notebook icon + Title and Description */}
          <div className="flex-1 flex items-start gap-4">
            <button
              onClick={() => navigate('/dashboard/maker-path')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
              title="Volver"
            >
              <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
            </button>
            
            {/* Notebook Icon Indicator */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0 mt-1" title="Vista de Notebook">
              <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                value={makerPath.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full"
                placeholder="Título del producto"
              />
              <input
                type="text"
                value={makerPath.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={handleDescriptionBlur}
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full mt-1"
                placeholder="Descripción del producto"
              />
            </div>
          </div>

          {/* Right side - Status Badge */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Globe size={18} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                Producto Público
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row - Product Link with Copy */}
        {makerPath.productLink && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 max-w-3xl">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <a
                  href={makerPath.productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {makerPath.productLink}
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors flex-shrink-0"
                  title="Copiar URL"
                >
                  {urlCopied ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Sources */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <RagSourcePanel
            sources={convertToRagSources(sources)}
            onToggleSource={handleToggleSourceAdapter}
            onDeleteSource={handleDeleteSourceAdapter}
            onOpenImportModal={() => {}} // No import in product view
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            hideImportButton={true}
          />
        </aside>

        {/* Center - Chat Interface */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatLoading}
            sourceSummary={null}
            isSummaryLoading={false}
          />
        </main>
      </div>

      {/* Modals */}
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

export default ProductView;
