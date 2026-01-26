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
  library: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTypes: string;
    filters: {
      all: string;
      mine: string;
      shared: string;
      public: string;
      private: string;
    };
    types: {
      assistant: string;
      prompt: string;
      notebook: string;
      project: string;
      perplexitySearch: string;
    };
    createNew: string;
    noResults: string;
    tableHeaders: {
      type: string;
      nameDescription: string;
      language: string;
      action: string;
      publicPrivate: string;
      authorDate: string;
    };
    buttons: {
      view: string;
      delete: string;
      public: string;
      private: string;
    };
    modal: {
      createTitle: string;
      createSubtitle: string;
    };
  };
  externalAccess: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTypes: string;
    filters: {
      all: string;
      mine: string;
      shared: string;
      public: string;
      private: string;
    };
    types: {
      externalLink: string;
      vibeCoding: string;
    };
    createNew: string;
    noResults: string;
    tableHeaders: {
      type: string;
      nameDescription: string;
      language: string;
      action: string;
      publicPrivate: string;
      authorDate: string;
    };
    buttons: {
      view: string;
      delete: string;
      public: string;
      private: string;
    };
    modal: {
      createTitle: string;
      createSubtitle: string;
    };
  };
  profile: {
    title: string;
    loadingProfile: string;
    personalInfo: string;
    firstName: string;
    email: string;
    phone: string;
    language: string;
    accountInfo: string;
    role: string;
    memberSince: string;
    statistics: string;
    edit: string;
    save: string;
    cancel: string;
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
    library: {
      title: 'Library',
      subtitle: 'Manage your AI resources.',
      searchPlaceholder: 'Search resources...',
      allTypes: 'All types',
      filters: {
        all: 'All',
        mine: 'Mine',
        shared: 'Shared',
        public: 'Public',
        private: 'Private',
      },
      types: {
        assistant: 'ASSISTANT',
        prompt: 'PROMPT',
        notebook: 'RAG MULTIMODAL',
        project: 'PROJECT',
        perplexitySearch: 'PERPLEXITY SEARCH',
      },
      createNew: 'Create',
      noResults: 'No results found',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Name & Description',
        language: 'Language',
        action: 'Action',
        publicPrivate: 'Public/Private',
        authorDate: 'Author / Date',
      },
      buttons: {
        view: 'VIEW',
        delete: 'Delete',
        public: 'Public',
        private: 'Private',
      },
      modal: {
        createTitle: 'Create a resource',
        createSubtitle: 'Select the type of resource you want to create',
      },
    },
    externalAccess: {
      title: 'External Access',
      subtitle: 'Manage your external links and coding tools.',
      searchPlaceholder: 'Search external resources...',
      allTypes: 'All types',
      filters: {
        all: 'All',
        mine: 'Mine',
        shared: 'Shared',
        public: 'Public',
        private: 'Private',
      },
      types: {
        externalLink: 'EXTERNAL LINK',
        vibeCoding: 'VIBE CODING',
      },
      createNew: 'Create',
      noResults: 'No results found',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Name & Description',
        language: 'Language',
        action: 'Action',
        publicPrivate: 'Public/Private',
        authorDate: 'Author / Date',
      },
      buttons: {
        view: 'VIEW',
        delete: 'Delete',
        public: 'Public',
        private: 'Private',
      },
      modal: {
        createTitle: 'Create a resource',
        createSubtitle: 'Select the type of resource you want to create',
      },
    },
    profile: {
      title: 'My Profile',
      loadingProfile: 'Loading profile...',
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      email: 'Email',
      phone: 'Phone',
      language: 'Language',
      accountInfo: 'Account Information',
      role: 'Role',
      memberSince: 'Member Since',
      statistics: 'Statistics',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
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
    library: {
      title: 'Biblioteca',
      subtitle: 'Gestiona tus recursos de IA.',
      searchPlaceholder: 'Buscar recursos...',
      allTypes: 'Todos los tipos',
      filters: {
        all: 'Todos',
        mine: 'Míos',
        shared: 'Compartidos',
        public: 'Públicos',
        private: 'Privados',
      },
      types: {
        assistant: 'ASISTENTE',
        prompt: 'PROMPT',
        notebook: 'RAG MULTIMODAL',
        project: 'PROYECTO',
        perplexitySearch: 'BÚSQUEDA PERPLEXITY',
      },
      createNew: 'Crear',
      noResults: 'No se encontraron resultados',
      tableHeaders: {
        type: 'Tipo',
        nameDescription: 'Nombre y Descripción',
        language: 'Idioma',
        action: 'Acción',
        publicPrivate: 'Público/Privado',
        authorDate: 'Autor / Fecha',
      },
      buttons: {
        view: 'VER',
        delete: 'Eliminar',
        public: 'Público',
        private: 'Privado',
      },
      modal: {
        createTitle: 'Crear un recurso',
        createSubtitle: 'Selecciona el tipo de recurso que deseas crear',
      },
    },
    externalAccess: {
      title: 'Acceso Externo',
      subtitle: 'Gestiona tus enlaces externos y herramientas de código.',
      searchPlaceholder: 'Buscar recursos externos...',
      allTypes: 'Todos los tipos',
      filters: {
        all: 'Todos',
        mine: 'Míos',
        shared: 'Compartidos',
        public: 'Públicos',
        private: 'Privados',
      },
      types: {
        externalLink: 'ENLACE EXTERNO',
        vibeCoding: 'VIBE CODING',
      },
      createNew: 'Crear',
      noResults: 'No se encontraron resultados',
      tableHeaders: {
        type: 'Tipo',
        nameDescription: 'Nombre y Descripción',
        language: 'Idioma',
        action: 'Acción',
        publicPrivate: 'Público/Privado',
        authorDate: 'Autor / Fecha',
      },
      buttons: {
        view: 'VER',
        delete: 'Eliminar',
        public: 'Público',
        private: 'Privado',
      },
      modal: {
        createTitle: 'Crear un recurso',
        createSubtitle: 'Selecciona el tipo de recurso que deseas crear',
      },
    },
    profile: {
      title: 'Mi Perfil',
      loadingProfile: 'Cargando perfil...',
      personalInfo: 'Información Personal',
      firstName: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      language: 'Idioma',
      accountInfo: 'Información de la Cuenta',
      role: 'Rol',
      memberSince: 'Miembro Desde',
      statistics: 'Estadísticas',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
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
    library: {
      title: 'Bibliothèque',
      subtitle: 'Gérez vos ressources IA.',
      searchPlaceholder: 'Rechercher des ressources...',
      allTypes: 'Tous les types',
      filters: {
        all: 'Tous',
        mine: 'Miens',
        shared: 'Partagés',
        public: 'Publics',
        private: 'Privés',
      },
      types: {
        assistant: 'ASSISTANT',
        prompt: 'PROMPT',
        notebook: 'RAG MULTIMODAL',
        project: 'PROJET',
        perplexitySearch: 'RECHERCHE PERPLEXITY',
      },
      createNew: 'Créer',
      noResults: 'Aucun résultat trouvé',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Nom et Description',
        language: 'Langue',
        action: 'Action',
        publicPrivate: 'Public/Privé',
        authorDate: 'Auteur / Date',
      },
      buttons: {
        view: 'VOIR',
        delete: 'Supprimer',
        public: 'Public',
        private: 'Privé',
      },
      modal: {
        createTitle: 'Créer une ressource',
        createSubtitle: 'Sélectionnez le type de ressource que vous souhaitez créer',
      },
    },
    externalAccess: {
      title: 'Accès Externe',
      subtitle: 'Gérez vos liens externes et outils de codage.',
      searchPlaceholder: 'Rechercher des ressources externes...',
      allTypes: 'Tous les types',
      filters: {
        all: 'Tous',
        mine: 'Miens',
        shared: 'Partagés',
        public: 'Publics',
        private: 'Privés',
      },
      types: {
        externalLink: 'LIEN EXTERNE',
        vibeCoding: 'VIBE CODING',
      },
      createNew: 'Créer',
      noResults: 'Aucun résultat trouvé',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Nom et Description',
        language: 'Langue',
        action: 'Action',
        publicPrivate: 'Public/Privé',
        authorDate: 'Auteur / Date',
      },
      buttons: {
        view: 'VOIR',
        delete: 'Supprimer',
        public: 'Public',
        private: 'Privé',
      },
      modal: {
        createTitle: 'Créer une ressource',
        createSubtitle: 'Sélectionnez le type de ressource que vous souhaitez créer',
      },
    },
    profile: {
      title: 'Mon Profil',
      loadingProfile: 'Chargement du profil...',
      personalInfo: 'Informations Personnelles',
      firstName: 'Prénom',
      email: 'Email',
      phone: 'Téléphone',
      language: 'Langue',
      accountInfo: 'Informations du Compte',
      role: 'Rôle',
      memberSince: 'Membre Depuis',
      statistics: 'Statistiques',
      edit: 'Éditer',
      save: 'Sauvegarder',
      cancel: 'Annuler',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur de chargement des données',
      retry: 'Réessayer',
    },
  },
};
