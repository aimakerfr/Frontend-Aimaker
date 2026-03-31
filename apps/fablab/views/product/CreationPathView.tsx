import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Route, Construction } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

const CreationPathView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = (t as any).creationPath ?? {};

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/context')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <Route size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {tr.title ?? 'Creation-Path'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr.subtitle ?? 'Ruta de creación guiada paso a paso con asistencia de IA'}
          </p>
        </div>
      </header>

      {/* En desarrollo */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Construction size={36} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {tr.inDevTitle ?? 'En Desarrollo'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {tr.inDevDesc ?? 'Esta funcionalidad estará disponible próximamente. Creation-Path te guiará paso a paso en la creación de proyectos con asistencia de IA.'}
          </p>
          <button
            onClick={() => navigate('/dashboard/context')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            {tr.back ?? 'Volver'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CreationPathView;
