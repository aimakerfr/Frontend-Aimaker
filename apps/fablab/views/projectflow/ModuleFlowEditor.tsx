import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, Edit2, Trash2, Eye, Settings, Save, Loader2, Check } from 'lucide-react';
import { getMakerPath, updateMakerPath } from '@core/maker-path';
import { AVAILABLE_MODULES, getModuleDefinition, canAddModule, type ModuleType, type ModuleDefinition } from './moduleDefinitions';

interface ModuleStep {
  id: number; // Local ID for rendering
  stepId: number; // Actual step_id for database (order)
  moduleType: ModuleType;
  config?: any;
}

/**
 * ModuleFlowEditor - Visual editor for creating module-based workflows
 * Used in /dashboard/projectflow?id={maker_path_id}
 */
const ModuleFlowEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const makerPathId = searchParams.get('id') ? Number(searchParams.get('id')) : undefined;

  // State
  const [title, setTitle] = useState('NUEVO FLUJO');
  const [steps, setSteps] = useState<ModuleStep[]>([]);
  const [isSelectingModule, setIsSelectingModule] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ═══════════════════════════════════════════════════════
  // Load project data
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (makerPathId) {
      loadProject();
    }
  }, [makerPathId]);

  const loadProject = async () => {
    if (!makerPathId) return;

    try {
      const project = await getMakerPath(makerPathId);
      console.log('[ModuleFlowEditor] Loaded project:', project);
      setTitle(project.title || 'NUEVO FLUJO');

      // Parse existing steps from project.data
      if (project.data) {
        let dataStr = typeof project.data === 'string' ? project.data : JSON.stringify(project.data);
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.modules && Array.isArray(parsed.modules)) {
            const loadedSteps: ModuleStep[] = parsed.modules.map((mod: any, idx: number) => ({
              id: idx + 1,
              stepId: idx + 1,
              moduleType: mod.type,
              config: mod.config || {},
            }));
            setSteps(loadedSteps);
            console.log('[ModuleFlowEditor] Loaded', loadedSteps.length, 'modules');
          }
        } catch (err) {
          console.error('[ModuleFlowEditor] Error parsing project.data:', err);
        }
      }
    } catch (error) {
      console.error('[ModuleFlowEditor] Error loading project:', error);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Save project to database
  // ═══════════════════════════════════════════════════════
  const saveProject = async () => {
    if (!makerPathId) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Build data structure to save
      const projectData = {
        modules: steps.map((step) => ({
          type: step.moduleType,
          stepId: step.stepId,
          config: step.config || {},
        })),
        totalSteps: steps.length,
        lastModified: new Date().toISOString(),
      };

      await updateMakerPath(makerPathId, {
        title,
        data: JSON.stringify(projectData),
      });

      console.log('[ModuleFlowEditor] Project saved successfully');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[ModuleFlowEditor] Error saving project:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // Handle adding new module
  // ═══════════════════════════════════════════════════════
  const handleAddModule = (moduleType: ModuleType) => {
    const newId = steps.length > 0 ? Math.max(...steps.map(s => s.id)) + 1 : 1;
    const newStepId = steps.length + 1;

    const newStep: ModuleStep = {
      id: newId,
      stepId: newStepId,
      moduleType,
      config: {},
    };

    setSteps(prev => [...prev, newStep]);
    setIsSelectingModule(false);
    setSelectedStepId(newId);

    console.log('[ModuleFlowEditor] Added module:', moduleType, 'at step', newStepId);
  };

  // ═══════════════════════════════════════════════════════
  // Handle replacing existing module
  // ═══════════════════════════════════════════════════════
  const handleReplaceModule = (stepId: number, newModuleType: ModuleType) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, moduleType: newModuleType, config: {} } : step
    ));
    setIsSelectingModule(false);
    console.log('[ModuleFlowEditor] Replaced module at step', stepId, 'with', newModuleType);
  };

  // ═══════════════════════════════════════════════════════
  // Handle deleting module
  // ═══════════════════════════════════════════════════════
  const handleDeleteModule = (stepId: number) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== stepId);
      // Reindex stepIds
      return filtered.map((step, idx) => ({ ...step, stepId: idx + 1 }));
    });
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
    console.log('[ModuleFlowEditor] Deleted module at step', stepId);
  };

  // ═══════════════════════════════════════════════════════
  // Navigate to product view
  // ═══════════════════════════════════════════════════════
  const handleViewProduct = () => {
    if (makerPathId) {
      navigate(`/product/projectflow/${makerPathId}`);
    }
  };

  // Get current module types for validation
  const currentModuleTypes = steps.map(s => s.moduleType);

  // Filter modules that can be added based on existing steps
  const availableModules = AVAILABLE_MODULES.filter((module: ModuleDefinition) => 
    canAddModule(module.id, currentModuleTypes)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-200 p-6 bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>

            <div className="flex items-center gap-3">
              {steps.length > 0 && (
                <button
                  onClick={handleViewProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  <Eye className="w-5 h-5" />
                  Ver Producto
                </button>
              )}
              
              <button
                onClick={saveProject}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-5 h-5" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>

          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold w-full outline-none bg-transparent placeholder-slate-400 text-blue-600"
            placeholder="Título del Proyecto"
          />
        </div>

        {/* Module Steps Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto px-4 pt-4 gap-2 flex-shrink-0">
          {steps.map((step) => {
            const moduleDef = getModuleDefinition(step.moduleType);
            const ModuleIcon = moduleDef?.icon || Settings;

            return (
              <div key={step.id} className="relative flex shrink-0 group">
                <button
                  onClick={() => {
                    setSelectedStepId(step.id);
                    setIsSelectingModule(false);
                  }}
                  className={`px-6 py-3 font-medium text-sm rounded-t-lg flex items-center gap-3 transition-colors whitespace-nowrap border border-b-0 pr-20
                    ${selectedStepId === step.id ? 'bg-white text-blue-600 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}
                  `}
                >
                  <ModuleIcon className="w-4 h-4" />
                  {`${step.stepId}. ${moduleDef?.name || 'Módulo'}`}
                </button>
                
                {/* Action buttons */}
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStepId(step.id);
                      setIsSelectingModule(true);
                    }}
                    className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                    title="Cambiar módulo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteModule(step.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                    title="Eliminar módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          <button 
            onClick={() => {
              setSelectedStepId(null);
              setIsSelectingModule(true);
            }}
            className="px-4 py-3 font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-t-lg transition-colors flex items-center justify-center shrink-0 mb-[1px]"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8 bg-white">
          
          {/* Module Selection View */}
          {isSelectingModule && (
            <div className="h-full flex flex-col animate-in fade-in duration-300 max-w-5xl mx-auto w-full">
              <h2 className="text-2xl font-bold mb-2 text-slate-800">
                {selectedStepId ? 'Cambiar módulo' : 'Selecciona un módulo'}
              </h2>
              <p className="text-slate-500 mb-8">
                {steps.length === 0
                  ? 'Estos son los módulos que pueden iniciar tu flujo'
                  : 'Elige el siguiente módulo para tu flujo'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableModules.map((module: ModuleDefinition) => {
                  const ModuleIcon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        if (selectedStepId) {
                          handleReplaceModule(selectedStepId, module.id);
                        } else {
                          handleAddModule(module.id);
                        }
                      }}
                      className="flex flex-col items-start p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="w-12 h-12 mb-4 text-white bg-blue-600 p-2.5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ModuleIcon className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-slate-800 group-hover:text-blue-600 transition-colors">
                        {module.name}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{module.description}</p>
                      
                      <div className="mt-4 flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          module.category === 'input' ? 'bg-green-100 text-green-700' :
                          module.category === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {module.category === 'input' ? 'Entrada' : module.category === 'processing' ? 'Procesamiento' : 'Salida'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableModules.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No hay módulos disponibles</p>
                  <p className="text-sm mt-2">Los módulos mostrados dependen de los pasos anteriores</p>
                </div>
              )}
            </div>
          )}

          {/* Empty State - No modules and not selecting */}
          {!isSelectingModule && steps.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <button 
                onClick={() => setIsSelectingModule(true)}
                className="flex flex-col items-center gap-6 group cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-32 h-32 rounded-3xl border-3 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                  <Plus className="w-16 h-16 text-slate-400 group-hover:text-blue-500 transition-colors" strokeWidth={2} />
                </div>
                <span className="font-semibold text-2xl text-slate-700 group-hover:text-blue-600 transition-colors">
                  Añadir Módulo
                </span>
              </button>
            </div>
          )}

          {/* Module Preview - Show selected step info */}
          {!isSelectingModule && selectedStepId !== null && steps.length > 0 && (
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              {(() => {
                const step = steps.find(s => s.id === selectedStepId);
                if (!step) return null;

                const moduleDef = getModuleDefinition(step.moduleType);
                if (!moduleDef) return null;

                const ModuleIcon = moduleDef.icon;

                return (
                  <div className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                        <ModuleIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-800">{moduleDef.name}</h2>
                        <p className="text-slate-500 font-medium mt-1">Paso {step.stepId} del flujo</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mb-6">
                      <p className="text-slate-700 leading-relaxed">{moduleDef.description}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuración
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        La configuración específica de este módulo se realizará en la vista de producto final.
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleViewProduct}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Configurar en Producto
                        </button>
                        <button
                          onClick={() => setIsSelectingModule(true)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Cambiar Módulo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Flow Overview - Show when we have steps but nothing selected */}
          {!isSelectingModule && selectedStepId === null && steps.length > 0 && (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
              <div className="w-full bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-100 rounded-2xl p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                  Tu Flujo de Trabajo
                </h3>
                
                <div className="space-y-3 mb-8">
                  {steps.map((step) => {
                    const moduleDef = getModuleDefinition(step.moduleType);
                    const ModuleIcon = moduleDef?.icon || Settings;

                    return (
                      <div
                        key={step.id}
                        className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedStepId(step.id)}
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {step.stepId}
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                          <ModuleIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{moduleDef?.name}</h4>
                          <p className="text-xs text-slate-500">{moduleDef?.category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setIsSelectingModule(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar Módulo
                  </button>
                  <button
                    onClick={handleViewProduct}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <Eye className="w-5 h-5" />
                    Ver Producto
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ModuleFlowEditor;
