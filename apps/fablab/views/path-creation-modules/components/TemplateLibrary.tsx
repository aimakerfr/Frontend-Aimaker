import React from 'react';
import { Template, ModuleType } from '../types';
import { predefinedTemplates } from '../data/templates';
import { Copy, Plus } from 'lucide-react';
import { Button } from './Button';

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  onCreateNew?: () => void;
  customTemplates?: Template[];
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  onSelectTemplate, 
  onCreateNew,
  customTemplates = [] 
}) => {
  const [selectedType, setSelectedType] = React.useState<ModuleType | 'all'>('all');

  const allTemplates = [...customTemplates, ...predefinedTemplates];
  
  const filteredTemplates = selectedType === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.type === selectedType);

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              📦 Biblioteca de Plantillas
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Opcional: Selecciona una plantilla para comenzar más rápido
            </p>
          </div>
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Plantilla
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedType === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedType('header')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              selectedType === 'header' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Headers
          </button>
          <button
            onClick={() => setSelectedType('body')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'body' 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Bodies
          </button>
          <button
            onClick={() => setSelectedType('footer')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'footer' 
                ? 'bg-orange-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Footers
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {filteredTemplates.map((template) => {
          const isCustom = template.id.startsWith('custom-');
          return (
            <div
              key={template.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-blue-500 transition-all cursor-pointer group"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    {isCustom && (
                      <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">
                        Personalizada
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                    template.type === 'header' ? 'bg-purple-900/50 text-purple-300' :
                    template.type === 'body' ? 'bg-green-900/50 text-green-300' :
                    'bg-orange-900/50 text-orange-300'
                  }`}>
                    {template.type}
                  </span>
                </div>
                <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
            
<p className="text-slate-400 text-xs mb-2">
              {template.description}
            </p>

            <div className="flex items-center gap-2 text-xs">
              {template.useTailwind && (
                <span className="bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded">
                  Tailwind
                </span>
              )}
              {template.css && (
                <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                  CSS
                </span>
              )}
            </div>

              <div className="mt-2 pt-2 border-t border-slate-700">
                <button className="w-full bg-slate-700 group-hover:bg-blue-600 text-slate-300 group-hover:text-white py-1.5 rounded transition-colors text-xs font-medium">
                Usar Plantilla
              </button>
            </div>
          </div>
        );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          No hay plantillas disponibles para esta categoría
        </div>
      )}
    </div>
  );
};
