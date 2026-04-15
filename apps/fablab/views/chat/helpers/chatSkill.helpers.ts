import type { ChatSkill } from '@core/chat-skills';

export type ParsedChatSkillResult = {
  cleanedText: string;
  skillInstructions: string[];
  skillNames: string[];
  formattedDisplay: string;
};

export const parseChatSkillFromInput = (text: string, chatSkills: ChatSkill[]): ParsedChatSkillResult => {
  const skillRegex = /(^|\s)\/([a-zA-Z0-9_-]+)/g;
  const matches = Array.from(text.matchAll(skillRegex));

  if (matches.length === 0) {
    return { cleanedText: text, skillInstructions: [], skillNames: [], formattedDisplay: text };
  }

  const foundSkills: { name: string; instruction: string; match: string }[] = [];

  for (const match of matches) {
    const skillName = match[2];
    const skill = chatSkills.find((s) => s.name === skillName);
    if (skill) {
      foundSkills.push({ name: skill.name, instruction: skill.instruction, match: match[0] });
    }
  }

  if (foundSkills.length === 0) {
    return { cleanedText: text, skillInstructions: [], skillNames: [], formattedDisplay: text };
  }

  let cleanedText = text;
  cleanedText = cleanedText.replace(skillRegex, (_match, lead) => lead);
  cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim();

  const skillNames = foundSkills.map((s) => s.name);
  const skillInstructions = foundSkills.map((s) => s.instruction);
  const formattedDisplay = `⚡ ${skillNames.join(' ')}: ${cleanedText}`;

  return {
    cleanedText,
    skillInstructions,
    skillNames,
    formattedDisplay,
  };
};

export const buildSystemPromptWithChatSkill = (baseSystemPrompt: string, chatSkillInstructions: string[]): string => {
  if (chatSkillInstructions.length === 0) return baseSystemPrompt;

  const combinedInstructions = chatSkillInstructions
    .map((instruction, index) => `[SKILL ${index + 1}]\n${instruction}`)
    .join('\n\n');

  return `${baseSystemPrompt}\n\n[CHAT SKILL INSTRUCTIONS - APLICAN SOLO PARA ESTE MENSAJE]\n${combinedInstructions}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const buildHighlightedInputHtml = (value: string, chatSkills: ChatSkill[]): string => {
  if (!value) return '';
  const skillRegex = /(^|\s)\/([a-zA-Z0-9_-]+)/g;
  return escapeHtml(value).replace(skillRegex, (match, lead, skillName) => {
    const exists = chatSkills.some((skill) => skill.name === skillName);
    if (!exists) return match;
    return `${lead}<span class="fablab-input-skill-highlight">/${skillName}</span>`;
  });
};
