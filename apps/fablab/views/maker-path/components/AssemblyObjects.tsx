import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Loader2,
  MessageSquare,
  Layout,
  Image as ImageIcon,
  Languages,
  Check,
  FileText,
  X,
} from 'lucide-react';
import { createMakerPath } from '@core/maker-path';
import { saveAssemblerIdentity } from '@core/assembler-identity';
import { forkProduct } from '@core/products';
import { postRagMultimodalSource } from '@core/rag_multimodal/ragMultimodal.service';
import { useLanguage } from '../../../language/useLanguage';
import AddSourceModal from '../../rag_multimodal/components/AddSourceModal';
import type { SourceType } from '../../rag_multimodal/types';
import { useAuth } from '@core/auth/useAuth';

interface AssemblyObjectsProps {
  onBack: () => void;
  onProductCreated: (makerPathId: number) => void;
}

interface AttachedSource {
  type: SourceType;
  content: string;
  title: string;
  url?: string;
  previewUrl?: string;
  file?: File;
}

const AVAILABLE_OBJECTS = [
  { id: 'rag_module', label: 'Cargar modulo RAG', enabled: true },
  // { id: 'api_module', label: 'Cargar modulo API', enabled: false },
  // { id: 'view_module', label: 'Cargar modulo vista', enabled: false },
  // { id: 'assistant_module', label: 'Cargar modulo asistente', enabled: false },
  // { id: 'assistant_instruction', label: 'Cargar instrucción de asistente', enabled: false },
  // { id: 'html_connector', label: 'Cargar html conector', enabled: false },
  // { id: 'external_link_connector', label: 'Cargar external_link_conector', enabled: false },
  // { id: 'app_deployment', label: 'Cargar app_deployment', enabled: false },
];

const PREDEFINED_TEMPLATES = [
  {
    id: 'rag_chat_maker',
    title: 'Notebook',
    description: 'Chat inteligente conectado a tus fuentes de datos.',
    icon: MessageSquare,
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'landing_page_maker',
    title: 'Landing Page',
    description: 'Crea páginas de aterrizaje optimizadas con RAG.',
    icon: Layout,
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'image_generator_rag',
    title: 'Generador de imágenes',
    description: 'Generación de imágenes basada en contextos RAG.',
    icon: ImageIcon,
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'translation_maker',
    title: 'Translation Maker',
    description: 'Detecta y traduce textos de archivos JSX/TSX automáticamente.',
    icon: Languages,
    gradient: 'from-orange-500 to-red-600'
  }
];

