import React from 'react';
import type { ModuleDefinition, CanvasModule, ModuleGroup } from './types';

type Props = {
  modules: ModuleDefinition[];
  canvasModules: CanvasModule[];
  groups?: ModuleGroup[];
  ungrouped?: ModuleDefinition[];
};

const ModulesPalette: React.FC<Props> = ({ modules, canvasModules, groups = [], ungrouped = [] }) => {
  const usedKeys = new Set(canvasModules.map((m) => m.key));

  const handleDragStart = (e: React.DragEvent, mod: ModuleDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(mod));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderModuleCard = (mod: ModuleDefinition) => {
    const alreadyUsed = usedKeys.has(mod.key);
    const badge = mod.needsObject ? 'HTML' : mod.textInput ? 'TEXT' : mod.type;
    return (
      <div
        key={mod.key}
        draggable={!alreadyUsed}
        onDragStart={(e) => handleDragStart(e, mod)}
        className={
          'group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all select-none ' +
          (alreadyUsed
            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
            : 'border-gray-200 bg-white cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600')
        }
      >
        <div className={`w-2 h-8 rounded-full ${mod.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {mod.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {badge}{mod.needsObject ? ' · requiere archivo' : ''}
          </div>
        </div>
        {alreadyUsed ? (
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase">
            ✓
          </span>
        ) : (
          <svg
            className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
        Módulos disponibles
      </h3>

      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${group.titleClass}`}>
            {group.label}
          </div>
          {group.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {group.description}
            </p>
          )}
          <div className={`rounded-2xl border p-3 space-y-2 ${group.containerClass}`}>
            {group.modules.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Otros módulos
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2">
            {ungrouped.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Arrastra módulos desde la paleta para comenzar.
        </p>
      )}
    </div>
  );
};

export default ModulesPalette;
