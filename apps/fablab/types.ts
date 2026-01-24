export type View = 'dashboard' | 'profile' | 'context' | 'maker-path' | 'library' | 'tools';

export interface UserProfile {
    name: string;
    email: string;
    role: string;
    level: 'Beginner' | 'Intermediate' | 'Expert';
    joinDate: string;
    stats: {
        projects: number;
        documents: number;
        tokensUsed: number;
        tokenLimit: number;
    };
}

export interface Project {
    id: string;
    name: string;
    description: string;
    icon: string;
    docCount: number;
    status: 'indexed' | 'indexing' | 'draft';
}

export interface AIContextConfig {
    tone: 'professional' | 'creative' | 'educational' | 'technical';
    responseLength: 'short' | 'balanced' | 'detailed';
    expertiseLevel: 'beginner' | 'intermediate' | 'expert';
    citeSources: boolean;
    autoSummary: boolean;
}

export interface ToolConfig {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    isSecure: boolean;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    isThinking?: boolean;
}

