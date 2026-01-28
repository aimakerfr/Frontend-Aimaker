
import React, { useState } from 'react';
import { PromptState, Visibility, ProjectType, DEFAULT_LANGUAGE } from './types';
import { translations } from './translations';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [state, setState] = useState<PromptState>({
    title: 'Nueva Estrategia de Marketing',
    description: 'Generación de copys para redes sociales enfocado',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: DEFAULT_LANGUAGE,
    projectType: 'landing page',
    deploymentUrl: 'https://mi-proyecto.vercel.app',
    context: 'Orientado a una marca de café artesanal.'
  });

  const t = translations[state.language] || translations['Español'];

  const handleUpdate = (updates: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const onSave = () => {
    console.log('Guardando Proyecto:', state);
    alert(t.alert_save);
  };

  return (
    <div className="flex justify-center p-4 md:p-12">
      <div className="w-full max-w-6xl">
        {/* Page Title Section */}
        <div className="flex items-center gap-5 mb-10">
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div className="bg-[#3b82f6] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fa-solid fa-diagram-project text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.app_title}</h1>
            <p className="text-slate-500 font-medium">{t.app_subtitle}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 space-y-10 shadow-sm">
          <Header state={state} onUpdate={handleUpdate} />
          <Body state={state} onUpdate={handleUpdate} />
          <Footer state={state} onUpdate={handleUpdate} onSave={onSave} />
        </div>
      </div>
    </div>
  );
};

export default App;
