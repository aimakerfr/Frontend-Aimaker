import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Globe, Lock, Heart, FileText, ArrowLeft, MessageSquare, FolderKanban, AlertCircle } from 'lucide-react';
import { getTool, toggleToolFavorite, toggleToolVisibility, updateTool, deleteTool } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { getPromptByToolId } from '@core/prompts/prompts.service';
import { getAssistantByToolId } from '@core/assistants/assistants.service';
import { copyToClipboard } from '@core/ui_utils/navigator_utilies';
import { useNavigate } from 'react-router-dom';
import PromptPublishModal from '../prompt/PublishConfirmModal';
import ProjectPublishModal from '../project/PublishConfirmModal';
import AssistantPublishModal from '../assistant/PublishConfirmModal';
import SaveStatusModal from '../prompt/SaveStatusModal';
import { useLanguage } from '../../language/useLanguage';

type ToolViewCardProps = {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerBelow?: React.ReactNode;
  blurred?: boolean;
  className?: string;
  children?: React.ReactNode;
  // New consolidated props to render common sections so views stay focused on logic
  saveProps?: {
    onSave: () => void;
    isSaving?: boolean;
    label?: string;
  };
  urlsProps?: {
    privateUrl: string;
    publicUrl?: string;
    isPublic: boolean;
    copiedPrivate?: boolean;
    copiedPublic?: boolean;
    onCopyPrivate: () => void;
    onCopyPublic: () => void;
    onOpenPrivate: () => void;
    onOpenPublic: () => void;
  };
  // Optional: make the card self-sufficient for URL section if a tool id is provided
  toolId?: number | null;
};

// Internal state exposed to children so Prompt-specific content can bind inputs
type Visibility = 'PRIVÉ' | 'PUBLIC';
export interface ToolViewState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  promptBody: string;
  context: string;
  outputFormat: string;
  assistantInstructions: string;
  // Validation state
  validationErrors: {
    title?: boolean;
    description?: boolean;
    category?: boolean;
    promptBody?: boolean;
    assistantInstructions?: boolean;
  };
}

type ToolViewContextType = {
  tool: CreationTool | null;
  loading: boolean;
  error: string | null;
  state: ToolViewState;
  update: (partial: Partial<ToolViewState>) => void;
  // actions
  save: () => Promise<void>;
  isSaving: boolean;
  openPublish: () => void;
  isPublishing: boolean;
  // Detail section save handler registration
  registerDetailSave: (handler: () => Promise<void>) => void;
};

const defaultState: ToolViewState = {
  title: '',
  description: '',
  visibility: 'PRIVÉ',
  category: 'Marketing',
  isFavorite: false,
  language: 'Espagnol',
  promptBody: '',
  context: '',
  outputFormat: '',
  assistantInstructions: '',
  validationErrors: {},
};