export const AssemblyObjects: React.FC<AssemblyObjectsProps> = ({ onBack, onProductCreated }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Key toggle
  const [wantsApiKey, setWantsApiKey] = useState(true);
  const [apiKey, setApiKey] = useState('');

  // Template toggle: 'predefined' | 'custom'
  const [templateMode, setTemplateMode] = useState<'predefined' | 'custom'>('custom');
  const [customTemplateFile, setCustomTemplateFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Upload modal & attached sources
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [attachedSources, setAttachedSources] = useState<AttachedSource[]>([]);

  const handleObjectClick = (id: string) => {
    if (id === 'rag_module') {
      // Always open the upload modal for RAG module
      if (!selectedObjects.includes(id)) {
        setSelectedObjects(prev => [...prev, id]);
      }
      setIsUploadModalOpen(true);
    } else {
      setSelectedObjects(prev =>
        prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
      );
    }
  };

  const handleAddSource = (type: SourceType, content: string, title: string, url?: string, previewUrl?: string, file?: File) => {
    setAttachedSources(prev => [...prev, { type, content, title, url, previewUrl, file }]);
  };

  const handleRemoveSource = (index: number) => {
    setAttachedSources(prev => prev.filter((_, i) => i !== index));
    if (attachedSources.length <= 1) {
      setSelectedObjects(prev => prev.filter(o => o !== 'rag_module'));
    }
  };

  const requiresTemplateSelection = templateMode === 'predefined';
  const canSubmit =
    title.trim().length > 0 &&
    selectedObjects.length > 0 &&
    !loading &&
    (!requiresTemplateSelection || !!selectedTemplateId);

  const handleAssemble = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const data: Record<string, unknown> = {
        selectedObjects,
        templateMode,
      };
      if (wantsApiKey && apiKey.trim()) {
        data.userApiKey = apiKey.trim();
      }
      if (templateMode === 'predefined' && selectedTemplateId) {
        data.predefinedTemplate = selectedTemplateId;
      }
      if (templateMode === 'custom' && customTemplateFile) {
        data.customTemplateName = customTemplateFile.name;
      }
      if (attachedSources.length > 0) {
        data.attachedSourcesCount = attachedSources.length;
      }

      const makerPath = await createMakerPath({
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'architect_ai',
        status: 'draft',
        data: JSON.stringify(data),
      });

      // Upload attached sources to the RAG created with the MakerPath
      const ragId = makerPath.rag?.id;
      if (ragId && attachedSources.length > 0) {
        for (const source of attachedSources) {
          try {
            let apiType = source.type.toUpperCase();
            if (apiType === 'URL') apiType = 'WEBSITE';
            if (apiType === 'PDF') apiType = 'DOC';

            const formData = new FormData();
            formData.append('rag_multimodal_id', ragId.toString());
            formData.append('name', source.title);
            formData.append('type', apiType);
            if (source.file) {
              formData.append('stream_file', source.file);
            }
            if (source.url) {
              formData.append('url', source.url);
            }
            if (source.content) {
              formData.append('text', source.content);
            }

            await postRagMultimodalSource(formData);
          } catch (uploadErr) {
            console.error('Error uploading source:', source.title, uploadErr);
          }
        }
      }

      // Create the assembler identity with all form fields
      try {
        const identityData: Record<string, unknown> = {
          systemPrompt: description.trim() || null,
          templateMode,
          selectedObjects,
          publicEnabled: true,
        };

        if (wantsApiKey && apiKey.trim()) {
          identityData.userApiKey = apiKey.trim();
        }

        if (templateMode === 'predefined' && selectedTemplateId) {
          identityData.selectedTemplate = selectedTemplateId;
        }

        if (templateMode === 'custom' && customTemplateFile) {
          const fileContent = await customTemplateFile.text();
          identityData.customTemplateContent = fileContent;
        }

        await saveAssemblerIdentity(makerPath.id, identityData);
      } catch (identityErr) {
        console.error('Error creating assembler identity:', identityErr);
      }

      // Create a Product record from the MakerPath so ProductView can load it
      const product = await forkProduct(makerPath.id);
      onProductCreated(product.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear el proyecto';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-8">
      <div className="max-w-xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ensamblador de Objetos</h1>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
          <div>
            <input
              type="text"
              placeholder="Título del proyecto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <textarea
              placeholder="Descripción del proyecto (instrucciones para el asistente)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Toggle API Key */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ¿Quieres configurar tu producto con un API key propia?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setWantsApiKey(true)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  wantsApiKey
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => { setWantsApiKey(false); setApiKey(''); }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !wantsApiKey
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                No
              </button>
            </div>
            {wantsApiKey && (
              <input
                type="text"
                placeholder="Introduzca aquí su API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full mt-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            )}
          </div>

          {/* Toggle Template Mode */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ¿Desea utilizar templates predefinidos o introducir uno propio?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTemplateMode('predefined');
                  setCustomTemplateFile(null);
                }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  templateMode === 'predefined'
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Templates predefinidos
              </button>
              <button
                onClick={() => {
                  setTemplateMode('custom');
                  setSelectedTemplateId(null);
                }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  templateMode === 'custom'
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Template propio
              </button>
            </div>

            {templateMode === 'predefined' && (
              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Plantillas disponibles</p>
                <div className="grid gap-3">
                  {PREDEFINED_TEMPLATES.map(template => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.gradient} flex items-center justify-center text-white shadow-md`}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{template.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-transparent'
                          }`}
                        >
                          <Check size={16} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {templateMode === 'custom' && (
              <div className="mt-3">
                <label className="flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:border-blue-400 transition-colors">
                  {customTemplateFile ? customTemplateFile.name : 'Seleccionar archivo HTML'}
                  <input
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={(e) => setCustomTemplateFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Selección de objetos */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Seleccionar Objetos:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_OBJECTS.map((obj) => {
                const isSelected = selectedObjects.includes(obj.id);
                return (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectClick(obj.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Plus
                      size={14}
                      className={isSelected ? 'text-blue-500 rotate-45 transition-transform' : 'text-gray-400'}
                    />
                    {obj.label}
                  </button>
                );
              })}
            </div>

            {/* Attached sources list */}
            {attachedSources.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {attachedSources.length} fuente{attachedSources.length > 1 ? 's' : ''} adjunta{attachedSources.length > 1 ? 's' : ''}
                </p>
                {attachedSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-blue-500 shrink-0" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 truncate">{source.title}</span>
                      <span className="text-xs text-blue-400 uppercase shrink-0">{source.type}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSource(idx)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors shrink-0"
                    >
                      <X size={14} className="text-blue-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  + Añadir otra fuente
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Botón ensamblar */}
          <button
            disabled={!canSubmit}
            onClick={handleAssemble}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Ensamblando...' : 'Ensamblar'}
          </button>
        </div>
      </div>

      {/* Upload Source Modal */}
      <AddSourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddSource={handleAddSource}
        tp={t.notebook.sourcePanel}
        t={t}
        isAdmin={isAdmin}
      />
    </div>
  );
};
