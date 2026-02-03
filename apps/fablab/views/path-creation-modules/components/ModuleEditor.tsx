import React, { useRef, useState } from 'react';
import { ModuleData } from '../types';
import { Button } from './Button';
import { Upload, Code, FileCode, Check, Download, Database } from 'lucide-react';
import { HTMLSourcePicker } from './HTMLSourcePicker';

interface ModuleEditorProps {
  moduleData: ModuleData;
  onChange: (data: Partial<ModuleData>) => void;
  isActive: boolean;
  onToggle: () => void;
}

export const ModuleEditor: React.FC<ModuleEditorProps> = ({ 
  moduleData, 
  onChange, 
  isActive, 
  onToggle 
}) => {
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const cssInputRef = useRef<HTMLInputElement>(null);
  const htmlTailwindInputRef = useRef<HTMLInputElement>(null);
  const [showHTMLSourcePicker, setShowHTMLSourcePicker] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'html' | 'css') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onChange({ [type]: content });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleHtmlTailwindUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Extract HTML and enable Tailwind
      onChange({ 
        html: content,
        useTailwind: true,
        css: '' // Clear CSS when using Tailwind
      });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleHTMLSourceSelect = (htmlContent: string, sourceName: string) => {
    onChange({ html: htmlContent });
    alert(`✅ Fuente "${sourceName}" cargada exitosamente!`);
  };

  const downloadModuleFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden mb-3 bg-slate-800">
      {/* HTML Source Picker Modal */}
      <HTMLSourcePicker
        isOpen={showHTMLSourcePicker}
        onClose={() => setShowHTMLSourcePicker(false)}
        onSelect={handleHTMLSourceSelect}
      />
      
      <div 
        onClick={onToggle}
        className={`p-3 cursor-pointer flex justify-between items-center transition-colors ${isActive ? 'bg-slate-700' : 'hover:bg-slate-750'}`}
      >
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-base capitalize">{moduleData.name} Module</h3>
        </div>
        <span className="text-slate-400 text-xs">{isActive ? 'Ocultar' : 'Editar'}</span>
      </div>

      {isActive && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          
          {/* Options Row */}
          <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                ⚙️ Configuración
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id={`tailwind-${moduleData.id}`}
                checked={moduleData.useTailwind}
                onChange={(e) => onChange({ useTailwind: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
              />
              <label htmlFor={`tailwind-${moduleData.id}`} className="text-xs cursor-pointer select-none text-slate-200">
                Usar Tailwind CSS (CDN)
              </label>
              {moduleData.useTailwind && (
                <span className="text-xs text-green-400 ml-2 flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Activo
                </span>
              )}
            </div>
          </div>

          {/* HTML Section */}
          <div className="space-y-2">
            <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> Código HTML
                </label>
                <div className="flex gap-1.5">
                   <input 
                    type="file" 
                    accept=".html,.txt" 
                    ref={htmlInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'html')}
                  />
                  <input 
                    type="file" 
                    accept=".html,.txt" 
                    ref={htmlTailwindInputRef} 
                    className="hidden" 
                    onChange={handleHtmlTailwindUpload}
                  />
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7"
                    onClick={() => htmlInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" /> .html
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7 bg-cyan-900/50 hover:bg-cyan-800"
                    onClick={() => htmlTailwindInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" /> +TW
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7 bg-purple-900/50 hover:bg-purple-800"
                    onClick={() => setShowHTMLSourcePicker(true)}
                    title="Cargar desde Notebook"
                  >
                    <Database className="w-3 h-3 mr-1" /> Notebook
                  </Button>
                </div>
              </div>
            </div>
            <textarea
              value={moduleData.html}
              onChange={(e) => onChange({ html: e.target.value })}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="<div>Escribe o pega tu HTML aquí...</div>"
            />
            {moduleData.html && (
              <Button
                variant="secondary"
                className="text-xs py-1 h-8 mt-2"
                onClick={() => downloadModuleFile(moduleData.html, `${moduleData.id}-content.html`, 'text/html')}
              >
                <Download className="w-3 h-3 mr-1" /> Descargar HTML
              </Button>
            )}
          </div>

          {/* CSS Section */}
          <div className="space-y-2">
            <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <span className="text-pink-400">#</span> Estilos CSS
                </label>
                <div className="flex gap-1.5">
                  <input 
                    type="file" 
                    accept=".css,.txt" 
                    ref={cssInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'css')}
                  />
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7"
                    onClick={() => cssInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" /> .css
                  </Button>
                </div>
              </div>
            </div>
            <textarea
              value={moduleData.css}
              onChange={(e) => onChange({ css: e.target.value })}
              className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder=".mi-clase { color: red; }"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                Nota: Los estilos se aíslan en este módulo
              </p>
              {moduleData.css && (
                <Button
                  variant="secondary"
                  className="text-xs py-1 h-8"
                  onClick={() => downloadModuleFile(moduleData.css, `${moduleData.id}-styles.css`, 'text/css')}
                >
                  <Download className="w-3 h-3 mr-1" /> Descargar CSS
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};