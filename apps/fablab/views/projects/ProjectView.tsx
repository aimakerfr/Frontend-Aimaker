import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowLeft, Globe, Lock, Copy, CheckCircle, ExternalLink, Save, Loader2 } from 'lucide-react';
import { getTool, updateTool } from '@core/creation-tools/creation-tools.service';
import { copyToClipboard } from '@core/ui_utils/navigator_utilies';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { useLanguage } from '../../language/useLanguage';

enum Visibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

type ProjectType = 'landing page' | 'app' | 'automation';

interface ProjectState {
  title: string;
  description: string;
  visibility: Visibility;
  category: string;
  isFavorite: boolean;
  language: string;
  projectType: ProjectType;
  deploymentUrl: string;
  context: string;
}

const ProjectView: React.FC = () => {
  const { t } = useLanguage();
  const tv = t.projectView;
  const tg = t.formGeneral;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CreationTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [state, setState] = useState<ProjectState>({
    title: '',
    description: '',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: 'es',
    projectType: 'landing page',
    deploymentUrl: '',
    context: ''
  });

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getTool(parseInt(id));
        
        if (data.type !== 'project') {
          setError(tv.notProject);
          return;
        }
        
        setProject(data);
        
        // Inicializar el estado con los datos del proyecto
        setState({
          title: data.title || '',
          description: data.description || '',
          visibility: data.hasPublicStatus ? Visibility.PUBLIC : Visibility.PRIVATE,
          category: data.category || 'Marketing',
          isFavorite: data.isFavorite || false,
          language: data.language || 'es',
          projectType: (data.projectType as ProjectType) || 'landing page',
          deploymentUrl: data.deploymentUrl || '',
          context: data.context || ''
        });
      } catch (err) {
        console.error('Error cargando proyecto:', err);
        setError(tv.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, tv.notProject, tv.errorLoading]);

  const handleUpdate = (updates: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!project || !id) return;
    
    try {
      setIsSaving(true);
      
      await updateTool(parseInt(id), {
        type: 'project',
        title: state.title,
        description: state.description,
        projectType: state.projectType,
        deploymentUrl: state.deploymentUrl,
        context: state.context,
        category: state.category,
        language: state.language as 'fr' | 'en' | 'es',
        hasPublicStatus: state.visibility === Visibility.PUBLIC,
      });
      
      alert(tv.saveSuccess);
      
      // Recargar datos
      const updatedData = await getTool(parseInt(id));
      setProject(updatedData);
    } catch (err) {
      console.error('Error guardando proyecto:', err);
      alert(tv.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    setIsModalOpen(true);
  };

  const confirmPublish = () => {
    handleUpdate({ visibility: Visibility.PUBLIC });
    setIsModalOpen(false);
  };

  const handleCopyToClipboard = async (text: string, type: 'private' | 'public') => {
    const copied = await copyToClipboard(text);
    if (!copied) return;

    if (type === 'private') {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } else {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{tv.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {tv.errorNotAvailable}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || tv.notProject}
          </p>
          <button
            onClick={() => navigate('/dashboard/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            {tv.backToLibrary}
          </button>
        </div>
      </div>
    );
  }

  const privateUrl = `${window.location.origin}/dashboard/project/${id}`;
  const publicUrl = `${window.location.origin}/public/project/${id}`;

  return (
    <div className="flex justify-center p-4 md:p-8 relative bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      <div className={`w-full max-w-6xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Main Interface Wrapper */}
        <div className="p-6 md:p-10 space-y-8">
          
          {/* Top Title Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard/library')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={tv.backToLibrary}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="bg-[#3b82f6] w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FolderKanban size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{tv.configTitle}</h1>
                <p className="text-sm text-slate-500">{tv.configSubtitle}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              title={t.formGeneral.update}
              aria-label={t.formGeneral.update}
              className="bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </button>
          </div>

          {/* Header Section - Metadata */}
          <div className="space-y-6">
            {/* Row 1: TYPE | TITLE | PUBLISH */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tv.type}</label>
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-[#2563eb] font-bold shadow-sm h-[46px]">
                  <FolderKanban size={16} />
                  <span className="text-sm">{tv.project}</span>
                </div>
              </div>

              <div className="md:col-span-7">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tg.titleLabel}</label>
                <input
                  type="text"
                  value={state.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
                  placeholder={tg.titleLabel}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tv.publish}</label>
                <button
                  onClick={handlePublish}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all group shadow-sm h-[46px]"
                >
                  <div className="flex items-center gap-3">
                    {state.visibility === Visibility.PUBLIC ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-slate-400" />}
                    <span className="text-sm font-semibold text-slate-600">
                      {state.visibility === Visibility.PUBLIC ? tv.published : tv.publish}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Row 2: DESCRIPTION | PROJECT TYPE | FAVORITE | LANGUAGE */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tg.description}</label>
                <input
                  type="text"
                  value={state.description}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white shadow-sm h-[46px]"
                  placeholder={tg.descriptionPlaceholder}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tv.projectType}</label>
                <select
                  value={state.projectType}
                  onChange={(e) => handleUpdate({ projectType: e.target.value as ProjectType })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
                >
                  <option value="landing page">{tv.types.landingPage}</option>
                  <option value="app">{tv.types.app}</option>
                  <option value="automation">{tv.types.automation}</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">{tv.fav}</label>
                <button
                  onClick={() => handleUpdate({ isFavorite: !state.isFavorite })}
                  className={`w-full flex items-center justify-center border rounded-xl transition-all shadow-sm h-[46px] ${
                    state.isFavorite 
                      ? 'bg-red-50 border-red-200 text-red-500' 
                      : 'bg-white border-slate-200 text-slate-300 hover:text-slate-400'
                  }`}
                >
                  <span className="text-lg">{state.isFavorite ? '❤️' : '🤍'}</span>
                </button>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tg.language}</label>
                <select
                  value={state.language}
                  onChange={(e) => handleUpdate({ language: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer text-slate-700 shadow-sm h-[46px]"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
            <div className="border-b border-slate-100 pt-2"></div>
          </div>

          {/* Body Section - Project Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.projectDetails.deploymentUrl}</label>
              <input
                type="url"
                value={state.deploymentUrl}
                onChange={(e) => handleUpdate({ deploymentUrl: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 bg-white"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tv.context}</label>
              <textarea
                value={state.context}
                onChange={(e) => handleUpdate({ context: e.target.value })}
                className="w-full h-48 px-6 py-6 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm leading-relaxed text-slate-700 bg-slate-50/30"
                placeholder={tv.contextPlaceholder}
              ></textarea>
            </div>
          </div>

          {/* Footer Section */}
          <div className="space-y-10">
            {/* URLs Section */}
            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{tv.resourceUrls}</h3>
              
              {/* Private URL */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">{tv.privateUrlLabel}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={privateUrl}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(privateUrl, 'private')}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold transition-all"
                    aria-label="Copy"
                  >
                    {copiedPrivate ? <CheckCircle size={18} /> : <Copy size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(privateUrl, '_blank')}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold transition-all"
                    aria-label="Open"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>

              {/* Public URL - only if public */}
              {state.visibility === Visibility.PUBLIC && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">{tv.publicUrlLabel}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg bg-green-50 text-gray-900 border border-green-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(publicUrl, 'public')}
                      className="px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all"
                      aria-label="Copy"
                    >
                      {copiedPublic ? <CheckCircle size={18} /> : <Copy size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="px-4 py-2 bg-green-100 hover:bg-green-200 border-2 border-green-300 text-green-700 rounded-lg font-semibold transition-all"
                      aria-label="Open"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{tv.publishModalTitle}</h2>
            <p className="text-slate-600 mb-6">
              {tv.publishModalDesc}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                {tv.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectView;
