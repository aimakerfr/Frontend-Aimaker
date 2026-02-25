import React, { useEffect, useState } from 'react';
import { httpClient } from '@core/api/http.client';
import RagSourcePanel, { type RagSource } from './RagSourcePanel';
import UploadSourceModal from '../../rag_multimodal/components/UploadSourceModal';
import ImportSourceModal from '../../rag_multimodal/components/ImportSourceModal';
import { useLanguage } from '../../../language/useLanguage';
import { postRagMultimodalSource, deleteRagMultimodalSource } from '@core/rag_multimodal';
import { copyObjectToRag, type ObjectItem } from '@core/objects';
import { SourceType } from '../../rag_multimodal/types';

type RagMultimodal = {
  id: number;
  tool: {
    title: string;
    description: string | null;
    language: string;
  };
  sources: RagSource[];
  cag: string | null;
  created_at: string;
};

type RagSelectorStepProps = {
  makerPathId?: number;
  required?: boolean;
};

const RagSelectorStep: React.FC<RagSelectorStepProps> = ({
  makerPathId,
}) => {
  const { t } = useLanguage();
  const [ragMultimodal, setRagMultimodal] = useState<RagMultimodal | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<ObjectItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (makerPathId) {
      loadRagForMakerPath();
    }
  }, [makerPathId]);

  const loadRagForMakerPath = async () => {
    if (!makerPathId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Load maker_path to get its rag_id
      const makerPath = await httpClient.get<any>(`/api/v1/maker-paths/${makerPathId}`);
      if (!makerPath?.rag?.id) {
        setError('No RAG found for this project');
        return;
      }
      
      // Load RAG with sources
      const rag = await httpClient.get<RagMultimodal>(`/api/v1/rag-multimodal/${makerPath.rag.id}`);
      setRagMultimodal(rag);
      
      // Map sources with selected flag
      const mappedSources = (rag.sources || []).map(s => ({
        ...s,
        selected: true // All sources active by default
      }));
      setSources(mappedSources);
    } catch (err) {
      console.error('Error loading RAG:', err);
      setError('Error loading RAG library. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm('¿Eliminar esta fuente?')) return;
    try {
      await deleteRagMultimodalSource(sourceId);
      await loadRagForMakerPath(); // Reload
    } catch (err) {
      console.error('Error deleting source:', err);
      alert('Error al eliminar fuente');
    }
  };

  const handleToggleSource = (sourceId: number) => {
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, selected: !s.selected } : s
    ));
  };

  const handleAddSource = async (type: SourceType, content: string, title: string, url?: string, _previewUrl?: string, file?: File) => {
    if (!ragMultimodal?.id) return;

    try {
      // Map frontend types to backend types
      let apiType = type.toUpperCase();
      if (apiType === 'URL') apiType = 'WEBSITE';
      if (apiType === 'PDF') apiType = 'DOC';

      const formData = new FormData();
      formData.append('rag_multimodal_id', ragMultimodal.id.toString());
      formData.append('type', apiType);
      formData.append('name', title);
      
      if (file) {
        formData.append('stream_file', file);
      }
      
      if (url) {
        formData.append('url', url);
      }
      
      if (content && !file) {
        formData.append('text', content);
      }

      await postRagMultimodalSource(formData);
      await loadRagForMakerPath();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Error al agregar fuente');
    }
  };

  const handleImportObjects = async () => {
    if (!ragMultimodal?.id) return;
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
            rag_id: ragMultimodal.id,
          })
        )
      );
      await loadRagForMakerPath();
      setSelectedObjects([]);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Error importing objects:', error);
      alert('Error al importar desde objetos');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => loadRagForMakerPath()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <RagSourcePanel
        sources={sources}
        onToggleSource={handleToggleSource}
        onDeleteSource={handleDeleteSource}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      <ImportSourceModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setSelectedObjects([]);
        }}
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
    </>
  );
};

export default RagSelectorStep;
