
export type Language = 'en' | 'es' | 'fr';

export interface ProjectState {
  objective: {
    title: string;
    description: string;
    goal: string;
    type: 'assistant' | 'web-app' | 'landing-page' | 'pdf' | '';
  };
  research: string[];
  notebook: {
    source1: string;
    source2: string;
    source3: string;
    source4: string;
    synthesis: string;
  };
  design: {
    role: string;
    experience: string;
    communication: string;
    process: string[];
  };
  optimizedPrompt: string;
}

export enum Phase {
  PRINCIPLE = -1,
  PHASE_0 = 0,
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3,
  PHASE_4 = 4,
  PHASE_5 = 5,
  PHASE_6 = 6
}
