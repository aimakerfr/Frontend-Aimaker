
import React, { useState, useEffect } from 'react';
import {
  Workflow, X, FilePlus, Layout, MessageSquare,
  Image as ImageIcon, ChevronDown, Library, ArrowLeft,
  Languages
} from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

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
  const [view, setView] = useState<'default' | 'templates' | 'create'>('default');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
  if (!isOpen) {
    setView('default');
    setSelectedTemplate(null);
    setFormData({
      title: '',
      description: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const templates = [
    {
      id: 'landing_page_maker',
      title: t.RouteTypeModalTranslations?.['text_1'] ?? (t.routeTypeModalTranslations?.['text_1'] ?? 'Creador de páginas de aterrizaje'),
      description: t.RouteTypeModalTranslations?.['text_2'] ?? (t.routeTypeModalTranslations?.['text_2'] ?? 'Crea páginas de aterrizaje optimizadas con RAG.'),
      icon: Layout,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    {
      id: 'rag_chat_maker',
      title: t.RouteTypeModalTranslations?.['text_3'] ?? (t.routeTypeModalTranslations?.['text_3'] ?? 'RAG Chat Maker'),
      description: t.RouteTypeModalTranslations?.['text_4'] ?? (t.routeTypeModalTranslations?.['text_4'] ?? 'Chat inteligente conectado a tus fuentes de datos.'),
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
    },
    {
      id: 'image_generator_rag',
      title: t.RouteTypeModalTranslations?.['text_5'] ?? (t.routeTypeModalTranslations?.['text_5'] ?? 'Generador de imágenes de RAG'),
      description: t.RouteTypeModalTranslations?.['text_6'] ?? (t.routeTypeModalTranslations?.['text_6'] ?? 'Generación de imágenes basada en contextos RAG.'),
      icon: ImageIcon,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
    {
      id: 'translation_maker',
      title: t.RouteTypeModalTranslations?.['text_7'] ?? (t.routeTypeModalTranslations?.['text_7'] ?? 'Translation Maker'),
      description: t.RouteTypeModalTranslations?.['text_8'] ?? (t.routeTypeModalTranslations?.['text_8'] ?? 'Detecta y traduce textos de archivos JSX/TSX automáticamente.'),
      icon: Languages,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxWidth: view === 'templates' ? '680px' : '1024px' }}
      >
        {/* ── Header ── */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              {/* Botón volver — se revela solo en vista templates */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ width: view === 'templates' ? '44px' : '0px', opacity: view === 'templates' ? 1 : 0 }}
              >
                <button
                  onClick={() => setView('default')}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all group"
                  title={t.RouteTypeModalTranslations?.['text_9']}
                >
                  <ArrowLeft size={18} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>

              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-all duration-300">
                  {view === 'templates'
                    ? (t.projectFlow?.modal?.makerPaths || (t.routeTypeModalTranslations?.['text_9'] ?? 'Maker Paths'))
                    : (t.projectFlow?.modal?.title || (t.routeTypeModalTranslations?.['text_10'] ?? 'Seleccionar Proyecto'))}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-base transition-all duration-300">
                  {view === 'templates'
                    ? (t.RouteTypeModalTranslations?.['text_11'] ?? (t.routeTypeModalTranslations?.['text_11'] ?? 'Elige la plantilla que mejor se adapte a tu flujo de trabajo.'))
                    : (t.projectFlow?.modal?.subtitle || (t.routeTypeModalTranslations?.['text_12'] ?? 'Elige cómo quieres empezar tu nuevo flujo de trabajo'))}
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

          {/* ── Vista default: dos columnas ── */}
          {view === 'default' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">

              {/* Caja izquierda: Proyecto en blanco */}
              <button
                onClick={() => onSelect('blank', '', '')}
                className="group flex flex-col p-8 bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 text-left min-h-[320px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FilePlus size={120} className="text-orange-500" />
                </div>
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:rotate-3 transition-transform mb-8">
                  <FilePlus size={32} className="text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t.projectFlow?.modal?.blankProject || (t.routeTypeModalTranslations?.['text_13'] ?? 'Proyecto en blanco')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                  {t.projectFlow?.modal?.blankProjectDesc || (t.routeTypeModalTranslations?.['text_14'] ?? 'Empieza desde cero y diseña tu propio flujo de trabajo personalizado paso a paso.')}
                </p>
                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full flex items-center text-orange-600 font-bold text-base">
                  {t.projectFlow?.modal?.startNow || (t.routeTypeModalTranslations?.['text_15'] ?? 'Empezar ahora')}
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
                  {t.projectFlow?.modal?.makerPaths || (t.routeTypeModalTranslations?.['text_9'] ?? 'Maker Paths')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                  {t.projectFlow?.modal?.makerPathsDesc || (t.routeTypeModalTranslations?.['text_16'] ?? 'Utiliza una de nuestras plantillas optimizadas para acelerar tu proceso creativo.')}
                </p>
                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full flex items-center text-indigo-600 font-bold text-base">
                  {t.projectFlow?.modal?.viewTemplates || (t.routeTypeModalTranslations?.['text_17'] ?? 'Ver plantillas disponibles')}
                  <ChevronDown size={18} className="ml-2 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          )}

          {/* ── Vista templates: modal se encoge, lista se expande ── */}
          {view === 'templates' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Contador de plantillas */}
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-5 font-medium tracking-wide uppercase">
                {templates.length} {t.RouteTypeModalTranslations?.['text_19']}
              </p>
              {/* Lista scrolleable — lista completa y cómoda */}
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
                      setSelectedTemplate(template.id);
                      setFormData({
                        title: '',
                        description: ''
                      });
                      setView('create');
                    }}
                    className={`group flex items-center p-5 bg-gradient-to-r ${template.bgColor} dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 ${template.borderColor} ${template.hoverBorder} hover:shadow-lg transition-all duration-300 text-left w-full`}
                  >
                    {/* Icono */}
                    <div className={`w-14 h-14 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:-rotate-2 transition-transform shrink-0`}>
                      <template.icon size={26} className="text-white" />
                    </div>
                    {/* Texto */}
                    <div className="ml-5 min-w-0 flex-1 text-left">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                        {template.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    {/* Arrow pill — aparece en hover */}
                    <div className="ml-4 w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-700 transition-all shrink-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                      <Workflow size={16} className="text-indigo-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vista 'create' */}
          {view === 'create' && selectedTemplate && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t.routeTypeModalTranslations?.['text_18']}</label>
                  <input
                    type="text"
                    placeholder={t.routeTypeModalTranslations?.['text_19']}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t.routeTypeModalTranslations?.['text_20']}</label>
                  <textarea
                    placeholder={t.routeTypeModalTranslations?.['text_21']}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              {/* Template seleccionado */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.routeTypeModalTranslations?.['text_22']}</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400">
                  {templates.find(t => t.id === selectedTemplate)?.title}
                </p>
              </div>
              {/* Botón crear */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!formData.title.trim()) return;
                    onSelect(selectedTemplate as string, formData.title, formData.description);
                  }}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                >{t.routeTypeModalTranslations?.['text_23']}</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">

          {/* Breadcrumb — navegación contextual */}
          <div className="flex items-center gap-2 text-sm text-gray-400 select-none">
            <button
              onClick={() => setView('default')}
              className={`transition-colors ${view === 'default'
                ? 'text-gray-700 dark:text-gray-200 font-semibold cursor-default'
                : 'hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer'}`}
            >{t.RouteTypeModalTranslations?.['text_20']}</button>
            {view === 'templates' && (
              <>
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{t.RouteTypeModalTranslations?.['text_10']}</span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-base"
          >{t.RouteTypeModalTranslations?.['text_21']}</button>
        </div>
      </div>
    </div>
  );
};