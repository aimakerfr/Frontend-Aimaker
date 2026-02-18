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
};
