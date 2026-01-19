import React from 'react';
import { UserProfile } from '../types';
import { Mail, Calendar, Shield, Award } from 'lucide-react';

// ProfileSection Component - Shows user profile information
const ProfileSection: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  // Early validation - show loading if user data is incomplete
  if (!user || !user.name || !user.email) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center text-gray-500">
            Cargando perfil...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
             <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1">
               <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500">
                 {user.name.charAt(0)}
               </div>
             </div>
             <button className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
               Edit Profile
             </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
            <Mail size={16} /> {user.email}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Shield size={16} />
                <span className="text-sm font-medium">Role</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{user.role}</div>
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Award size={16} />
                <span className="text-sm font-medium">Skill Level</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{user.level}</div>
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar size={16} />
                <span className="text-sm font-medium">Joined</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{user.joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Subscription & Limits</h2>
        <div className="space-y-4">
           <div>
             <div className="flex justify-between text-sm font-medium mb-1">
               <span className="text-gray-700 dark:text-gray-300">Monthly Token Budget</span>
               <span className="text-gray-900 dark:text-white">{(user.stats.tokensUsed/1000).toFixed(1)}k / {(user.stats.tokenLimit/1000).toFixed(0)}k</span>
             </div>
             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
               <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: `${(user.stats.tokensUsed / user.stats.tokenLimit) * 100}%` }}></div>
             </div>
           </div>
           
           <div className="pt-4 flex gap-3">
             <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium text-sm">Upgrade Plan</button>
             <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm">Billing Settings</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
