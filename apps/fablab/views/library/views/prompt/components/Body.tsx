
import React from 'react';
import { PromptState } from '../types';
import { translations, languageMap } from '../translations';

interface BodyProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
}

const Body: React.FC<BodyProps> = ({ state, onUpdate }) => {
  const langCode = languageMap[state.language] || 'es';
  const t = translations[langCode];

  return (
    <div className="relative group">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t.promptBodyLabel}</label>
      <div className="relative">
        <textarea
          value={state.promptBody}
          onChange={(e) => onUpdate({ promptBody: e.target.value })}
          className="w-full h-80 px-6 py-6 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm leading-relaxed text-slate-700 bg-slate-50/30"
          placeholder={t.promptBodyPlaceholder}
        ></textarea>
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
             onClick={() => {
               navigator.clipboard.writeText(state.promptBody);
             }}
             className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all" 
             title="Copiar"
           >
             <i className="fa-regular fa-copy"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default Body;
