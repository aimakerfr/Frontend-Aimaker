/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@apps/ComponenteEspanol' {
  import type { ComponentType } from 'react';
  const ComponenteEspanol: ComponentType;
  export default ComponenteEspanol;
}

declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const JsxComponent: ComponentType<any>;
  export default JsxComponent;
}