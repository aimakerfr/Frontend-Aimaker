import React from 'react';
import { Route, Link2, X } from 'lucide-react';

interface RouteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'architect_ai' | 'module_connector') => void;
}

export const RouteTypeModal: React.FC<RouteTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Selecciona el Tipo de Ruta
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Elige qué tipo de ruta deseas crear
          </p>
        </div>

        {/* Body */}
        <div className="p-6 grid md:grid-cols-2 gap-4">
          {/* Ruta Arquitecto AI */}
          <button
            onClick={() => onSelect('architect_ai')}
            className="group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Route size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Ruta Arquitecto AI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Crea proyectos paso a paso con asistencia de IA. Ideal para planificación estructurada y optimización de prompts.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  IA Asistida
                </span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  6 Fases
                </span>
              </div>
            </div>
          </button>

          {/* Conector de Módulos */}
          <button
            onClick={() => onSelect('module_connector')}
            className="group relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Link2 size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Conector de Módulos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Orquesta módulos HTML/CSS con plantillas. Conecta componentes header, body y footer con estilos integrados.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  Modular
                </span>
                <span className="text-xs bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
                  HTML/CSS
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
