import React, { useEffect, useState, useCallback } from 'react';
import type { MakerPath, ShareMember, UserSearchResult, ShareRole } from '@core/maker-path/maker-path.types';
import {
  getShareStatus,
  getShareMembers,
  addShareMember,
  removeShareMember,
  toggleShare,
  searchUsers,
} from '@core/maker-path/maker-path-share.service';

interface ShareProjectModalProps {
  project: MakerPath;
  isOpen: boolean;
  onClose: () => void;
  onShareUpdated: () => void;
}

const ROLES: { value: ShareRole; label: string; description: string }[] = [
  { value: 'viewer', label: 'Viewer', description: 'Can only view the project' },
  { value: 'collaborator', label: 'Collaborator', description: 'Can edit and deploy but cannot rename or delete' },
  { value: 'admin', label: 'Admin', description: 'Can rename and delete the project' },
];

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onShareUpdated,
}) => {
  const [isShared, setIsShared] = useState(false);
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<ShareRole>('viewer');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Load share status and members
  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const [status, membersData] = await Promise.all([
        getShareStatus(project.id),
        getShareMembers(project.id),
      ]);
      setIsShared(status.isShared);
      setMembers(membersData.members);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load sharing data');
    } finally {
      setLoading(false);
    }
  }, [isOpen, project.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search users
  useEffect(() => {
    if (!showAddForm || userSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(userSearchQuery, 10);
        // Filter out already added users
        const existingIds = new Set(members.map(m => m.user.id));
        setSearchResults(results.users.filter(u => !existingIds.has(u.id)));
      } catch (e) {
        // Silent fail
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [userSearchQuery, showAddForm, members]);

  const handleToggleShare = async () => {
    setLoading(true);
    try {
      const result = await toggleShare(project.id, !isShared);
      setIsShared(result.isShared);
      if (!result.isShared) {
        setMembers([]);
      }
      onShareUpdated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to toggle sharing');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setAdding(true);
    try {
      await addShareMember(project.id, { userId: selectedUser.id, role: selectedRole });
      setSelectedUser(null);
      setUserSearchQuery('');
      setShowAddForm(false);
      await loadData();
      onShareUpdated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setLoading(true);
    try {
      await removeShareMember(project.id, userId);
      await loadData();
      onShareUpdated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Share Project
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {project.title}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Enable Sharing Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Project Sharing</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isShared ? 'Project is shared with others' : 'Project is private'}
              </p>
            </div>
            <button
              onClick={handleToggleShare}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isShared ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShared ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Members List */}
          {isShared && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Members ({members.length})
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
                >
                  {showAddForm ? 'Cancel' : '+ Add Member'}
                </button>
              </div>

              {/* Add Member Form */}
              {showAddForm && (
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 space-y-3">
                  {/* User Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search User
                    </label>
                    <input
                      type="text"
                      value={selectedUser ? selectedUser.displayName : userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setSelectedUser(null);
                      }}
                      placeholder="Type at least 2 characters..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                    {searching && (
                      <p className="mt-1 text-xs text-gray-500">Searching...</p>
                    )}
                    {searchResults.length > 0 && !selectedUser && (
                      <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchResults([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {userSearchQuery.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                        No users found for "{userSearchQuery}"
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as ShareRole)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUser || adding}
                    className="w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              )}

              {/* Members Table */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {member.user.firstName && member.user.lastName
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user.username || member.user.email}
                      </div>
                      <div className="text-xs text-gray-500">{member.user.email}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {member.roleDisplay}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={loading}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    No members yet. Add members to share this project.
                  </p>
                )}
              </div>
            </>
          )}

          {!isShared && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              Enable sharing to collaborate with others on this project.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
