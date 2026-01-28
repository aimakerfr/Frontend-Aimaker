import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { getTool, updateTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import SaveStatusModal from './SaveStatusModal';
import PublishConfirmModal from './PublishConfirmModal';
import ToolViewCard from '../tool/ToolViewCard';
import PromptDetails from './PromptDetails';
// Body editing is handled inside PromptDetails now

// Importar componentes de la nueva vista
enum Visibility {
  PRIVATE = 'PRIVÉ',
  PUBLIC = 'PUBLIC'
}

const CATEGORY_OPTIONS = ['Marketing', 'Ventes', 'Développement', 'RH'];
const LANGUAGE_OPTIONS = ['Espagnol', 'Anglais', 'Français'];

interface PromptState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  promptBody: string;
  context: string;
  outputFormat: string;
}

const PromptView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toolId = id ? parseInt(id, 10) : null;
  const [prompt, setPrompt] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'success' | 'error'>('success');
  const [saveModalMessage, setSaveModalMessage] = useState<string>('');
  // Body edition moved to PromptDetails
  // Prompt body status now managed within PromptDetails

  const [state, setState] = useState<PromptState>({
    title: '',
    description: '',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: 'Español',
    promptBody: '',
    context: '',
    outputFormat: ''
  });

  const mapToolToState = React.useCallback((data: CreationTool): PromptState => ({
    title: data.title || '',
    description: data.description || '',
    visibility: data.hasPublicStatus ? Visibility.PUBLIC : Visibility.PRIVATE,
    category: data.category || 'Marketing',
    isFavorite: data.isFavorite || false,
    language: data.language || 'Español',
    promptBody: data.promptBody || '',
    context: data.context || '',
    outputFormat: data.outputFormat || ''
  }), []);

  const syncToolState = React.useCallback((data: CreationTool) => {
    setPrompt(data);
    setState(mapToolToState(data));
  }, [mapToolToState]);

  const loadPrompt = React.useCallback(async () => {
    if (!toolId) return;

    try {
      setLoading(true);
      const data = await getTool(toolId);

      if (data.type !== 'prompt') {
        setError("La ressource demandée n'est pas un prompt.");
        return;
      }

      syncToolState(data);
    } catch (err) {
      console.error('Error cargando prompt:', err);
      setError('Impossible de charger le prompt.');
    } finally {
      setLoading(false);
    }
  }, [toolId, syncToolState]);

  useEffect(() => {
    loadPrompt()
      .then(() => {
        // Opcional: acciones adicionales después de cargar
      })
      .catch((err) => {
        console.error('Error en useEffect loadPrompt:', err);
      });
  }, [id, loadPrompt]);

  const handleUpdate = React.useCallback((updates: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // We avoid updating parent state on each keystroke to prevent re-renders.
  // The body value will be provided on save by the child component.

  const handleSave = async () => {
    if (!prompt || !toolId) return;

    try {
      setIsSaving(true);
      await updateTool(toolId, {
        type: 'prompt',
        title: state.title,
        description: state.description,
        context: state.context,
        outputFormat: state.outputFormat,
        category: state.category,
        isFavorite: state.isFavorite,
        language: state.language as any,
        hasPublicStatus: state.visibility === Visibility.PUBLIC,
      });
      setSaveModalType('success');
      setSaveModalMessage('Le prompt a été enregistré avec succès.');
      setIsSaveModalOpen(true);

      // Recargar datos
      const updatedData = await getTool(toolId);
      syncToolState(updatedData);
    } catch (err) {
      console.error('Error guardando prompt:', err);
      setSaveModalType('error');
      setSaveModalMessage("Une erreur est survenue lors de l’enregistrement du prompt.");
      setIsSaveModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmPublish = async () => {
    if (!toolId) return;
    try {
      setIsPublishing(true);
      await updateTool(toolId, {
        type: 'prompt',
        title: state.title,
        description: state.description,
        context: state.context,
        outputFormat: state.outputFormat,
        category: state.category,
        isFavorite: state.isFavorite,
        language: state.language as any,
        hasPublicStatus: true
      });

      const refreshed = await getTool(toolId);
      syncToolState(refreshed);

      // Feedback modal
      setSaveModalType('success');
      setSaveModalMessage('Prompt publié et enregistré avec succès.');
      setIsSaveModalOpen(true);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error publicando prompt:', err);
      setSaveModalType('error');
      setSaveModalMessage('Une erreur est survenue lors de la publication du prompt.');
      setIsSaveModalOpen(true);
    } finally {
      setIsPublishing(false);
    }
  };

  // visibility, publish and favorite controls are now handled in ToolViewCard header

  const loadingContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Chargement du prompt…</p>
      </div>
    </div>
  );

  const errorContent = (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prompt non disponible
        </h2>
        <p className="text-gray-600 mb-6">
          {error || 'Le prompt demandé est introuvable.'}
        </p>
        <button
          onClick={() => navigate('/dashboard/library')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
        >
          <ArrowLeft size={20} />
          Retour à la bibliothèque
        </button>
      </div>
    </div>
  );

  // Title section moved into ToolViewCard

  const metadataSection = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TYPE</label>
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#2563eb] font-bold shadow-sm h-[46px]">
            <FileText size={16} />
            <span className="text-sm">Prompt</span>
          </div>
        </div>

        <div className="md:col-span-10">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TITRE</label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
            placeholder="Titre du prompt"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">DESCRIPTION</label>
          <input
            type="text"
            value={state.description}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
            placeholder="Description du prompt"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">CATÉGORIE</label>
          <select
            value={state.category}
            onChange={(e) => handleUpdate({ category: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">LANGUE</label>
          <select
            value={state.language}
            onChange={(e) => handleUpdate({ language: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="border-b border-slate-100 pt-2"></div>
    </div>
  );

  // Prompt body editing moved to PromptDetails

  // Details (below CUERPO DEL PROMPT) will be rendered by PromptDetails component

  // Moved urls and save sections into ToolViewCard via props

  const Content: React.FC = () => (
    <>
      {metadataSection}
      {/* Body section is now rendered inside PromptDetails */}
      {toolId && <PromptDetails toolId={toolId} />}
    </>
  );


  const cardContent = (
    <ToolViewCard
      toolId={toolId}
      saveProps={{ onSave: handleSave, isSaving }}
      blurred={isModalOpen}
    >
      <Content />
    </ToolViewCard>
  );

  const publishModal = (
    <PublishConfirmModal
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      onConfirm={confirmPublish}
      isWorking={isPublishing}
    />
  );

  if (loading) {
    return loadingContent;
  }

  if (error || !prompt) {
    return errorContent;
  }

  return (
    <div className="flex justify-center p-4 md:p-8 relative bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {cardContent}
      {publishModal}
      <SaveStatusModal
        open={isSaveModalOpen}
        type={saveModalType}
        title={saveModalType === 'success' ? 'Prompt enregistré' : "Erreur lors de l’enregistrement"}
        message={saveModalMessage}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </div>
  );
};

export default PromptView;
