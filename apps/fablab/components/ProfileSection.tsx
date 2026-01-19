import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Mail, Calendar, Shield, Award, FolderKanban, FileText, Notebook, BookOpen } from 'lucide-react';
import { ProfileService } from '@core/profile/profile.service';
import type { UserProfile as ApiUserProfile } from '@core/profile/profile.types';

// ProfileSection Component - Shows user profile information
const ProfileSection: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [profileData, setProfileData] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileService = new ProfileService();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profileData) {
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

  const displayName = profileData.firstName && profileData.lastName 
    ? `${profileData.firstName} ${profileData.lastName}` 
    : profileData.username || profileData.email.split('@')[0];

  const joinDate = new Date(profileData.createdAt).toLocaleDateString('es-ES', { 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
             <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1">
               <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500">
             <div className="text-lg font-semibold text-gray-900 dark:text-white">{displayName.charAt(0).toUpperCase()}</div>
               </div>
             </div>
             <button className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
               Edit Profile
             </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
            <Mail size={16} /> {profileData.email}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Shield size={16} />
                <span className="text-sm font-medium">Estado</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {profileData.isActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Award size={16} />
                <span className="text-sm font-medium">Idioma</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white uppercase">
                {profileData.uiLanguage}
              </div>
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar size={16} />
                <span className="text-sm font-medium">Miembro desde</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Estadísticas de Herramientas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700">
            <Notebook className="text-purple-600 dark:text-purple-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {profileData.stats.byType.note_books || 0}
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Notebooks</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <FolderKanban className="text-blue-600 dark:text-blue-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {profileData.stats.byType.project || 0}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Proyectos</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
            <FileText className="text-green-600 dark:text-green-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {profileData.stats.byType.prompt || 0}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">Prompts</div>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700">
            <BookOpen className="text-orange-600 dark:text-orange-400 mb-2" size={24} />
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {profileData.stats.totalTools}
            </div>
            <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">Total</div>
          </div>
        </div>
      </div>

      {profileData.bio && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acerca de</h2>
          <p className="text-gray-600 dark:text-gray-300">{profileData.bio}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
