import React from 'react';
import { ArrowRight, Box } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface ProjectsHubProps {
  onGoToAssembly: () => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  onGoToAssembly,
}) => {
  const { t } = useLanguage();
  const tr = t.projectsHubTranslations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Encabezado */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{tr?.title ?? 'Proyectos'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{tr?.subtitle ?? 'Gestiona y crea tus flujos de trabajo'}</p>
        </div>

        <div className="grid grid-cols-1 md:max-w-md mx-auto gap-6">

          {/* Caja 1: Ensamblador de objetos (Única caja ahora) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-center leading-snug">
              {tr?.card3Question ?? '¿Quieres crear tu proyecto con módulos de tu biblioteca de objetos?'}
            </p>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Box size={18} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tr?.card3Title ?? 'Ensamblador de objetos'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tr?.card3Desc ?? 'Ensambla componentes de tu biblioteca.'}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onGoToAssembly}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {tr?.continueBtn ?? 'Continuar'} <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
