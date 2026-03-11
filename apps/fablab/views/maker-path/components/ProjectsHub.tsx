import React, { useState } from 'react';
import { ArrowRight, BookOpen, Rocket, Box } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface ProjectsHubProps {
  onGoToTemplates: (intention: string) => void;
  onGoToDeploy: () => void;
  onGoToAssembly: () => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  onGoToTemplates,
  onGoToDeploy,
  onGoToAssembly,
}) => {
  const [intention, setIntention] = useState('');
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

        {/* Tres cajitas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Caja 1: Usar una plantilla */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-center leading-snug">
              {tr?.card1Question ?? '¿Quieres clonar y usar un proyecto existente?'}
            </p>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tr?.card1Title ?? 'Usar una plantilla'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tr?.card1Desc ?? 'Comienza desde una estructura predefinida.'}</p>
                </div>
              </div>
              <input
                type="text"
                placeholder={tr?.card1Input ?? '¿Qué quieres crear?'}
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && intention.trim()) {
                    onGoToTemplates(intention.trim());
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => onGoToTemplates(intention.trim())}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {tr?.continueBtn ?? 'Continuar'} <ArrowRight size={16} />
            </button>
          </div>

          {/* Caja 2: Desplegar proyecto */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-center leading-snug">
              {tr?.card2Question ?? '¿Ya tienes un proyecto y quieres desplegarlo?'}
            </p>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Rocket size={18} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tr?.card2Title ?? 'Desplegar un proyecto'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tr?.card2Desc ?? 'Conecta y despliega tu código existente.'}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onGoToDeploy}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {tr?.continueBtn ?? 'Continuar'} <ArrowRight size={16} />
            </button>
          </div>

          {/* Caja 3: Ensamblador de objetos */}
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
