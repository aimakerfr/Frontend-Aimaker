
import React from 'react';
import { PromptState } from '../types';
import { translations, languageMap } from '../translations';

interface FooterProps {
  state: PromptState;
  onUpdate: (updates: Partial<PromptState>) => void;
  onSave: () => void;
}

const Footer: React.FC<FooterProps> = ({ state, onUpdate, onSave }) => {
  const langCode = languageMap[state.language] || 'es';
  const t = translations[langCode];

  return (
    <div className="space-y-10">
      {/* Context and Output Format Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t.contextLabel}
          </label>
          <textarea
            value={state.context}
            onChange={(e) => onUpdate({ context: e.target.value })}
            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={t.contextPlaceholder}
          ></textarea>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t.outputLabel}
          </label>
          <textarea
            value={state.outputFormat}
            onChange={(e) => onUpdate({ outputFormat: e.target.value })}
            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 bg-white"
            placeholder={t.outputPlaceholder}
          ></textarea>
        </div>
      </div>

      {/* Stylized Footer Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {t.configFooterLabel}
        </span>
        <button
          onClick={onSave}
          className="bg-[#3b82f6] hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] text-sm"
        >
          {t.saveButton}
        </button>
      </div>
    </div>
  );
};

export default Footer;
