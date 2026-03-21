import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Lock, Copy, Check, ArrowLeft, BookOpen, Download } from 'lucide-react';
import SourcePanel from '../rag_multimodal/components/SourcePanel.tsx';
import ImportSourceModal from '../rag_multimodal/components/ImportSourceModal.tsx';
import ChatInterface from '../notebook/components/ChatInterface.tsx';
import UploadSourceModal from '../rag_multimodal/components/UploadSourceModal.tsx';
import { Source, SourceType } from '../rag_multimodal/types';
import { ChatMessage } from '../notebook/types.ts';
import { generateChatResponse } from '../notebook/services/geminiService.ts';
import { getProduct, getPublicProduct, updateProduct, type Product } from '@core/products';
import { getProductStepProgress, updateProductStepProgress } from '@core/product-step-progress';
import { getRagMultimodalSources, postRagMultimodalSource, deleteRagMultimodalSource, getRagMultimodalSourceContent } from '@core/rag_multimodal';
import { copyObjectToRag, type ObjectItem } from '@core/objects';
import { tokenStorage } from '@core/api/http.client';
import { downloadAssembledProject } from '@core/assembler-identity';
import { useLanguage } from '../../language/useLanguage';

// Step IDs for product steps (matching the workflow configuration)
// const RAG_SELECTOR_STEP_ID = 1; // Sources selection (not used in ProductView)
const RAG_CHAT_STEP_ID = 2;     // Chat conversation

