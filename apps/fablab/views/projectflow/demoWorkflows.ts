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
};
