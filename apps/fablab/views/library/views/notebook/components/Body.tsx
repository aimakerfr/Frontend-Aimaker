
import React from 'react';
import { PromptState, ProjectType } from '../types';
import { translations } from '../translations';

interface BodyProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
}

const Body: React.FC<BodyProps> = ({ state, onUpdate }) => {
  const t = translations[state.language] || translations['Español'];

  const types: { id: ProjectType; label: string; icon: string }[] = [
    { id: 'landing page', label: t.type_landing, icon: 'fa-window-maximize' },
    { id: 'app', label: t.type_app, icon: 'fa-mobile-screen-button' },
    { id: 'automation', label: t.type_automation, icon: 'fa-gears' }
  ];

  const labelStyle = "text-[11px] font-bold text-slate-400 uppercase tracking-widest";
  const inputStyle = "w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b5dfa]/10 focus:border-[#5b5dfa] transition-all text-[15px] text-slate-700 placeholder:text-slate-300 bg-white shadow-sm";

  return (
    <div className="pt-10 border-t border-slate-100 space-y-12">
      {/* Project Type Selection */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <label className={labelStyle}>{t.label_project_type}</label>
          <i className="fa-solid fa-pen-nib text-slate-300"></i>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => onUpdate({ projectType: type.id })}
              className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all group ${
                state.projectType === type.id
                  ? 'bg-[#f5f5ff] border-[#5b5dfa] text-[#5b5dfa] shadow-lg shadow-indigo-50'
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                state.projectType === type.id ? 'bg-[#5b5dfa] text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-white'
              }`}>
                <i className={`fa-solid ${type.icon} text-2xl`}></i>
              </div>
              <span className="font-black text-[12px] tracking-[0.1em] uppercase text-center">{type.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Deployment URL Field */}
      <section className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <label className={labelStyle}>{t.label_deployment_url}</label>
          <i className="fa-solid fa-link text-slate-300 text-xs"></i>
        </div>
        <div className="relative">
          <input
            type="url"
            value={state.deploymentUrl}
            onChange={(e) => onUpdate({ deploymentUrl: e.target.value })}
            className={inputStyle}
            placeholder="https://tu-url-de-despliegue.com"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
            <i className="fa-solid fa-globe text-xs"></i>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Body;
