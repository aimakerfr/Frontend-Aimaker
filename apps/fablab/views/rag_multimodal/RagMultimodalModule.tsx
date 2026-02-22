import React, { useEffect, useState } from 'react';

import SourcePanel from './components/SourcePanel.tsx';
import ImportSourceModal from './components/ImportSourceModal.tsx';
import UploadSourceModal from './components/UploadSourceModal.tsx';

import { type Source, type SourceType } from './types.ts';
import { useLanguage } from '../../language/useLanguage';

import {
  deleteRagMultimodalSource,
  getRagMultimodalSources,
  postRagMultimodalSource,
  type RagMultimodalSourceItem,
} from '@core/rag_multimodal';
import { copyObjectToRag } from '@core/objects';

// A minimal module version of RagMultimodal that renders only the SourcePanel,
// preserving the source-management logic (load, add/upload, import, toggle, delete)

type RagMultimodalModuleProps = {
  id?: string | number;
};

const RagMultimodalModule: React.FC<RagMultimodalModuleProps> = ({ id: propId }) => {
  const { t } = useLanguage();
  
  const [id, setId] = useState<string | undefined>(
    propId !== undefined && propId !== null ? String(propId) : undefined,
  );
  const [sources, setSources] = useState<Source[]>([]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (propId !== undefined && propId !== null) {
      setId(String(propId));
    }
  }, [propId]);

  const mapApiSourceType = (type: string): Source['type'] => {
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

  const mapApiSourceToLocal = (apiSource: RagMultimodalSourceItem): Source => {
    const filePath = apiSource.filePath || undefined;
    const content = (apiSource as any)?.text ?? filePath ?? '';
    return {
      id: apiSource.id.toString(),
      title: apiSource.name,
      type: mapApiSourceType(apiSource.type),
      backendType: apiSource.type,
      content,
      url: filePath,
      previewUrl: filePath,
      dateAdded: apiSource.createdAt ? new Date(apiSource.createdAt) : new Date(),
      selected: false,
    };
  };

  const loadRagMultimodalSources = async (notebookId: number) => {
    try {
      const apiSources = await getRagMultimodalSources(notebookId);
      const mappedSources = apiSources.map(mapApiSourceToLocal);

      setSources((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const merged = [...prev];
        mappedSources.forEach((source) => {
          if (!existingIds.has(source.id)) merged.push(source);
        });
        return merged;
      });
    } catch (error) {
      console.error('Error cargando fuentes del notebook:', error);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadRagMultimodalSources(parseInt(id));
  }, [id]);

  const refreshSources = async () => {
    if (!id) return;
    await loadRagMultimodalSources(parseInt(id));
  };

  const uploadSource = async (apiType: string, title: string, file?: File, url?: string, text?: string) => {
    if (!id) throw new Error('Notebook ID is missing');

    const formData = new FormData();
    formData.append('rag_multimodal_id', id.toString());
    formData.append('name', title);
    formData.append('type', apiType);
    if (file) formData.append('stream_file', file);
    if (url) formData.append('url', url);
    if (text) formData.append('text', text);
    return await postRagMultimodalSource(formData);
  };

  const processSourceLocally = (
    response: any,
    type: SourceType,
    content: string,
    url?: string,
    previewUrl?: string,
    backendType?: string,
  ) => {
    const absoluteUrl = response?.filePath || previewUrl || url;
    const newSource: Source = {
      id: response.id.toString(),
      title: response.name,
      type,
      backendType: response?.type || backendType || type.toUpperCase(),
      content,
      url: absoluteUrl,
      previewUrl: absoluteUrl,
      dateAdded: new Date(response.createdAt),
      selected: true,
    };
    setSources((prev) => [...prev, newSource]);
  };

  const handleAddSource = async (
    type: SourceType,
    content: string,
    title: string,
    url?: string,
    previewUrl?: string,
    file?: File,
  ) => {
    if (!id) return;
    try {
      let apiType = type.toUpperCase();
      if (apiType === 'URL') apiType = 'WEBSITE';
      if (apiType === 'PDF') apiType = 'DOC';
      const response = await uploadSource(apiType, title, file, url, content);
      processSourceLocally(response, type, content, url, previewUrl, apiType);
    } catch (error) {
      console.error('Error adding source to backend:', error);
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, selected: !s.selected } : s)));
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await deleteRagMultimodalSource(parseInt(sourceId));
      setSources((prev) => {
        const source = prev.find((s) => sourceId === s.id);
        if (source?.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(source.previewUrl);
        }
        return prev.filter((s) => s.id !== sourceId);
      });
    } catch (error) {
      console.error('Error eliminando fuente:', error);
      alert('Error al eliminar la fuente. Por favor intente de nuevo.');
    }
  };

  const handleImportObjects = async () => {
    if (!id || id === 'new') {
      console.error('RAG id is required to import objects');
      return;
    }
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
            rag_id: parseInt(id),
          }),
        ),
      );
      await refreshSources();
      setSelectedObjects([]);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Error importing objects to RAG:', error);
      alert(t.common.error);
    } finally {
      setIsImporting(false);
    }
  };

  // Only render the SourcePanel and the two modals it controls
  return (
    <div className="h-full w-full">
      <SourcePanel
        sources={sources}
        onToggleSource={handleToggleSource}
        onDeleteSource={handleDeleteSource}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
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

export default RagMultimodalModule;
