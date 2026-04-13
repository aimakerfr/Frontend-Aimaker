import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ModuleDefinition, CanvasModule } from './types';
import { GRID_SIZE } from './types';

type RagInjectedObject = {
  id: string | number;
  name?: string | null;
};

type Props = {
  modules: CanvasModule[];
  onChange: (modules: CanvasModule[]) => void;
  /** Called when a module block requests object selection (for needsObject modules) */
  onSelectObject?: (moduleKey: string) => void;
  /** Called when a textInput module's value changes */
  onTextChange?: (moduleKey: string, value: string) => void;
  /** RAG injected objects (for hover list/count) */
  ragObjects?: RagInjectedObject[];
  /** Open the RAG injection modal */
  onRagOpenModal?: () => void;
  /** Remove an injected object from RAG list */
  onRagRemove?: (objectId: string | number) => void;
  /** Handle drop of an object id into the RAG module */
  onRagDrop?: (objectId: number) => void;
};

/** Clamp a value between min and max */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const DragDropCanvas: React.FC<Props> = ({
  modules,
  onChange,
  onSelectObject,
  onTextChange,
  ragObjects = [],
  onRagOpenModal,
  onRagRemove,
  onRagDrop,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Drag-to-reposition state ──
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ col: number; row: number } | null>(null);
  const dragOffset = useRef<{ dCol: number; dRow: number }>({ dCol: 0, dRow: 0 });

  // ── Resize state ──
  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const resizeStart = useRef<{ startX: number; startY: number; origColSpan: number; origRowSpan: number }>({ startX: 0, startY: 0, origColSpan: 1, origRowSpan: 1 });

  // ── Drop from palette highlight ──
  const [paletteHover, setPaletteHover] = useState<{ col: number; row: number } | null>(null);

  // ── Helpers ──
  const cellSize = useCallback(() => {
    if (!gridRef.current) return { w: 0, h: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    return { w: rect.width / GRID_SIZE, h: rect.height / GRID_SIZE };
  }, []);

  const posFromMouse = useCallback(
    (clientX: number, clientY: number) => {
      if (!gridRef.current) return { col: 0, row: 0 };
      const rect = gridRef.current.getBoundingClientRect();
      const cs = cellSize();
      if (cs.w === 0 || cs.h === 0) return { col: 0, row: 0 };
      const col = clamp(Math.floor((clientX - rect.left) / cs.w), 0, GRID_SIZE - 1);
      const row = clamp(Math.floor((clientY - rect.top) / cs.h), 0, GRID_SIZE - 1);
      return { col, row };
    },
    [cellSize]
  );

  // ── REPOSITION: pointer handlers on module blocks ──
  const handleBlockPointerDown = useCallback(
    (key: string, e: React.PointerEvent) => {
      // Don't start drag if clicking on a button or resize handle
      if ((e.target as HTMLElement).closest('[data-resize-handle]') || (e.target as HTMLElement).closest('button')) return;
      if (key === 'api_configuration') return;
      e.preventDefault();
      const mod = modules.find((m) => m.key === key);
      if (!mod) return;
      const pos = posFromMouse(e.clientX, e.clientY);
      dragOffset.current = { dCol: pos.col - mod.col, dRow: pos.row - mod.row };
      setDraggingKey(key);
      setGhostPos({ col: mod.col, row: mod.row });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [modules, posFromMouse]
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingKey) {
        const pos = posFromMouse(e.clientX, e.clientY);
        const mod = modules.find((m) => m.key === draggingKey);
        if (!mod) return;
        const newCol = clamp(pos.col - dragOffset.current.dCol, 0, GRID_SIZE - mod.colSpan);
        const newRow = clamp(pos.row - dragOffset.current.dRow, 0, GRID_SIZE - mod.rowSpan);
        setGhostPos({ col: newCol, row: newRow });
      }
    },
    [draggingKey, modules, posFromMouse]
  );

  const handleGridPointerUp = useCallback(() => {
    if (draggingKey && ghostPos) {
      onChange(
        modules.map((m) =>
          m.key === draggingKey ? { ...m, col: ghostPos.col, row: ghostPos.row } : m
        )
      );
    }
    setDraggingKey(null);
    setGhostPos(null);
  }, [draggingKey, ghostPos, modules, onChange]);

  // ── RESIZE: pointer handlers on corner handle ──
  const handleResizePointerDown = useCallback(
    (key: string, e: React.PointerEvent) => {
      if (key === 'api_configuration') return;
      e.preventDefault();
      e.stopPropagation();
      const mod = modules.find((m) => m.key === key);
      if (!mod) return;
      resizeStart.current = { startX: e.clientX, startY: e.clientY, origColSpan: mod.colSpan, origRowSpan: mod.rowSpan };
      setResizingKey(key);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [modules]
  );

  useEffect(() => {
    if (!resizingKey) return;
    const onMove = (e: PointerEvent) => {
      const cs = cellSize();
      if (cs.w === 0 || cs.h === 0) return;
      const dx = e.clientX - resizeStart.current.startX;
      const dy = e.clientY - resizeStart.current.startY;
      const newColSpan = clamp(resizeStart.current.origColSpan + Math.round(dx / cs.w), 1, GRID_SIZE);
      const newRowSpan = clamp(resizeStart.current.origRowSpan + Math.round(dy / cs.h), 1, GRID_SIZE);
      const mod = modules.find((m) => m.key === resizingKey);
      if (!mod) return;
      const maxW = GRID_SIZE - mod.col;
      const maxH = GRID_SIZE - mod.row;
      onChange(
        modules.map((m) =>
          m.key === resizingKey
            ? { ...m, colSpan: clamp(newColSpan, 1, maxW), rowSpan: clamp(newRowSpan, 1, maxH) }
            : m
        )
      );
    };
    const onUp = () => setResizingKey(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [resizingKey, modules, onChange, cellSize]);

  // ── DROP FROM PALETTE ──
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      const pos = posFromMouse(e.clientX, e.clientY);
      setPaletteHover(pos);
    },
    [posFromMouse]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setPaletteHover(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setPaletteHover(null);
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      try {
        const mod: ModuleDefinition = JSON.parse(raw);
        if (modules.some((m) => m.key === mod.key)) return;
        const pos = posFromMouse(e.clientX, e.clientY);
        const isApiConfig = mod.key === 'api_configuration';
        const defaultColSpan = isApiConfig ? 4 : 4;
        const defaultRowSpan = isApiConfig ? 2 : 2;
        const fixedCol = GRID_SIZE - defaultColSpan;
        const col = isApiConfig ? fixedCol : clamp(pos.col, 0, GRID_SIZE - defaultColSpan);
        const row = isApiConfig ? 0 : clamp(pos.row, 0, GRID_SIZE - defaultRowSpan);
        const newMod: CanvasModule = {
          ...mod,
          index: modules.length + 1,
          col,
          row,
          colSpan: defaultColSpan,
          rowSpan: defaultRowSpan,
        };
        onChange([...modules, newMod]);
      } catch { /* ignore */ }
    },
    [modules, onChange, posFromMouse]
  );

  const handleRemove = useCallback(
    (key: string) => {
      const next = modules.filter((m) => m.key !== key);
      onChange(next.map((m, i) => ({ ...m, index: i + 1 })));
    },
    [modules, onChange]
  );

  const apiConfigModule = modules.find((m) => m.key === 'api_configuration');
  const gridModules = modules.filter((m) => m.key !== 'api_configuration');

  const handleRagDragOver = useCallback((e: React.DragEvent) => {
    if (!onRagDrop) return;
    const raw = e.dataTransfer.getData('text/object-id');
    if (!raw) return;
    e.preventDefault();
  }, [onRagDrop]);

  const handleRagDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
  }, []);

  const handleRagDrop = useCallback((e: React.DragEvent) => {
    if (!onRagDrop) return;
    const raw = e.dataTransfer.getData('text/object-id');
    if (!raw) return;
    e.preventDefault();
    const objectId = Number(raw);
    if (!Number.isNaN(objectId) && objectId > 0) {
      onRagDrop(objectId);
    }
  }, [onRagDrop]);

  // ── Render ──
  return (
    <div
      ref={gridRef}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handleGridPointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Grid lines */}
      <svg xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: GRID_SIZE + 1 }, (_, i) => {
          const pct = `${(i / GRID_SIZE) * 100}%`;
          return (
            <React.Fragment key={i}>
              <line x1={pct} y1="0" x2={pct} y2="100%" strokeWidth="1" />
              <line x1="0" y1={pct} x2="100%" y2={pct} strokeWidth="1" />
            </React.Fragment>
          );
        })}
      </svg>

      {/* Empty state */}
      {modules.length === 0 && !paletteHover && (
        <div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p>Drag modules here</p>
          <p>12 &times; 12 grid</p>
        </div>
      )}

      {/* Palette drop preview */}
      {paletteHover && (
        <div
          style={{
            left: `${(paletteHover.col / GRID_SIZE) * 100}%`,
            top: `${(paletteHover.row / GRID_SIZE) * 100}%`,
            width: `${(4 / GRID_SIZE) * 100}%`,
            height: `${(2 / GRID_SIZE) * 100}%`,
          }}
        />
      )}

      {apiConfigModule && (
        <div
          style={{ minHeight: '72px' }}
        >
          <div className={apiConfigModule.color} />
          <div>
            <div>{apiConfigModule.label}</div>
            <div>Botón en exportable</div>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(apiConfigModule.key)}
            title="Remove"
          >
            ×
          </button>
        </div>
      )}

      {/* Module blocks */}
      {gridModules.map((mod) => {
        const isBeingDragged = draggingKey === mod.key;
        const displayCol = isBeingDragged && ghostPos ? ghostPos.col : mod.col;
        const displayRow = isBeingDragged && ghostPos ? ghostPos.row : mod.row;
        const isResizing = resizingKey === mod.key;

        return (
          <div
            key={mod.key}
            onPointerDown={(e) => handleBlockPointerDown(mod.key, e)}
            onDragOver={mod.key === 'rag' ? handleRagDragOver : undefined}
            onDragLeave={mod.key === 'rag' ? handleRagDragLeave : undefined}
            onDrop={mod.key === 'rag' ? handleRagDrop : undefined}
            style={{
              left: `${(displayCol / GRID_SIZE) * 100}%`,
              top: `${(displayRow / GRID_SIZE) * 100}%`,
              width: `${(mod.colSpan / GRID_SIZE) * 100}%`,
              height: `${(mod.rowSpan / GRID_SIZE) * 100}%`,
              transition: isBeingDragged || isResizing ? 'none' : 'left 0.15s, top 0.15s, width 0.15s, height 0.15s, box-shadow 0.15s',
            }}
          >
            {/* Background fill */}
            <div />

            {/* Color accent */}
            <div className={mod.color} />

            {/* Content */}
            <div>
              <div>
                <div>
                  <div>
                    {mod.label}
                  </div>
                  <div>
                    {mod.type} &middot; idx {mod.index}
                  </div>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleRemove(mod.key)}
                  title="Remove"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* needsObject modules: object selector button */}
              {mod.needsObject && (
                <div>
                  {mod.objectId ? (
                    <div>
                      <div>
                        {mod.objectName || `Object #${mod.objectId}`}
                      </div>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onSelectObject?.(mod.key)}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onSelectObject?.(mod.key)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Select HTML
                    </button>
                  )}
                </div>
              )}

              {mod.key === 'rag' && (
                <div>
                  <p>
                    Inyecta documentos del proyecto para el exportable.
                  </p>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onRagOpenModal?.()}
                  >
                    Inyectar objetos
                  </button>
                  {ragObjects.length > 0 && (
                    <div>
                      <span>
                        Objetos: {ragObjects.length}
                      </span>
                      <div>
                        <div>
                          {ragObjects.map((obj) => (
                            <div key={obj.id}>
                              <span>{obj.name ?? `Objeto #${obj.id}`}</span>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onRagRemove?.(obj.id)}
                                title="Quitar"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    Arrastra objetos aquí
                  </div>
                </div>
              )}

              {mod.key === 'api_configuration' && (
                <div>
                  Se mostrará como botón de configuración en el exportable.
                </div>
              )}

              {/* textInput modules: inline text area */}
              {mod.textInput && mod.key !== 'api_configuration' && (
                <div>
                  <textarea
                    value={mod.textValue ?? ''}
                    onChange={(e) => onTextChange?.(mod.key, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder={mod.textPlaceholder ?? ''}
                  />
                </div>
              )}

              {/* Position info at bottom */}
              <div>
                ({mod.col},{mod.row}) {mod.colSpan}&times;{mod.rowSpan}
              </div>
            </div>

            {/* Resize handle (bottom-right corner) */}
            <div
              data-resize-handle
              onPointerDown={(e) => handleResizePointerDown(mod.key, e)}
              title="Drag to resize"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="20" cy="20" r="2" />
                <circle cx="20" cy="12" r="2" />
                <circle cx="12" cy="20" r="2" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DragDropCanvas;
