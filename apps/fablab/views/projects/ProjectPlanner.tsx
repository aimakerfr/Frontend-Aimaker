
import React, { useState, useEffect } from 'react';
import { Phase, ProjectState, Language } from './types';
import { StepIndicator } from './components/StepIndicator';
import { dashboardAIService } from '@core/ai/dashboard.service';
import { translations } from './translations';
import { useLanguage } from '../../i18n/useLanguage';

const createInitialState = (): ProjectState => ({
  objective: { title: '', goal: '', type: '' },
  research: [],
  notebook: { source1: '', source2: '', source3: '', source4: '', synthesis: '' },
  design: { role: '', experience: '', communication: '', process: ['', '', '', ''] },
  optimizedPrompt: ''
});

const App: React.FC = () => {
  const { language } = useLanguage();
  const lang = language as Language;
  
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = localStorage.getItem('ai_architect_phase');
    return saved ? parseInt(saved, 10) : Phase.PRINCIPLE;
  });

  const [state, setState] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('ai_architect_state');
    return saved ? JSON.parse(saved) : createInitialState();
  });

  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('ai_architect_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('ai_architect_phase', phase.toString());
  }, [phase]);

  const next = () => {
    const nextPhase = Math.min(phase + 1, Phase.PHASE_6);
    setPhase(nextPhase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => {
    const prevPhase = Math.max(phase - 1, Phase.PRINCIPLE);
    setPhase(prevPhase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToPhase = (p: Phase) => {
    setPhase(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateObjective = (field: keyof ProjectState['objective'], value: string) => {
    setState(s => ({ ...s, objective: { ...s.objective, [field]: value } }));
  };

  const updateDesignProcess = (index: number, value: string) => {
    const newProcess = [...state.design.process];
    newProcess[index] = value;
    setState(s => ({ ...s, design: { ...s.design, process: newProcess } }));
  };

  const handleOptimize = async () => {
    const raw = `Act as ${state.design.role} (${state.design.experience}). Goal: ${state.objective.goal}. Context: ${state.notebook.synthesis}. Steps: ${state.design.process.join(', ')}. Target Output Language: ${lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'French'}.`;
    setLoading(true);
    try {
      const result = await dashboardAIService.optimizePrompt(raw);
      setState(s => ({ ...s, optimizedPrompt: result.optimized }));
      next();
    } catch (err) {
      alert("Error optimizing prompt. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t.common.copySuccess);
  };

  const handleReset = () => {
    if (window.confirm(t.common.resetConfirm)) {
      // 1. Clear LocalStorage first to avoid sync issues
      localStorage.removeItem('ai_architect_state');
      localStorage.removeItem('ai_architect_phase');
      
      // 2. Reset state variables
      setState(createInitialState());
      setPhase(Phase.PRINCIPLE);
      
      // 3. UI feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 pb-20 pt-10 px-4 max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="text-gray-600 dark:text-slate-400 text-lg">{t.subtitle}</p>
      </header>

      <StepIndicator currentPhase={phase} labels={t.phases} onStepClick={jumpToPhase} />

      <main>
        {phase === Phase.PRINCIPLE && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-500">🧠</span> {t.principle.title}
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 italic text-gray-700 dark:text-slate-300 mb-6">
              "{t.principle.quote}"
            </div>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-8">
              {t.principle.desc}
            </p>
            <button onClick={next} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg">
              {t.principle.btn}
            </button>
          </div>
        )}

        {phase === Phase.PHASE_0 && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.phase0.title}</h2>
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-4 py-2 rounded-lg font-bold">{t.phase0.rule}</span>
            </div>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-8">{t.phase0.desc}</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Título del Proyecto</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={state.objective.title}
                  onChange={(e) => updateObjective('title', e.target.value)}
                  placeholder="Ej: Asistente de Atención al Cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Objetivo</label>
                <textarea 
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={state.objective.goal}
                  onChange={(e) => updateObjective('goal', e.target.value)}
                  placeholder="Describe el objetivo principal de tu proyecto..."
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                <select
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={state.objective.type}
                  onChange={(e) => updateObjective('type', e.target.value as any)}
                >
                  <option value="">Selecciona un tipo...</option>
                  <option value="assistant">Asistente</option>
                  <option value="web-app">Aplicación Web</option>
                  <option value="landing-page">Landing Page</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button onClick={prev} className="flex-1 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">{t.common.back}</button>
              <button onClick={next} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors">{t.common.next}</button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase1.title}</h2>
            <div className="flex items-center gap-2 text-blue-400">
              <span className="font-bold">{t.phase1.tool}</span> 
              <a href="https://perplexity.ai" target="_blank" className="underline hover:text-blue-300">Perplexity.ai</a>
            </div>
            <p className="text-slate-400">{t.phase1.desc}</p>
            
            <div className="grid gap-4">
              {t.phase1.questions.map((qTemplate: string, i: number) => {
                const q = qTemplate
                  .replace('{serves}', state.objective.title || '...')
                  .replace('{result}', state.objective.goal || '...');
                  
                return (
                  <div key={i} className="group relative bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-sm italic text-slate-300">"{q}"</span>
                    <button 
                      onClick={() => copyToClipboard(q)}
                      className="ml-4 p-2 bg-slate-700 group-hover:bg-blue-600 rounded-lg transition-colors"
                      title="Copy Prompt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="bg-yellow-900/10 border border-yellow-700/50 p-4 rounded-xl">
              <h3 className="text-yellow-500 font-bold mb-2 text-sm">📌 {t.phase1.ruleTitle}</h3>
              <p className="text-xs text-slate-400">{t.phase1.ruleDesc}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 border border-slate-700 py-3 rounded-xl font-bold">{t.common.back}</button>
              <button onClick={next} className="flex-[2] bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">{t.common.next}</button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase2.title}</h2>
            <div className="flex items-center gap-2 text-indigo-400">
              <span className="font-bold">{t.phase1.tool}</span> 
              <a href="https://notebooklm.google.com" target="_blank" className="underline hover:text-indigo-300">Google NotebookLM</a>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                <h3 className="font-bold text-indigo-300 mb-2">{t.phase2.desc}</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <h4 className="text-blue-400 font-bold text-xs uppercase mb-2">{t.phase2.s1}</h4>
                  <p className="text-xs text-slate-500">{t.phase2.s1Desc}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <h4 className="text-green-400 font-bold text-xs uppercase mb-2">{t.phase2.s2}</h4>
                  <p className="text-xs text-slate-500">{t.phase2.s2Desc}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <h4 className="text-red-400 font-bold text-xs uppercase mb-2">{t.phase2.s3}</h4>
                  <p className="text-xs text-slate-500">{t.phase2.s3Desc}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <h4 className="text-purple-400 font-bold text-xs uppercase mb-2">{t.phase2.s4}</h4>
                  <p className="text-xs text-slate-500">{t.phase2.s4Desc}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="font-bold">{t.phase2.synth}</h3>
                <p className="text-xs text-slate-400 italic">{t.phase2.synthDesc}</p>
                <textarea 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 h-32 text-sm"
                  value={state.notebook.synthesis}
                  onChange={(e) => setState(s => ({ ...s, notebook: { ...s.notebook, synthesis: e.target.value } }))}
                  placeholder={t.phase2.synthPlaceholder}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 border border-slate-700 py-3 rounded-xl font-bold">{t.common.back}</button>
              <button onClick={next} className="flex-[2] bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">{t.common.next}</button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase3.title}</h2>
            <p className="text-slate-400">{t.phase3.desc}</p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.phase3.role}</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm"
                    value={state.design.role}
                    onChange={(e) => setState(s => ({ ...s, design: { ...s.design, role: e.target.value } }))}
                    placeholder="Expert Data Analyst"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.phase3.exp}</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm"
                    value={state.design.experience}
                    onChange={(e) => setState(s => ({ ...s, design: { ...s.design, experience: e.target.value } }))}
                    placeholder="10+ years"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.phase3.style}</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm"
                    value={state.design.communication}
                    onChange={(e) => setState(s => ({ ...s, design: { ...s.design, communication: e.target.value } }))}
                    placeholder="Clear & Professional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.phase3.process}</label>
                <div className="space-y-3">
                  {state.design.process.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-slate-600 font-bold">{idx + 1}.</span>
                      <input 
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm"
                        value={step}
                        onChange={(e) => updateDesignProcess(idx, e.target.value)}
                        placeholder={t.phase3.stepPlaceholder.replace('{n}', (idx + 1).toString())}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 border border-slate-700 py-3 rounded-xl font-bold">{t.common.back}</button>
              <button 
                onClick={handleOptimize} 
                disabled={loading}
                className="flex-[2] bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {loading ? t.common.loading : t.phase3.optimizeBtn}
              </button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase4.title}</h2>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.phase4.master}</h3>
              <div className="bg-slate-900 p-4 rounded-lg text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {state.optimizedPrompt}
              </div>
              <button 
                onClick={() => copyToClipboard(state.optimizedPrompt)}
                className="mt-4 w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                {t.phase4.copy}
              </button>
            </div>

            <div className="bg-blue-900/10 border border-blue-700/50 p-4 rounded-xl text-sm">
              <h4 className="font-bold text-blue-400 mb-1">{t.phase4.improved}</h4>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                {t.phase4.improvements.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 border border-slate-700 py-3 rounded-xl font-bold">{t.common.back}</button>
              <button onClick={next} className="flex-[2] bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">{t.common.next}</button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase5.title}</h2>
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="font-bold">{t.phase1.tool}</span> 
              <a href="https://aistudio.google.com" target="_blank" className="underline hover:text-cyan-300">Google AI Studio</a>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.phase5.settings}</h4>
                <ul className="text-sm space-y-2 text-slate-300">
                  <li className="flex justify-between"><span>Model:</span> <span className="text-white">Gemini 3 Flash</span></li>
                  <li className="flex justify-between"><span>Temperature:</span> <span className="text-white">0.3</span></li>
                  <li className="flex justify-between"><span>Top-P:</span> <span className="text-white">Default</span></li>
                  <li className="flex justify-between"><span>Safety:</span> <span className="text-white">Default</span></li>
                </ul>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.phase5.structure}</h4>
                <p className="text-xs text-slate-400">{t.phase5.structureDesc}</p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl text-center">
              <h3 className="text-xl font-bold mb-4">🚀 {t.phase5.launchTitle}</h3>
              <p className="text-slate-400 text-sm mb-6">{t.phase5.launchDesc}</p>
              <button 
                onClick={() => window.open('https://aistudio.google.com', '_blank')}
                className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors"
              >
                {t.phase5.openBtn}
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={prev} className="flex-1 border border-slate-700 py-3 rounded-xl font-bold">{t.common.back}</button>
              <button onClick={next} className="flex-[2] bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">{t.common.nextReview}</button>
            </div>
          </div>
        )}

        {phase === Phase.PHASE_6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t.phase6.title}</h2>
            <p className="text-slate-400">{t.phase6.desc}</p>

            <div className="grid gap-4">
              <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-green-400 mb-2">{t.phase6.checklistTitle}</h4>
                <ul className="text-sm text-slate-300 space-y-2">
                  {t.phase6.checkItems.map((item: string, i: number) => <li key={i} className="flex gap-2"><span>✅</span> {item}</li>)}
                </ul>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.phase6.refinementTitle}</h4>
                <div className="space-y-2">
                  <div className="bg-slate-900 p-2 rounded text-xs text-blue-300 font-mono">"Always include a summary table at the end."</div>
                  <div className="bg-slate-900 p-2 rounded text-xs text-blue-300 font-mono">"Avoid using technical jargon if not requested."</div>
                  <div className="bg-slate-900 p-2 rounded text-xs text-blue-300 font-mono">"If data is missing, ask the user before continuing."</div>
                </div>
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-block p-4 rounded-full bg-blue-500/10 text-blue-500 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.phase6.masteryTitle}</h3>
              <p className="text-slate-400 mb-6">{t.phase6.masteryDesc}</p>
              <button 
                type="button"
                onClick={handleReset}
                className="text-slate-500 hover:text-white text-sm underline cursor-pointer focus:outline-none"
              >
                {t.phase6.newProject}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} {t.title} • Built for the Future</p>
      </footer>
    </div>
  );
};

export default App;