const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = !!tokenStorage.get();
  const [product, setProduct] = useState<Product | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<ObjectItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  // isOwner is true when the logged-in user is the owner of the product
  const [isOwner, setIsOwner] = useState(false);

  const loadRagSources = async (ragId: number) => {
    try {
      console.log('[ProductView] Loading RAG sources for RAG ID:', ragId);
      const apiSources = await getRagMultimodalSources(ragId);
      
      if (apiSources.length === 0) {
        console.log('[ProductView] No sources found');
        setSources([]);
        return;
      }

      // 1) Paint sources immediately with safe placeholders so the user sees uploads instantly.
      const baseSources: Source[] = apiSources.map((source: any) => {
        const backendType = (source.type || '').toUpperCase();
        const requiresDeferredContent = backendType === 'PDF' || backendType === 'DOC' || backendType === 'IMAGE' || backendType === 'VIDEO';
        return {
          id: source.id.toString(),
          title: source.name || `Source ${source.id}`,
          type: mapApiSourceType(source.type),
          backendType: source.type,
          content: requiresDeferredContent ? `[${source.name || `Source ${source.id}`} - Procesando contenido...]` : '',
          url: source.filePath || source.url || '',
          previewUrl: source.filePath || source.url || '',
          dateAdded: source.createdAt ? new Date(source.createdAt) : new Date(),
          selected: true,
        };
      });
      setSources(baseSources);

      // 2) Hydrate content in background (parallel), then merge without hiding newly uploaded items.
      const hydratedEntries = await Promise.all(apiSources.map(async (source: any) => {
        try {
          const sourceData = await getRagMultimodalSourceContent(source.id);
          const hasContent = !!(sourceData.content && sourceData.content.trim() !== '');
          const backendType = (sourceData.type || source.type || '').toUpperCase();
          const allowsEmpty = backendType === 'PDF' || backendType === 'DOC' || backendType === 'IMAGE' || backendType === 'VIDEO';

          if (!hasContent && !allowsEmpty) {
            return null;
          }

          return {
            id: source.id.toString(),
            title: sourceData.name || source.name || `Source ${source.id}`,
            type: mapApiSourceType(sourceData.type),
            backendType: sourceData.type,
            content: hasContent ? sourceData.content : `[${sourceData.name || source.name || `Source ${source.id}`} - Documento pendiente de procesamiento]`,
            url: source.filePath || source.url || '',
            previewUrl: source.filePath || source.url || '',
            dateAdded: source.createdAt ? new Date(source.createdAt) : new Date(),
            selected: true,
          } as Source;
        } catch (err) {
          console.error(`[ProductView] Error loading source ${source.id}:`, err);
          return null;
        }
      }));

      const hydratedMap = new Map<string, Source>();
      hydratedEntries.forEach((entry) => {
        if (entry) hydratedMap.set(entry.id, entry);
      });

      const merged = baseSources.map((base) => hydratedMap.get(base.id) || base);
      setSources(merged);
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
    if (!product?.rag?.id) {
      throw new Error('No RAG associated with this product');
    }

    let apiType = type.toUpperCase();
    if (apiType === 'URL') apiType = 'WEBSITE';
    if (apiType === 'PDF') apiType = 'DOC';

    await uploadSource(product.rag.id, apiType, title, file, url, content);
    await loadRagSources(product.rag.id);
    console.log('[ProductView] Source added and reloaded');
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!product?.rag?.id) return;
    
    try {
      await deleteRagMultimodalSource(parseInt(sourceId));
      
      // Reload all sources from database (ensures consistency)
      await loadRagSources(product.rag.id);
      console.log('[ProductView] Source deleted and reloaded');
    } catch (error) {
      console.error('[ProductView] Error deleting source:', error);
      alert('Error al eliminar la fuente. Por favor intente de nuevo.');
    }
  };

  const saveChatHistory = async (productId: number, messages: ChatMessage[]) => {
    try {
      // Save with real-time update - use same format as RagChatStep
      await updateProductStepProgress({
        productId,
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

  const loadChatHistory = async (productId: number) => {
    try {
      console.log('[ProductView] Loading chat history for product:', productId);
      const progress = await getProductStepProgress(productId);
      
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
        console.log('[ProductView] Loading product for ID:', id, '| isAuthenticated:', isAuthenticated);
        
        let productData: Product;
        
        if (isAuthenticated) {
          // User has token → use authenticated endpoint (lets owner see private products)
          try {
            productData = await getProduct(parseInt(id));
            // Determine if API response indicates ownership
            // Backend grants access if owner OR if public, so if both public==false and we got it, we are owner
            setIsOwner(true);
          } catch (authError: any) {
            // Token expired or forbidden → fall back to public endpoint
            console.warn('[ProductView] Auth fetch failed, trying public endpoint:', authError.message);
            productData = await getPublicProduct(parseInt(id));
            setIsOwner(false);
          }
        } else {
          // No token → use public endpoint (only works for public products)
          productData = await getPublicProduct(parseInt(id));
          setIsOwner(false);
        }
        
        console.log('[ProductView] Product loaded:', productData.title, '| isPublic:', productData.isPublic);
        setProduct(productData);

        // Load chat history from product_step_progress
        await loadChatHistory(parseInt(id));

        // Load RAG sources if available
        if (productData.rag?.id) {
          console.log('[ProductView] RAG ID found:', productData.rag.id);
          await loadRagSources(productData.rag.id);
        } else {
          console.warn('[ProductView] No RAG associated with this product');
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
    if (!message.trim() || chatLoading || !product) return;

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
      
      // Save chat history to product_step_progress (same format as RagChatStep - without IDs)
      const messagesToSave = finalMessages.map(({ role, content }) => ({ role, content }));
      await saveChatHistory(product.id, messagesToSave);
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
      await saveChatHistory(product.id, messagesToSave);
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
    const productUrl = window.location.origin + `/product/notebook/${product?.id}`;
    navigator.clipboard.writeText(productUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleImportObjects = async () => {
    if (!product?.rag?.id || !selectedObjects.length) {
      setIsImportModalOpen(false);
      return;
    }
    try {
      setIsImporting(true);
      await Promise.all(
        selectedObjects.map((object) =>
          copyObjectToRag({
            object_id: Number(object.id),
            rag_id: product.rag!.id,
          })
        )
      );
      await loadRagSources(product.rag.id);
      setSelectedObjects([]);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('[ProductView] Error importing objects:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!product || !isOwner) return;
    setProduct({ ...product, title: newTitle });
  };

  const handleTitleBlur = async () => {
    if (!product || !isOwner) return;
    try {
      await updateProduct(product.id, { title: product.title });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    if (!product || !isOwner) return;
    setProduct({ ...product, description: newDescription });
  };

  const handleDescriptionBlur = async () => {
    if (!product || !isOwner) return;
    try {
      await updateProduct(product.id, { description: product.description });
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleDownloadProject = async () => {
    if (!product) return;

    const makerPathId = product.templateId;
    if (!makerPathId) {
      console.error('[ProductView] No templateId (makerPathId) found on product');
      alert('No se puede descargar: el producto no tiene un MakerPath asociado.');
      return;
    }

    try {
      await downloadAssembledProject(makerPathId);
    } catch (error) {
      console.error('[ProductView] Error downloading project:', error);
      alert('Error al descargar el proyecto. Por favor intente de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Producto no encontrado o no es público</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
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
            {isOwner && (
              <button
                onClick={() => navigate('/dashboard/products')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                title="Volver"
              >
                <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
            
            {/* Notebook Icon Indicator */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0 mt-1" title="Vista de Notebook">
              <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                value={product.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full"
                placeholder="Título del producto"
                disabled={!isOwner}
              />
              <input
                type="text"
                value={product.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={handleDescriptionBlur}
                disabled={!isOwner}
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-full mt-1"
                placeholder="Descripción del producto"
              />
            </div>
          </div>

          {/* Right side - Download Button + Status Badge */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {/*{isOwner && (*/}
            {/*  <button*/}
            {/*    onClick={handleDownloadProject}*/}
            {/*    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"*/}
            {/*    title="Descargar proyecto como index.html"*/}
            {/*  >*/}
            {/*    <Download size={16} />*/}
            {/*    Descargar proyecto*/}
            {/*  </button>*/}
            {/*)}*/}
            {product.isPublic ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Globe size={18} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Producto Público
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Producto Privado
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Product Link with Copy */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="flex-1 text-sm text-blue-600 dark:text-blue-400 truncate">
                {window.location.origin}/product/notebook/{product.id}
              </span>
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
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Sources */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <SourcePanel
            sources={sources}
            onToggleSource={handleToggleSource}
            onDeleteSource={handleDeleteSource}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            hideImportButton={!isOwner}
            hideUploadButton={!isOwner}
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
      {isOwner && (
        <>
          <UploadSourceModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAddSource={handleAddSource}
            tp={t.notebook.sourcePanel}
            t={t}
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
        </>
      )}
    </div>
  );
};

export default ProductView;
