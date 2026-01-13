/**
 * Dashboard Constants
 * Mock data for resources (Prompts, Agents, Projects, Notebooks)
 */

import { MessageSquare, Bot, Folder, Book } from 'lucide-react';
import React from 'react';

export interface Resource {
  id: string;
  type: 'PROMPT' | 'AGENT' | 'PROJECT' | 'NOTEBOOK';
  name: string;
  description: string;
  author: {
    name: string;
    date: string;
    avatar?: string;
  };
  status?: string;
  tags?: string[];
  visibility?: 'PRIVATE' | 'PUBLIC' | 'TEAM';
  sharedWith?: string[];
  prompt?: string;
  category?: string;
}

// Type configuration for UI rendering
export const TYPE_CONFIG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  PROMPT: {
    bg: 'bg-purple-100',
    color: 'text-purple-600',
    icon: React.createElement(MessageSquare, { size: 20 }),
  },
  AGENT: {
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    icon: React.createElement(Bot, { size: 20 }),
  },
  PROJECT: {
    bg: 'bg-green-100',
    color: 'text-green-600',
    icon: React.createElement(Folder, { size: 20 }),
  },
  NOTEBOOK: {
    bg: 'bg-amber-100',
    color: 'text-amber-600',
    icon: React.createElement(Book, { size: 20 }),
  },
  RECHERCHE: {
    bg: 'bg-slate-100',
    color: 'text-slate-600',
    icon: React.createElement(MessageSquare, { size: 20 }),
  },
};

export const RESOURCES: Resource[] = [
  {
    id: '1',
    type: 'PROMPT',
    name: 'Generador de Contenido SEO',
    description: 'Prompt optimizado para crear contenido SEO-friendly',
    author: {
      name: 'Usuario Demo',
      date: '10/01/2026',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    tags: ['SEO', 'Marketing', 'Contenido'],
    visibility: 'PUBLIC',
  },
  {
    id: '2',
    type: 'AGENT',
    name: 'Asistente de Código',
    description: 'Agente especializado en revisión y mejora de código',
    author: {
      name: 'Usuario Demo',
      date: '09/01/2026',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    tags: ['Desarrollo', 'Code Review'],
    visibility: 'TEAM',
    sharedWith: ['Équipe Dev', 'Admin'],
  },
  {
    id: '3',
    type: 'PROJECT',
    name: 'Campaña de Marketing Q1',
    description: 'Proyecto completo de campaña de marketing para el primer trimestre',
    author: {
      name: 'Usuario Demo',
      date: '08/01/2026',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    status: 'En progreso',
    tags: ['Marketing', 'Campaña'],
    visibility: 'TEAM',
    sharedWith: ['Marketing', 'Admin'],
  },
  {
    id: '4',
    type: 'NOTEBOOK',
    name: 'Investigación de Mercado',
    description: 'Notebook con análisis y datos de investigación de mercado',
    author: {
      name: 'Usuario Demo',
      date: '07/01/2026',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
    tags: ['Investigación', 'Datos'],
    visibility: 'PUBLIC',
  },
];
