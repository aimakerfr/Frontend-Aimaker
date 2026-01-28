
import React from 'react';
import { PromptState } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
}

const Header: React.FC<HeaderProps> = ({ state, onUpdate }) => {
  const t = translations[state.language] || translations['Español'];
  const labelStyle = "text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-0.5";
  const fieldBase = "h-[40px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-200 transition-all text-[13px] text-slate-600 bg-white px-3.5 flex items-center shadow-sm hover:shadow-md transition-shadow";

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex items-end">
        <div className="flex-1">
          <label className={labelStyle}>{t.label_description}</label>
          <input
            type="text"
            value={state.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className={`${fieldBase} w-full`}
            placeholder={t.placeholder_description}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
