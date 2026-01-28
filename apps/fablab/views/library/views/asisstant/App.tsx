
import React, { useState } from 'react';
import { PromptState, Visibility } from './types';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';
import PublishModal from './components/PublishModal';
import { translations } from './translations';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, setState] = useState<PromptState>({
    title: 'Nueva Estrategia de Marketing',
    description: 'Generación de copys para redes sociales enfocado',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: 'Español',
    instruction: 'Actúa como un experto en marketing digital...',
    context: 'Orientado a una marca de café artesanal.'
  });

  const t = translations[state.language] || translations['Español'];

  const handleUpdate = (updates: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handlePublish = () => {
    setIsModalOpen(true);
  };

  const handleSave = () => {
    console.log('Asistente guardado:', state);
    alert(state.language === 'Español' ? '¡Asistente guardado con éxito!' : state.language === 'English' ? 'Assistant saved successfully!' : 'Assistant enregistré avec succès !');
  };

  const confirmPublish = () => {
    handleUpdate({ visibility: Visibility.PUBLIC });
    setIsModalOpen(false);
    alert(t.alert_success);
  };

  return (
    <div className="flex justify-center p-4 md:p-12">
      <div className="w-full max-w-6xl">
        {/* Page Title Section from Image */}
        <div className="flex items-center gap-5 mb-10">
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div className="bg-[#3b82f6] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fa-solid fa-file-lines text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.config_assistant}</h1>
            <p className="text-slate-500 font-medium">{t.manage_details}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 space-y-10 shadow-sm">
          <Header state={state} onUpdate={handleUpdate} onPublishClick={handlePublish} t={t} />
          <Body state={state} onUpdate={handleUpdate} t={t} />
          <Footer state={state} onUpdate={handleUpdate} t={t} onSave={handleSave} />
        </div>
      </div>

      <PublishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={confirmPublish} 
        t={t}
      />
    </div>
  );
};

export default App;
