export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  dashboard: {
    welcome: string;
    subtitle: string;
    stats: {
      notebooks: string;
      projects: string;
      agents: string;
      prompts: string;
    };
    quickAccess: string;
    goTo: string;
    sections: {
      library: string;
      projects: string;
      profile: string;
      tools: string;
    };
  };
  sidebar: {
    dashboard: string;
    library: string;
    profile: string;
    context: string;
    projects: string;
    tools: string;
    signOut: string;
  };
  common: {
    loading: string;
    error: string;
    retry: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    dashboard: {
      welcome: 'Welcome back',
      subtitle: 'Here\'s an overview of your AI resources',
      stats: {
        notebooks: 'Notebooks',
        projects: 'Projects',
        agents: 'Agents',
        prompts: 'Prompts',
      },
      quickAccess: 'Quick Access',
      goTo: 'Go to',
      sections: {
        library: 'Library',
        projects: 'Projects',
        profile: 'My Profile',
        tools: 'Tools',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Library',
      profile: 'My Profile',
      context: 'AI Context',
      projects: 'Projects',
      tools: 'Tools',
      signOut: 'Sign Out',
    },
    common: {
      loading: 'Loading...',
      error: 'Error loading data',
      retry: 'Retry',
    },
  },
  es: {
    dashboard: {
      welcome: 'Bienvenido de nuevo',
      subtitle: 'Aquí tienes un resumen de tus recursos de IA',
      stats: {
        notebooks: 'Notebooks',
        projects: 'Proyectos',
        agents: 'Agentes',
        prompts: 'Prompts',
      },
      quickAccess: 'Acceso Rápido',
      goTo: 'Ir a',
      sections: {
        library: 'Biblioteca',
        projects: 'Proyectos',
        profile: 'Mi Perfil',
        tools: 'Herramientas',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      profile: 'Mi Perfil',
      context: 'Contexto IA',
      projects: 'Proyectos',
      tools: 'Herramientas',
      signOut: 'Cerrar Sesión',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error al cargar datos',
      retry: 'Reintentar',
    },
  },
  fr: {
    dashboard: {
      welcome: 'Bon retour',
      subtitle: 'Voici un aperçu de vos ressources IA',
      stats: {
        notebooks: 'Notebooks',
        projects: 'Projets',
        agents: 'Agents',
        prompts: 'Prompts',
      },
      quickAccess: 'Accès Rapide',
      goTo: 'Aller à',
      sections: {
        library: 'Bibliothèque',
        projects: 'Projets',
        profile: 'Mon Profil',
        tools: 'Outils',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Bibliothèque',
      profile: 'Mon Profil',
      context: 'Contexte IA',
      projects: 'Projets',
      tools: 'Outils',
      signOut: 'Déconnexion',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur de chargement des données',
      retry: 'Réessayer',
    },
  },
};
