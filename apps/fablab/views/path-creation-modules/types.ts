export interface ModuleData {
  id: string;
  name: string;
  html: string;
  css: string;
  useTailwind: boolean;
}

export type ModuleType = 'header' | 'body' | 'footer';

export interface AppState {
  header: ModuleData;
  body: ModuleData;
  footer: ModuleData;
}

export type WizardStep = 'select' | 'edit' | 'export';

export type ExportFormat = 'html-only' | 'css-only' | 'html-tailwind' | 'combined';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: ModuleType;
  html: string;
  css: string;
  useTailwind: boolean;
  thumbnail?: string;
}
