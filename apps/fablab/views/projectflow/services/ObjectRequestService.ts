export type ObjectRequestEvent = 'changed';

type Listener = () => void;

export type StoredWorkflowStep = {
  step_id: number;
  name: string;
  displayName?: string;
  action: any;
  input_source_type?: any;
  input_file_variable?: string;
  input_file_variable_index_number?: number;
  input_prompt?: string;
  output_format?: any;
  output_type?: string;
  required: boolean;
  variable_index_number?: number;
  variable_name?: string;
};

export type StoredWorkflow = {
  id: string;
  name: string;
  description: string;
  outputType: string;
  stageName: string;
  steps: StoredWorkflowStep[];
  source?: 'demo' | 'custom';
  updatedAt: string;
};

export type WorkflowLibraryState = {
  version: number;
  workflows: Record<string, StoredWorkflow>;
};

const STORAGE_KEY = 'projectflow.library';
const STORAGE_VERSION = 1;

const safeParse = (raw: string | null): WorkflowLibraryState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as WorkflowLibraryState;
  } catch {
    return null;
  }
};

class ObjectRequestService {
  private listeners = new Set<Listener>();

  constructor() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.emit();
      }
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private readState(): WorkflowLibraryState {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (parsed && parsed.version === STORAGE_VERSION && parsed.workflows) {
      return parsed;
    }
    return { version: STORAGE_VERSION, workflows: {} };
  }

  private writeState(next: WorkflowLibraryState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.emit();
  }

  getState(): WorkflowLibraryState {
    return this.readState();
  }

  getWorkflows(): StoredWorkflow[] {
    const state = this.readState();
    return Object.values(state.workflows).sort((a, b) => a.name.localeCompare(b.name));
  }

  getWorkflow(id: string): StoredWorkflow | null {
    const state = this.readState();
    return state.workflows[id] || null;
  }

  upsertWorkflow(workflow: Omit<StoredWorkflow, 'updatedAt'>): StoredWorkflow {
    const state = this.readState();
    const next: StoredWorkflow = {
      ...workflow,
      updatedAt: new Date().toISOString(),
    };
    state.workflows[next.id] = next;
    this.writeState({ ...state });
    return next;
  }

  deleteWorkflow(id: string): void {
    const state = this.readState();
    if (!state.workflows[id]) return;
    delete state.workflows[id];
    this.writeState({ ...state });
    try {
      localStorage.removeItem(`projectflow.completed.${id}`);
    } catch {
      // ignore
    }
  }

  ensureSeed(seed: Array<Omit<StoredWorkflow, 'updatedAt'>>): void {
    const state = this.readState();
    let changed = false;

    for (const wf of seed) {
      if (!state.workflows[wf.id]) {
        state.workflows[wf.id] = { ...wf, updatedAt: new Date().toISOString() };
        changed = true;
      }
    }

    if (changed) {
      this.writeState({ ...state });
    }
  }
}

export const objectRequestService = new ObjectRequestService();
export { STORAGE_KEY as PROJECTFLOW_LIBRARY_STORAGE_KEY };
