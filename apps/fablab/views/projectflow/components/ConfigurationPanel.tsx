import React, { useState } from 'react';
import { Link as LinkIcon, AlertCircle, Settings as SettingsIcon, X as CloseIcon } from 'lucide-react';
import type { AvailablePath } from '../types';

interface ConfigurationPanelProps {
  jsonInput: string;
  onJsonChange: (value: string) => void;
  onParseWorkflow: () => void;
  parseError: string | null;
  availablePaths: AvailablePath[];
  selectedPathId: string | null;
  onSelectPath: (id: string) => void;
  t: any;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  jsonInput,
  onJsonChange,
  onParseWorkflow,
  parseError,
  availablePaths,
  selectedPathId,
  onSelectPath,
  t,
}) => {
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  return (
    <div className="relative w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {t.projectFlow.configuration}
        </h2>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3">
        <div className="space-y-3">
          {availablePaths.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {t.projectFlow.availablePaths}
              </h3>
              {availablePaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => onSelectPath(path.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                    selectedPathId === path.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <LinkIcon size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                    {path.name}
                  </span>
                </button>
              ))}

              {/* Path detail */}
              {selectedPathId && (
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {availablePaths.find((p) => p.id === selectedPathId)?.description}
                  </h4>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    {availablePaths.find((p) => p.id === selectedPathId)?.outputType}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <LinkIcon size={20} className="text-gray-400" />
              </div>
              <p className="font-medium">{t.projectFlow.makerPathSelector}</p>
              <p className="text-xs mt-1 text-gray-400">{t.projectFlow.noPathsAvailable}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gear button to open Paste JSON modal */}
      <button
        onClick={() => setIsJsonModalOpen(true)}
        className="absolute bottom-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        aria-label="Open JSON configuration"
        title={t.projectFlow.pasteJson}
      >
        <SettingsIcon size={18} />
      </button>

      {/* Paste JSON Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsJsonModalOpen(false)} />
          <div className="relative z-[61] w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                {t.projectFlow.pasteJson}
              </h3>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <CloseIcon size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={jsonInput}
                onChange={(e) => onJsonChange(e.target.value)}
                placeholder={t.projectFlow.jsonPlaceholder}
                className="w-full h-60 px-3 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />

              <button
                onClick={() => {
                  onParseWorkflow();
                }}
                className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold uppercase tracking-wide rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {t.projectFlow.parseAndRender}
              </button>

              {parseError && (
                <div className="flex items-start gap-2 text-red-500 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed">
                {t.projectFlow.pasteJsonHint}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPanel;
