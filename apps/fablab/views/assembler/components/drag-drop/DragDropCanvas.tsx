import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ModuleDefinition, CanvasModule } from './types';
import { GRID_SIZE } from './types';

type Props = {
  modules: CanvasModule[];
  onChange: (modules: CanvasModule[]) => void;
  /** Called when a module block requests object selection (for needsObject modules) */
  onSelectObject?: (moduleKey: string) => void;
  /** Called when a textInput module's value changes */
  onTextChange?: (moduleKey: string, value: string) => void;
};

/** Clamp a value between min and max */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const DragDropCanvas: React.FC<Props> = ({ modules, onChange, onSelectObject, onTextChange }) => {
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
        const defaultColSpan = 4;
        const defaultRowSpan = 2;
        const col = clamp(pos.col, 0, GRID_SIZE - defaultColSpan);
        const row = clamp(pos.row, 0, GRID_SIZE - defaultRowSpan);
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

  // ── Render ──
  return (
    <div
      ref={gridRef}
      className="relative select-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 overflow-hidden"
      style={{ aspectRatio: '1 / 1' }}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handleGridPointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: GRID_SIZE + 1 }, (_, i) => {
          const pct = `${(i / GRID_SIZE) * 100}%`;
          return (
            <React.Fragment key={i}>
              <line x1={pct} y1="0" x2={pct} y2="100%" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />
              <line x1="0" y1={pct} x2="100%" y2={pct} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />
            </React.Fragment>
          );
        })}
      </svg>

      {/* Empty state */}
      {modules.length === 0 && !paletteHover && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Drag modules here</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">12 &times; 12 grid</p>
        </div>
      )}

      {/* Palette drop preview */}
      {paletteHover && (
        <div
          className="absolute rounded-lg border-2 border-dashed border-brand-400 bg-brand-100/40 dark:border-brand-500 dark:bg-brand-900/20 pointer-events-none z-20 transition-all duration-75"
          style={{
            left: `${(paletteHover.col / GRID_SIZE) * 100}%`,
            top: `${(paletteHover.row / GRID_SIZE) * 100}%`,
            width: `${(4 / GRID_SIZE) * 100}%`,
            height: `${(2 / GRID_SIZE) * 100}%`,
          }}
        />
      )}

      {/* Module blocks */}
      {modules.map((mod) => {
        const isBeingDragged = draggingKey === mod.key;
        const displayCol = isBeingDragged && ghostPos ? ghostPos.col : mod.col;
        const displayRow = isBeingDragged && ghostPos ? ghostPos.row : mod.row;
        const isResizing = resizingKey === mod.key;

        return (
          <div
            key={mod.key}
            onPointerDown={(e) => handleBlockPointerDown(mod.key, e)}
            className={
              'absolute rounded-lg border shadow-sm flex flex-col overflow-hidden transition-shadow ' +
              (isBeingDragged
                ? 'z-30 opacity-80 shadow-lg cursor-grabbing ring-2 ring-brand-400'
                : isResizing
                ? 'z-30 shadow-lg ring-2 ring-brand-400'
                : 'z-10 cursor-grab hover:shadow-md hover:z-20')
            }
            style={{
              left: `${(displayCol / GRID_SIZE) * 100}%`,
              top: `${(displayRow / GRID_SIZE) * 100}%`,
              width: `${(mod.colSpan / GRID_SIZE) * 100}%`,
              height: `${(mod.rowSpan / GRID_SIZE) * 100}%`,
              transition: isBeingDragged || isResizing ? 'none' : 'left 0.15s, top 0.15s, width 0.15s, height 0.15s, box-shadow 0.15s',
            }}
          >
            {/* Background fill */}
            <div className="absolute inset-0 bg-white dark:bg-gray-900 opacity-95" />

            {/* Color accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${mod.color}`} />

            {/* Content */}
            <div className="relative flex flex-col h-full p-2 pt-2.5">
              <div className="flex items-start justify-between gap-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {mod.label}
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                    {mod.type} &middot; idx {mod.index}
                  </div>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleRemove(mod.key)}
                  className="flex-shrink-0 p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:text-gray-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* needsObject modules: object selector button */}
              {mod.needsObject && (
                <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0">
                  {mod.objectId ? (
                    <div className="text-center">
                      <div className="text-[10px] font-medium text-green-700 dark:text-green-300 truncate max-w-full px-1">
                        {mod.objectName || `Object #${mod.objectId}`}
                      </div>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onSelectObject?.(mod.key)}
                        className="mt-1 text-[9px] text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onSelectObject?.(mod.key)}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 text-[10px] font-semibold transition shadow-sm"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Select HTML
                    </button>
                  )}
                </div>
              )}

              {/* textInput modules: inline text area */}
              {mod.textInput && (
                <div className="flex-1 flex flex-col min-h-0 mt-1">
                  <textarea
                    value={mod.textValue ?? ''}
                    onChange={(e) => onTextChange?.(mod.key, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder={mod.textPlaceholder ?? ''}
                    className="flex-1 w-full resize-none rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-1 text-[10px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Position info at bottom */}
              <div className="mt-auto text-[8px] text-gray-300 dark:text-gray-600 tabular-nums">
                ({mod.col},{mod.row}) {mod.colSpan}&times;{mod.rowSpan}
              </div>
            </div>

            {/* Resize handle (bottom-right corner) */}
            <div
              data-resize-handle
              onPointerDown={(e) => handleResizePointerDown(mod.key, e)}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 flex items-end justify-end"
              title="Drag to resize"
            >
              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
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
