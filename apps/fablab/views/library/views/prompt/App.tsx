
import React, { useState } from 'react';
import { PromptState, Visibility } from './types';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';
import PublishModal from './components/PublishModal';
import { translations, languageMap } from './translations';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, setState] = useState<PromptState>({
    title: 'Nueva Estrategia de Marketing',
    description: 'Generación de copys para redes sociales enfocados en conversión.',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: 'Español',
    promptBody: 'Actúa como un experto en copywriting con 10 años de experiencia...',
    context: 'Empresa de tecnología SaaS enfocada en B2B.',
    outputFormat: 'Lista de viñetas con 3 opciones variadas.'
  });

  const langCode = languageMap[state.language] || 'es';
  const t = translations[langCode];

  const handleUpdate = (updates: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleConfirmPublish = () => {
    handleUpdate({ visibility: Visibility.PUBLIC });
    setIsModalOpen(false);
    alert(t.successPublish);
  };

  const onSave = () => {
    console.log('Guardando prompt:', state);
    alert(t.successSave);
  };

  return (
    <div className="flex justify-center p-4 md:p-8 relative">
      <div className={`w-full max-w-5xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Main Interface Wrapper */}
        <div className="p-6 md:p-10 space-y-8">
          
          {/* Top Title Section */}
          <div className="flex items-center gap-4 mb-8">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
            <div className="bg-[#3b82f6] w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{t.configTitle}</h1>
              <p className="text-sm text-slate-500">{t.configSubtitle}</p>
            </div>
          </div>

          <Header state={state} onUpdate={handleUpdate} onOpenPublish={() => setIsModalOpen(true)} />
          
          <Body state={state} onUpdate={handleUpdate} />
          
          <Footer state={state} onUpdate={handleUpdate} onSave={onSave} />
        </div>
      </div>

      <PublishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmPublish} 
        language={state.language}
      />
    </div>
  );
};

export default App;
