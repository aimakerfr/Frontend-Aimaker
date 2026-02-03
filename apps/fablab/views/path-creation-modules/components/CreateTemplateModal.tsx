import React, { useState } from 'react';
import { ModuleType, Template } from '../types';
import { Button } from './Button';
import { X, Save, Sparkles } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<Template, 'id'>) => void;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ModuleType>('header');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [useTailwind, setUseTailwind] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !html.trim()) {
      alert('Por favor completa al menos el nombre y el HTML');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || 'Plantilla personalizada',
      type,
      html: html.trim(),
      css: css.trim(),
      useTailwind,
    });

    // Reset form
    setName('');
    setDescription('');
    setType('header');
    setHtml('');
    setCss('');
    setUseTailwind(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] m-4 bg-slate-900 rounded-lg shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Crear Plantilla Personalizada</h2>
              <p className="text-sm text-slate-400">Guarda tu código como plantilla reutilizable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre de la Plantilla *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mi Header Personalizado"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente tu plantilla"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Módulo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('header')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === 'header'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Header
              </button>
              <button
                onClick={() => setType('body')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === 'body'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setType('footer')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === 'footer'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Footer
              </button>
            </div>
          </div>

          {/* Tailwind Option */}
          <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded-lg">
            <input
              type="checkbox"
              id="template-tailwind"
              checked={useTailwind}
              onChange={(e) => setUseTailwind(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
            />
            <label htmlFor="template-tailwind" className="text-sm cursor-pointer select-none text-slate-200">
              Esta plantilla usa Tailwind CSS
            </label>
          </div>

          {/* HTML */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Código HTML *
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<div>Tu código HTML aquí...</div>"
              className="w-full h-48 bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* CSS */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Código CSS (opcional)
            </label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder=".mi-clase { color: blue; }"
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800 flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1 h-12"
          >
            <Save className="w-5 h-5 mr-2" />
            Guardar Plantilla
          </Button>
        </div>
      </div>
    </div>
  );
};
