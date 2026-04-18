/**
 * Maker Path Types
 */

export type MakerPathType = 'architect_ai' | 'module_connector' | 'custom' | 'rag_chat_maker' | 'landing_page_maker' | 'image_generator_rag' | 'translation_maker' | 'style_transfer_maker' | 'assembler';
export type MakerPathStatus = 'draft' | 'in_progress' | 'completed';

export type MakerPathRole = 'owner' | 'admin' | 'collaborator' | 'viewer';

export interface MakerPath {
  id: number;
  title: string;
  description: string;
  type: MakerPathType;
  status: MakerPathStatus;
  data: string | null;
  projectType: string | null;
  projectName: string | null;
  projectMission: string | null;
  hasDatabase: boolean | null;
  hasApplicationDeployment?: boolean;
  optimizationProvider: string | null;
  apiSource: string | null;
  selectedTool: string | null;
  deploymentUrl: string | null;
  productLink: string | null;
  productStatus?: 'public' | 'private';
  editionUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  userId: number;
  // Multi-user project fields
  myRole?: MakerPathRole;
  isOwner?: boolean;
  isShared?: boolean;
  rag?: {
    id: number;
    cag: string | null;
    tool?: {
      id: number;
      title: string | null;
    } | null;
  } | null;
}

// Multi-User Project Share Types
export type ShareRole = 'viewer' | 'collaborator' | 'admin';

export interface ShareMember {
  id: number;
  user: {
    id: number;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  role: ShareRole;
  roleDisplay: string;
  createdBy: {
    id: number;
    email: string;
  };
  createdAt: string;
}

export interface ShareStatus {
  makerPathId: number;
  makerPathTitle: string;
  isShared: boolean;
  totalShares: number;
  isOwner: boolean;
  myRole: MakerPathRole | null;
  canManage: boolean;
}

export interface ShareMembersResponse {
  makerPathId: number;
  makerPathTitle: string;
  isShared: boolean;
  totalMembers: number;
  members: ShareMember[];
}

export interface AddMemberRequest {
  userId: number;
  role: ShareRole;
}

export interface UserSearchResult {
  id: number;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  avatarFilename: string | null;
}

export interface MakerPathsParams {
  type?: MakerPathType;
  hasApplicationDeployment?: boolean;
}

export interface CreateMakerPathRequest {
  title: string;
  description?: string;
  type?: MakerPathType;
  status?: MakerPathStatus;
  data?: string;
  projectType?: string;
  projectName?: string;
  projectMission?: string;
  hasDatabase?: boolean;
  productLink?: string;
  editionUrl?: string;
}

export interface UpdateMakerPathRequest {
  title?: string;
  description?: string;
  type?: MakerPathType;
  status?: MakerPathStatus;
  data?: string;
  productLink?: string;
  productStatus?: 'public' | 'private';
  editionUrl?: string;
}