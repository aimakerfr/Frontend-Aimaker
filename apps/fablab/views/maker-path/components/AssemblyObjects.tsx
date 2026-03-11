import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

interface AssemblyObjectsProps {
  onBack: () => void;
}

const AVAILABLE_OBJECTS = [
  { id: 'rag_module' },
  { id: 'api_module' },
  { id: 'view_module' },
  { id: 'assistant_module' },
  { id: 'assistant_instruction' },
  { id: 'html_connector' },
  { id: 'external_link_connector' },
  { id: 'app_deployment' },
];

const OBJECT_FALLBACKS: Record<string, string> = {
  rag_module: 'Cargar modulo RAG',
  api_module: 'Cargar modulo API',
  view_module: 'Cargar modulo vista',
  assistant_module: 'Cargar modulo asistente',
  assistant_instruction: 'Cargar instrucción de asistente',
  html_connector: 'Cargar html conector',
  external_link_connector: 'Cargar external_link_conector',
  app_deployment: 'Cargar app_deployment',
};

export const AssemblyObjects: React.FC<AssemblyObjectsProps> = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const { t } = useLanguage();
  const tr = t.assemblyObjectsTranslations;

  const toggleObject = (id: string) => {
    setSelectedObjects(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-8">
      <div className="max-w-xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} /> {tr?.backBtn ?? 'Volver al inicio'}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tr?.title ?? 'Ensamblador de Objetos'}</h1>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5">
          <div>
            <input
              type="text"
              placeholder={tr?.titlePlaceholder ?? 'Título del proyecto'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <textarea
              placeholder={tr?.descPlaceholder ?? 'Descripción del proyecto'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Selección de objetos */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {tr?.selectObjects ?? 'Seleccionar Objetos:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_OBJECTS.map((obj) => {
                const isSelected = selectedObjects.includes(obj.id);
                return (
                  <button
                    key={obj.id}
                    onClick={() => toggleObject(obj.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Plus
                      size={14}
                      className={isSelected ? 'text-blue-500 rotate-45 transition-transform' : 'text-gray-400'}
                    />
                    {tr?.objects?.[obj.id] ?? OBJECT_FALLBACKS[obj.id]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón ensamblar */}
          <button
            disabled
            className="w-full py-3 bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
            title="Funcionalidad próximamente disponible"
          >
            {tr?.assembleBtn ?? 'Ensamblar'}
          </button>
        </div>

        {/* Aviso sin lógica */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
          {tr?.comingSoon ?? 'Esta funcionalidad estará disponible próximamente.'}
        </p>
      </div>
    </div>
  );
};
