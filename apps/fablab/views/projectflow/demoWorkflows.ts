import type { WorkflowJSON, AvailablePath } from './types';

/** Example workflows for the RAG Library / demo */
export const INITIAL_MAKERPATHS: Record<string, { json: WorkflowJSON; path: AvailablePath }> = {
  landing_page_maker: {
    path: {
      id: 'landing_page_maker',
      name: 'Landing Page Maker',
      description: 'A path for creating a basic landing page',
      outputType: 'HTML',
    },
    json: {
      simple_landing_creator: {
        stage_name: 'simple_landing_creator',
        description: 'A path for creating a basic landing page.',
        output_type: 'HTML',
        required_files: [
          { id: 1, name: 'header.html' },
          { id: 2, name: 'footer.html' },
          { id: 3, name: 'body.html' },
        ],
        steps: [
          {
            step_id: 1,
            name: 'Select Header',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'header.html',
            input_file_variable_index_number: 1,
            required: true,
          },
          {
            step_id: 2,
            name: 'Select Footer',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'footer.html',
            input_file_variable_index_number: 2,
            required: true,
          },
          {
            step_id: 3,
            name: 'Select Body Template',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'body.html',
            input_file_variable_index_number: 3,
            required: true,
          },
          {
            step_id: 4,
            name: 'Compile and Export Landing Page',
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
      name: 'RAG Chat Maker',
      description: 'A path for chatting with selected RAG knowledge sources.',
      outputType: 'TEXT',
    },
    json: {
      rag_chat_creator: {
        stage_name: 'rag_chat_creator',
        description: 'Chat interactively with selected RAG knowledge sources.',
        output_type: 'TEXT',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Select Knowledge Sources',
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'main_selected_rag',
            required: true,
          },
          {
            step_id: 2,
            name: 'Generate RAG Chat Response',
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
      name: 'Image Generator from RAG',
      description: 'Generate images using prompts built from RAG knowledge sources.',
      outputType: 'IMAGE',
    },
    json: {
      rag_image_generator: {
        stage_name: 'Imagen desde RAG (Simple)',
        description: 'Selecciona una tarjeta RAG, construye el prompt y genera la imagen.',
        output_type: 'IMAGE',
        required_files: [],
        required_variables: [1],
        steps: [
          {
            step_id: 1,
            name: 'Seleccionar tarjeta RAG',
            action: 'rag_selector',
            variable_index_number: 1,
            variable_name: 'image_rag_source',
            required: true,
          },
          {
            step_id: 2,
            name: 'Construir prompt visual',
            action: 'rag_chat',
            variable_index_number: 1,
            required: true,
          },
          {
            step_id: 3,
            name: 'Generar imagen',
            action: 'ia_generator',
            variable_index_number: 2,
            variable_name: 'generated_image_url',
            required: true,
          },
          {
            step_id: 4,
            name: 'Guardar resultado',
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
      name: 'Translation Maker',
      description: 'Create translation files (ES, EN, FR) from React components (JSX, TSX) and HTML files.',
      outputType: 'JSON',
    },
    json: {
      translation_workflow: {
        stage_name: 'translation_workflow',
        description: 'Extract text from code files and generate translation JSON for ES, EN, and FR.',
        output_type: 'JSON',
        required_files: [],
        required_variables: [1, 2],
        steps: [
          {
            step_id: 1,
            name: 'Upload & Analyze File',
            action: 'file_upload_analyzer',
            input_source_type: 'code_file',
            variable_index_number: 1,
            variable_name: 'uploaded_file_content',
            required: true,
          },
          {
            step_id: 2,
            name: 'Extract Text Variables',
            action: 'translation_extractor',
            variable_index_number: 1,
            required: true,
          },
          {
            step_id: 3,
            name: 'Generate Translations (ES, EN, FR)',
            action: 'translation_generator',
            variable_index_number: 2,
            variable_name: 'translations_json',
            required: true,
          },
          {
            step_id: 4,
            name: 'Save to Project or Download',
            action: 'translation_saver',
            variable_index_number: 2,
            required: true,
          },
        ],
      },
    },
  },
};
