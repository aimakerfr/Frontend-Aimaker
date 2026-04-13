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
        className={`assembler-palette-card${alreadyUsed ? ' is-used' : ''}`}
      >
        <div className={`assembler-palette-card-accent ${mod.color}`} />
        <div className="assembler-palette-card-body">
          <div className="assembler-palette-card-title">
            {mod.label}
          </div>
          <div className="assembler-palette-card-meta">
            {badge}{mod.needsObject ? ' · requiere archivo' : ''}
          </div>
        </div>
        {alreadyUsed ? (
          <span className="assembler-palette-card-check">
            ✓
          </span>
        ) : (
          <svg
            className="assembler-palette-card-drag"
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
    <div className="assembler-palette">
      <h3 className="assembler-palette-title">
        Módulos disponibles
      </h3>

      {groups.map((group) => (
        <div key={group.id} className="assembler-palette-group">
          <div className={`assembler-palette-group-title ${group.titleClass}`}>
            {group.label}
          </div>
          {group.description && (
            <p className="assembler-palette-group-desc">
              {group.description}
            </p>
          )}
          <div className={`assembler-palette-group-grid ${group.containerClass}`}>
            {group.modules.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="assembler-palette-group">
          <div className="assembler-palette-group-title">
            Otros módulos
          </div>
          <div className="assembler-palette-group-grid">
            {ungrouped.map((mod) => renderModuleCard(mod))}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <p className="assembler-palette-empty">
          Arrastra módulos desde la paleta para comenzar.
        </p>
      )}
    </div>
  );
};

export default ModulesPalette;
