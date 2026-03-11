import React, { useState } from 'react';
import {
  ArrowLeft, Layout, MessageSquare, Image as ImageIcon,
  Languages, ChevronRight
} from 'lucide-react';
import { analyzeIntention, type MakerPathId } from '../utils/intentionAnalyzer';
import { ProductCreateModal } from './ProductCreateModal';
import { useLanguage } from '../../../language/useLanguage';

interface TemplateSelectorProps {
  /** Intención que el usuario escribió en la tarjeta principal */
  intention: string;
  onBack: () => void;
  onProductCreated: (productId: number, templateId: string) => void;
}

const TEMPLATES = [
  {
    id: 'rag_chat_maker' as MakerPathId,
    titleKey: 'templateNotebook' as const,
    descKey: 'templateNotebookDesc' as const,
    titleFallback: 'Notebook',
    descFallback: 'Chat inteligente conectado a tus fuentes de datos.',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    hoverBorder: 'hover:border-purple-400',
  },
  {
    id: 'landing_page_maker' as MakerPathId,
    titleKey: 'templateLanding' as const,
    descKey: 'templateLandingDesc' as const,
    titleFallback: 'Landing Page',
    descFallback: 'Crea páginas de aterrizaje optimizadas con RAG.',
    icon: Layout,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
  },
  {
    id: 'image_generator_rag' as MakerPathId,
    titleKey: 'templateImage' as const,
    descKey: 'templateImageDesc' as const,
    titleFallback: 'Generador de imágenes',
    descFallback: 'Generación de imágenes basada en contextos RAG.',
    icon: ImageIcon,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
  },
  {
    id: 'translation_maker' as MakerPathId,
    titleKey: 'templateTranslation' as const,
    descKey: 'templateTranslationDesc' as const,
    titleFallback: 'Translation Maker',
    descFallback: 'Detecta y traduce textos de archivos JSX/TSX automáticamente.',
    icon: Languages,
    color: 'from-orange-500 to-red-600',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    hoverBorder: 'hover:border-orange-400',
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  intention,
  onBack,
  onProductCreated,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { t } = useLanguage();
  const tr = t.templateSelectorTranslations;

  // Si hay intención analiza y filtra sugeridos, si no muestra todos
  const suggestedIds = intention ? analyzeIntention(intention) : [];
  const suggested = suggestedIds.length > 0
    ? TEMPLATES.filter(t => suggestedIds.includes(t.id))
    : TEMPLATES;
  const rest = suggestedIds.length > 0
    ? TEMPLATES.filter(t => !suggestedIds.includes(t.id))
    : [];

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate({ id: template.id, title: tr?.[template.titleKey] ?? template.titleFallback });
    setShowCreateModal(true);
  };

  const TemplateCard = ({ template }: { template: typeof TEMPLATES[0] }) => (
    <button
      onClick={() => handleSelectTemplate(template)}
      className={`group flex items-center p-5 bg-gradient-to-r ${template.bgColor} dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 ${template.borderColor} ${template.hoverBorder} hover:shadow-lg transition-all duration-300 text-left w-full`}
    >
      <div className={`w-14 h-14 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:-rotate-2 transition-transform shrink-0`}>
        <template.icon size={26} className="text-white" />
      </div>
      <div className="ml-5 min-w-0 flex-1 text-left">
        <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
          {tr?.[template.titleKey] ?? template.titleFallback}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {tr?.[template.descKey] ?? template.descFallback}
        </p>
      </div>
      <div className="ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} /> {tr?.backBtn ?? 'Volver al inicio'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {tr?.title ?? 'Selecciona una plantilla'}
          </h1>
          {intention && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tr?.intentionLabel ?? 'Basado en tu intención:'} <span className="font-medium text-indigo-600 dark:text-indigo-400">"{intention}"</span>
            </p>
          )}
        </div>

        {/* Plantillas sugeridas */}
        <div className="space-y-3">
          {suggestedIds.length > 0 && (
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
              {suggested.length === 1 ? (tr?.suggestedSingle ?? 'Plantilla sugerida') : (tr?.suggestedMultiple ?? 'Plantillas sugeridas')}
            </p>
          )}
          {suggested.map(t => <TemplateCard key={t.id} template={t} />)}
        </div>

        {/* Resto de plantillas (si hubo sugerencias) */}
        {rest.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tr?.allTemplates ?? 'Todas las plantillas'}</p>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            {rest.map(t => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}
      </div>

      {/* Modal de creación */}
      {selectedTemplate && (
        <ProductCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          templateType={selectedTemplate.id}
          templateTitle={selectedTemplate.title}
          onSubmit={async (title, description) => {
            const { createProductFromTemplate } = await import('@core/products');
            const product = await createProductFromTemplate(selectedTemplate.id, title, description);
            setShowCreateModal(false);
            setSelectedTemplate(null);
            onProductCreated(product.id, selectedTemplate.id);
          }}
        />
      )}
    </div>
  );
};
