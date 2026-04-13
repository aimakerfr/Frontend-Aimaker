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
      >
        <div className={mod.color} />
        <div>
          <div>
            {mod.label}
          </div>
          <div>
            {badge}{mod.needsObject ? ' · requiere archivo' : ''}
          </div>
        </div>
        {alreadyUsed ? (
          <span>
            ✓
          </span>
        ) : (
          <svg
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
    <div>
      <h3>
        Módulos disponibles
      </h3>

      {groups.map((group) => (
        <div key={group.id}>
          <div className={group.titleClass}>
            {group.label}
          </div>
          {group.description && (
            <p>
              {group.description}
            </p>
          )}
          <div className={group.containerClass}>
            {group.modules.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div>
          <div>
            Otros módulos
          </div>
          <div>
            {ungrouped.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <p>
          Arrastra módulos desde la paleta para comenzar.
        </p>
      )}
    </div>
  );
};

export default ModulesPalette;
