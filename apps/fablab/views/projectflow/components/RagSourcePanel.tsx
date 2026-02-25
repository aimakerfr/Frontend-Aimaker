import React, { useRef } from 'react';
import { FileType, Eye, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../language/useLanguage';

export type RagSource = {
  id: number;
  name: string;
  type: string;
  objectId?: number;
  relativePath?: string;
  url?: string;
  makerPathId?: number;
  filePath?: string | null;
  createdAt: string;
  selected?: boolean;
};

interface RagSourcePanelProps {
  sources: RagSource[];
  onToggleSource: (id: number) => void;
  onDeleteSource: (id: number) => void;
  onOpenImportModal: () => void;
  onOpenUploadModal: () => void;
}

const RagSourcePanel: React.FC<RagSourcePanelProps> = ({ 
  sources, 
  onToggleSource, 
  onDeleteSource, 
  onOpenImportModal, 
  onOpenUploadModal 
}) => {
  const { t } = useLanguage();
  const tp = t.notebook.sourcePanel;
  const panelRef = useRef<HTMLDivElement>(null);

  const handleViewSource = (source: RagSource) => {
    const url = source.url || source.filePath;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const typeColors: Record<string, string> = {
    HTML: 'bg-green-100 text-green-700 border-green-300',
    TEXT: 'bg-blue-100 text-blue-700 border-blue-300',
    PDF: 'bg-red-100 text-red-700 border-red-300',
    IMAGE: 'bg-purple-100 text-purple-700 border-purple-300',
    VIDEO: 'bg-orange-100 text-orange-700 border-orange-300',
    WEBSITE: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    CODE: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    DOC: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    CONFIG: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <div ref={panelRef} className="h-full flex flex-col bg-gradient-to-b from-gray-50/50 to-white border-r border-gray-200/70 relative overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/70 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200/50">
              <FileType className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 tracking-tight text-base">
                {tp.title}
              </h2>
              <p className="text-[10px] text-gray-600 font-bold mt-0.5">{tp.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <span className="text-xs font-bold text-gray-700">{tp.activeLabel}</span>
          <span className="text-sm font-black bg-white px-3 py-1 rounded-lg text-indigo-600 shadow-sm">
            {sources.filter(s => s.selected).length} / {sources.length}
          </span>
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
              <FileType className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">CAHIER VIDE</p>
            <p className="text-[10px] text-gray-400 mt-1">Agrega tu primera fuente para comenzar</p>
          </div>
        ) : (
          sources.map((source) => {
            const colorClass = typeColors[source.type] || typeColors.DOC;
            return (
              <div
                key={source.id}
                className={`group relative bg-white rounded-xl border p-3 transition-all ${
                  source.selected 
                    ? 'border-indigo-400 shadow-md shadow-indigo-100' 
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle checkbox */}
                  <button
                    onClick={() => onToggleSource(source.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      source.selected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {source.selected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{source.name}</p>
                    <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded border ${colorClass}`}>
                      {source.type}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(source.url || source.filePath) && (
                      <button
                        onClick={() => handleViewSource(source)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition"
                        title="Ver"
                      >
                        <Eye size={14} className="text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteSource(source.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-5 border-t border-gray-200/70 bg-white/95 backdrop-blur-sm shadow-[0_-12px_40px_-20px_rgba(79,70,229,0.4)] z-10">
        <div className="flex flex-col gap-3">
          <button
            onClick={onOpenImportModal}
            className="w-full py-3.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-700 bg-white text-xs font-black uppercase tracking-wider hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 transition-all"
          >
            {tp.importButton}
          </button>
          <button
            onClick={onOpenUploadModal}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-indigo-200/50 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            {tp.add}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RagSourcePanel;
