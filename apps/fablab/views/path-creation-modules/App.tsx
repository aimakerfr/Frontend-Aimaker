import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppState, ModuleData, ModuleType, WizardStep, ExportFormat, Template } from './types';
import { ModuleEditor } from './components/ModuleEditor';
import { Button } from './components/Button';
import { StepWizard } from './components/StepWizard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { PreviewModal } from './components/PreviewModal';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { exportProject } from './utils/exportUtils';
import { getMakerPath, updateMakerPath } from '@core/maker-path';
import { Download, LayoutTemplate, ArrowRight, ArrowLeft, Sparkles, Eye, ChevronLeft, Save, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../language/useLanguage';
import { translations } from '../../language/translations';

const initialModuleState = (id: string, name: string): ModuleData => ({
  id,
  name,
  html: '',
  css: '',
  useTailwind: false,
});

export default function App() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [activeTab, setActiveTab] = useState<ModuleType | null>('header');
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [makerPathTitle, setMakerPathTitle] = useState('');
  const [isEditMode, setIsEditMode] = useState(false); // Track if in edit mode (vs view mode)
  const [pathStatus, setPathStatus] = useState<string>(''); // Track path status
  
  const [appState, setAppState] = useState<AppState>({
    header: initialModuleState('mod-header', 'Header'),
    body: initialModuleState('mod-body', 'Body Content'),
    footer: initialModuleState('mod-footer', 'Footer'),
  });

  // --- LOAD DATA FROM MAKER PATH ---
  useEffect(() => {
    if (!id) return;
    
    const loadMakerPath = async () => {
      try {
        const makerPath = await getMakerPath(parseInt(id));
        setMakerPathTitle(makerPath.title || '');
        setPathStatus(makerPath.status || '');
        
        console.log('🔍 Loading maker path:', { 
          status: makerPath.status, 
          hasData: !!makerPath.data,
          dataType: typeof makerPath.data 
        });
        
        // Load saved data from maker_path.data field
        if (makerPath.data) {
          try {
            const savedData = typeof makerPath.data === 'string' 
              ? JSON.parse(makerPath.data) 
              : makerPath.data;
            
            console.log('📦 Parsed saved data:', savedData);
            
            // Load modules if they exist
            if (savedData.modules) {
              console.log('📋 Loading modules into appState:', {
                header: savedData.modules.header?.html?.length || 0,
                body: savedData.modules.body?.html?.length || 0,
                footer: savedData.modules.footer?.html?.length || 0
              });
              setAppState(savedData.modules);
              
              // Verify after setting
              setTimeout(() => {
                console.log('✅ AppState after loading:', {
                  header: savedData.modules.header?.html?.length || 0,
                  body: savedData.modules.body?.html?.length || 0,
                  footer: savedData.modules.footer?.html?.length || 0
                });
              }, 100);
            } else {
              console.warn('⚠️ No modules found in saved data');
            }
            
            // Set active tab
            if (savedData.activeTab) {
              setActiveTab(savedData.activeTab);
            }
          } catch (e) {
            console.error('Error parsing saved data:', e);
          }
        }
        
        // Determine mode and step based on status
        if (makerPath.status === 'completed') {
          // Path is completed - show in VIEW MODE on EXPORT phase
          setIsEditMode(false);
          setCurrentStep('export');
          console.log('✅ Path completed - VIEW MODE on EXPORT phase');
        } else {
          // Path not completed yet - EDIT MODE
          setIsEditMode(true);
          console.log('🔧 Path in progress - EDIT MODE enabled');
        }
      } catch (error) {
        console.error('Error loading maker path:', error);
      }
    };
    
    loadMakerPath();
  }, [id]);

  // --- PROTECCIÓN: Evitar que en modo vista se acceda a fase 'select' ---
  useEffect(() => {
    if (!isEditMode && currentStep === 'select') {
      console.warn('⚠️ Blocked access to SELECT phase in VIEW mode. Redirecting to EXPORT.');
      setCurrentStep('export');
    }
  }, [isEditMode, currentStep]);

  // --- NO AUTO-SAVE - Only save on "Guardar y Finalizar" button ---

  // --- ORCHESTRATOR LOGIC ---
  // Listens for 'anchor-click' messages from any iframe and broadcasts 'scroll-to' to all iframes.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'anchor-click') {
        const hash = event.data.hash;
        
        // Find all iframes in the document
        const iframes = document.querySelectorAll('iframe');
        
        // Broadcast the scroll command to all modules (Header, Body, Footer)
        iframes.forEach((iframe) => {
          iframe.contentWindow?.postMessage({ type: 'scroll-to', hash }, '*');
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateModule = (type: ModuleType, data: Partial<ModuleData>) => {
    console.log(`🔄 Updating ${type} module:`, {
      htmlLength: data.html?.length || 'unchanged',
      cssLength: data.css?.length || 'unchanged'
    });
    setAppState(prev => ({
      ...prev,
      [type]: { ...prev[type], ...data }
    }));
  };

  const handleTemplateSelect = (template: Template) => {
    updateModule(template.type, {
      html: template.html,
      css: template.css,
      useTailwind: template.useTailwind,
    });
    // Auto advance to edit step
    setCurrentStep('edit');
    setActiveTab(template.type);
  };

  const handleSaveCustomTemplate = (templateData: Omit<Template, 'id'>) => {
    const newTemplate: Template = {
      ...templateData,
      id: `custom-${Date.now()}`,
    };
    setCustomTemplates(prev => [...prev, newTemplate]);
  };

  const handleFinalize = async () => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      const dataToSave = {
        modules: appState,
        currentStep: 'export',
        activeTab,
        completedAt: new Date().toISOString()
      };
      
      console.log('💾 Saving data:', {
        headerHtml: appState.header.html.length,
        bodyHtml: appState.body.html.length,
        footerHtml: appState.footer.html.length
      });
      console.log('Full appState:', appState);
      
      await updateMakerPath(parseInt(id), {
        data: JSON.stringify(dataToSave),
        status: 'completed'
      });
      
      alert('✅ Ruta guardada y finalizada exitosamente');
      // Navigate back to maker path list
      navigate('/dashboard/maker-path');
    } catch (error) {
      console.error('Error finalizing:', error);
      alert('❌ Error al finalizar la ruta. Por favor intente de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard/maker-path');
  };

  const handleExport = (format: ExportFormat) => {
    exportProject(appState, format);
  };

  const canProceedToEdit = () => {
    // Check if at least one module has content
    return appState.header.html || appState.body.html || appState.footer.html;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100">
      
      {/* Header with Back Button and Edit/Save Button */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
          <span>{t.moduleCreator.backToMakerPath}</span>
        </button>
        
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">
            {makerPathTitle || t.moduleCreator.title}
          </h1>
          {pathStatus === 'completed' && !isEditMode && (
            <span className="px-3 py-1 text-xs font-medium bg-green-900/50 text-green-300 rounded-full border border-green-500/50">
              ✓ {t.moduleCreator.completed}
            </span>
          )}
          {isSaving && (
            <span className="flex items-center gap-2 text-sm text-blue-400">
              <Save size={16} className="animate-pulse" />
              {t.moduleCreator.saving}
            </span>
          )}
        </div>
        
        {/* Show Edit button if in VIEW mode, or Finalizar button if in EDIT mode */}
        {pathStatus === 'completed' && !isEditMode ? (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Save size={20} />
            {t.moduleCreator.editModify}
          </button>
        ) : (
          <button
            onClick={handleFinalize}
            disabled={isSaving || currentStep !== 'export'}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            title={currentStep !== 'export' ? t.moduleCreator.finalizeDisabledTooltip : t.moduleCreator.saveAndFinalize}
          >
            <CheckCircle size={20} />
            {t.moduleCreator.saveAndFinalize}
          </button>
        )}
      </div>
      
      {/* Wizard Navigation */}
      <StepWizard 
        currentStep={currentStep} 
        onStepChange={setCurrentStep}
        disabled={!isEditMode}
      />

      {/* Preview Modal */}
      <PreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)}
        appState={appState}
      />

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        onSave={handleSaveCustomTemplate}
      />

      {/* Main Content Area - Full Width */}
      <div className="flex-1 overflow-hidden">
        
        {/* FULL WIDTH CONTENT */}
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-800">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutTemplate className="text-blue-500 w-5 h-5" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                      Module Orchestrator
                    </h1>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {currentStep === 'select' && t.moduleCreator.steps.selectDescription}
                    {currentStep === 'edit' && t.moduleCreator.steps.editDescription}
                    {currentStep === 'export' && t.moduleCreator.steps.exportDescription}
                  </p>
                </div>
                
                {/* Preview Button - Visible in edit and export steps */}
                {(currentStep === 'edit' || currentStep === 'export') && (
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    {t.moduleCreator.navigation.viewPreview}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
            <div className="max-w-7xl mx-auto p-4">
            
              {/* STEP 1: SELECT TEMPLATES - Only visible in EDIT mode */}
              {currentStep === 'select' && isEditMode && (
                <div className="space-y-6">
                  <TemplateLibrary 
                    onSelectTemplate={handleTemplateSelect}
                    onCreateNew={() => setShowCreateTemplate(true)}
                    customTemplates={customTemplates}
                  />
                  
                  <div className="max-w-2xl mx-auto mt-6">
                    <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-base font-semibold mb-1 text-white">
                            {t.moduleCreator.phases.select.startFromScratch.title}
                          </h3>
                          <p className="text-slate-300 text-xs mb-3">
                            {t.moduleCreator.phases.select.startFromScratch.description}
                          </p>
                          <Button 
                            onClick={() => setCurrentStep('edit')} 
                            variant="primary"
                            fullWidth
                            className="h-10 text-sm"
                          >
                            {t.moduleCreator.phases.select.startFromScratch.button}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EDIT MODULES - PROFESSIONAL LAYOUT */}
              {currentStep === 'edit' && (
                <div className="h-full flex gap-6">
                  {/* Left Sidebar - Module Navigation */}
                  <div className="w-72 flex-shrink-0 space-y-3">
                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-white font-semibold text-sm mb-1">{t.moduleCreator.phases.edit.moduleInfo.title}</h3>
                          <p className="text-blue-200 text-xs leading-relaxed">
                            {t.moduleCreator.phases.edit.moduleInfo.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module Cards */}
                    <div className="space-y-2">
                      {/* Header Module */}
                      <button
                        onClick={() => setActiveTab('header')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          activeTab === 'header'
                            ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activeTab === 'header' ? 'bg-purple-700' : 'bg-slate-700'
                          }`}>
                            <span className="text-2xl">🔝</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{t.moduleCreator.phases.edit.modules.header}</h3>
                            <p className="text-xs text-slate-300">
                              {appState.header.html ? `${appState.header.html.length} caracteres` : 'Vacío'}
                            </p>
                          </div>
                          {activeTab === 'header' && (
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          )}
                        </div>
                      </button>

                      {/* Body Module */}
                      <button
                        onClick={() => setActiveTab('body')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          activeTab === 'body'
                            ? 'bg-green-600 border-green-400 shadow-lg shadow-green-500/30'
                            : 'bg-slate-800 border-slate-700 hover:border-green-500 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activeTab === 'body' ? 'bg-green-700' : 'bg-slate-700'
                          }`}>
                            <span className="text-2xl">📄</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{t.moduleCreator.phases.edit.modules.body}</h3>
                            <p className="text-xs text-slate-300">
                              {appState.body.html ? `${appState.body.html.length} caracteres` : 'Vacío'}
                            </p>
                          </div>
                          {activeTab === 'body' && (
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          )}
                        </div>
                      </button>

                      {/* Footer Module */}
                      <button
                        onClick={() => setActiveTab('footer')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          activeTab === 'footer'
                            ? 'bg-orange-600 border-orange-400 shadow-lg shadow-orange-500/30'
                            : 'bg-slate-800 border-slate-700 hover:border-orange-500 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activeTab === 'footer' ? 'bg-orange-700' : 'bg-slate-700'
                          }`}>
                            <span className="text-2xl">🔻</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{t.moduleCreator.phases.edit.modules.footer}</h3>
                            <p className="text-xs text-slate-300">
                              {appState.footer.html ? `${appState.footer.html.length} caracteres` : 'Vacío'}
                            </p>
                          </div>
                          {activeTab === 'footer' && (
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3">Acciones Rápidas</h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => setShowPreview(true)}
                          variant="primary"
                          fullWidth
                          className="justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Content - Module Editor */}
                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {activeTab === 'header' && (
                      <ModuleEditor 
                        moduleData={appState.header}
                        onChange={(d) => updateModule('header', d)}
                        isActive={true}
                        onToggle={() => {}}
                        readOnly={!isEditMode}
                      />
                    )}
                    {activeTab === 'body' && (
                      <ModuleEditor 
                        moduleData={appState.body}
                        onChange={(d) => updateModule('body', d)}
                        isActive={true}
                        onToggle={() => {}}
                        readOnly={!isEditMode}
                      />
                    )}
                    {activeTab === 'footer' && (
                      <ModuleEditor 
                        moduleData={appState.footer}
                        onChange={(d) => updateModule('footer', d)}
                        isActive={true}
                        onToggle={() => {}}
                        readOnly={!isEditMode}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: EXPORT OPTIONS */}
              {currentStep === 'export' && (
                <div className="max-w-4xl mx-auto">
                  
                  {/* View Mode Banner */}
                  {!isEditMode && (
                    <div className="mb-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-500/50 rounded-xl p-5 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-2">{t.moduleCreator.viewMode.banner.title}</h3>
                          <p className="text-blue-200 text-sm mb-3">
                            {t.moduleCreator.viewMode.banner.description}
                          </p>
                          <p className="text-blue-100 text-sm font-medium">
                            {t.moduleCreator.viewMode.banner.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-8 text-center">
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
                      {t.moduleCreator.phases.export.title}
                    </h2>
                    <p className="text-slate-400 text-lg">
                      {t.moduleCreator.phases.export.subtitle}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Complete HTML with CSS */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-blue-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">{t.moduleCreator.phases.export.formats.combined.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        {t.moduleCreator.phases.export.formats.combined.description}
                      </p>
                      <Button 
                        onClick={() => handleExport('combined')}
                        variant="primary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {t.moduleCreator.phases.export.formats.combined.button}
                      </Button>
                    </div>

                    {/* HTML Only */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-purple-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">{t.moduleCreator.phases.export.formats.htmlOnly.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        {t.moduleCreator.phases.export.formats.htmlOnly.description}
                      </p>
                      <Button 
                        onClick={() => handleExport('html-only')}
                        variant="secondary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {t.moduleCreator.phases.export.formats.htmlOnly.button}
                      </Button>
                    </div>

                    {/* CSS Only */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-pink-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">{t.moduleCreator.phases.export.formats.cssOnly.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        {t.moduleCreator.phases.export.formats.cssOnly.description}
                      </p>
                      <Button 
                        onClick={() => handleExport('css-only')}
                        variant="secondary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {t.moduleCreator.phases.export.formats.cssOnly.button}
                      </Button>
                    </div>

                    {/* HTML with Tailwind */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-cyan-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-2">
                        {t.moduleCreator.phases.export.formats.htmlTailwind.title}
                        <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">{t.moduleCreator.phases.export.formats.htmlTailwind.badge}</span>
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">
                        {t.moduleCreator.phases.export.formats.htmlTailwind.description}
                      </p>
                      <Button 
                        onClick={() => handleExport('html-tailwind')}
                        variant="primary"
                        fullWidth
                        className="bg-cyan-600 hover:bg-cyan-700 h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {t.moduleCreator.phases.export.formats.htmlTailwind.button}
                      </Button>
                    </div>
                  </div>

                  {/* View Modules Section - Only in View Mode */}
                  {!isEditMode && (
                    <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <h3 className="text-white font-semibold text-lg mb-3">{t.moduleCreator.viewMode.viewModulesSection.title}</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        {t.moduleCreator.viewMode.viewModulesSection.description}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300">
                      {t.moduleCreator.phases.export.tip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <div className="max-w-7xl mx-auto flex gap-3">
              {/* Botón Atrás: Solo visible en modo edición o si está en export (puede volver a edit) */}
              {currentStep !== 'select' && (isEditMode || currentStep === 'export') && (
                <Button 
                  onClick={() => {
                    const steps: WizardStep[] = ['select', 'edit', 'export'];
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex > 0) {
                      // En modo vista, no permitir ir a 'select' desde 'edit'
                      const previousStep = steps[currentIndex - 1];
                      if (!isEditMode && previousStep === 'select') {
                        return; // Bloquear navegación a select en modo vista
                      }
                      setCurrentStep(previousStep);
                    }
                  }}
                  variant="secondary"
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t.moduleCreator.navigation.back}
                </Button>
              )}
              
              {currentStep === 'select' && isEditMode && (
                <Button 
                  onClick={() => setCurrentStep('edit')}
                  variant="primary"
                  fullWidth
                  className="h-12"
                >
                  {t.moduleCreator.navigation.continueToEdit}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}

              {currentStep === 'edit' && (
                <>
                  <Button 
                    onClick={() => setShowPreview(true)}
                    variant="secondary"
                    className="flex-1 h-12"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    {t.moduleCreator.navigation.viewPreview}
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('export')}
                    variant="primary"
                    className="flex-1 h-12"
                    disabled={isEditMode && !canProceedToEdit()}
                  >
                    {t.moduleCreator.navigation.continueToExport}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}

              {/* No footer buttons in export phase - only Guardar y Finalizar in header */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}