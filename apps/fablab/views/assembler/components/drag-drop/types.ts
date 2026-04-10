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
  /** API key type required by this module (e.g., 'gemini', 'perplexity', 'openai') */
  apiKeyType?: string;
}

/** Map of API key types to their configuration */
export interface ApiKeyConfig {
  key: string;
  label: string;
  placeholder: string;
  envVar: string;
}

/** Available API key configurations */
export const API_KEY_CONFIGS: Record<string, ApiKeyConfig> = {
  gemini: {
    key: 'gemini',
    label: 'Gemini API Key',
    placeholder: 'Ingresa tu API key de Google Gemini',
    envVar: 'GEMINI_API_KEY',
  },
  perplexity: {
    key: 'perplexity',
    label: 'Perplexity API Key',
    placeholder: 'Ingresa tu API key de Perplexity',
    envVar: 'PERPLEXITY_API_KEY',
  },
};

export const GRID_SIZE = 12;
export const MAX_HTML_INPUTS = 5;

export interface ModuleGroup {
  id: string;
  label: string;
  description?: string;
  containerClass: string;
  titleClass: string;
  modules: ModuleDefinition[];
}

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
    key: 'chat',
    label: 'Chat',
    description: 'Módulo de conversación donde el usuario escribe y ve respuestas.',
    type: 'HTML',
    color: 'bg-emerald-500',
    apiKeyType: 'gemini',
  },
  {
    key: 'rag',
    label: 'RAG',
    description: 'Espacio para subir archivos PDF y documentos.',
    type: 'HTML',
    color: 'bg-violet-500',
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    description: 'Buscador inteligente potenciado por Perplexity AI.',
    type: 'HTML',
    color: 'bg-sky-500',
    apiKeyType: 'perplexity',
  },
];

export const UNGROUPED_MODULES: ModuleDefinition[] = [
  {
    key: 'buscador',
    label: 'Buscador',
    description: 'Módulo de búsqueda con funcionalidad y apariencia definida.',
    type: 'HTML',
    color: 'bg-sky-500',
  },
  {
    key: 'html_input',
    label: 'HTML Input',
    description: 'Selecciona un objeto HTML personalizado.',
    type: 'HTML',
    color: 'bg-rose-500',
    needsObject: true,
  },
  {
    key: 'api_configuration',
    label: 'API Configuration',
    description: 'Configura la API global del proyecto.',
    type: 'CONFIG',
    color: 'bg-amber-500',
  },
];

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'landing_page',
    label: 'LandingPage modules',
    description: 'Módulos base para una landing page.',
    containerClass: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800/60',
    titleClass: 'text-sky-700 dark:text-sky-200',
    modules: LANDING_PAGE_MODULES,
  },
  {
    id: 'notebook',
    label: 'Notebook modules',
    description: 'Bloques principales de un notebook.',
    containerClass: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/60',
    titleClass: 'text-emerald-700 dark:text-emerald-200',
    modules: NOTEBOOK_MODULES,
  },
];

export const ALL_MODULES: ModuleDefinition[] = [
  ...LANDING_PAGE_MODULES,
  ...NOTEBOOK_MODULES,
  ...UNGROUPED_MODULES,
];
