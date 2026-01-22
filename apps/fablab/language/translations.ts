export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  dashboard: {
    welcome: string;
    subtitle: string;
    stats: {
      notebooks: string;
      makerPath: string;
      assistants: string;
      prompts: string;
    };
    quickAccess: string;
    goTo: string;
    sections: {
      library: string;
      makerPath: string;
      profile: string;
      tools: string;
    };
  };
  sidebar: {
    dashboard: string;
    library: string;
    profile: string;
    context: string;
    makerPath: string;
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
        makerPath: 'Maker Path',
        assistants: 'Assistants',
        prompts: 'Prompts',
      },
      quickAccess: 'Quick Access',
      goTo: 'Go to',
      sections: {
        library: 'Library',
        makerPath: 'Maker Path',
        profile: 'My Profile',
        tools: 'External Access',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Library',
      profile: 'My Profile',
      context: 'Server',
      makerPath: 'Maker Path',
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
        makerPath: 'Ruta del Maker',
        assistants: 'Asistentes',
        prompts: 'Prompts',
      },
      quickAccess: 'Acceso Rápido',
      goTo: 'Ir a',
      sections: {
        library: 'Biblioteca',
        makerPath: 'Ruta del Maker',
        profile: 'Mi Perfil',
        tools: 'Acceso Externo',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Biblioteca',
      profile: 'Mi Perfil',
      context: 'Servidor',
      makerPath: 'Ruta del Maker',
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
        makerPath: 'Chemin du Maker',
        assistants: 'Assistants',
        prompts: 'Prompts',
      },
      quickAccess: 'Accès Rapide',
      goTo: 'Aller à',
      sections: {
        library: 'Bibliothèque',
        makerPath: 'Chemin du Maker',
        profile: 'Mon Profil',
        tools: 'Accès Externe',
      },
    },
    sidebar: {
      dashboard: 'Dashboard',
      library: 'Bibliothèque',
      profile: 'Mon Profil',
      context: 'Serveur',
      makerPath: 'Chemin du Maker',
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
