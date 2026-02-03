import React, { useRef, useState } from 'react';
import { ModuleData } from '../types';
import { Button } from './Button';
import { Upload, Code, FileCode, Check, Download, Database } from 'lucide-react';
import { HTMLSourcePicker } from './HTMLSourcePicker';
import { useLanguage } from '../../../language/useLanguage';
import { translations } from '../../../language/translations';

interface ModuleEditorProps {
  moduleData: ModuleData;
  onChange: (data: Partial<ModuleData>) => void;
  isActive: boolean;
  onToggle: () => void;
  readOnly?: boolean; // New prop for view mode
}

export const ModuleEditor: React.FC<ModuleEditorProps> = ({ 
  moduleData, 
  onChange, 
  isActive, 
  onToggle,
  readOnly = false // Default to edit mode
}) => {
  const { language } = useLanguage();
  const t = translations[language];
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

  const handleHTMLSourceSelect = (htmlContent: string, _sourceName: string) => {
    onChange({ html: htmlContent });
    // Source loaded silently - no alert needed
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
        <span className="text-slate-400 text-xs">{isActive ? t.moduleCreator.moduleEditor.hide : t.moduleCreator.moduleEditor.edit}</span>
      </div>

      {isActive && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          
          {/* Read-Only Mode Banner */}
          {readOnly && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-200">
                {t.moduleCreator.moduleEditor.readOnlyBanner}
              </p>
            </div>
          )}
          
          {/* Options Row */}
          <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                {t.moduleCreator.moduleEditor.configuration}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id={`tailwind-${moduleData.id}`}
                checked={moduleData.useTailwind}
                onChange={(e) => onChange({ useTailwind: e.target.checked })}
                disabled={readOnly}
                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor={`tailwind-${moduleData.id}`} className="text-xs cursor-pointer select-none text-slate-200">
                {t.moduleCreator.moduleEditor.useTailwind}
              </label>
              {moduleData.useTailwind && (
                <span className="text-xs text-green-400 ml-2 flex items-center">
                  <Check className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.active}
                </span>
              )}
            </div>
          </div>

          {/* HTML Section */}
          <div className="space-y-2">
            <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> {t.moduleCreator.moduleEditor.htmlCode}
                </label>
                <div className="flex gap-1.5">
                   <input 
                    type="file" 
                    accept=".html,.txt" 
                    ref={htmlInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'html')}
                    disabled={readOnly}
                  />
                  <input 
                    type="file" 
                    accept=".html,.txt" 
                    ref={htmlTailwindInputRef} 
                    className="hidden" 
                    onChange={handleHtmlTailwindUpload}
                    disabled={readOnly}
                  />
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7"
                    onClick={() => htmlInputRef.current?.click()}
                    disabled={readOnly}
                  >
                    <Upload className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.uploadHtml}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7 bg-cyan-900/50 hover:bg-cyan-800"
                    onClick={() => htmlTailwindInputRef.current?.click()}
                    disabled={readOnly}
                  >
                    <Upload className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.uploadTailwind}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7 bg-purple-900/50 hover:bg-purple-800"
                    onClick={() => setShowHTMLSourcePicker(true)}
                    title="Cargar desde Notebook"
                    disabled={readOnly}
                  >
                    <Database className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.notebook}
                  </Button>
                </div>
              </div>
            </div>
            <textarea
              value={moduleData.html}
              onChange={(e) => onChange({ html: e.target.value })}
              disabled={readOnly}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t.moduleCreator.moduleEditor.htmlPlaceholder}
            />
            {moduleData.html && (
              <Button
                variant="secondary"
                className="text-xs py-1 h-8 mt-2"
                onClick={() => downloadModuleFile(moduleData.html, `${moduleData.id}-content.html`, 'text/html')}
              >
                <Download className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.downloadHtml}
              </Button>
            )}
          </div>

          {/* CSS Section */}
          <div className="space-y-2">
            <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <span className="text-pink-400">#</span> {t.moduleCreator.moduleEditor.cssStyles}
                </label>
                <div className="flex gap-1.5">
                  <input 
                    type="file" 
                    accept=".css,.txt" 
                    ref={cssInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'css')}
                    disabled={readOnly}
                  />
                  <Button 
                    variant="secondary" 
                    className="text-xs py-1 px-2 h-7"
                    onClick={() => cssInputRef.current?.click()}
                    disabled={readOnly}
                  >
                    <Upload className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.uploadCss}
                  </Button>
                </div>
              </div>
            </div>
            <textarea
              value={moduleData.css}
              onChange={(e) => onChange({ css: e.target.value })}
              disabled={readOnly}
              className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t.moduleCreator.moduleEditor.cssPlaceholder}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                {t.moduleCreator.moduleEditor.note}
              </p>
              {moduleData.css && (
                <Button
                  variant="secondary"
                  className="text-xs py-1 h-8"
                  onClick={() => downloadModuleFile(moduleData.css, `${moduleData.id}-styles.css`, 'text/css')}
                >
                  <Download className="w-3 h-3 mr-1" /> {t.moduleCreator.moduleEditor.downloadCss}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};