import type { StepAction, WorkflowStep } from '../types';

export type StepTemplate = {
  action: StepAction;
  label: string;
  defaults: Omit<WorkflowStep, 'step_id'>;
};

export const STEP_TEMPLATES: StepTemplate[] = [
  {
    action: 'rag_selector',
    label: 'RAG Selector',
    defaults: {
      name: 'Select Knowledge Sources',
      displayName: 'Seleccionar fuentes de conocimiento',
      action: 'rag_selector',
      required: true,
      variable_index_number: 1,
      variable_name: 'main_selected_rag',
    },
  },
  {
    action: 'rag_chat',
    label: 'RAG Chat',
    defaults: {
      name: 'Generate RAG Chat Response',
      displayName: 'Generar respuesta de chat RAG',
      action: 'rag_chat',
      required: true,
      variable_index_number: 1,
    },
  },
  {
    action: 'file_generator',
    label: 'File Generator',
    defaults: {
      name: 'Compile and Export',
      displayName: 'Compilar y exportar',
      action: 'file_generator',
      required: true,
      input_source_type: 'HTML',
    },
  },
  {
    action: 'file_upload_analyzer',
    label: 'File Upload & Analyzer',
    defaults: {
      name: 'Upload and Analyze File',
      displayName: 'Subir y analizar archivo',
      action: 'file_upload_analyzer',
      required: true,
      input_source_type: 'code_file',
      variable_index_number: 1,
      variable_name: 'uploaded_file_content',
    },
  },
  {
    action: 'translation_extractor',
    label: 'Translation Extractor',
    defaults: {
      name: 'AI: Detect and Translate',
      displayName: 'IA: Detectar y traducir',
      action: 'translation_extractor',
      required: true,
      variable_index_number: 2,
      variable_name: 'extracted_variables',
    },
  },
  {
    action: 'translation_saver',
    label: 'Translation Saver',
    defaults: {
      name: 'Save to Project or Download',
      displayName: 'Guardar en proyecto o descargar',
      action: 'translation_saver',
      required: false,
      variable_index_number: 3,
      variable_name: 'translations_json',
    },
  },
  {
    action: 'output_result_saver',
    label: 'Output Result Saver',
    defaults: {
      name: 'Save Result',
      displayName: 'Guardar resultado',
      action: 'output_result_saver',
      required: true,
    },
  },
];
