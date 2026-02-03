import React from 'react';
import { X, Download } from 'lucide-react';
import { AppState } from '../types';
import { PreviewSection } from './PreviewSection';
import { Button } from './Button';
import { generateCombinedHtml, downloadFile } from '../utils/exportUtils';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, appState }) => {
  if (!isOpen) return null;

  const handleDownloadPreview = () => {
    const html = generateCombinedHtml(appState);
    downloadFile(html, 'preview-complete.html', 'text/html');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full h-full max-w-7xl max-h-[90vh] m-4 bg-slate-900 rounded-lg shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Vista Previa en Vivo</h2>
            <p className="text-sm text-slate-400">Previsualiza tu página completa</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPreview}
              variant="primary"
              className="h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Vista Previa
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-6xl mx-auto shadow-2xl bg-white min-h-[500px] flex flex-col">
            <div className="w-full">
              <PreviewSection data={appState.header} />
            </div>
            
            <div className="w-full flex-1">
              <PreviewSection data={appState.body} />
            </div>
            
            <div className="w-full">
              <PreviewSection data={appState.footer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
