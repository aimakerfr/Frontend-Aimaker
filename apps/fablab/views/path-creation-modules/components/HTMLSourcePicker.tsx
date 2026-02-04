import React, { useState, useEffect } from 'react';
import { getNotebookSources, getNotebookSourceContent } from '@core/notebooks';
import { Database, X, Check } from 'lucide-react';

interface HTMLSource {
  id: number;
  name: string;
  filePath: string | null;
  createdAt: string;
}

interface HTMLSourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (html: string, sourceName: string) => void;
}

export const HTMLSourcePicker: React.FC<HTMLSourcePickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [sources, setSources] = useState<HTMLSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<HTMLSource | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHTMLSources();
    }
  }, [isOpen]);

  const loadHTMLSources = async () => {
    setIsLoading(true);
    try {
      // Obtener TODAS las fuentes HTML de TODOS los notebooks del usuario
      // Al no pasar noteBookId, el backend devuelve todas las fuentes
      const allSources = await getNotebookSources(undefined, 'HTML');
      
      // Mapear a HTMLSource
      const htmlSources: HTMLSource[] = allSources.map((source: any) => ({
        id: source.id,
        name: source.name,
        filePath: source.filePath || null,
        createdAt: source.createdAt
      }));
      setSources(htmlSources);
    } catch (error) {
      console.error('Error loading HTML sources:', error);
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSource = async (source: HTMLSource) => {
    setSelectedSource(source);
    
    try {
      // Usar endpoint de API para obtener el contenido
      const response = await getNotebookSourceContent(source.id);
      onSelect(response.content, source.name);
      onClose();
    } catch (error) {
      console.error('Error loading HTML content:', error);
      // Silent error - no alert to user
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Cargar Fuente HTML desde Notebook
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Selecciona una fuente HTML previamente guardada
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Cargando fuentes...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Database size={48} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                No hay fuentes HTML disponibles
              </h3>
              <p className="text-slate-400 text-center max-w-md">
                Ve a un Notebook (RAG Multimodal) y carga fuentes de tipo HTML primero.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSelectSource(source)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSource?.id === source.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        {source.name}
                        {selectedSource?.id === source.id && (
                          <Check size={16} className="text-blue-400" />
                        )}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Creado: {new Date(source.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                        HTML
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center">
          <p className="text-sm text-slate-400">
            {sources.length} {sources.length === 1 ? 'fuente disponible' : 'fuentes disponibles'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
