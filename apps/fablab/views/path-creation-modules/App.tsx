import { useEffect, useState } from 'react';
import { AppState, ModuleData, ModuleType, WizardStep, ExportFormat, Template } from './types';
import { ModuleEditor } from './components/ModuleEditor';
import { Button } from './components/Button';
import { StepWizard } from './components/StepWizard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { PreviewModal } from './components/PreviewModal';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { exportProject } from './utils/exportUtils';
import { Download, LayoutTemplate, ArrowRight, ArrowLeft, Sparkles, Eye } from 'lucide-react';

const initialModuleState = (id: string, name: string): ModuleData => ({
  id,
  name,
  html: '',
  css: '',
  useTailwind: false,
});

export default function App() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [activeTab, setActiveTab] = useState<ModuleType | null>('header');
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  
  const [appState, setAppState] = useState<AppState>({
    header: initialModuleState('mod-header', 'Header'),
    body: initialModuleState('mod-body', 'Body Content'),
    footer: initialModuleState('mod-footer', 'Footer'),
  });

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
    // Show success message
    alert('✅ Plantilla guardada exitosamente!');
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
      
      {/* Wizard Navigation */}
      <StepWizard currentStep={currentStep} onStepChange={setCurrentStep} />

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
                    {currentStep === 'select' && 'Selecciona plantillas predeterminadas o comienza desde cero'}
                    {currentStep === 'edit' && 'Personaliza el código HTML y CSS de tus módulos'}
                    {currentStep === 'export' && 'Exporta tu proyecto en el formato deseado'}
                  </p>
                </div>
                
                {/* Preview Button - Visible in edit step */}
                {currentStep === 'edit' && (
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Vista Previa
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
            <div className="max-w-7xl mx-auto p-4">
            
              {/* STEP 1: SELECT TEMPLATES */}
              {currentStep === 'select' && (
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
                            ¿Prefieres empezar desde cero?
                          </h3>
                          <p className="text-slate-300 text-xs mb-3">
                            Salta esta sección y crea tu diseño desde cero sin usar plantillas
                          </p>
                          <Button 
                            onClick={() => setCurrentStep('edit')} 
                            variant="primary"
                            fullWidth
                            className="h-10 text-sm"
                          >
                            Continuar sin Plantilla
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EDIT MODULES */}
              {currentStep === 'edit' && (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <p className="text-blue-300 text-xs">
                      <strong>💡 Ayuda:</strong> Expande cada módulo para editarlo. Puedes escribir código, cargar archivos (.html / .css / +TW), o descargarlos. Usa "Vista Previa" para ver el resultado.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <ModuleEditor 
                      moduleData={appState.header}
                      onChange={(d) => updateModule('header', d)}
                      isActive={activeTab === 'header'}
                      onToggle={() => setActiveTab(activeTab === 'header' ? null : 'header')}
                    />
                    
                    <ModuleEditor 
                      moduleData={appState.body}
                      onChange={(d) => updateModule('body', d)}
                      isActive={activeTab === 'body'}
                      onToggle={() => setActiveTab(activeTab === 'body' ? null : 'body')}
                    />
                    
                    <ModuleEditor 
                      moduleData={appState.footer}
                      onChange={(d) => updateModule('footer', d)}
                      isActive={activeTab === 'footer'}
                      onToggle={() => setActiveTab(activeTab === 'footer' ? null : 'footer')}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: EXPORT OPTIONS */}
              {currentStep === 'export' && (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8 text-center">
                    <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
                      🎉 ¡Listo para Exportar!
                    </h2>
                    <p className="text-slate-400 text-lg">
                      Selecciona el formato de exportación que necesites
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Complete HTML with CSS */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-blue-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">HTML Completo (con CSS)</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Página HTML completa con todos los estilos CSS integrados
                      </p>
                      <Button 
                        onClick={() => handleExport('combined')}
                        variant="primary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar HTML Completo
                      </Button>
                    </div>

                    {/* HTML Only */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-purple-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">Solo HTML</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Solo el código HTML sin estilos (útil para integrar en otros proyectos)
                      </p>
                      <Button 
                        onClick={() => handleExport('html-only')}
                        variant="secondary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar HTML
                      </Button>
                    </div>

                    {/* CSS Only */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-pink-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white">Solo CSS</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Solo los estilos CSS en un archivo separado
                      </p>
                      <Button 
                        onClick={() => handleExport('css-only')}
                        variant="secondary"
                        fullWidth
                        className="h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar CSS
                      </Button>
                    </div>

                    {/* HTML with Tailwind */}
                    <div className="bg-slate-800 p-6 rounded-lg border-2 border-slate-700 hover:border-cyan-500 transition-all">
                      <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-2">
                        HTML con Tailwind
                        <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">Recomendado</span>
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">
                        HTML completo usando Tailwind CSS desde CDN (sin CSS personalizado)
                      </p>
                      <Button 
                        onClick={() => handleExport('html-tailwind')}
                        variant="primary"
                        fullWidth
                        className="bg-cyan-600 hover:bg-cyan-700 h-12"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar HTML + Tailwind
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300">
                      💡 <strong>Tip:</strong> Si usaste clases de Tailwind en tu código, 
                      selecciona "HTML con Tailwind" para asegurar que los estilos funcionen correctamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <div className="max-w-7xl mx-auto flex gap-3">
              {currentStep !== 'select' && (
                <Button 
                  onClick={() => {
                    const steps: WizardStep[] = ['select', 'edit', 'export'];
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1]);
                    }
                  }}
                  variant="secondary"
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Atrás
                </Button>
              )}
              
              {currentStep === 'select' && (
                <Button 
                  onClick={() => setCurrentStep('edit')}
                  variant="primary"
                  fullWidth
                  className="h-12"
                >
                  Continuar a Edición
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
                    Ver Vista Previa
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('export')}
                    variant="primary"
                    className="flex-1 h-12"
                    disabled={!canProceedToEdit()}
                  >
                    Continuar a Exportar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              )}

              {currentStep === 'export' && (
                <Button 
                  onClick={() => {
                    setCurrentStep('select');
                    setAppState({
                      header: initialModuleState('mod-header', 'Header'),
                      body: initialModuleState('mod-body', 'Body Content'),
                      footer: initialModuleState('mod-footer', 'Footer'),
                    });
                  }}
                  variant="secondary"
                  fullWidth
                  className="h-12"
                >
                  Nuevo Proyecto
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}