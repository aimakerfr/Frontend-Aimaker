import type { WorkflowJSON, AvailablePath } from './types';

/** Example workflows for the RAG Library / demo */
export const getInitialMakerPaths = (t: any): Record<string, { json: WorkflowJSON; path: AvailablePath }> => ({
  landing_page_maker: {
    path: {
      id: 'landing_page_maker',
      name: t.makerPathTranslations?.['text_1'] ?? 'Landing Page Maker',
      description: t.makerPathTranslations?.['text_2'] ?? 'A path for creating a basic landing page',
      outputType: 'HTML',
    },
    json: {
      simple_landing_creator: {
        stage_name: 'simple_landing_creator',
        description: t.makerPathTranslations?.['text_3'] ?? 'A path for creating a basic landing page.',
        output_type: 'HTML',
        required_files: [
          { id: 1, name: t.makerPathTranslations?.['text_4'] ?? 'header.html' },
          { id: 2, name: t.makerPathTranslations?.['text_5'] ?? 'footer.html' },
          { id: 3, name: t.makerPathTranslations?.['text_6'] ?? 'body.html' },
        ],
        steps: [
          {
            step_id: 1,
            name: t.makerPathTranslations?.['text_7'] ?? 'Select Header',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: t.makerPathTranslations?.['text_4'] ?? 'header.html',
            input_file_variable_index_number: 1,
            required: true,
          },
          {
            step_id: 2,
            name: t.makerPathTranslations?.['text_8'] ?? 'Select Footer',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: t.makerPathTranslations?.['text_5'] ?? 'footer.html',
            input_file_variable_index_number: 2,
            required: true,
          },
          {
            step_id: 3,
            name: t.makerPathTranslations?.['text_9'] ?? 'Select Body Template',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: t.makerPathTranslations?.['text_6'] ?? 'body.html',
            input_file_variable_index_number: 3,
            required: true,
          },
          {
            step_id: 4,
            name: t.makerPathTranslations?.['text_10'] ?? 'Compile and Export Landing Page',
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
      name: t.makerPathTranslations?.['text_11'] ?? 'RAG Chat Maker',
      description: t.makerPathTranslations?.['text_12'] ?? 'A path for chatting with selected RAG knowledge sources.',
      outputType: 'TEXT',
    },
    json: {
      rag_chat_creator: {
        stage_name: 'rag_chat_creator',
        description: t.makerPathTranslations?.['text_13'] ?? 'Chat interactively with selected RAG knowledge sources.',
        output_type: 'TEXT',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: t.makerPathTranslations?.['text_14'] ?? 'Select Knowledge Sources',
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'main_selected_rag',
            required: true,
          },
          {
            step_id: 2,
            name: t.makerPathTranslations?.['text_15'] ?? 'Generate RAG Chat Response',
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
      name: t.makerPathTranslations?.['text_16'] ?? 'Image Generator from RAG',
      description: t.makerPathTranslations?.['text_17'] ?? 'Generate images using prompts built from RAG knowledge sources.',
      outputType: 'IMAGE',
    },
    json: {
      rag_image_generator: {
        stage_name: t.makerPathTranslations?.['text_18'] ?? 'Imagen desde RAG (Simple)',
        description: t.makerPathTranslations?.['text_19'] ?? 'Selecciona una tarjeta RAG, construye el prompt y genera la imagen.',
        output_type: 'IMAGE',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: t.makerPathTranslations?.['text_20'] ?? 'Seleccionar tarjeta RAG',
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'image_rag_source',
            required: true,
          },
          {
            step_id: 2,
            name: t.makerPathTranslations?.['text_21'] ?? 'Construir prompt visual',
            action: 'rag_chat',
            variable_index_number: 1,
            required: true,
          },
          {
            step_id: 3,
            name: t.makerPathTranslations?.['text_22'] ?? 'Generar imagen',
            action: 'ia_generator',
            variable_index_number: 2,
            variable_name: 'generated_image_url',
            required: true,
          },
          {
            step_id: 4,
            name: t.makerPathTranslations?.['text_23'] ?? 'Guardar resultado',
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
      name: t.makerPathTranslations?.['text_24'] ?? 'Translation Maker',
      description: t.makerPathTranslations?.['text_25'] ?? 'Create translation files (ES, EN, FR) from React components (JSX, TSX) and HTML files.',
      outputType: 'JSON',
    },
    json: {
      translation_workflow: {
        stage_name: 'translation_workflow',
        description: t.makerPathTranslations?.['text_26'] ?? 'Extract text from code files and generate translation JSON for ES, EN, and FR.',
        output_type: 'JSON',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: t.makerPathTranslations?.['text_27'] ?? 'Upload & Analyze File',
            action: 'file_upload_analyzer',
            input_source_type: 'code_file',
            variable_index_number: 1,
            variable_name: 'uploaded_file_content',
            required: true,
          },
          {
            step_id: 2,
            name: t.makerPathTranslations?.['text_28'] ?? 'AI: Detect and Translate',
            action: 'translation_extractor',
            variable_index_number: 2,
            variable_name: 'extracted_variables',
            required: true,
          },
          {
            step_id: 3,
            name: t.makerPathTranslations?.['text_29'] ?? 'Save to Project or Download',
            action: 'translation_saver',
            variable_index_number: 3,
            variable_name: 'translations_json',
            required: false,
          },
          {
            step_id: 4,
            name: t.makerPathTranslations?.['text_30'] ?? 'Manage Complete Project Languages',
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
