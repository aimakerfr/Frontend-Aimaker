import React, { useState } from 'react';
import { Workflow, X, FilePlus, Layout, MessageSquare, Image as ImageIcon, ChevronDown, Library } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface RouteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'blank' | 'landing_page_maker' | 'rag_chat_maker' | 'image_generator_rag') => void;
}

export const RouteTypeModal: React.FC<RouteTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useLanguage();
  const [showTemplates, setShowTemplates] = useState(false);
  
  if (!isOpen) return null;

  const templates = [
    {
      id: 'landing_page_maker',
      title: 'Creador de páginas de aterrizaje',
      description: 'Crea páginas de aterrizaje optimizadas con RAG.',
      icon: Layout,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-500'
    },
    {
      id: 'rag_chat_maker',
      title: 'RAG Chat Maker',
      description: 'Chat inteligente conectado a tus fuentes de datos.',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-500'
    },
    {
      id: 'image_generator_rag',
      title: 'Generador de imágenes de RAG',
      description: 'Generación de imágenes basada en contextos RAG.',
      icon: ImageIcon,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {t.projectFlow?.modal?.title || 'Seleccionar Proyecto'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
                {t.projectFlow?.modal?.subtitle || 'Elige cómo quieres empezar tu nuevo flujo de trabajo'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all border border-transparent hover:border-gray-200"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box 1: Proyecto en Blanco */}
            <button
              onClick={() => onSelect('blank')}
              className="group flex flex-col p-8 bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 text-left min-h-[320px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <FilePlus size={120} className="text-orange-500" />
              </div>

              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:rotate-3 transition-transform mb-8">
                <FilePlus size={32} className="text-orange-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t.projectFlow?.modal?.blankProject || 'Proyecto en blanco'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                {t.projectFlow?.modal?.blankProjectDesc || 'Empieza desde cero y diseña tu propio flujo de trabajo personalizado paso a paso.'}
              </p>
              
              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full flex items-center text-orange-600 font-bold text-base">
                {t.projectFlow?.modal?.startNow || 'Empezar ahora'}
                <Workflow size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 2: Maker Paths (Plantillas) */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`w-full group flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-300 text-left min-h-[320px] relative overflow-hidden
                  ${showTemplates 
                    ? 'bg-white dark:bg-gray-800 border-indigo-500 shadow-xl' 
                    : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-500 hover:bg-white dark:hover:bg-gray-800'
                  }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Library size={120} className="text-indigo-500" />
                </div>

                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:-rotate-3 transition-transform mb-8">
                  <Library size={32} className="text-indigo-600" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t.projectFlow?.modal?.makerPaths || 'Maker Paths'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 text-lg">
                  {t.projectFlow?.modal?.makerPathsDesc || 'Utiliza una de nuestras plantillas optimizadas para acelerar tu proceso creativo.'}
                </p>

                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 w-full flex items-center justify-between text-indigo-600 font-bold text-base">
                  <span className="flex items-center">
                    {t.projectFlow?.modal?.viewTemplates || 'Ver plantillas disponibles'}
                    <ChevronDown 
                      size={18} 
                      className={`ml-2 transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} 
                    />
                  </span>
                </div>
              </button>

              {/* Dropdown Menu for Maker Paths */}
              {showTemplates && (
                <div className="mt-4 grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-300">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template.id as any)}
                      className={`group flex items-center p-4 bg-gradient-to-r ${template.bgColor} dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 ${template.borderColor} ${template.hoverBorder} hover:shadow-md transition-all duration-300 text-left`}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                        <template.icon size={22} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                          {template.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {template.description}
                        </p>
                      </div>
                      <Workflow size={16} className="ml-auto text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-lg"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

