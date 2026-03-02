
import React, { useState, useEffect } from 'react';
import {
  Workflow, X, FilePlus, Layout, MessageSquare,
  Image as ImageIcon, ChevronDown, Library, ArrowLeft,
  Languages, Sparkles
} from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';
import { analyzeIntention, type MakerPathId } from '../utils/intentionAnalyzer';

interface RouteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    type: string,
    title: string,
    description: string
  ) => void;
}

export const RouteTypeModal: React.FC<RouteTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'initial' | 'suggested' | 'default' | 'templates' | 'create'>('initial');
  const [formData, setFormData] = useState({
    title: '',
    intention: ''
  });
  const [suggestedPaths, setSuggestedPaths] = useState<MakerPathId[]>([]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      // Reset to initial view when modal opens
      setView('initial');
      setFormData({
        title: '',
        intention: ''
      });
      setSuggestedPaths([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const templates = [
    {
      id: 'landing_page_maker',
      title: t.RouteTypeModalTranslations?.['text_1'] ?? 'Landing Page Maker',
      description: t.RouteTypeModalTranslations?.['text_2'] ?? 'Create optimized landing pages with RAG.',
      icon: Layout,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    {
      id: 'rag_chat_maker',
      title: t.RouteTypeModalTranslations?.['text_3'] ?? 'Notebook',
      description: t.RouteTypeModalTranslations?.['text_4'] ?? 'Smart chat connected to your data sources.',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
    },
    {
      id: 'image_generator_rag',
      title: t.RouteTypeModalTranslations?.['text_5'] ?? 'RAG Image Generator',
      description: t.RouteTypeModalTranslations?.['text_6'] ?? 'Image generation based on RAG contexts.',
      icon: ImageIcon,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
    {
      id: 'translation_maker',
      title: t.RouteTypeModalTranslations?.['text_7'] ?? 'Translation Maker',
      description: t.RouteTypeModalTranslations?.['text_8'] ?? 'Automatically detects and translates texts from JSX/TSX files.',
      icon: Languages,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
    },
  ];

  const handleContinueFromInitial = () => {
    if (!formData.title.trim() || !formData.intention.trim()) return;
    
    // Analyze intention
    const matches = analyzeIntention(formData.intention);
    setSuggestedPaths(matches);
    
    // If matches found, show suggested view; otherwise show default with blank option
    if (matches.length > 0) {
      setView('suggested');
    } else {
      setView('default');
    }
  };

  const getSuggestedTemplates = () => {
    return templates.filter(t => suggestedPaths.includes(t.id as MakerPathId));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxWidth: view === 'templates' || view === 'suggested' ? '680px' : '1024px' }}
      >
        {/* ── Header ── */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              {/* Botón volver — se revela en vistas templates y suggested */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                  width: (view === 'templates' || view === 'suggested') ? '44px' : '0px', 
                  opacity: (view === 'templates' || view === 'suggested') ? 1 : 0 
                }}
              >
                <button
                  onClick={() => setView(view === 'suggested' ? 'initial' : 'default')}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all group"
                  title={t.RouteTypeModalTranslations?.['text_9'] ?? 'Back'}
                >
                  <ArrowLeft size={18} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>

              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-all duration-300">
                  {view === 'initial' && (t.RouteTypeModalTranslations?.['text_22'] ?? 'New Project')}
                  {view === 'suggested' && (t.RouteTypeModalTranslations?.['text_30'] ?? 'Suggested Maker Paths')}
                  {view === 'templates' && (t.RouteTypeModalTranslations?.['text_10'] ?? 'Maker Paths')}
                  {view === 'default' && (t.RouteTypeModalTranslations?.['text_11'] ?? 'Select Project')}
                  {view === 'create' && (t.RouteTypeModalTranslations?.['text_11'] ?? 'Select Project')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-base transition-all duration-300">
                  {view === 'initial' && (t.RouteTypeModalTranslations?.['text_23'] ?? 'Tell us about your project')}
                  {view === 'suggested' && (t.RouteTypeModalTranslations?.['text_31'] ?? 'Based on your intention, we recommend:')}
                  {view === 'templates' && (t.RouteTypeModalTranslations?.['text_12'] ?? 'Choose the template that best suits your workflow.')}
                  {view === 'default' && (t.RouteTypeModalTranslations?.['text_33'] ?? 'Your intention doesn\'t match any of our Maker Paths. You can start from scratch:')}
                  {view === 'create' && (t.RouteTypeModalTranslations?.['text_12'] ?? 'Choose the template that best suits your workflow.')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all border border-transparent hover:border-gray-200 shrink-0"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-8">

          {/* ── Vista initial: Formulario de titulo e intención ── */}
          {view === 'initial' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    {t.RouteTypeModalTranslations?.['text_24'] ?? 'Title'}
                  </label>
                  <input
                    type="text"
                    placeholder={t.RouteTypeModalTranslations?.['text_25'] ?? 'Enter project title'}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    {t.RouteTypeModalTranslations?.['text_26'] ?? 'Intention'}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t.RouteTypeModalTranslations?.['text_27'] ?? 'What do you want to create?'}
                  </p>
                  <textarea
                    placeholder={t.RouteTypeModalTranslations?.['text_28'] ?? 'E.g.: A website with header, body and footer | Generate an image of a sunset | Translate my JSX files'}
                    value={formData.intention}
                    onChange={(e) => setFormData(prev => ({ ...prev, intention: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll analyze your intention and suggest the best Maker Path templates for your project.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleContinueFromInitial}
                  disabled={!formData.title.trim() || !formData.intention.trim()}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  {t.RouteTypeModalTranslations?.['text_29'] ?? 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── Vista suggested: Muestra templates sugeridos basados en intención ── */}
          {view === 'suggested' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 font-medium tracking-wide">
                {getSuggestedTemplates().length} {getSuggestedTemplates().length === 1 ? 'recommended path' : 'recommended paths'}
              </p>
              <div
                className="flex flex-col gap-4 overflow-y-auto pr-1"
                style={{
                  maxHeight: '400px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#c7d2fe transparent',
                }}
              >
                {getSuggestedTemplates().map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelect(template.id, formData.title, formData.intention);
                    }}
                    className={`group flex items-center p-5 bg-gradient-to-r ${template.bgColor} dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 ${template.borderColor} ${template.hoverBorder} hover:shadow-lg transition-all duration-300 text-left w-full`}
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:-rotate-2 transition-transform shrink-0`}>
                      <template.icon size={26} className="text-white" />
                    </div>
                    <div className="ml-5 min-w-0 flex-1 text-left">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                        {template.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <div className="ml-4 w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-700 transition-all shrink-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                      <Workflow size={16} className="text-indigo-500" />
                    </div>
                  </button>
                ))}

                {/* Option to see all templates */}
                <button
                  onClick={() => setView('templates')}
                  className="group flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  <Library size={18} className="mr-2" />
                  View all Maker Paths
                </button>

                {/* Option for blank project */}
                <button
                  onClick={() => onSelect('blank', formData.title, formData.intention)}
                  className="group flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium"
                >
                  <FilePlus size={18} className="mr-2" />
                  Start from scratch
                </button>
              </div>
            </div>
          )}

          {/* ── Vista default: dos columnas (cuando no hay sugerencias) ── */}
          {view === 'default' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">

              {/* Caja izquierda: Proyecto en blanco (destacado cuando no hay matches) */}
              <button
                onClick={() => onSelect('blank', formData.title, formData.intention)}
                className="group flex flex-col p-8 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-[2.5rem] border-2 border-orange-300 dark:border-orange-700 hover:border-orange-500 dark:hover:border-orange-600 hover:shadow-xl transition-all duration-300 text-left min-h-[320px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FilePlus size={120} className="text-orange-500" />
                </div>
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-orange-200 dark:border-orange-700 group-hover:scale-110 group-hover:rotate-3 transition-transform mb-8">
                  <FilePlus size={32} className="text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t.RouteTypeModalTranslations?.['text_14'] ?? 'Blank Project'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                  {t.RouteTypeModalTranslations?.['text_15'] ?? 'Start from scratch and design your own custom workflow step by step.'}
                </p>
                <div className="mt-auto pt-6 border-t border-orange-200 dark:border-orange-700 w-full flex items-center text-orange-600 dark:text-orange-500 font-bold text-base">
                  {t.RouteTypeModalTranslations?.['text_16'] ?? 'Start now'}
                  <Workflow size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Caja derecha: Maker Paths — actúa como trigger */}
              <button
                onClick={() => setView('templates')}
                className="group flex flex-col p-8 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-500 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 text-left min-h-[320px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Library size={120} className="text-indigo-500" />
                </div>
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:-rotate-3 transition-transform mb-8">
                  <Library size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t.RouteTypeModalTranslations?.['text_10'] ?? 'Maker Paths'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                  {t.RouteTypeModalTranslations?.['text_17'] ?? 'Use one of our optimized templates to speed up your creative process.'}
                </p>
                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full flex items-center text-indigo-600 font-bold text-base">
                  {t.RouteTypeModalTranslations?.['text_18'] ?? 'View available templates'}
                  <ChevronDown size={18} className="ml-2 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          )}

          {/* ── Vista templates: lista completa de templates ── */}
          {view === 'templates' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 font-medium tracking-wide uppercase">
                {templates.length} {t.RouteTypeModalTranslations?.['text_19'] ?? 'available templates'}
              </p>
              <div
                className="flex flex-col gap-4 overflow-y-auto pr-1"
                style={{
                  maxHeight: '400px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#c7d2fe transparent',
                }}
              >
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelect(template.id, formData.title, formData.intention);
                    }}
                    className={`group flex items-center p-5 bg-gradient-to-r ${template.bgColor} dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 ${template.borderColor} ${template.hoverBorder} hover:shadow-lg transition-all duration-300 text-left w-full`}
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:-rotate-2 transition-transform shrink-0`}>
                      <template.icon size={26} className="text-white" />
                    </div>
                    <div className="ml-5 min-w-0 flex-1 text-left">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                        {template.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <div className="ml-4 w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-700 transition-all shrink-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                      <Workflow size={16} className="text-indigo-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">

          {/* Breadcrumb — navegación contextual */}
          <div className="flex items-center gap-2 text-sm text-gray-400 select-none">
            <button
              onClick={() => setView('initial')}
              className={`transition-colors ${view === 'initial'
                ? 'text-gray-700 dark:text-gray-200 font-semibold cursor-default'
                : 'hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'}`}
            >{t.RouteTypeModalTranslations?.['text_20'] ?? 'Home'}</button>
            {(view === 'templates' || view === 'suggested') && (
              <>
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {view === 'templates' ? (t.RouteTypeModalTranslations?.['text_10'] ?? 'Maker Paths') : (t.RouteTypeModalTranslations?.['text_30'] ?? 'Suggested')}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-base"
          >{t.RouteTypeModalTranslations?.['text_21'] ?? 'Cancel'}</button>
        </div>
      </div>
    </div>
  );
};