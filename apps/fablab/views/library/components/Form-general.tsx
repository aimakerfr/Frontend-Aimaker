import React, { useState } from 'react';
import { 
  BookOpen, FileText, Notebook, FolderKanban, 
  Globe, Lock, ArrowLeft 
} from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

type ItemType = 'assistant' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

interface FormGeneralProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  selectedType?: ItemType;
  userLanguage?: string; // Idioma del perfil del usuario
}

const FormGeneral: React.FC<FormGeneralProps> = ({ 
  onClose, 
  onSave, 
  selectedType,
  userLanguage = 'fr'
}) => {
  const { language } = useLanguage();
  const effectiveLanguage = language || userLanguage || 'fr';

  const [formData, setFormData] = useState({
    type: selectedType || 'note_books',
    title: '',
    description: '',
    language: effectiveLanguage, // Usar el idioma del perfil del usuario
    hasPublicStatus: false,
    isTemplate: false,
    category: '' as string // Nueva propiedad
  });

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'note_books', icon: Notebook, label: 'Notebook' },
    { type: 'project', icon: FolderKanban, label: 'Project' },
    { type: 'assistant', icon: BookOpen, label: 'Assistant' },
    { type: 'prompt', icon: FileText, label: 'Prompt' },
    { type: 'perplexity_search', icon: Globe, label: 'Perplexity Search' }
  ];

  // Opciones de categoría
  const categoryOptions = [
    { value: '', label: 'Seleccionar categoría...' },
    { value: 'analysis', label: 'Análisis' },
    { value: 'development', label: 'Desarrollo' },
    { value: 'design', label: 'Diseño' },
    { value: 'education', label: 'Educación' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'research', label: 'Investigación' },
    { value: 'other', label: 'Otro' }
  ];

  const getCurrentTypeLabel = () => {
    const typeConfig = itemTypes.find(t => t.type === formData.type);
    return typeConfig?.label || 'Notebook';
  };

  const getDetailsLabel = () => {
    const labels: Record<ItemType, string> = {
      'note_books': 'Détails Notebook',
      'project': 'Détails Project',
      'assistant': 'Détails Assistant',
      'prompt': 'Détails Prompt',
      'perplexity_search': 'Détails Perplexity Search'
    };
    return labels[formData.type as ItemType] || 'Détails';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onClose();
  };

  const TypeIcon = itemTypes.find(t => t.type === formData.type)?.icon || Notebook;

  // Obtener el label del idioma
  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      'fr': 'Français',
      'en': 'English',
      'es': 'Español'
    };
    return labels[lang] || lang;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TypeIcon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {getDetailsLabel()}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Documentez vos recherches et partages
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:scale-105"
          >
            Mettre à jour
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection - SOLO MOSTRAR, NO EDITABLE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              TYPE
            </label>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <TypeIcon size={24} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {getCurrentTypeLabel()}
              </span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 italic">
                (Sélectionné)
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              TITRE DU {getCurrentTypeLabel().toUpperCase()}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="REX Industrialisation LLM"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Category - NUEVO CAMPO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              CATÉGORIE
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility - FIJO, NO EDITABLE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              VISIBILITÉ
            </label>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <Lock size={20} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Privé
              </span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 italic">
                (Non modifiable)
              </span>
            </div>
          </div>

          {/* Language - NO EDITABLE, VIENE DEL PERFIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              LANGUE
            </label>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <Globe size={20} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getLanguageLabel(formData.language)}
              </span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 italic">
                (Défini dans le profil)
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notes sur les tests de latence et coûts."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormGeneral;
