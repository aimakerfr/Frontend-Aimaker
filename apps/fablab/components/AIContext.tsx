import React, { useState } from 'react';
import { AIContextConfig } from '../types';
import { Sliders, HelpCircle, Save } from 'lucide-react';

const AIContext: React.FC = () => {
  const [config, setConfig] = useState<AIContextConfig>({
    tone: 'professional',
    responseLength: 'balanced',
    expertiseLevel: 'intermediate',
    citeSources: true,
    autoSummary: false
  });

  const handleChange = (key: keyof AIContextConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Sliders className="text-indigo-600 dark:text-indigo-400" />
          AI Context Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Define how your AI behaves by default. These settings apply to all your FabLabs unless overridden.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 space-y-6">
          
          {/* Tone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Response Tone</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['professional', 'creative', 'educational', 'technical'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleChange('tone', t)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                    config.tone === t
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 ring-2 ring-brand-500/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Response Length */}
          <div>
             <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Response Length</label>
             <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
               {['short', 'balanced', 'detailed'].map((len) => (
                 <button
                  key={len}
                  onClick={() => handleChange('responseLength', len)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                    config.responseLength === len
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                 >
                   {len}
                 </button>
               ))}
             </div>
          </div>

           <hr className="border-gray-100 dark:border-gray-700" />

          {/* Expertise Level */}
          <div>
             <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Target Expertise Level</label>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { id: 'beginner', label: 'Beginner', desc: 'Simple concepts, no jargon' },
                 { id: 'intermediate', label: 'Intermediate', desc: 'Standard professional terms' },
                 { id: 'expert', label: 'Expert', desc: 'Deep technical details' }
               ].map((level) => (
                 <div 
                  key={level.id}
                  onClick={() => handleChange('expertiseLevel', level.id)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all ${
                    config.expertiseLevel === level.id
                     ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500'
                     : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                 >
                   <div className="font-medium text-gray-900 dark:text-white">{level.label}</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.desc}</div>
                 </div>
               ))}
             </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Cite Sources</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Include references in answers</div>
              </div>
              <button
                onClick={() => handleChange('citeSources', !config.citeSources)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  config.citeSources ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  config.citeSources ? 'left-7' : 'left-1'
                }`}></div>
              </button>
            </div>

             <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Auto-Summary</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add TL;DR to long responses</div>
              </div>
              <button
                onClick={() => handleChange('autoSummary', !config.autoSummary)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  config.autoSummary ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  config.autoSummary ? 'left-7' : 'left-1'
                }`}></div>
              </button>
            </div>
          </div>

        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIContext;
