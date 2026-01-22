import React, { useState } from 'react';
import { 
  BookOpen, FileText, Notebook, FolderKanban, 
  Globe, Lock, ArrowLeft, Edit2, ExternalLink
} from 'lucide-react';

type ItemType = 'agent' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

interface LibraryItem {
  id: number;
  type: ItemType;
  title: string;
  description: string;
  isPublic: boolean;
  author: string;
  createdAt: string;
  category: string;
  url: string;
  language?: string;
  usageCount?: number;
}

interface DetailsViewProps {
  item: LibraryItem | undefined;
  isEditMode: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: (data: any) => Promise<boolean>;
  onRedirect: (url: string) => void;
}

const DetailsView: React.FC<DetailsViewProps> = ({ 
  item, 
  isEditMode, 
  onClose, 
  onEdit, 
  onSave, 
  onRedirect 
}) => {
  if (!item) {
    return null;
  }

  const [formData, setFormData] = useState({
    type: item.type,
    title: item.title || '',
    url: item.url || '',
    description: item.description || '',
    language: item.language || 'fr',
    hasPublicStatus: item.isPublic,
  });

  const [isSaving, setIsSaving] = useState(false);

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'note_books', icon: Notebook, label: 'Notebook' },
    { type: 'project', icon: FolderKanban, label: 'Project' },
    { type: 'agent', icon: BookOpen, label: 'Agent' },
    { type: 'prompt', icon: FileText, label: 'Prompt' },
    { type: 'perplexity_search', icon: Globe, label: 'Perplexity Search' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const success = await onSave(formData);
    
    setIsSaving(false);
  };

  const TypeIcon = itemTypes.find(t => t.type === (isEditMode ? formData.type : item.type))?.icon || Notebook;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
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
                    {isEditMode ? 'Modifier la ressource' : 'Détails de la ressource'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode ? 'Mettez à jour les informations' : 'Consultez les informations'}
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
              {isEditMode ? (
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
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <TypeIcon size={20} className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">
                    {itemTypes.find(t => t.type === item.type)?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                TITRE
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  {item.title}
                </p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                URL (OPTIONNEL)
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  {item.url || 'N/A'}
                </p>
              )}
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                LANGUE
              </label>
              {isEditMode ? (
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 uppercase">
                  {item.language || 'N/A'}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                DESCRIPTION
              </label>
              {isEditMode ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              ) : (
                <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px]">
                  {item.description}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                VISIBILITÉ
              </label>
              {isEditMode ? (
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
              ) : (
                <div>
                  {item.isPublic ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <Globe size={18} className="text-green-600" />
                      <span className="text-sm font-semibold text-green-600">PUBLIC</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <Lock size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-600">PRIVÉ</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {isEditMode ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex-1 px-6 py-3 border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} />
                    Modifier
                  </button>
                  {item.type === 'note_books' && (
                    <button
                      type="button"
                      onClick={() => onRedirect(`/dashboard/notebook/${item.id}?title=${encodeURIComponent(item.title)}`)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all shadow-lg inline-flex items-center justify-center gap-2"
                    >
                      <Notebook size={18} />
                      Ver Notebook
                    </button>
                  )}
                  {item.isPublic && item.url && item.type !== 'note_books' && (
                    <button
                      type="button"
                      onClick={() => onRedirect(item.url)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all shadow-lg inline-flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Ouvrir
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DetailsView;
