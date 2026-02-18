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
        steps: [
          {
            step_id: 1,
            name: 'Select Header',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'header.html',
            required: true,
          },
          {
            step_id: 2,
            name: 'Select Footer',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'footer.html',
            required: true,
          },
          {
            step_id: 3,
            name: 'Select Body Template',
            action: 'rag_library_selector',
            input_source_type: 'HTML',
            input_file_variable: 'body.html',
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
