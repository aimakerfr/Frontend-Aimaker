import React, { useEffect, useState } from 'react';
import { 
  BookOpen, FileText, Notebook, FolderKanban, 
  Globe, Lock, ArrowLeft, ExternalLink, Copy, CheckCircle
} from 'lucide-react';
import { copyToClipboard } from '@core/ui_utils/navigator_utilies';
import { useLanguage } from '../../../language/useLanguage';

type ItemType = 'assistant' | 'prompt' | 'note_books' | 'project' | 'perplexity_search';

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
  publicUrl?: string;
  language?: string;
  usageCount?: number;
}

interface DetailsViewProps {
  item: LibraryItem | undefined;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
}

const DetailsView: React.FC<DetailsViewProps> = ({ 
  item, 
  onClose, 
  onSave
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(() => ({
    type: item?.type ?? 'assistant',
    title: item?.title ?? '',
    url: item?.url ?? '',
    description: item?.description ?? '',
    language: item?.language ?? 'fr',
    hasPublicStatus: item?.isPublic ?? false,
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  useEffect(() => {
    if (!item) return;

    setFormData({
      type: item.type,
      title: item.title || '',
      url: item.url || '',
      description: item.description || '',
      language: item.language || 'fr',
      hasPublicStatus: item.isPublic,
    });
  }, [item]);

  if (!item) {
    return null;
  }

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

  const itemTypes: { type: ItemType; icon: any; label: string }[] = [
    { type: 'note_books', icon: Notebook, label: t.library.types.notebook },
    { type: 'project', icon: FolderKanban, label: t.library.types.project },
    { type: 'assistant', icon: BookOpen, label: t.library.types.assistant },
    { type: 'prompt', icon: FileText, label: t.library.types.prompt },
    { type: 'perplexity_search', icon: Globe, label: t.library.types.perplexitySearch }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const success = await onSave(formData);
    
    // Si se guardó exitosamente y es público, actualizar el item local con la URL pública generada
    if (success && formData.hasPublicStatus) {
      // Generar la URL pública basada en el tipo e ID
      const urlType = item.type === 'note_books' ? 'notebook' : item.type;
      item.publicUrl = `/public/${urlType}/${item.id}`;
      // Forzar re-render
      setFormData({...formData});
    }
    
    setIsSaving(false);
  };

  const TypeIcon = itemTypes.find(t => t.type === item.type)?.icon || Notebook;

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
                    {t.detailsView.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.detailsView.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Type - Solo lectura */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t.detailsView.type}
              </label>
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <TypeIcon size={20} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {itemTypes.find(t => t.type === item.type)?.label}
                </span>
              </div>
            </div>

            {/* Title - Editable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.detailsView.name}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Language - Editable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.detailsView.language}
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="fr">{t.detailsView.languages.fr}</option>
                <option value="en">{t.detailsView.languages.en}</option>
                <option value="es">{t.detailsView.languages.es}</option>
              </select>
            </div>

            {/* Description - Editable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.detailsView.description}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Visibility - Editable */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t.detailsView.visibility}
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
                      {t.detailsView.private}
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
                      {t.detailsView.public}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-2">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                {t.detailsView.readOnlyInfo}
              </h3>
            </div>

            {/* URLs para tipos automáticos (solo lectura) */}
            {(item.type === 'note_books' || item.type === 'prompt' || item.type === 'assistant' || item.type === 'project') && (
              <div className="space-y-4 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                {/* URL Privada */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.detailsView.privateUrl}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.url || `http://localhost:3001/dashboard/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 cursor-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const privateUrl = item.url || `http://localhost:3001/dashboard/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`;
                        handleCopyToClipboard(privateUrl, 'private');
                      }}
                      className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl font-semibold transition-all"
                      title={t.detailsView.copyUrl}
                    >
                      {copiedPrivate ? <CheckCircle size={20} /> : <Copy size={20} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const privateUrl = item.url || `http://localhost:3001/dashboard/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`;
                        window.open(privateUrl, '_blank');
                      }}
                      className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 rounded-xl font-semibold transition-all"
                      title={t.detailsView.openTab}
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>

                {/* URL Pública - mostrar si es público (con URL del backend o generada) */}
                {formData.hasPublicStatus && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t.detailsView.publicUrl}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.publicUrl || `http://localhost:3001/public/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`}
                        readOnly
                        className="flex-1 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white border border-green-300 dark:border-green-700 cursor-text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const publicUrl = item.publicUrl || `http://localhost:3001/public/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`;
                          handleCopyToClipboard(publicUrl, 'public');
                        }}
                        className="px-4 py-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl font-semibold transition-all"
                        title={t.detailsView.copyUrl}
                      >
                        {copiedPublic ? <CheckCircle size={20} /> : <Copy size={20} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const publicUrl = item.publicUrl || `http://localhost:3001/public/${item.type === 'note_books' ? 'notebook' : item.type}/${item.id}`;
                          window.open(publicUrl, '_blank');
                        }}
                        className="px-4 py-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl font-semibold transition-all"
                        title={t.detailsView.openTab}
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {t.detailsView.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? t.detailsView.updating : t.detailsView.update}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default DetailsView;
