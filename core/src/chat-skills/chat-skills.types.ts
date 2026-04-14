/**
 * Chat Skill Types
 * For dynamic skills triggered via .//skillname in chat
 */

export type ChatSkillSourceType = 'manual' | 'object';

export interface ChatSkill {
  id: number;
  name: string;
  instruction: string;
  sourceType: ChatSkillSourceType;
  objectId: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateChatSkillRequest {
  name: string;
  instruction: string;
  sourceType?: ChatSkillSourceType;
  objectId?: number | null;
}

export interface UpdateChatSkillRequest {
  name?: string;
  instruction?: string;
  sourceType?: ChatSkillSourceType;
  objectId?: number | null;
}

export interface ParsedChatSkill {
  raw: string;
  skillName: string;
  skill: ChatSkill | null;
  startIndex: number;
  endIndex: number;
}
