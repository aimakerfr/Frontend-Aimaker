
export type SourceType = 'pdf' | 'url' | 'text' | 'video' | 'image' | 'html' | 'translation';
export type Language = 'es' | 'en' | 'fr';

export interface Source {
    id: string;
    title: string;
    type: SourceType;
    content: string;
    dateAdded: Date;
    selected: boolean;
    url?: string;
    previewUrl?: string; // Almacena el Blob URL o URL externa para vista previa
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export interface SourceAnalysis {
    title: string;
    type: SourceType;
    summary: string;
    keyTopics: string[];
    suggestedQuestions: string[];
}

export interface StructuredSummary {
    globalOverview: string;
    sourcesAnalysis: SourceAnalysis[];
}

export interface NotebookState {
    id: string;
    name: string;
    sources: Source[];
    chatHistory: ChatMessage[];
}

export type StudioToolType = 'summary' | 'study-guide' | 'audio-overview' | 'quiz' | 'mind-map';

export interface StudioResult {
    id: string;
    type: StudioToolType;
    title: string;
    content: string;
    createdAt: Date;
    audioData?: string;
}