// MetadataSection component - shared across all tool views
const MetadataSection: React.FC = () => {
  const { t } = useLanguage();
  const tv = t.toolView;
  const { tool, state, update } = useToolView();
  const toolType = tool?.type ? tool.type.charAt(0).toUpperCase() + tool.type.slice(1) : 'Tool';
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tv.labels.type}</label>
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#2563eb] font-bold shadow-sm h-[46px]">
            <FileText size={16} />
            <span className="text-sm">{toolType}</span>
          </div>
        </div>

        <div className="md:col-span-10">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            {tv.labels.title}
            {(!state.title || state.title.trim() === '') && (
              <span title="Required field">
                <AlertCircle size={12} className="text-amber-500" />
              </span>
            )}
          </label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => update({ title: e.target.value, validationErrors: { ...state.validationErrors, title: false } })}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px] ${
              state.validationErrors?.title ? 'border-red-500 border-2' : 'border-slate-200'
            }`}
            placeholder={tv.placeholders.title.replace('{type}', toolType.toLowerCase())}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            {tv.labels.description}
            {(!state.description || state.description.trim() === '') && (
              <span title="Required field">
                <AlertCircle size={12} className="text-amber-500" />
              </span>
            )}
          </label>
          <input
            type="text"
            value={state.description}
            onChange={(e) => update({ description: e.target.value, validationErrors: { ...state.validationErrors, description: false } })}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px] ${
              state.validationErrors?.description ? 'border-red-500 border-2' : 'border-slate-200'
            }`}
            placeholder={tv.placeholders.description.replace('{type}', toolType.toLowerCase())}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            {tv.labels.category}
            {(!state.category || state.category.trim() === '') && (
              <span title="Required field">
                <AlertCircle size={12} className="text-amber-500" />
              </span>
            )}
          </label>
          <select
            value={state.category}
            onChange={(e) => update({ category: e.target.value, validationErrors: { ...state.validationErrors, category: false } })}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px] ${
              state.validationErrors?.category ? 'border-red-500 border-2' : 'border-slate-200'
            }`}
          >
            <option value="Marketing">{tv.categories.marketing}</option>
            <option value="Ventes">{tv.categories.sales}</option>
            <option value="Développement">{tv.categories.development}</option>
            <option value="RH">{tv.categories.hr}</option>
          </select>
        </div>

        {/* Language field removed - automatically set from user profile */}
      </div>
      <div className="border-b border-slate-100 pt-2"></div>
    </div>
  );
};

const ToolViewContext = createContext<ToolViewContextType | undefined>(undefined);
export const useToolView = (): ToolViewContextType => {
  const ctx = useContext(ToolViewContext);
  if (!ctx) throw new Error('useToolView must be used within ToolViewCard');
  return ctx;
};

/**
 * Generic card layout for Tool views.
 * - Places a header with left/right areas (flex on large screens).
 * - Renders children inside the card body (simpler than passing a component).
 */
const ToolViewCard: React.FC<ToolViewCardProps> = ({
  headerLeft,
  headerRight,
  headerBelow,
  blurred = false,
  className = '',
  children,
  saveProps,
  urlsProps,
  toolId,
}) => {
  const { t } = useLanguage();
  const tv = t.toolView;
  const navigate = useNavigate();
  // If toolId is provided, fetch tool data to build URLs section internally
  const [tool, setTool] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState<boolean>(!!toolId);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'success' | 'error'>('success');
  const [saveModalMessage, setSaveModalMessage] = useState<string>('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const [state, setState] = useState<ToolViewState>(defaultState);

  // Ref to store detail save handler
  const detailSaveHandlerRef = React.useRef<(() => Promise<void>) | null>(null);

  const registerDetailSave = useCallback((handler: () => Promise<void>) => {
    detailSaveHandlerRef.current = handler;
  }, []);

  const mapToolToState = useCallback((data: CreationTool): ToolViewState => ({
    title: data.title || '',
    description: data.description || '',
    visibility: data.hasPublicStatus ? 'PUBLIC' : 'PRIVÉ',
    category: (data as any).category || 'Marketing',
    isFavorite: data.isFavorite || false,
    language: (data as any).language || 'Espagnol',
    promptBody: (data as any).promptBody || '',
    context: (data as any).context || '',
    outputFormat: (data as any).outputFormat || '',
    assistantInstructions: (data as any).assistantInstructions || '',
    validationErrors: {},
  }), []);

  // Helper function to load type-specific data from prompts/assistants tables
  const loadSpecificData = useCallback(async (toolId: number, toolType: string) => {
    let specificData: any = {};
    if (toolType === 'prompt') {
      try {
        const promptData = await getPromptByToolId(toolId);
        // Backend returns 'prompt' field, not 'promptBody'
        specificData = {
          promptBody: (promptData as any).prompt || '',
          context: (promptData as any).context || '',
          outputFormat: (promptData as any).outputFormat || ''
        };
      } catch (e) {
        specificData = { promptBody: '', context: '', outputFormat: '' };
      }
    } else if (toolType === 'assistant') {
      try {
        const assistantData = await getAssistantByToolId(toolId);
        specificData = {
          assistantInstructions: (assistantData as any).instructions || ''
        };
      } catch (e) {
        specificData = { assistantInstructions: '' };
      }
    }
    return specificData;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!toolId && toolId !== 0) return;
      try {
        setLoading(true);
        const data = await getTool(Number(toolId));
        if (cancelled) return;
        
        // Cargar datos específicos según el tipo
        const specificData = await loadSpecificData(Number(toolId), data.type);
        
        if (!cancelled) {
          setTool(data);
          // Mapear datos base y luego agregar datos específicos
          const baseState = mapToolToState(data);
          setState({ ...baseState, ...specificData });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(tv.messages.errorLoading.replace('{type}', 'prompt'));
      }
      finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toolId, mapToolToState, loadSpecificData, tv.messages.errorLoading]);

  const isPublic = tool?.hasPublicStatus ?? false;
  const privateUrl = tool?.url || '';
  const publicUrl = tool?.publicUrl || '';
  const isFavorite = tool?.isFavorite ?? false;

  const handleCopy = async (text: string, type: 'private' | 'public') => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    if (type === 'private') {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  const update = useCallback((partial: Partial<ToolViewState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const save = useCallback(async () => {
    if (!toolId || !tool) return;
    
    // VALIDACIÓN: Verificar campos obligatorios según el tipo de tool
    const errors: typeof state.validationErrors = {};
    
    // Campos obligatorios para todos los tipos
    if (!state.title || state.title.trim() === '') errors.title = true;
    if (!state.description || state.description.trim() === '') errors.description = true;
    if (!state.category || state.category.trim() === '') errors.category = true;
    
    // Validación específica: solo para prompt validamos el promptBody
    if (tool.type === 'prompt') {
      if (!state.promptBody || state.promptBody.trim() === '') errors.promptBody = true;
    }
    
    // Validación específica: para assistant validamos las instrucciones
    if (tool.type === 'assistant') {
      if (!state.assistantInstructions || state.assistantInstructions.trim() === '') errors.assistantInstructions = true;
    }
    
    // Actualizar estado de validación
    update({ validationErrors: errors });
    
    // Si hay errores, no guardar
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setIsSaving(true);
      // Save metadata
      await updateTool(Number(toolId), {
        type: tool.type,
        title: state.title,
        description: state.description,
        context: state.context,
        outputFormat: state.outputFormat,
        category: (state as any).category,
        isFavorite: state.isFavorite,
        language: (state as any).language,
        hasPublicStatus: state.visibility === 'PUBLIC',
      });
      
      // Also save detail section data if handler is registered
      if (detailSaveHandlerRef.current) {
        await detailSaveHandlerRef.current();
      }

      // Limpiar errores después de guardar exitosamente
      update({ validationErrors: {} });
      
      setSaveModalType('success');
      const saveTexts = getSaveModalTexts();
      setSaveModalMessage(saveTexts.successMessage);
      setIsSaveModalOpen(true);
      // refresh tool with specific data
      const refreshed = await getTool(Number(toolId));
      const specificData = await loadSpecificData(Number(toolId), refreshed.type);
      setTool(refreshed);
      const baseState = mapToolToState(refreshed);
      setState({ ...baseState, ...specificData });
    } catch (e) {
      setSaveModalType('error');
      setSaveModalMessage(tv.messages.errorSaving.replace('{type}', tool?.type || 'tool'));
      setIsSaveModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  }, [toolId, tool, state, mapToolToState, loadSpecificData, tv.messages.errorSaving, update]);

  const confirmPublish = useCallback(async () => {
    if (!toolId || !tool) return;
    try {
      setIsPublishing(true);
      await updateTool(Number(toolId), {
        type: tool.type,
        title: state.title,
        description: state.description,
        context: state.context,
        outputFormat: state.outputFormat,
        category: (state as any).category,
        isFavorite: state.isFavorite,
        language: (state as any).language,
        hasPublicStatus: true,
      });
      const refreshed = await getTool(Number(toolId));
      const specificData = await loadSpecificData(Number(toolId), refreshed.type);
      setTool(refreshed);
      const baseState = mapToolToState(refreshed);
      setState({ ...baseState, ...specificData });
      setSaveModalType('success');
      setSaveModalMessage(tv.messages.successPublish.replace('{type}', tool?.type || 'Tool'));
      setIsSaveModalOpen(true);
      setIsPublishModalOpen(false);
    } catch (e) {
      setSaveModalType('error');
      setSaveModalMessage(tv.messages.errorPublishing.replace('{type}', tool?.type || 'tool'));
      setIsSaveModalOpen(true);
    } finally {
      setIsPublishing(false);
    }
  }, [toolId, tool, state, mapToolToState, loadSpecificData, tv.messages.successPublish, tv.messages.errorPublishing]);

  const openPublish = useCallback(() => setIsPublishModalOpen(true), []);
  
  const handleCancelAndDelete = useCallback(async () => {
    if (!toolId) return;
    try {
      await deleteTool(Number(toolId));
      navigate('/dashboard/library');
    } catch (e) {
      console.error('Error deleting tool:', e);
      navigate('/dashboard/library');
    }
  }, [toolId, navigate]);
  
  const validateAndNavigate = useCallback(() => {
    if (!tool) {
      navigate('/dashboard/library');
      return;
    }
    
    // VALIDACIÓN: Verificar campos obligatorios según el tipo de tool
    const errors: typeof state.validationErrors = {};
    
    // Campos obligatorios para todos los tipos
    if (!state.title || state.title.trim() === '') errors.title = true;
    if (!state.description || state.description.trim() === '') errors.description = true;
    if (!state.category || state.category.trim() === '') errors.category = true;
    
    // Validación específica: solo para prompt validamos el promptBody
    if (tool.type === 'prompt') {
      if (!state.promptBody || state.promptBody.trim() === '') errors.promptBody = true;
    }
    
    // Validación específica: para assistant validamos las instrucciones
    if (tool.type === 'assistant') {
      if (!state.assistantInstructions || state.assistantInstructions.trim() === '') errors.assistantInstructions = true;
    }
    
    // Actualizar estado de validación
    update({ validationErrors: errors });
    
    // Si NO hay errores, navegar
    if (Object.keys(errors).length === 0) {
      navigate('/dashboard/library');
    } else {
      // Si hay errores, mostrar modal de confirmación
      setIsValidationModalOpen(true);
    }
  }, [tool, state, navigate, update]);

  // Build save section: use external props if provided, otherwise internal when toolId exists
  const internalSaveSection = (saveProps ? (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {/* PUBLICAR */}

        {/* FAV */}
        {tool && (
          <button
            type="button"
            onClick={async () => {
              if (!toolId || togglingFavorite) return;
              try {
                setTogglingFavorite(true);
                const res = await toggleToolFavorite(Number(toolId));
                setTool(prev => (prev ? { ...prev, isFavorite: res.isFavorite } as CreationTool : prev));
              } finally {
                setTogglingFavorite(false);
              }
            }}
            disabled={togglingFavorite}
            className={`flex items-center justify-center w-[46px] h-[42px] border rounded-xl transition-all shadow-sm ${
              isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400'
            } disabled:opacity-50`}
            title={isFavorite ? tv.actions.removeFavorite : tv.actions.addFavorite}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        {tool && (
            <button
                type="button"
                onClick={async () => {
                  if (!toolId || togglingVisibility) return;
                  try {
                    setTogglingVisibility(true);
                    const updated = await toggleToolVisibility(Number(toolId), !isPublic);
                    setTool(updated);
                  } finally {
                    setTogglingVisibility(false);
                  }
                }}
                disabled={togglingVisibility}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-sm h-[42px] text-slate-600 disabled:opacity-50"
                title={isPublic ? tv.actions.published : tv.actions.publish}
            >
              {isPublic ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-slate-400" />}
              <span className="text-sm font-semibold">{isPublic ? tv.actions.published : tv.actions.publish}</span>
            </button>
        )}
        {/* GUARDAR CAMBIOS */}
        <button
          onClick={saveProps.onSave}
          disabled={!!saveProps.isSaving}
          className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {saveProps.isSaving ? tv.actions.saving : (saveProps.label || tv.actions.save)}
        </button>
      </div>
    </div>
  ) : (toolId ? (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {tool && (
            <button
                type="button"
                onClick={async () => {
                  if (!toolId || togglingFavorite) return;
                  try {
                    setTogglingFavorite(true);
                    const res = await toggleToolFavorite(Number(toolId));
                    setTool(prev => (prev ? { ...prev, isFavorite: res.isFavorite } as CreationTool : prev));
                  } finally {
                    setTogglingFavorite(false);
                  }
                }}
                disabled={togglingFavorite}
                className={`flex items-center justify-center w-[46px] h-[42px] border rounded-xl transition-all shadow-sm ${
                    isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400'
                } disabled:opacity-50`}
                title={isFavorite ? tv.actions.removeFavorite : tv.actions.addFavorite}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
        )}
        {tool && (
          <button
            type="button"
            onClick={() => openPublish()}
            disabled={togglingVisibility || isPublishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-sm h-[42px] text-slate-600 disabled:opacity-50"
            title={isPublic ? tv.actions.published : tv.actions.publish}
          >
            {isPublic ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-slate-400" />}
            <span className="text-sm font-semibold">{isPublic ? tv.actions.published : tv.actions.publish}</span>
          </button>
        )}
        <button
          onClick={save}
          disabled={isSaving}
          className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          {isSaving ? tv.actions.saving : tv.actions.save}
        </button>
      </div>
    </div>
  ) : null));

  // Internal default title section (moved from PromptView)
  const getTypeIcon = () => {
    const type = tool?.type || 'prompt';
    switch (type) {
      case 'assistant':
        return <MessageSquare size={20} />;
      case 'project':
        return <FolderKanban size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getTypeLabel = () => {
    const type = tool?.type || 'prompt';
    switch (type) {
      case 'assistant':
        return { title: tv.types.assistant.title, subtitle: tv.types.assistant.subtitle };
      case 'project':
        return { title: tv.types.project.title, subtitle: tv.types.project.subtitle };
      default:
        return { title: tv.types.prompt.title, subtitle: tv.types.prompt.subtitle };
    }
  };

  const getSaveModalTexts = () => {
    const type = tool?.type || 'prompt';
    switch (type) {
      case 'assistant':
        return {
          successTitle: tv.types.assistant.saveSuccess,
          successMessage: tv.messages.successSave.replace('{type}', 'assistant')
        };
      case 'project':
        return {
          successTitle: tv.types.project.saveSuccess,
          successMessage: tv.messages.successSave.replace('{type}', 'project')
        };
      default:
        return {
          successTitle: tv.types.prompt.saveSuccess,
          successMessage: tv.messages.successSave.replace('{type}', 'prompt')
        };
    }
  };

  const typeLabel = getTypeLabel();

  const internalTitleSection = (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={validateAndNavigate}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        type="button"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="bg-[#3b82f6] w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
        {getTypeIcon()}
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{typeLabel.title}</h1>
        <p className="text-sm text-slate-500">{typeLabel.subtitle}</p>
      </div>
    </div>
  );

  // Build urls section if props provided
  const internalUrlsSection = urlsProps ? (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{tv.urls.title}</h3>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">{tv.urls.privateLabel}</label>
        <div className="flex flex-wrap items-stretch gap-2 min-w-0">
          <input
            type="text"
            value={urlsProps.privateUrl}
            readOnly
            className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm truncate"
          />
          <button
            type="button"
            onClick={urlsProps.onCopyPrivate}
            disabled={!urlsProps.privateUrl}
            className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {urlsProps.copiedPrivate ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
          <button
            type="button"
            onClick={urlsProps.onOpenPrivate}
            disabled={!urlsProps.privateUrl}
            className="shrink-0 px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {urlsProps.isPublic && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">{tv.urls.publicLabel}</label>
          <div className="flex flex-wrap items-stretch gap-2 min-w-0">
            <input
              type="text"
              value={urlsProps.publicUrl || ''}
              readOnly
              className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-green-50 text-gray-900 border border-green-300 text-sm truncate"
            />
            <button
              type="button"
              onClick={urlsProps.onCopyPublic}
              disabled={!urlsProps.publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {urlsProps.copiedPublic ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
            <button
              type="button"
              onClick={urlsProps.onOpenPublic}
              disabled={!urlsProps.publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  ) : tool ? (
    <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{tv.urls.title}</h3>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">{tv.urls.privateLabel}</label>
        <div className="flex flex-wrap items-stretch gap-2 min-w-0">
          <input
            type="text"
            value={privateUrl}
            readOnly
            className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm truncate"
          />
          <button
            type="button"
            onClick={() => handleCopy(privateUrl, 'private')}
            disabled={!privateUrl}
            className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copiedPrivate ? <CheckCircle size={18} /> : <Copy size={18} />}
          </button>
          <button
            type="button"
            onClick={() => privateUrl && window.open(privateUrl, '_blank')}
            disabled={!privateUrl}
            className="shrink-0 px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {isPublic && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">{tv.urls.publicLabel}</label>
          <div className="flex flex-wrap items-stretch gap-2 min-w-0">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 min-w-0 w-0 px-4 py-2 rounded-lg bg-green-50 text-gray-900 border border-green-300 text-sm truncate"
            />
            <button
              type="button"
              onClick={() => handleCopy(publicUrl, 'public')}
              disabled={!publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedPublic ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
            <button
              type="button"
              onClick={() => publicUrl && window.open(publicUrl, '_blank')}
              disabled={!publicUrl}
              className="shrink-0 px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;
  const ctxValue = useMemo<ToolViewContextType>(() => ({
    tool,
    loading,
    error,
    state,
    update,
    save,
    isSaving,
    openPublish,
    isPublishing,
    registerDetailSave,
  }), [tool, loading, error, state, update, save, isSaving, openPublish, isPublishing, registerDetailSave]);

  const loadingContent = (
    <div className="min-h-[200px] w-full flex items-center justify-center">
      <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const errorContent = (
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <FileText size={24} className="text-red-600" />
      </div>
      <p className="text-gray-600 mb-4">{error || tv.messages.notFound.replace('{type}', 'tool')}</p>
      <button
        onClick={validateAndNavigate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
        type="button"
      >
        <ArrowLeft size={18} />
        {tv.messages.backToLibrary}
      </button>
    </div>
  );

  return (
    <div className={`w-full max-w-[90vw] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${blurred ? 'blur-sm pointer-events-none' : ''} ${className}`}>
      <div className="p-6 md:p-10 space-y-8">
        {/* Header: title on the left, actions on the right. Stack on small screens. */}
        <div className="flex flex-row gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left (Title/Info) */}
          <div className="flex-1 min-w-0 space-y-6 overflow-hidden">
            {headerLeft ?? internalTitleSection}
            {headerBelow}
          </div>
          {headerRight}
          {internalSaveSection}
        </div>

        {/* Optional area directly under the header row (e.g., urlsSection) */}
        {(internalUrlsSection) && (
          <div className="-mt-4 lg:mt-0">
            {internalUrlsSection}
          </div>
        )}

        {/* Divider between header/wrapper and the content */}
        <div className="border-t border-slate-200" />

        {/* Content area */}
        <ToolViewContext.Provider value={ctxValue}>
          <div className="pt-6">
            {toolId && loading ? loadingContent : error ? errorContent : (
              <>
                <MetadataSection />
                {children}
              </>
            )}
          </div>
        </ToolViewContext.Provider>
        
        {/* Render the correct publish modal based on tool type */}
        {tool?.type === 'assistant' && (
          <AssistantPublishModal
            open={isPublishModalOpen}
            onCancel={() => setIsPublishModalOpen(false)}
            onConfirm={confirmPublish}
            isWorking={isPublishing}
          />
        )}
        {tool?.type === 'project' && (
          <ProjectPublishModal
            open={isPublishModalOpen}
            onCancel={() => setIsPublishModalOpen(false)}
            onConfirm={confirmPublish}
            isWorking={isPublishing}
          />
        )}
        {tool?.type === 'prompt' && (
          <PromptPublishModal
            open={isPublishModalOpen}
            onCancel={() => setIsPublishModalOpen(false)}
            onConfirm={confirmPublish}
            isWorking={isPublishing}
          />
        )}
        
        <SaveStatusModal
          open={isSaveModalOpen}
          type={saveModalType}
          title={saveModalType === 'success' ? getSaveModalTexts().successTitle : t.saveStatusModal.errorTitle}
          message={saveModalMessage}
          onClose={() => setIsSaveModalOpen(false)}
        />
        
        {/* Modal de validación al intentar regresar */}
        {isValidationModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Campos incompletos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No has completado todos los campos obligatorios. ¿Qué deseas hacer?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsValidationModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Seguir editando
                </button>
                <button
                  onClick={() => {
                    setIsValidationModalOpen(false);
                    handleCancelAndDelete();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
                >
                  Anular y salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolViewCard;
