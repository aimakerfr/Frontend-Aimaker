/**
 * ProjectFlow Types
 * Defines the data structures for the visual workflow interpreter
 */

/** Possible actions a workflow step can perform */
export type StepAction =
  | 'rag_library_selector'
  | 'prompt_library_selector'
  | 'ia_generator'
  | 'text_input'
  | 'information_searcher'
  | 'rag_library_uploader'
  | 'prompt_optimizer'
  | 'api_configurator'
  | 'output_result_saver'
  | 'text_processor'
  | 'file_generator'
  | 'rag_selector'
  | 'rag_chat'
  | 'file_upload_analyzer'
  | 'translation_extractor'
  | 'translation_generator'
  | 'translation_saver'
  | 'language_manager'
  // Legacy actions (backward compatibility)
  | 'fetch_data'
  | 'select_file'
  | 'select_rag_source'
  | 'user_input_and_ai_refinement'
  | 'compile_and_export'
  | 'ai_analysis_generation'
  | 'information_search'
  | 'rag_upload'
  | 'api_configuration'
  | 'store_data'
  | 'text_processing';

/** Source type for a step's input */
export type InputSourceType =
  | 'HTML'
  | 'HTML_template'
  | 'CSS'
  | 'text_input'
  | 'RAG'
  | 'prompt'
  | 'json'
  | 'image'
  | 'file'
  | 'api_key'
  | 'JSX'
  | 'TSX'
  | 'code_file';

/** Output format for the final compiled step */
export type OutputFormat = 'HTML' | 'JSON' | 'PDF' | 'TEXT' | 'IMAGE';

/** A single step in the workflow */
export interface WorkflowStep {
  step_id: number;
  /** Internal identifier - should never be translated (used in logic) */
  name: string;
  /** Translated name for UI display only - if not provided, 'name' will be used */
  displayName?: string;
  action: StepAction;
  input_source_type?: InputSourceType;
  input_file_variable?: string;
  /** 1-based position of this file variable within the maker path */
  input_file_variable_index_number?: number;
  input_prompt?: string;
  output_format?: OutputFormat;
  output_type?: string;
  required: boolean;
  /** Variable index number for steps that save variables (e.g., rag_selector) */
  variable_index_number?: number;
  /** Variable name for steps that save variables */
  variable_name?: string;
}

/** The workflow definition parsed from JSON */
export interface WorkflowDefinition {
  stage_name: string;
  description: string;
  output_type?: string;
  /** Optional list of required files for the path; reserved for future UI use */
  required_files?: Array<{ id: string | number; name: string }>;
  /** Optional list of required variable indices for the path */
  required_variables?: number[];
  steps: WorkflowStep[];
}

/** Parsed JSON root – the key is the workflow title */
export type WorkflowJSON = Record<string, WorkflowDefinition>;

/** Represents a single available path entry in the sidebar */
export interface AvailablePath {
  id: string;
  name: string;
  description: string;
  outputType: string;
}

/** Configuration state for a single node (right panel) */
export interface NodeConfig {
  stepId: number;
  name: string;
  required: boolean;
  action: StepAction;
  inputSourceType?: InputSourceType;
  promptContent?: string;
  inputFileVariable?: string;
  /** 1-based position of this file variable within the maker path */
  inputFileVariableIndexNumber?: number;
  geminiKeyConfigured: boolean;
  outputFormat?: OutputFormat;
}

/** Card type identifiers for node rendering */
export type CardType =
  | 'rag_library'
  | 'prompt_library'
  | 'ia_generator'
  | 'text_input'
  | 'information_search'
  | 'rag_upload'
  | 'prompt_optimizer'
  | 'file_upload'
  | 'translation_processor'
  | 'api_configuration'
  | 'store_data'
  | 'text_processing';

/** Maps step actions to card types for visual rendering */
export const ACTION_TO_CARD_TYPE: Record<StepAction, CardType> = {
  // New action types
  rag_library_selector: 'rag_library',
  prompt_library_selector: 'prompt_library',
  ia_generator: 'ia_generator',
  text_input: 'text_input',
  information_searcher: 'information_search',
  rag_library_uploader: 'rag_upload',
  prompt_optimizer: 'prompt_optimizer',
  api_configurator: 'api_configuration',
  output_result_saver: 'store_data',
  text_processor: 'text_processing',
  file_generator: 'store_data',
  file_upload_analyzer: 'file_upload',
  translation_extractor: 'translation_processor',
  translation_generator: 'translation_processor',
  translation_saver: 'store_data',
  rag_selector: 'rag_library',
  rag_chat: 'ia_generator',
  language_manager: 'translation_processor',
  // Legacy actions (backward compatibility)
  fetch_data: 'rag_library',
  select_file: 'rag_library',
  select_rag_source: 'rag_library',
  user_input_and_ai_refinement: 'text_input',
  compile_and_export: 'store_data',
  ai_analysis_generation: 'ia_generator',
  information_search: 'information_search',
  rag_upload: 'rag_upload',
  api_configuration: 'api_configuration',
  store_data: 'store_data',
  text_processing: 'text_processing',
};

/** Visual label that appears below the node title */
export const ACTION_LABELS: Record<StepAction, string> = {
  // New action types
  rag_library_selector: 'RAG LIBRARY SELECTOR',
  prompt_library_selector: 'PROMPT LIBRARY SELECTOR',
  ia_generator: 'IA GENERATOR',
  text_input: 'TEXT INPUT',
  information_searcher: 'INFORMATION SEARCHER',
  rag_library_uploader: 'RAG LIBRARY UPLOADER',
  prompt_optimizer: 'PROMPT OPTIMIZER',
  file_upload_analyzer: 'FILE UPLOAD & ANALYZER',
  translation_extractor: 'TRANSLATION EXTRACTOR',
  translation_generator: 'TRANSLATION GENERATOR',
  translation_saver: 'TRANSLATION SAVER',
  language_manager: 'LANGUAGE MANAGER',
  api_configurator: 'API CONFIGURATOR',
  output_result_saver: 'OUTPUT RESULT SAVER',
  text_processor: 'TEXT PROCESSOR',
  file_generator: 'FILE GENERATOR',
  rag_selector: 'RAG SELECTOR',
  rag_chat: 'RAG CHAT',
  // Legacy actions (backward compatibility)
  fetch_data: 'FETCH DATA',
  select_file: 'SELECT FILE',
  select_rag_source: 'SELECT RAG SOURCE',
  user_input_and_ai_refinement: 'USER INPUT & AI REFINEMENT',
  compile_and_export: 'COMPILE & EXPORT',
  ai_analysis_generation: 'AI ANALYSIS GENERATION',
  information_search: 'INFORMATION SEARCH',
  rag_upload: 'RAG UPLOAD',
  api_configuration: 'API CONFIGURATION',
  store_data: 'STORE DATA',
  text_processing: 'TEXT PROCESSING',
};
