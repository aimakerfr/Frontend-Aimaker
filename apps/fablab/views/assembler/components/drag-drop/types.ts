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
    key: 'css_generator',
    label: 'CSS Generator',
    description: 'Describe el estilo visual (colores, tipografía, espaciado).',
    type: 'CONFIG',
    color: 'bg-amber-500',
    textInput: true,
    textPlaceholder: 'Ej: Colores oscuros, acentos verdes, tipografía sans-serif, botones redondeados...',
  },
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
    key: 'api_key',
    label: 'API Key',
    description: 'Pega tu API key aquí.',
    type: 'CONFIG',
    color: 'bg-amber-500',
    textInput: true,
    textPlaceholder: 'AIzaSy...',
  },
  {
    key: 'chat_instruction',
    label: 'Instrucción del Asistente',
    description: 'Define el comportamiento del chat.',
    type: 'TEXT',
    color: 'bg-sky-500',
    textInput: true,
    textPlaceholder: 'Ej: Eres un asistente experto en...',
  },
  {
    key: 'main_visual_template',
    label: 'Visual Template',
    description: 'Selecciona la plantilla HTML del notebook.',
    type: 'HTML',
    color: 'bg-emerald-500',
    needsObject: true,
  },
  {
    key: 'buscador',
    label: 'Buscador',
    description: 'Módulo de búsqueda del notebook.',
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
