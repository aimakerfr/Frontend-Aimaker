import React, { useState } from 'react';
import { 
  BookOpen, Link2, FileText, Notebook, FolderKanban, 
  Smartphone, Globe, Code, Lock, ArrowLeft 
} from 'lucide-react';

type ItemType = 'agent' | 'external_link' | 'prompt' | 'note_book' | 'project' | 'app' | 'perplexity_search' | 'vibe_coding';

interface FormEditProps {
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
  initialData: any;
}

const FormEdit: React.FC<FormEditProps> = ({ onClose, onSave, initialData }) => {
  console.log('FormEdit initialData recibida:', initialData);
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'note_book',
    title: initialData?.title || '',
    url: initialData?.url || '',
    description: initialData?.description || '',
    language: initialData?.language || 'fr',
    hasPublicStatus: initialData?.isPublic ?? false,
  });

  console.log('FormEdit formData inicial:', formData);

  const [isSaving, setIsSaving] = useState(false);

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'note_book', icon: Notebook, label: 'Notebook' },
    { type: 'project', icon: FolderKanban, label: 'Project' },
    { type: 'agent', icon: BookOpen, label: 'Agent' },
    { type: 'prompt', icon: FileText, label: 'Prompt' },
    { type: 'external_link', icon: Link2, label: 'External Link' },
    { type: 'app', icon: Smartphone, label: 'App' },
    { type: 'perplexity_search', icon: Globe, label: 'Perplexity Search' },
    { type: 'vibe_coding', icon: Code, label: 'Vibe Coding' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    console.log('FormEdit: Guardando datos:', formData);
    const success = await onSave(formData);
    console.log('FormEdit: Resultado:', success);
    
    setIsSaving(false);
    
    if (success) {
      console.log('FormEdit: Cerrando modal');
      onClose();
    } else {
      console.error('FormEdit: Error al guardar, modal permanece abierto');
    }
  };

  const TypeIcon = itemTypes.find(t => t.type === formData.type)?.icon || Notebook;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
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
                  Modifier la ressource
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mettez à jour les informations
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              TYPE
            </label>
            <div className="grid grid-cols-4 gap-3">
              {itemTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.type })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.type === type.type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={formData.type === type.type ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              TITRE
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              placeholder="https://..."
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormEdit;
