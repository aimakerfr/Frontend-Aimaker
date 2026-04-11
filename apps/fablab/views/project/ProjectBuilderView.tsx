import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, LayoutGrid, Box, Map } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { createProductFromTemplate, getProducts } from '@core/products';

export default function ProjectBuilderView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpeningCreationPath, setIsOpeningCreationPath] = useState(false);
  const [creationPathError, setCreationPathError] = useState('');

  const openCreationPathById = async () => {
    try {
      setCreationPathError('');
      setIsOpeningCreationPath(true);

      const existing = await getProducts({ type: 'creation_path' });
      let first = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;

      if (!first?.id) {
        first = await createProductFromTemplate(
          'creation_path',
          (t.products.fixed as any).creationPathTitle || 'Creation-Path',
          (t.products.fixed as any).creationPathDesc || 'Ruta de creación guiada paso a paso con asistencia de IA.'
        );
      }

      if (!first?.id) {
        setCreationPathError('No se pudo crear o abrir el producto Creation-Path.');
        return;
      }

      navigate('/product/creation-path', {
        state: { creationPathId: first.id },
      });
    } catch (error: any) {
      setCreationPathError(error?.message || 'No se pudo abrir Creation-Path.');
    } finally {
      setIsOpeningCreationPath(false);
    }
  };

  const handleOptionClick = async (path: string) => {
    if (path === '/dashboard/creation-path') {
      await openCreationPathById();
      return;
    }

    navigate(path);
  };

  const options = [
    {
      title: t.projectBuilder.assembleCustomProject,
      description: t.projectBuilder.assembleCustomProjectDesc,
      icon: LayoutGrid,
      path: '/dashboard/maker-path',
    },
    {
      title: t.projectBuilder.deployExternalProject,
      description: t.projectBuilder.deployExternalProjectDesc,
      icon: CloudUpload,
      path: '/dashboard/applications',
    },
    {
      title: t.projectBuilder.useServerProducts,
      description: t.projectBuilder.useServerProductsDesc,
      icon: Box,
      path: '/dashboard/context',
    },
    {
      title: t.projectBuilder.guidedCreationPath,
      description: t.projectBuilder.guidedCreationPathDesc,
      icon: Map,
      path: '/dashboard/creation-path',
    },
  ];

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">{t.projectBuilder.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">{t.projectBuilder.subtitle}</p>
        {creationPathError && (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{creationPathError}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option, idx) => {
          const Icon = option.icon;
          const isGuidedPath = option.path === '/dashboard/creation-path';
          const isDisabled = isGuidedPath && isOpeningCreationPath;

          return (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md dark:hover:shadow-brand-900/10 transition-all cursor-pointer group ${isDisabled ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => {
                void handleOptionClick(option.path);
              }}
            >
              <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <Icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{option.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{option.description}</p>
              {isGuidedPath && isOpeningCreationPath && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Abriendo Creation-Path...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
