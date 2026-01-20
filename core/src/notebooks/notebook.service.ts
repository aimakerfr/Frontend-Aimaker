import { httpClient } from '../api/http.client';

export interface Notebook {
  id: number;
  title: string;
  description?: string;
  type: 'note_books';
  language: 'fr' | 'en' | 'es';
  url?: string;
  hasPublicStatus: boolean;
  isTemplate: boolean;
  usageCount?: number;
  userId: number;
  typeLinkMore?: string;
  urlMore?: string;
  urlStudyTogether?: string;
}

export interface CreateNotebookData {
  creationToolId: number;
  typeLinkMore?: string;
  urlMore?: string;
  urlStudyTogether?: string;
}

export interface UpdateNotebookData {
  title?: string;
  description?: string;
  typeLinkMore?: string;
  urlMore?: string;
  urlStudyTogether?: string;
}

export class NotebookService {
  private baseUrl = '/api/v1/notebooks';

  async getNotebooks(): Promise<Notebook[]> {
    return httpClient.get<Notebook[]>(this.baseUrl);
  }

  async getNotebook(id: number): Promise<Notebook> {
    return httpClient.get<Notebook>(`${this.baseUrl}/${id}`);
  }

  async createNotebook(data: CreateNotebookData): Promise<Notebook> {
    return httpClient.post<Notebook>(this.baseUrl, data);
  }

  async updateNotebook(id: number, data: UpdateNotebookData): Promise<Notebook> {
    return httpClient.patch<Notebook>(`${this.baseUrl}/${id}`, data);
  }

  async deleteNotebook(id: number): Promise<void> {
    return httpClient.delete(`${this.baseUrl}/${id}`);
  }
}
