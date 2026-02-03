import React from 'react';
import { Template, ModuleType } from '../types';
import { predefinedTemplates } from '../data/templates';
import { Copy, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../../language/useLanguage';
import { translations } from '../../../language/translations';

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
  const { language } = useLanguage();
  const t = translations[language];
  
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    header: false,
    body: false,
    footer: false
  });

  const allTemplates = [...customTemplates, ...predefinedTemplates];
  
  const getTemplatesByType = (type: ModuleType) => {
    return allTemplates.filter(t => t.type === type);
  };

  const toggleSection = (type: ModuleType) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderTemplateSection = (type: ModuleType, title: string, color: string) => {
    const templates = getTemplatesByType(type);
    const isExpanded = expandedSections[type];

    return (
      <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
        <button
          onClick={() => toggleSection(type)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <h3 className={`font-semibold text-lg ${color}`}>
              {title}
            </h3>
            <span className="text-sm text-slate-400">
              ({templates.length} plantillas)
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => {
              const isCustom = template.id.startsWith('custom-');
              return (
                <div
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className={`
                    bg-slate-800 border-2 border-slate-700 rounded-lg p-3 cursor-pointer 
                    hover:border-blue-500 hover:shadow-lg transition-all
                    ${isCustom ? 'border-purple-500/50' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-white flex-1">
                      {template.name}
                    </h3>
                    {isCustom && (
                      <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Copy size={12} />
                      {template.useTailwind ? 'Tailwind' : 'CSS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              📦 {t.moduleCreator.templateLibrary.title}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {t.moduleCreator.templateLibrary.subtitle}
            </p>
          </div>
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t.moduleCreator.templateLibrary.createTemplate}
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {renderTemplateSection('header', `🔝 ${t.moduleCreator.templateLibrary.headers}`, 'text-purple-400')}
        {renderTemplateSection('body', `📄 ${t.moduleCreator.templateLibrary.body}`, 'text-green-400')}
        {renderTemplateSection('footer', `🔻 ${t.moduleCreator.templateLibrary.footers}`, 'text-orange-400')}
      </div>
    </div>
  );
};
