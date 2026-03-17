export interface ModuleDefinition {
  key: string;
  label: string;
  description: string;
  type: 'CONFIG' | 'HTML' | 'TEXT' | 'JSON' | string;
  color: string; // tailwind bg class for the card accent
  /** When true, the module can be added multiple times (html_1, html_2, …) */
  dynamic?: boolean;
  /** When true, the module needs an uploaded HTML object (shows Select HTML button) */
  needsObject?: boolean;
  /** When true, the module is a free-text input field on the canvas */
  textInput?: boolean;
  /** Placeholder text for textInput modules */
  textPlaceholder?: string;
}

export const GRID_SIZE = 12;
export const MAX_HTML_INPUTS = 5;

export interface CanvasModule extends ModuleDefinition {
  /** Assembly order index (1-based) */
  index: number;
  /** Column position (0-based, 0–11) */
  col: number;
  /** Row position (0-based, 0–11) */
  row: number;
  /** Width in grid cells (1–12) */
  colSpan: number;
  /** Height in grid cells (1–12) */
  rowSpan: number;
  /** Associated object ID (set via object selector for needsObject modules) */
  objectId?: number | null;
  /** Display name of the associated object */
  objectName?: string | null;
  /** Free-text value for textInput modules */
  textValue?: string;
}

export interface LayoutEntry {
  module_name: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export const LANDING_PAGE_MODULES: ModuleDefinition[] = [
  {
    key: 'header',
    label: 'Header',
    description: 'HTML snippet for page header.',
    type: 'HTML',
    color: 'bg-sky-500',
    needsObject: true,
  },
  {
    key: 'body',
    label: 'Body',
    description: 'HTML snippet for main content.',
    type: 'HTML',
    color: 'bg-emerald-500',
    needsObject: true,
  },
  {
    key: 'footer',
    label: 'Footer',
    description: 'HTML snippet for footer.',
    type: 'HTML',
    color: 'bg-violet-500',
    needsObject: true,
  },
];

export const NOTEBOOK_MODULES: ModuleDefinition[] = [
  {
    key: 'buscador',
    label: 'Buscador',
    description: 'Módulo de búsqueda con funcionalidad y apariencia definida.',
    type: 'HTML',
    color: 'bg-sky-500',
  },
  {
    key: 'chat',
    label: 'Chat',
    description: 'Módulo de conversación donde el usuario escribe y ve respuestas.',
    type: 'HTML',
    color: 'bg-emerald-500',
  },
  {
    key: 'rag',
    label: 'RAG',
    description: 'Espacio para subir archivos PDF y documentos.',
    type: 'HTML',
    color: 'bg-violet-500',
  },
  {
    key: 'html_input',
    label: 'HTML Input',
    description: 'Selecciona un objeto HTML personalizado.',
    type: 'HTML',
    color: 'bg-rose-500',
    needsObject: true,
  },
];

export function getModulesForProduct(productType: string): ModuleDefinition[] {
  switch (productType) {
    case 'landing_page':
      return LANDING_PAGE_MODULES;
    case 'notebook':
      return NOTEBOOK_MODULES;
    default:
      return [];
  }
}
