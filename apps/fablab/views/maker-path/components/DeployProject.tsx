import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface DeployProjectProps {
  onBack: () => void;
}

export const DeployProject: React.FC<DeployProjectProps> = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();
  const tr = t.deployProjectTranslations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-8">
      <div className="max-w-xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} /> {tr?.backBtn ?? 'Volver al inicio'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tr?.title ?? 'Desplegar Proyecto'}</h1>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
          <div>
            <input
              type="text"
              placeholder={tr?.titlePlaceholder ?? 'Título del proyecto'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <textarea
              placeholder={tr?.descPlaceholder ?? 'Descripción del proyecto'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Zona de carga */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => document.getElementById('deploy-folder-input')?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/30'
            }`}
          >
            <Upload size={28} className="text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tr?.uploadLabel ?? 'Haz clic para subir la carpeta del proyecto'}
            </p>
            <input
              id="deploy-folder-input"
              type="file"
              className="hidden"
              // @ts-ignore - webkitdirectory no está en los tipos estándar
              webkitdirectory=""
              multiple
            />
          </div>
        </div>

        {/* Aviso sin lógica */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
          {tr?.comingSoon ?? 'Esta funcionalidad estará disponible próximamente.'}
        </p>
      </div>
    </div>
  );
};
