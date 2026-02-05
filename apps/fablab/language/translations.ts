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
      favorites: string;
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
      favorites: string;
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
  server: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTypes: string;
    createNew: string;
    noResults: string;
    tableHeaders: {
      type: string;
      nameDescription: string;
      status: string;
      url: string;
      creationDate: string;
      actions: string;
    };
    form: {
      name: string;
      namePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      type: string;
      url: string;
      urlPlaceholder: string;
      apiKey: string;
      apiKeyPlaceholder: string;
      configJson: string;
      isActive: string;
      cancel: string;
      save: string;
      create: string;
    };
    deleteConfirm: string;
    active: string;
    inactive: string;
    tooltips: {
      edit: string;
      delete: string;
    };
  };
  profile: {
    title: string;
    loadingProfile: string;
    personalInfo: string;
    firstName: string;
    email: string;
    phone: string;
    phoneNotSpecified: string;
    language: string;
    accountInfo: string;
    role: string;
    memberSince: string;
    statistics: string;
    statisticsToolsTitle: string;
    edit: string;
    editProfile: string;
    save: string;
    saving: string;
    cancel: string;
    category: string;
    level: string;
    categories: {
      student: string;
      teacher: string;
      developer: string;
      apprentice: string;
      professional: string;
      researcher: string;
      other: string;
    };
  };
  makerPath: {
    title: string;
    subtitle: string;
    newRoute: string;
    searchPlaceholder: string;
    allTypes: string;
    allStatuses: string;
    statuses: {
      draft: string;
      inProgress: string;
      completed: string;
    };
    types: {
      architectAI: string;
      moduleConnector: string;
      custom: string;
    };
    deleteConfirm: string;
    tableHeaders: {
      type: string;
      titleDescription: string;
      status: string;
      creationDate: string;
      actions: string;
    };
    modal: {
      title: string;
      subtitle: string;
      architectAI: {
        title: string;
        description: string;
        badge1: string;
        badge2: string;
      };
      moduleConnector: {
        title: string;
        description: string;
        badge1: string;
        badge2: string;
      };
      cancel: string;
    };
  };
  moduleCreator: {
    title: string;
    backToMakerPath: string;
    completed: string;
    editModify: string;
    saveAndFinalize: string;
    finalizeDisabledTooltip: string;
    saving: string;
    steps: {
      select: string;
      selectDescription: string;
      edit: string;
      editDescription: string;
      export: string;
      exportDescription: string;
    };
    viewMode: {
      banner: {
        title: string;
        description: string;
        tip: string;
      };
      viewModulesSection: {
        title: string;
        description: string;
      };
    };
    moduleEditor: {
      readOnlyBanner: string;
      configuration: string;
      useTailwind: string;
      active: string;
      htmlCode: string;
      cssStyles: string;
      downloadHtml: string;
      downloadCss: string;
      note: string;
      uploadHtml: string;
      uploadTailwind: string;
      uploadCss: string;
      notebook: string;
      hide: string;
      edit: string;
      htmlPlaceholder: string;
      cssPlaceholder: string;
    };
    templateLibrary: {
      title: string;
      subtitle: string;
      createTemplate: string;
      headers: string;
      body: string;
      footers: string;
      useTemplate: string;
    };
    phases: {
      select: {
        title: string;
        subtitle: string;
        startFromScratch: {
          title: string;
          description: string;
          button: string;
        };
      };
      edit: {
        title: string;
        subtitle: string;
        moduleInfo: {
          title: string;
          description: string;
        };
        modules: {
          header: string;
          body: string;
          footer: string;
        };
      };
      export: {
        title: string;
        subtitle: string;
        formats: {
          combined: {
            title: string;
            description: string;
            button: string;
          };
          htmlOnly: {
            title: string;
            description: string;
            button: string;
          };
          cssOnly: {
            title: string;
            description: string;
            button: string;
          };
          htmlTailwind: {
            title: string;
            description: string;
            button: string;
            badge: string;
          };
        };
        tip: string;
      };
    };
    navigation: {
      back: string;
      continueToEdit: string;
      viewPreview: string;
      continueToExport: string;
    };
    preview: {
      title: string;
      subtitle: string;
      download: string;
    };
    createTemplate: {
      title: string;
      subtitle: string;
      name: string;
      namePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      moduleType: string;
      useTailwindLabel: string;
      htmlCodeLabel: string;
      htmlPlaceholder: string;
      cssCodeLabel: string;
      cssPlaceholder: string;
      cancel: string;
      save: string;
      alertMessage: string;
    };
    promptLibrary: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      copyButton: string;
      copiedButton: string;
      noContent: string;
      noResults: string;
      noPrompts: string;
      tip: string;
    };
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    create: string;
    view: string;
    search: string;
    name: string;
    description: string;
    actions: string;
    saving: string;
    creating: string;
    updating: string;
    deleting: string;
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
        private: 'Private',        favorites: 'Favorites',      },
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
        favorites: 'Favorites',
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
    server: {
      title: 'Server Tools',
      subtitle: 'Manage your AI server tools and integrations.',
      searchPlaceholder: 'Search tools...',
      allTypes: 'All types',
      createNew: 'Create Tool',
      noResults: 'No tools found',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Name & Description',
        status: 'Status',
        url: 'URL',
        creationDate: 'Creation Date',
        actions: 'Actions',
      },
      form: {
        name: 'Name *',
        namePlaceholder: 'Tool name',
        description: 'Description',
        descriptionPlaceholder: 'Describe the purpose of this tool',
        type: 'Type',
        url: 'URL',
        urlPlaceholder: 'https://...',
        apiKey: 'API Key',
        apiKeyPlaceholder: 'Your API key',
        configJson: 'JSON Configuration',
        isActive: 'Active',
        cancel: 'Cancel',
        save: 'Save Changes',
        create: 'Create Tool',
      },
      deleteConfirm: 'Are you sure you want to delete this tool?',
      active: 'Active',
      inactive: 'Inactive',
      tooltips: {
        edit: 'Edit',
        delete: 'Delete',
      },
    },
    profile: {
      title: 'My Profile',
      loadingProfile: 'Loading profile...',
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      email: 'Email',
      phone: 'Phone',
      phoneNotSpecified: 'Not specified',
      language: 'Language',
      accountInfo: 'Account Information',
      role: 'Role',
      memberSince: 'Member Since',
      statistics: 'Statistics',
      statisticsToolsTitle: 'Tool Statistics',
      edit: 'Edit',
      editProfile: 'Edit Profile',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      category: 'Category',
      level: 'Level',
      categories: {
        student: 'Student',
        teacher: 'Teacher',
        developer: 'Developer',
        apprentice: 'Apprentice',
        professional: 'Professional',
        researcher: 'Researcher',
        other: 'Other',
      },
    },
    makerPath: {
      title: 'Maker Path',
      subtitle: 'Manage your project creation paths',
      newRoute: 'New Route',
      searchPlaceholder: 'Search routes...',
      allTypes: 'All types',
      allStatuses: 'All statuses',
      statuses: {
        draft: 'Draft',
        inProgress: 'In Progress',
        completed: 'Completed',
      },
      types: {
        architectAI: 'Architect AI Route',
        moduleConnector: 'Module Connector',
        custom: 'Custom',
      },
      deleteConfirm: 'Are you sure you want to delete this route?',
      tableHeaders: {
        type: 'Type',
        titleDescription: 'Title & Description',
        status: 'Status',
        creationDate: 'Creation Date',
        actions: 'Actions',
      },
      modal: {
        title: 'Select Route Type',
        subtitle: 'Choose which type of route you want to create',
        architectAI: {
          title: 'Architect AI Route',
          description: 'Create projects step by step with AI assistance. Ideal for structured planning and prompt optimization.',
          badge1: 'AI Assisted',
          badge2: '6 Phases',
        },
        moduleConnector: {
          title: 'Module Connector',
          description: 'Orchestrate HTML/CSS modules with templates. Connect header, body and footer components with integrated styles.',
          badge1: 'Modular',
          badge2: 'HTML/CSS',
        },
        cancel: 'Cancel',
      },
    },
    moduleCreator: {
      title: 'Module Connector',
      backToMakerPath: 'Back to Maker Path',
      completed: 'Completed',
      editModify: 'Edit / Modify',
      saveAndFinalize: 'Save and Finalize',
      finalizeDisabledTooltip: 'Complete all phases to finalize',
      saving: 'Saving...',
      steps: {
        select: 'Select',
        selectDescription: 'Choose templates or start from scratch',
        edit: 'Edit',
        editDescription: 'Customize your content',
        export: 'Export',
        exportDescription: 'Download your project',
      },
      viewMode: {
        banner: {
          title: '🔒 View Mode - Completed Path',
          description: 'This path is completed and displayed in read-only mode. You can export the project or view the created modules.',
          tip: '💡 To modify the content, click the "Edit / Modify" button at the top.',
        },
        viewModulesSection: {
          title: '📋 View Saved Modules',
          description: 'Click "Back" to review the modules you created (Header, Body, Footer) in read-only mode.',
        },
      },
      moduleEditor: {
        readOnlyBanner: '🔒 View Mode: This module is completed. Click "Edit / Modify" at the top to make changes.',
        configuration: '⚙️ Configuration',
        useTailwind: 'Use Tailwind CSS (CDN)',
        active: 'Active',
        htmlCode: 'HTML Code',
        cssStyles: 'CSS Styles',
        downloadHtml: 'Download HTML',
        downloadCss: 'Download CSS',
        note: 'Note: Styles are isolated in this module',
        uploadHtml: '.html',
        uploadTailwind: '+TW',
        uploadCss: '.css',
        notebook: 'Notebook',
        hide: 'Hide',
        edit: 'Edit',
        htmlPlaceholder: '<div>Write or paste your HTML here...</div>',
        cssPlaceholder: '.my-class { color: red; }',
      },
      templateLibrary: {
        title: 'Template Library',
        subtitle: 'Optional: Select a template to start faster, or continue without a template',
        createTemplate: 'Create Template',
        headers: 'Headers',
        body: 'Body',
        footers: 'Footers',
        useTemplate: 'Use Template',
      },
      phases: {
        select: {
          title: 'Select Templates',
          subtitle: 'Choose from our predefined templates or start from scratch',
          startFromScratch: {
            title: 'Prefer to start from scratch?',
            description: 'Skip this section and create your design from scratch without using templates',
            button: 'Continue without Template',
          },
        },
        edit: {
          title: 'Module Editor',
          subtitle: 'Select a module to edit. Write code, upload files, or import from Notebook.',
          moduleInfo: {
            title: 'Module Editor',
            description: 'Select a module to edit. Write code, upload files, or import from Notebook.',
          },
          modules: {
            header: 'Header',
            body: 'Body Content',
            footer: 'Footer',
          },
        },
        export: {
          title: '🎉 Ready to Export!',
          subtitle: 'Select the export format you need',
          formats: {
            combined: {
              title: 'Complete HTML (with CSS)',
              description: 'Complete HTML page with all integrated CSS styles',
              button: 'Download Complete HTML',
            },
            htmlOnly: {
              title: 'HTML Only',
              description: 'Only the HTML code without styles (useful for integrating into other projects)',
              button: 'Download HTML',
            },
            cssOnly: {
              title: 'CSS Only',
              description: 'Only the CSS styles in a separate file',
              button: 'Download CSS',
            },
            htmlTailwind: {
              title: 'HTML with Tailwind',
              description: 'Complete HTML using Tailwind CSS from CDN (without custom CSS)',
              button: 'Download HTML + Tailwind',
              badge: 'Recommended',
            },
          },
          tip: '💡 Tip: If you used Tailwind classes in your code, select "HTML with Tailwind" to ensure styles work correctly.',
        },
      },
      navigation: {
        back: 'Back',
        continueToEdit: 'Continue to Edit',
        viewPreview: 'View Preview',
        continueToExport: 'Continue to Export',
      },
      preview: {
        title: 'Live Preview',
        subtitle: 'Preview your complete page',
        download: 'Download Preview',
      },
      createTemplate: {
        title: 'Create Custom Template',
        subtitle: 'Save your code as a reusable template',
        name: 'Template Name *',
        namePlaceholder: 'E.g.: My Custom Header',
        description: 'Description',
        descriptionPlaceholder: 'Briefly describe your template',
        moduleType: 'Module Type',
        useTailwindLabel: 'This template uses Tailwind CSS',
        htmlCodeLabel: 'HTML Code *',
        htmlPlaceholder: '<div>Your HTML code here...</div>',
        cssCodeLabel: 'CSS Code (optional)',
        cssPlaceholder: '.my-class { color: blue; }',
        cancel: 'Cancel',
        save: 'Save Template',
        alertMessage: 'Please complete at least the name and HTML',
      },
      promptLibrary: {
        title: 'Prompt Library',
        subtitle: 'Select a prompt to copy',
        searchPlaceholder: 'Search prompts...',
        copyButton: 'Copy',
        copiedButton: 'Copied',
        noContent: 'No content',
        noResults: 'No prompts found',
        noPrompts: 'No prompts available',
        tip: '💡 Tip: Use copied prompts to generate content with AI',
      },
    },
    common: {
      loading: 'Loading...',
      error: 'Error loading data',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      view: 'View',
      search: 'Search',
      name: 'Name',
      description: 'Description',
      actions: 'Actions',
      saving: 'Saving...',
      creating: 'Creating...',
      updating: 'Updating...',
      deleting: 'Deleting...',
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
        favorites: 'Favoritos',
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
        favorites: 'Favoritos',
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
    server: {
      title: 'Herramientas del Servidor',
      subtitle: 'Gestiona tus herramientas de servidor IA e integraciones.',
      searchPlaceholder: 'Buscar herramientas...',
      allTypes: 'Todos los tipos',
      createNew: 'Crear Herramienta',
      noResults: 'No se encontraron herramientas',
      tableHeaders: {
        type: 'Tipo',
        nameDescription: 'Nombre y Descripción',
        status: 'Estado',
        url: 'URL',
        creationDate: 'Fecha Creación',
        actions: 'Acciones',
      },
      form: {
        name: 'Nombre *',
        namePlaceholder: 'Nombre de la herramienta',
        description: 'Descripción',
        descriptionPlaceholder: 'Describe el propósito de esta herramienta',
        type: 'Tipo',
        url: 'URL',
        urlPlaceholder: 'https://...',
        apiKey: 'API Key',
        apiKeyPlaceholder: 'Tu API key',
        configJson: 'Configuración JSON',
        isActive: 'Activo',
        cancel: 'Cancelar',
        save: 'Guardar Cambios',
        create: 'Crear Herramienta',
      },
      deleteConfirm: '¿Está seguro de eliminar esta herramienta?',
      active: 'Activo',
      inactive: 'Inactivo',
      tooltips: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
    },
    profile: {
      title: 'Mi Perfil',
      loadingProfile: 'Cargando perfil...',
      personalInfo: 'Información Personal',
      firstName: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      phoneNotSpecified: 'No especificado',
      language: 'Idioma',
      accountInfo: 'Información de la Cuenta',
      role: 'Rol',
      memberSince: 'Miembro Desde',
      statistics: 'Estadísticas',
      statisticsToolsTitle: 'Estadísticas de Herramientas',
      edit: 'Editar',
      editProfile: 'Editar Perfil',
      save: 'Guardar',
      saving: 'Guardando...',
      cancel: 'Cancelar',
      category: 'Categoría',
      level: 'Nivel',
      categories: {
        student: 'Estudiante',
        teacher: 'Profesor',
        developer: 'Desarrollador',
        apprentice: 'Aprendiz',
        professional: 'Profesional',
        researcher: 'Investigador',
        other: 'Otro',
      },
    },
    makerPath: {
      title: 'Maker Path',
      subtitle: 'Gestiona tus rutas de creación de proyectos',
      newRoute: 'Nueva Ruta',
      searchPlaceholder: 'Buscar rutas...',
      allTypes: 'Todos los tipos',
      allStatuses: 'Todos los estados',
      statuses: {
        draft: 'Borrador',
        inProgress: 'En Progreso',
        completed: 'Completado',
      },
      types: {
        architectAI: 'Ruta Arquitecto AI',
        moduleConnector: 'Conector de Módulos',
        custom: 'Personalizada',
      },
      deleteConfirm: '¿Está seguro de eliminar esta ruta?',
      tableHeaders: {
        type: 'Tipo',
        titleDescription: 'Título y Descripción',
        status: 'Estado',
        creationDate: 'Fecha de Creación',
        actions: 'Acciones',
      },
      modal: {
        title: 'Selecciona el Tipo de Ruta',
        subtitle: 'Elige qué tipo de ruta deseas crear',
        architectAI: {
          title: 'Ruta Arquitecto AI',
          description: 'Crea proyectos paso a paso con asistencia de IA. Ideal para planificación estructurada y optimización de prompts.',
          badge1: 'IA Asistida',
          badge2: '6 Fases',
        },
        moduleConnector: {
          title: 'Conector de Módulos',
          description: 'Orquesta módulos HTML/CSS con plantillas. Conecta componentes header, body y footer con estilos integrados.',
          badge1: 'Modular',
          badge2: 'HTML/CSS',
        },
        cancel: 'Cancelar',
      },
    },
    moduleCreator: {
      title: 'Conector de Módulos',
      backToMakerPath: 'Volver a Maker Path',
      completed: 'Finalizado',
      editModify: 'Editar / Modificar',
      saveAndFinalize: 'Guardar y Finalizar',
      finalizeDisabledTooltip: 'Completa todas las fases para finalizar',
      saving: 'Guardando...',
      steps: {
        select: 'Seleccionar',
        selectDescription: 'Elige plantillas o comienza desde cero',
        edit: 'Editar',
        editDescription: 'Personaliza tu contenido',
        export: 'Exportar',
        exportDescription: 'Descarga tu proyecto',
      },
      viewMode: {
        banner: {
          title: '🔒 Modo Vista - Ruta Finalizada',
          description: 'Esta ruta está completada y se muestra en modo solo lectura. Puedes exportar el proyecto o ver los módulos creados.',
          tip: '💡 Para modificar el contenido, haz clic en el botón "Editar / Modificar" en la parte superior.',
        },
        viewModulesSection: {
          title: '📋 Ver Módulos Guardados',
          description: 'Haz clic en "Atrás" para revisar los módulos que creaste (Header, Body, Footer) en modo solo lectura.',
        },
      },
      moduleEditor: {
        readOnlyBanner: '🔒 Modo Vista: Este módulo está finalizado. Haz clic en "Editar / Modificar" en la parte superior para hacer cambios.',
        configuration: '⚙️ Configuración',
        useTailwind: 'Usar Tailwind CSS (CDN)',
        active: 'Activo',
        htmlCode: 'Código HTML',
        cssStyles: 'Estilos CSS',
        downloadHtml: 'Descargar HTML',
        downloadCss: 'Descargar CSS',
        note: 'Nota: Los estilos se aíslan en este módulo',
        uploadHtml: '.html',
        uploadTailwind: '+TW',
        uploadCss: '.css',
        notebook: 'Notebook',
        hide: 'Ocultar',
        edit: 'Editar',
        htmlPlaceholder: '<div>Escribe o pega tu HTML aquí...</div>',
        cssPlaceholder: '.mi-clase { color: red; }',
      },
      templateLibrary: {
        title: 'Biblioteca de Plantillas',
        subtitle: 'Opcional: Selecciona una plantilla para comenzar más rápido, o avanza sin plantilla',
        createTemplate: 'Crear Plantilla',
        headers: 'Encabezados',
        body: 'Cuerpo',
        footers: 'Pies de Página',
        useTemplate: 'Usar Plantilla',
      },
      phases: {
        select: {
          title: 'Seleccionar Plantillas',
          subtitle: 'Elige entre nuestras plantillas predefinidas o comienza desde cero',
          startFromScratch: {
            title: '¿Prefieres empezar desde cero?',
            description: 'Salta esta sección y crea tu diseño desde cero sin usar plantillas',
            button: 'Continuar sin Plantilla',
          },
        },
        edit: {
          title: 'Editor de Módulos',
          subtitle: 'Selecciona un módulo para editar. Escribe código, carga archivos, o importa desde Notebook.',
          moduleInfo: {
            title: 'Editor de Módulos',
            description: 'Selecciona un módulo para editar. Escribe código, carga archivos, o importa desde Notebook.',
          },
          modules: {
            header: 'Encabezado',
            body: 'Contenido del Cuerpo',
            footer: 'Pie de Página',
          },
        },
        export: {
          title: '🎉 ¡Listo para Exportar!',
          subtitle: 'Selecciona el formato de exportación que necesites',
          formats: {
            combined: {
              title: 'HTML Completo (con CSS)',
              description: 'Página HTML completa con todos los estilos CSS integrados',
              button: 'Descargar HTML Completo',
            },
            htmlOnly: {
              title: 'Solo HTML',
              description: 'Solo el código HTML sin estilos (útil para integrar en otros proyectos)',
              button: 'Descargar HTML',
            },
            cssOnly: {
              title: 'Solo CSS',
              description: 'Solo los estilos CSS en un archivo separado',
              button: 'Descargar CSS',
            },
            htmlTailwind: {
              title: 'HTML con Tailwind',
              description: 'HTML completo usando Tailwind CSS desde CDN (sin CSS personalizado)',
              button: 'Descargar HTML + Tailwind',
              badge: 'Recomendado',
            },
          },
          tip: '💡 Tip: Si usaste clases de Tailwind en tu código, selecciona "HTML con Tailwind" para asegurar que los estilos funcionen correctamente.',
        },
      },
      navigation: {
        back: 'Atrás',
        continueToEdit: 'Continuar a Edición',
        viewPreview: 'Ver Vista Previa',
        continueToExport: 'Continuar a Exportar',
      },
      preview: {
        title: 'Vista Previa en Vivo',
        subtitle: 'Previsualiza tu página completa',
        download: 'Descargar Vista Previa',
      },
      createTemplate: {
        title: 'Crear Plantilla Personalizada',
        subtitle: 'Guarda tu código como plantilla reutilizable',
        name: 'Nombre de la Plantilla *',
        namePlaceholder: 'Ej: Mi Header Personalizado',
        description: 'Descripción',
        descriptionPlaceholder: 'Describe brevemente tu plantilla',
        moduleType: 'Tipo de Módulo',
        useTailwindLabel: 'Esta plantilla usa Tailwind CSS',
        htmlCodeLabel: 'Código HTML *',
        htmlPlaceholder: '<div>Tu código HTML aquí...</div>',
        cssCodeLabel: 'Código CSS (opcional)',
        cssPlaceholder: '.mi-clase { color: blue; }',
        cancel: 'Cancelar',
        save: 'Guardar Plantilla',
        alertMessage: 'Por favor completa al menos el nombre y el HTML',
      },
      promptLibrary: {
        title: 'Biblioteca de Prompts',
        subtitle: 'Selecciona un prompt para copiar',
        searchPlaceholder: 'Buscar prompts...',
        copyButton: 'Copiar',
        copiedButton: 'Copiado',
        noContent: 'Sin contenido',
        noResults: 'No se encontraron prompts',
        noPrompts: 'No hay prompts disponibles',
        tip: '💡 Tip: Usa los prompts copiados para generar contenido con IA',
      },
    },
    common: {
      loading: 'Cargando...',
      error: 'Error al cargar datos',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      create: 'Crear',
      view: 'Ver',
      search: 'Buscar',
      name: 'Nombre',
      description: 'Descripción',
      actions: 'Acciones',
      saving: 'Guardando...',
      creating: 'Creando...',
      updating: 'Actualizando...',
      deleting: 'Eliminando...',
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
        favorites: 'Favoris',
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
        favorites: 'Favoris',
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
    server: {
      title: 'Outils Serveur',
      subtitle: 'Gérez vos outils serveur IA et intégrations.',
      searchPlaceholder: 'Rechercher des outils...',
      allTypes: 'Tous les types',
      createNew: 'Créer un Outil',
      noResults: 'Aucun outil trouvé',
      tableHeaders: {
        type: 'Type',
        nameDescription: 'Nom et Description',
        status: 'Statut',
        url: 'URL',
        creationDate: 'Date de Création',
        actions: 'Actions',
      },
      form: {
        name: 'Nom *',
        namePlaceholder: 'Nom de l\'outil',
        description: 'Description',
        descriptionPlaceholder: 'Décrivez le but de cet outil',
        type: 'Type',
        url: 'URL',
        urlPlaceholder: 'https://...',
        apiKey: 'Clé API',
        apiKeyPlaceholder: 'Votre clé API',
        configJson: 'Configuration JSON',
        isActive: 'Actif',
        cancel: 'Annuler',
        save: 'Enregistrer les Modifications',
        create: 'Créer l\'Outil',
      },
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet outil?',
      active: 'Actif',
      inactive: 'Inactif',
      tooltips: {
        edit: 'Éditer',
        delete: 'Supprimer',
      },
    },
    profile: {
      title: 'Mon Profil',
      loadingProfile: 'Chargement du profil...',
      personalInfo: 'Informations Personnelles',
      firstName: 'Prénom',
      email: 'Email',
      phone: 'Téléphone',
      phoneNotSpecified: 'Non spécifié',
      language: 'Langue',
      accountInfo: 'Informations du Compte',
      role: 'Rôle',
      memberSince: 'Membre Depuis',
      statistics: 'Statistiques',
      statisticsToolsTitle: 'Statistiques des Outils',
      edit: 'Éditer',
      editProfile: 'Éditer le Profil',
      save: 'Sauvegarder',
      saving: 'Enregistrement...',
      cancel: 'Annuler',
      category: 'Catégorie',
      level: 'Niveau',
      categories: {
        student: 'Étudiant',
        teacher: 'Professeur',
        developer: 'Développeur',
        apprentice: 'Apprenti',
        professional: 'Professionnel',
        researcher: 'Chercheur',
        other: 'Autre',
      },
    },
    makerPath: {
      title: 'Chemin du Maker',
      subtitle: 'Gérez vos chemins de création de projets',
      newRoute: 'Nouvelle Route',
      searchPlaceholder: 'Rechercher des routes...',
      allTypes: 'Tous les types',
      allStatuses: 'Tous les statuts',
      statuses: {
        draft: 'Brouillon',
        inProgress: 'En Cours',
        completed: 'Terminé',
      },
      types: {
        architectAI: 'Route Architecte IA',
        moduleConnector: 'Connecteur de Modules',
        custom: 'Personnalisée',
      },
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette route?',
      tableHeaders: {
        type: 'Type',
        titleDescription: 'Titre et Description',
        status: 'Statut',
        creationDate: 'Date de Création',
        actions: 'Actions',
      },
      modal: {
        title: 'Sélectionnez le Type de Route',
        subtitle: 'Choisissez le type de route que vous souhaitez créer',
        architectAI: {
          title: 'Route Architecte IA',
          description: 'Créez des projets étape par étape avec l\'assistance de l\'IA. Idéal pour la planification structurée et l\'optimisation des prompts.',
          badge1: 'Assistée par IA',
          badge2: '6 Phases',
        },
        moduleConnector: {
          title: 'Connecteur de Modules',
          description: 'Orchestrez des modules HTML/CSS avec des modèles. Connectez les composants header, body et footer avec des styles intégrés.',
          badge1: 'Modulaire',
          badge2: 'HTML/CSS',
        },
        cancel: 'Annuler',
      },
    },
    moduleCreator: {
      title: 'Connecteur de Modules',
      backToMakerPath: 'Retour au Chemin du Maker',
      completed: 'Terminé',
      editModify: 'Éditer / Modifier',
      saveAndFinalize: 'Enregistrer et Finaliser',
      finalizeDisabledTooltip: 'Complétez toutes les phases pour finaliser',
      saving: 'Enregistrement...',
      steps: {
        select: 'Sélectionner',
        selectDescription: 'Choisissez des modèles ou commencez à partir de zéro',
        edit: 'Éditer',
        editDescription: 'Personnalisez votre contenu',
        export: 'Exporter',
        exportDescription: 'Téléchargez votre projet',
      },
      viewMode: {
        banner: {
          title: '🔒 Mode Lecture - Chemin Terminé',
          description: 'Ce chemin est terminé et affiché en mode lecture seule. Vous pouvez exporter le projet ou voir les modules créés.',
          tip: '💡 Pour modifier le contenu, cliquez sur le bouton "Éditer / Modifier" en haut.',
        },
        viewModulesSection: {
          title: '📋 Voir les Modules Enregistrés',
          description: 'Cliquez sur "Retour" pour revoir les modules que vous avez créés (En-tête, Corps, Pied de page) en mode lecture seule.',
        },
      },
      moduleEditor: {
        readOnlyBanner: '🔒 Mode Lecture: Ce module est terminé. Cliquez sur "Éditer / Modifier" en haut pour apporter des modifications.',
        configuration: '⚙️ Configuration',
        useTailwind: 'Utiliser Tailwind CSS (CDN)',
        active: 'Actif',
        htmlCode: 'Code HTML',
        cssStyles: 'Styles CSS',
        downloadHtml: 'Télécharger HTML',
        downloadCss: 'Télécharger CSS',
        note: 'Note: Les styles sont isolés dans ce module',
        uploadHtml: '.html',
        uploadTailwind: '+TW',
        uploadCss: '.css',
        notebook: 'Notebook',
        hide: 'Masquer',
        edit: 'Éditer',
        htmlPlaceholder: '<div>Écrivez ou collez votre HTML ici...</div>',
        cssPlaceholder: '.ma-classe { color: red; }',
      },
      templateLibrary: {
        title: 'Bibliothèque de Modèles',
        subtitle: 'Optionnel: Sélectionnez un modèle pour commencer plus rapidement, ou continuez sans modèle',
        createTemplate: 'Créer un Modèle',
        headers: 'En-têtes',
        body: 'Corps',
        footers: 'Pieds de page',
        useTemplate: 'Utiliser le Modèle',
      },
      phases: {
        select: {
          title: 'Sélectionner les Modèles',
          subtitle: 'Choisissez parmi nos modèles prédéfinis ou commencez à partir de zéro',
          startFromScratch: {
            title: 'Préférez-vous commencer à partir de zéro?',
            description: 'Passez cette section et créez votre design à partir de zéro sans utiliser de modèles',
            button: 'Continuer sans Modèle',
          },
        },
        edit: {
          title: 'Éditeur de Modules',
          subtitle: 'Sélectionnez un module à éditer. Écrivez du code, téléchargez des fichiers ou importez depuis Notebook.',
          moduleInfo: {
            title: 'Éditeur de Modules',
            description: 'Sélectionnez un module à éditer. Écrivez du code, téléchargez des fichiers ou importez depuis Notebook.',
          },
          modules: {
            header: 'En-tête',
            body: 'Contenu du Corps',
            footer: 'Pied de page',
          },
        },
        export: {
          title: '🎉 Prêt à Exporter!',
          subtitle: 'Sélectionnez le format d\'exportation dont vous avez besoin',
          formats: {
            combined: {
              title: 'HTML Complet (avec CSS)',
              description: 'Page HTML complète avec tous les styles CSS intégrés',
              button: 'Télécharger HTML Complet',
            },
            htmlOnly: {
              title: 'HTML Seulement',
              description: 'Seulement le code HTML sans styles (utile pour l\'intégration dans d\'autres projets)',
              button: 'Télécharger HTML',
            },
            cssOnly: {
              title: 'CSS Seulement',
              description: 'Seulement les styles CSS dans un fichier séparé',
              button: 'Télécharger CSS',
            },
            htmlTailwind: {
              title: 'HTML avec Tailwind',
              description: 'HTML complet utilisant Tailwind CSS depuis CDN (sans CSS personnalisé)',
              button: 'Télécharger HTML + Tailwind',
              badge: 'Recommandé',
            },
          },
          tip: '💡 Astuce: Si vous avez utilisé des classes Tailwind dans votre code, sélectionnez "HTML avec Tailwind" pour garantir que les styles fonctionnent correctement.',
        },
      },
      navigation: {
        back: 'Retour',
        continueToEdit: 'Continuer vers Édition',
        viewPreview: 'Voir Aperçu',
        continueToExport: 'Continuer vers Export',
      },      preview: {
        title: 'Aperçu en Direct',
        subtitle: 'Prévisualisez votre page complète',
        download: 'Télécharger l’Aperçu',
      },
      createTemplate: {
        title: 'Créer un Modèle Personnalisé',
        subtitle: 'Enregistrez votre code comme modèle réutilisable',
        name: 'Nom du Modèle *',
        namePlaceholder: 'Ex: Mon En-tête Personnalisé',
        description: 'Description',
        descriptionPlaceholder: 'Décrivez brièvement votre modèle',
        moduleType: 'Type de Module',
        useTailwindLabel: 'Ce modèle utilise Tailwind CSS',
        htmlCodeLabel: 'Code HTML *',
        htmlPlaceholder: '<div>Votre code HTML ici...</div>',
        cssCodeLabel: 'Code CSS (optionnel)',
        cssPlaceholder: '.ma-classe { color: blue; }',
        cancel: 'Annuler',
        save: 'Enregistrer le Modèle',
        alertMessage: 'Veuillez compléter au moins le nom et le HTML',
      },
      promptLibrary: {
        title: 'Bibliothèque de Prompts',
        subtitle: 'Sélectionnez un prompt à copier',
        searchPlaceholder: 'Rechercher des prompts...',
        copyButton: 'Copier',
        copiedButton: 'Copié',
        noContent: 'Aucun contenu',
        noResults: 'Aucun prompt trouvé',
        noPrompts: 'Aucun prompt disponible',
        tip: '💡 Astuce: Utilisez les prompts copiés pour générer du contenu avec l\'IA',
      },
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur de chargement des données',
      retry: 'Réessayer',
      cancel: 'Annuler',
      save: 'Sauvegarder',
      edit: 'Éditer',
      delete: 'Supprimer',
      create: 'Créer',
      view: 'Voir',
      search: 'Rechercher',
      name: 'Nom',
      description: 'Description',
      actions: 'Actions',
      saving: 'Enregistrement...',
      creating: 'Création...',
      updating: 'Mise à jour...',
      deleting: 'Suppression...',
    },
  },
};
