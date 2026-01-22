import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notebook, FolderKanban, BookOpen, FileText, ArrowRight, TrendingUp, Sparkles, Zap, Target } from 'lucide-react';
import { getTools } from '@core/creation-tools/creation-tools.service';
import type { Tool } from '@core/creation-tools/creation-tools.types';
import { useLanguage } from '../../language/useLanguage';
import { translations } from '../../language/translations';
import { useAuth } from '@core/auth/useAuth';

interface Stats {
  notebooks: number;
  projects: number;
  assistant: number;
  prompts: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, isLoading: langLoading } = useLanguage();
  const [stats, setStats] = useState<Stats>({ notebooks: 0, projects: 0, assistant: 0, prompts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const tools = await getTools();
      
      const newStats: Stats = {
        notebooks: tools.filter((t: Tool) => t.type === 'note_books').length,
        projects: tools.filter((t: Tool) => t.type === 'project').length,
        assistant: tools.filter((t: Tool) => t.type === 'assistant').length,
        prompts: tools.filter((t: Tool) => t.type === 'prompt').length,
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
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      action: () => handleNavigate('library')
    },
    { 
      icon: FolderKanban, 
      label: t.dashboard.stats.makerPath, 
      value: stats.projects, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      action: () => handleNavigate('library')
    },
    { 
      icon: BookOpen, 
      label: t.dashboard.stats.assistants, 
      value: stats.assistant, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      action: () => handleNavigate('library')
    },
    { 
      icon: FileText, 
      label: t.dashboard.stats.prompts, 
      value: stats.prompts, 
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      action: () => handleNavigate('library')
    },
  ];

  const quickAccessCards = [
    {
      title: t.dashboard.sections.library,
      description: language === 'en' ? 'Manage your AI resources' : language === 'es' ? 'Gestiona tus recursos de IA' : 'Gérez vos ressources IA',
      icon: Sparkles,
      color: 'from-blue-500 via-cyan-500 to-blue-600',
      action: () => handleNavigate('library')
    },
    {
      title: t.dashboard.sections.makerPath,
      description: language === 'en' ? 'Plan and organize projects' : language === 'es' ? 'Planifica y organiza proyectos' : 'Planifiez et organisez des projets',
      icon: Target,
      color: 'from-purple-500 via-pink-500 to-purple-600',
      action: () => handleNavigate('projects')
    },
    {
      title: t.dashboard.sections.profile,
      description: language === 'en' ? 'Update your settings' : language === 'es' ? 'Actualiza tu configuración' : 'Mettez à jour vos paramètres',
      icon: BookOpen,
      color: 'from-green-500 via-emerald-500 to-green-600',
      action: () => handleNavigate('profile')
    },
    {
      title: t.dashboard.sections.tools,
      description: language === 'en' ? 'Configure AI tools' : language === 'es' ? 'Configura herramientas de IA' : 'Configurez les outils IA',
      icon: Zap,
      color: 'from-orange-500 via-amber-500 to-orange-600',
      action: () => handleNavigate('tools')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 rounded-3xl shadow-2xl border border-blue-400/20 p-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl shadow-2xl border border-white/30 ring-4 ring-white/10">
              {user?.name?.substring(0, 2).toUpperCase() || 'AI'}
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
                {t.dashboard.welcome}, {user?.name || 'User'}! 
              </h1>
              <p className="text-blue-100 text-lg font-medium">{t.dashboard.subtitle}</p>
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
                className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 ${stat.borderColor} p-6 hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={32} className={stat.textColor} />
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp size={18} className="animate-pulse" />
                    </div>
                  </div>
                  <div className={`text-5xl font-black mb-2 ${stat.textColor} tracking-tight`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              {t.dashboard.quickAccess}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickAccessCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <button
                  key={index}
                  onClick={card.action}
                  className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl transition-all hover:scale-[1.02] cursor-pointer group text-left"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                          <Icon size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                          {card.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-base">
                        {card.description}
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold group-hover:gap-4 transition-all">
                        <span>{t.dashboard.goTo}</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
