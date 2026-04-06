import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Mail, Calendar, Shield, Globe, Code, Edit2, Save, X, Phone } from 'lucide-react';
import { ProfileService } from '@core/profile/profile.service';
import { httpClient } from '@core/api/http.client';
import type { UserProfile as ApiUserProfile } from '@core/profile/profile.types';
import { useLanguage } from '../language/useLanguage';
import ProductMetricsModule from './ProductMetricsModule';
import ProfileChatRuntimeConfig from './profile/ProfileChatRuntimeConfig';

// ProfileSection Component - Shows user profile information
const ProfileSection: React.FC<{ user: UserProfile | null }> = () => {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    firstName: '', 
    uiLanguage: '', 
    phoneNumber: '', 
    category: 'student' as const
  });
  const [saving, setSaving] = useState(false);

  const profileService = new ProfileService();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const data = await profileService.getProfile();
      setProfileData(data);
      setEditForm({
        firstName: data.firstName || '',
        uiLanguage: data.uiLanguage || 'es',
        phoneNumber: data.phoneNumber || '',
        category: (data.category as any) || 'student'
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const oldLanguage = profileData?.uiLanguage;
      await httpClient.patch('/api/v1/profile', editForm);
      await loadProfileData();
      setIsEditing(false);
      
      // Dispatch language change event if language was updated
      if (oldLanguage !== editForm.uiLanguage) {
        window.dispatchEvent(new CustomEvent('languageChanged', { 
          detail: { language: editForm.uiLanguage } 
        }));
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      firstName: profileData?.firstName || '',
      uiLanguage: profileData?.uiLanguage || 'es',
      phoneNumber: profileData?.phoneNumber || '',
      category: (profileData?.category as any) || 'student'
    });
    setIsEditing(false);
  };

  if (loading || !profileData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center text-gray-500">
            {t.profile.loadingProfile}
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
             <div className="flex gap-2">
               {isEditing ? (
                 <>
                   <button 
                     onClick={handleCancel}
                     disabled={saving}
                     className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                   >
                     <X size={16} /> {t.profile.cancel}
                   </button>
                   <button 
                     onClick={handleSave}
                     disabled={saving}
                     className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                   >
                     <Save size={16} /> {saving ? t.profile.saving : t.profile.save}
                   </button>
                 </>
               ) : (
                 <button 
                   onClick={handleEdit}
                   className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                 >
                   <Edit2 size={16} /> {t.profile.editProfile}
                 </button>
               )}
             </div>
          </div>
          
          <div className="mb-8">
            {isEditing ? (
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="text-3xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 w-full max-w-md"
                placeholder={t.profile.firstName}
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
            )}
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <Mail size={16} /> {profileData.email}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Phone size={16} />
                <span className="text-sm font-medium">{t.profile.phone}</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                  placeholder={t.profile.phone}
                />
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profileData.phoneNumber || t.profile.phoneNotSpecified}
                </div>
              )}
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Globe size={16} />
                <span className="text-sm font-medium">{t.profile.language}</span>
              </div>
              {isEditing ? (
                <select
                  value={editForm.uiLanguage}
                  onChange={(e) => setEditForm({ ...editForm, uiLanguage: e.target.value })}
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                >
                  <optgroup label={t.profile.standardLanguages}>
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                  </optgroup>
                  {profileData?.customLanguages && profileData.customLanguages.length > 0 && (
                    <optgroup label={t.profile.customLanguages}>
                      {profileData.customLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.code.toUpperCase()})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-white uppercase truncate max-w-[150px]">
                  {(() => {
                    const customLang = profileData?.customLanguages?.find(l => l.code === profileData.uiLanguage);
                    if (customLang) return `${customLang.name} (${customLang.code.toUpperCase()})`;
                    
                    const standardLangs: Record<string, string> = {
                      'es': 'Español',
                      'en': 'English',
                      'fr': 'Français'
                    };
                    return standardLangs[profileData?.uiLanguage || 'es'] || profileData?.uiLanguage;
                  })()}
                </div>
              )}
            </div>
             <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Calendar size={16} />
                <span className="text-sm font-medium">{t.profile.memberSince}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{joinDate}</div>
            </div>
          </div>

          {/* Category and Level Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Shield size={16} />
                <span className="text-sm font-medium">{t.profile.category}</span>
              </div>
              {isEditing ? (
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                >
                  <option value="student">{t.profile.categories.student}</option>
                  <option value="teacher">{t.profile.categories.teacher}</option>
                  <option value="developer">{t.profile.categories.developer}</option>
                  <option value="apprentice">{t.profile.categories.apprentice}</option>
                  <option value="professional">{t.profile.categories.professional}</option>
                  <option value="researcher">{t.profile.categories.researcher}</option>
                  <option value="other">{t.profile.categories.other}</option>
                </select>
              ) : (
                <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {profileData.category === 'student' && t.profile.categories.student}
                  {profileData.category === 'teacher' && t.profile.categories.teacher}
                  {profileData.category === 'developer' && t.profile.categories.developer}
                  {profileData.category === 'apprentice' && t.profile.categories.apprentice}
                  {profileData.category === 'professional' && t.profile.categories.professional}
                  {profileData.category === 'researcher' && t.profile.categories.researcher}
                  {profileData.category === 'other' && t.profile.categories.other}
                </div>
              )}
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Code size={16} />
                <span className="text-sm font-medium">{t.profile.level}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.level || 0}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (profileData.experiencePoints || 0) / 10)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {profileData.experiencePoints || 0} XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileChatRuntimeConfig />

      <ProductMetricsModule />

      {profileData.bio && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.profile.about}</h2>
          <p className="text-gray-600 dark:text-gray-300">{profileData.bio}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
