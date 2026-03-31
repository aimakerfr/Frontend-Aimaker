import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, LayoutGrid, Box, Map } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';

export default function ProjectBuilderView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const options = [
    {
      title: t.projectBuilder.deployExternalProject,
      description: t.projectBuilder.deployExternalProjectDesc,
      icon: CloudUpload,
      path: '/dashboard/applications',
    },
    {
      title: t.projectBuilder.assembleCustomProject,
      description: t.projectBuilder.assembleCustomProjectDesc,
      icon: LayoutGrid,
      path: '/dashboard/maker-path',
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
        <h1 className="text-4xl font-bold text-slate-900 mb-3">{t.projectBuilder.title}</h1>
        <p className="text-slate-500 text-lg">{t.projectBuilder.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option, idx) => {
          const Icon = option.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(option.path)}
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Icon size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{option.title}</h3>
              <p className="text-slate-500 leading-relaxed">{option.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
