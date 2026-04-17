/**
 * Chat Skill Types
 * For dynamic skills triggered via .//skillname in chat
 */

export type ChatSkillSourceType = 'manual' | 'object';
export type ChatSetupType = 'role' | 'skill';

export interface ChatSkill {
  id: number;
  type: ChatSetupType;
  name: string;
  instruction: string;
  sourceType: ChatSkillSourceType;
  objectId: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateChatSkillRequest {
  type?: ChatSetupType;
  name: string;
  instruction: string;
  sourceType?: ChatSkillSourceType;
  objectId?: number | null;
}

export interface UpdateChatSkillRequest {
  type?: ChatSetupType;
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
