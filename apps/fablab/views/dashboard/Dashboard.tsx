import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notebook, FolderKanban, BookOpen, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { getCreationTools } from '@core/creation-tools/creation-tools.service';
import type { CreationTool } from '@core/creation-tools/creation-tools.types';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useAuth } from '@core/auth/useAuth';

interface Stats {
  notebooks: number;
  projects: number;
  agents: number;
  prompts: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, isLoading: langLoading } = useLanguage();
  const [stats, setStats] = useState<Stats>({ notebooks: 0, projects: 0, agents: 0, prompts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const tools = await getCreationTools();
      
      const newStats: Stats = {
        notebooks: tools.filter((t: CreationTool) => t.type === 'note_books').length,
        projects: 0, // Projects will be counted differently or added later
        agents: tools.filter((t: CreationTool) => t.type === 'agent').length,
        prompts: tools.filter((t: CreationTool) => t.type === 'prompt').length,
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (view: string) => {
    navigate(`/dashboard`, { state: { view } });
  };

  if (langLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      icon: Notebook, 
      label: t.dashboard.stats.notebooks, 
      value: stats.notebooks, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      action: () => handleNavigate('library')
    },
    { 
      icon: FolderKanban, 
      label: t.dashboard.stats.projects, 
      value: stats.projects, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      action: () => handleNavigate('projects')
    },
    { 
      icon: BookOpen, 
      label: t.dashboard.stats.agents, 
      value: stats.agents, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      action: () => handleNavigate('library')
    },
    { 
      icon: FileText, 
      label: t.dashboard.stats.prompts, 
      value: stats.prompts, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      action: () => handleNavigate('library')
    },
  ];

  const quickAccessCards = [
    {
      title: t.dashboard.sections.library,
      description: language === 'en' ? 'Manage your AI resources' : language === 'es' ? 'Gestiona tus recursos de IA' : 'Gérez vos ressources IA',
      icon: Notebook,
      color: 'from-blue-500 to-blue-600',
      action: () => handleNavigate('library')
    },
    {
      title: t.dashboard.sections.projects,
      description: language === 'en' ? 'Plan and organize projects' : language === 'es' ? 'Planifica y organiza proyectos' : 'Planifiez et organisez des projets',
      icon: FolderKanban,
      color: 'from-purple-500 to-purple-600',
      action: () => handleNavigate('projects')
    },
    {
      title: t.dashboard.sections.profile,
      description: language === 'en' ? 'Update your settings' : language === 'es' ? 'Actualiza tu configuración' : 'Mettez à jour vos paramètres',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      action: () => handleNavigate('profile')
    },
    {
      title: t.dashboard.sections.tools,
      description: language === 'en' ? 'Configure AI tools' : language === 'es' ? 'Configura herramientas de IA' : 'Configurez les outils IA',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      action: () => handleNavigate('tools')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.name?.substring(0, 2).toUpperCase() || 'AI'}
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.dashboard.welcome}, {user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{t.dashboard.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <button
                key={index}
                onClick={stat.action}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className={`text-4xl font-bold mb-2 ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span>{t.dashboard.quickAccess}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickAccessCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <button
                  key={index}
                  onClick={card.action}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {card.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {card.description}
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                        <span>{t.dashboard.goTo}</span>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
