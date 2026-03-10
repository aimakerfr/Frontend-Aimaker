import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
  templateTitle: string;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  templateType,
  templateTitle,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError(t.productModal?.titleRequired || 'El título es requerido');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onSubmit(title, description);
      onClose();
    } catch (err: any) {
      console.error('[ProductCreateModal] Error creating product:', err);
      setError(err.message || 'Error al crear el producto');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <MessageSquare size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {t.productModal?.createProduct || 'Crear Producto'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {templateTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isCreating}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t.productModal?.title || 'Título'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.productModal?.titlePlaceholder || 'Ingresa un título para tu producto'}
              disabled={isCreating}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t.productModal?.description || 'Descripción'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.productModal?.descriptionPlaceholder || 'Describe tu producto (opcional)'}
              disabled={isCreating}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.productModal?.cancel || 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t.productModal?.creating || 'Creando...'}
                </>
              ) : (
                t.productModal?.create || 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
