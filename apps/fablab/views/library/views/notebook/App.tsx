
import React, { useState } from 'react';
import { PromptState, Visibility, DEFAULT_LANGUAGE } from './types';
import { translations } from './translations';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const App: React.FC = () => {
  const [state, setState] = useState<PromptState>({
    title: 'Nueva Estrategia de Marketing',
    description: 'Generación de copys para redes sociales enfc',
    visibility: Visibility.PRIVATE,
    category: 'Marketing',
    isFavorite: false,
    language: 'Español',
    projectType: 'landing page',
    deploymentUrl: '',
    context: ''
  });

  const t = translations[state.language] || translations['Español'];

  const handleUpdate = (updates: Partial<PromptState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden font-sans">
      {/* BARRA SUPERIOR GLOBAL */}
      <header className="shrink-0 bg-white z-20">
        <TopBar state={state} onUpdate={handleUpdate} />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (240px de ancho) */}
        <Sidebar state={state} />

        {/* Main Work Area */}
        <main className="flex-1 bg-[#fcfcfd] relative flex flex-col overflow-hidden border-l border-slate-50">
          
          {/* HEADER DE LA SECCIÓN DERECHA 
              Alineación: pl-0 para empezar justo en el borde de la sidebar (240px)
              Alineación: pr-10 para coincidir con el padding derecho de la TopBar
          */}
          <div className="pl-0 pr-10 py-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-sm shrink-0">
            <Header state={state} onUpdate={handleUpdate} />
          </div>

          <div className="flex-1 relative flex flex-col items-center justify-center overflow-y-auto p-8">
            {/* Central Illustration */}
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-700 pb-20">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <i className="fa-solid fa-wand-magic-sparkles text-5xl text-indigo-100/40"></i>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-200 tracking-tight">
                  {t.main_title}
                </h1>
                <p className="text-slate-300 font-medium text-[13px] leading-relaxed max-w-xs mx-auto opacity-50">
                  {t.main_subtitle}
                </p>
              </div>
            </div>

            {/* Chat / Prompt Input Area */}
            <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center">
              <div className="max-w-3xl w-full relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl shadow-indigo-100/30 -z-10"></div>
                <div className="flex items-center gap-4 bg-white border border-slate-100 p-1.5 pl-8 rounded-full shadow-sm hover:shadow-md transition-shadow group">
                  <input 
                    type="text" 
                    placeholder={t.chat_placeholder}
                    className="flex-1 bg-transparent py-3 text-[14px] text-slate-600 placeholder:text-slate-200 outline-none font-medium"
                  />
                  <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center group-hover:bg-[#5b5dfa] group-hover:text-white transition-all shadow-sm">
                    <i className="fa-solid fa-paper-plane text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
