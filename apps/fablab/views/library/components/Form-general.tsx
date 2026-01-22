import React, { useState } from 'react';
import { 
  BookOpen, FileText, Notebook, FolderKanban, 
  Globe, Lock, ArrowLeft 
} from 'lucide-react';

type ItemType = 'agent' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

interface FormGeneralProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  selectedType?: ItemType;
}

const FormGeneral: React.FC<FormGeneralProps> = ({ 
  onClose, 
  onSave, 
  selectedType
}) => {
  const [formData, setFormData] = useState({
    type: selectedType || 'note_books',
    title: '',
    url: '',
    description: '',
    language: 'fr',
    hasPublicStatus: false,
    isTemplate: false
  });

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'note_books', icon: Notebook, label: 'Notebook' },
    { type: 'project', icon: FolderKanban, label: 'Project' },
    { type: 'agent', icon: BookOpen, label: 'Agent' },
    { type: 'prompt', icon: FileText, label: 'Prompt' },
    { type: 'perplexity_search', icon: Globe, label: 'Perplexity Search' }
  ];

  const getCurrentTypeLabel = () => {
    const typeConfig = itemTypes.find(t => t.type === formData.type);
    return typeConfig?.label || 'Notebook';
  };

  const getDetailsLabel = () => {
    const labels: Record<ItemType, string> = {
      'note_books': 'Détails Notebook',
      'project': 'Détails Project',
      'agent': 'Détails Agent',
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
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              TYPE
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {itemTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.type })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      formData.type === type.type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon 
                      size={24} 
                      className={formData.type === type.type ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} 
                    />
                    <span className={`text-xs font-medium text-center ${
                      formData.type === type.type ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
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
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              URL (OPTIONNEL)
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="aimaker.fr/s/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              LANGUE
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
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

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              VISIBILITÉ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasPublicStatus: false })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  !formData.hasPublicStatus
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock size={20} className={!formData.hasPublicStatus ? 'text-blue-600' : 'text-gray-400'} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    !formData.hasPublicStatus ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    PRIVÉ
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, hasPublicStatus: true })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  formData.hasPublicStatus
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe size={20} className={formData.hasPublicStatus ? 'text-green-600' : 'text-gray-400'} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    formData.hasPublicStatus ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    PUBLIC
                  </div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormGeneral;