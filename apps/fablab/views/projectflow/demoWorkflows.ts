import type { WorkflowJSON, AvailablePath } from './types';

/** 
 * Example workflows for the RAG Library / demo
 * IMPORTANT: 'name' fields are INTERNAL IDENTIFIERS (never translated, used in logic)
 *            'displayName' fields are for UI DISPLAY (translated based on user language)
 */
export const getInitialMakerPaths = (t: any): Record<string, { json: WorkflowJSON; path: AvailablePath }> => ({
  landing_page_maker: {
    path: {
      id: 'landing_page_maker',
      name: t.demoWorkflowsTranslations?.['text_1'] ?? 'Landing Page Maker',
      description: t.demoWorkflowsTranslations?.['text_2'] ?? 'Un flujo para crear una landing page básica',
      outputType: 'HTML',
    },
    json: {
      simple_landing_creator: {
        stage_name: 'simple_landing_creator',
        description: t.demoWorkflowsTranslations?.['text_3'] ?? 'Un flujo para crear una landing page básica.',
        output_type: 'HTML',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Manage HTML Sources', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_11'] ?? 'Gestionar fuentes HTML', // UI display - translated
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'html_sources',
            required: true,
          },
          {
            step_id: 2,
            name: 'Compile and Export Landing Page', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_7'] ?? 'Compilar y exportar Landing Page', // UI display - translated
            action: 'file_generator',
            input_source_type: 'HTML',
            required: true,
          },
        ],
      },
    },
  },
  rag_chat_maker: {
    path: {
      id: 'rag_chat_maker',
      name: t.demoWorkflowsTranslations?.['text_8'] ?? 'RAG Chat Maker',
      description: t.demoWorkflowsTranslations?.['text_9'] ?? 'Un flujo para chatear con fuentes de conocimiento RAG seleccionadas.',
      outputType: 'TEXT',
    },
    json: {
      rag_chat_creator: {
        stage_name: 'rag_chat_creator',
        description: t.demoWorkflowsTranslations?.['text_10'] ?? 'Chatea interactivamente con fuentes RAG seleccionadas.',
        output_type: 'TEXT',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Select Knowledge Sources', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_11'] ?? 'Seleccionar fuentes de conocimiento', // UI display - translated
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'main_selected_rag',
            required: true,
          },
          {
            step_id: 2,
            name: 'Generate RAG Chat Response', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_12'] ?? 'Generar respuesta de chat RAG', // UI display - translated
            action: 'rag_chat',
            variable_index_number: 1,
            required: true,
          },
        ],
      },
    },
  },
  image_generator_rag: {
    path: {
      id: 'image_generator_rag',
      name: t.demoWorkflowsTranslations?.['text_13'] ?? 'Generador de imágenes desde RAG',
      description: t.demoWorkflowsTranslations?.['text_14'] ?? 'Genera imágenes usando prompts construidos desde fuentes RAG.',
      outputType: 'IMAGE',
    },
    json: {
      rag_image_generator: {
        stage_name: t.demoWorkflowsTranslations?.['text_15'] ?? 'Imagen desde RAG (Simple)',
        description: t.demoWorkflowsTranslations?.['text_16'] ?? 'Selecciona una tarjeta RAG, construye el prompt y genera la imagen.',
        output_type: 'IMAGE',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Select RAG Card', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_11'] ?? 'Seleccionar tarjeta RAG', // UI display - translated
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'image_rag_source',
            required: true,
          },
          {
            step_id: 2,
            name: 'Build Visual Prompt', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_18'] ?? 'Construir prompt visual', // UI display - translated
            action: 'rag_chat',
            variable_index_number: 1,
            required: true,
          },
          {
            step_id: 3,
            name: 'Generate Image', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_19'] ?? 'Generar imagen', // UI display - translated
            action: 'ia_generator',
            variable_index_number: 2,
            variable_name: 'generated_image_url',
            required: true,
          },
          {
            step_id: 4,
            name: 'Save Result', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_20'] ?? 'Guardar resultado', // UI display - translated
            action: 'output_result_saver',
            required: true,
          },
        ],
      },
    },
  },
  translation_maker: {
    path: {
      id: 'translation_maker',
      name: t.demoWorkflowsTranslations?.['text_21'] ?? 'Creador de Traducciones',
      description: t.demoWorkflowsTranslations?.['text_22'] ?? 'Crea archivos de traducción (ES, EN, FR) desde componentes React (JSX, TSX) y archivos HTML.',
      outputType: 'JSON',
    },
    json: {
      translation_workflow: {
        stage_name: 'translation_workflow',
        description: t.demoWorkflowsTranslations?.['text_23'] ?? 'Extrae texto de archivos de código y genera JSON de traducción para ES, EN y FR.',
        output_type: 'JSON',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Upload and Analyze File', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_24'] ?? 'Subir y analizar archivo', // UI display - translated
            action: 'file_upload_analyzer',
            input_source_type: 'code_file',
            variable_index_number: 1,
            variable_name: 'uploaded_file_content',
            required: true,
          },
          {
            step_id: 2,
            name: 'AI: Detect and Translate', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_25'] ?? 'IA: Detectar y traducir', // UI display - translated
            action: 'translation_extractor',
            variable_index_number: 2,
            variable_name: 'extracted_variables',
            required: true,
          },
          {
            step_id: 3,
            name: 'Save to Project or Download', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_26'] ?? 'Guardar en proyecto o descargar', // UI display - translated
            action: 'translation_saver',
            variable_index_number: 3,
            variable_name: 'translations_json',
            required: false,
          },
          {
            step_id: 4,
            name: 'Manage Complete Project Languages', // Internal identifier - never changes
            displayName: t.demoWorkflowsTranslations?.['text_27'] ?? 'Gestionar idiomas completos del proyecto', // UI display - translated
            action: 'language_manager',
            variable_index_number: 4,
            variable_name: 'complete_project_json',
            required: false,
          },
        ],
      },
    },
  },
});
