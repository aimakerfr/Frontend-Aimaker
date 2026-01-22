export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  dashboard: {
    welcome: string;
    subtitle: string;
    stats: {
      notebooks: string;
      projects: string;
      assistants: string;
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
        assistants: 'Assistants',
        prompts: 'Prompts',
      },
      quickAccess: 'Quick Access',
      goTo: 'Go to',
      sections: {
        library: 'Library',
        projects: 'Projects',
        profile: 'My Profile',
        tools: 'External Access',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Library',
      profile: 'My Profile',
      context: 'Server',
      projects: 'Projects',
      tools: 'External Access',
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
        assistants: 'Asistentes',
        prompts: 'Prompts',
      },
      quickAccess: 'Acceso Rápido',
      goTo: 'Ir a',
      sections: {
        library: 'Biblioteca',
        projects: 'Proyectos',
        profile: 'Mi Perfil',
        tools: 'Acceso Externo',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      profile: 'Mi Perfil',
      context: 'Servidor',
      projects: 'Proyectos',
      tools: 'Acceso Externo',
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
        assistants: 'Assistants',
        prompts: 'Prompts',
      },
      quickAccess: 'Accès Rapide',
      goTo: 'Aller à',
      sections: {
        library: 'Bibliothèque',
        projects: 'Projets',
        profile: 'Mon Profil',
        tools: 'Accès Externe',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Bibliothèque',
      profile: 'Mon Profil',
      context: 'Serveur',
      projects: 'Projets',
      tools: 'Accès Externe',
      signOut: 'Déconnexion',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur de chargement des données',
      retry: 'Réessayer',
    },
  },
};
