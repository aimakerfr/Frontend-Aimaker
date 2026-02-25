/**
 * Language types and interfaces
 * Centralizes all translation type definitions
 */

// Exporta desde languageManager para mantener compatibilidad
export type { Language, StandardLanguage, CustomLanguage, LanguageInfo } from './languageManager';

/**
 * Base Translations interface
 * Includes core sections and allows dynamic sections from Translation Maker
 */
export interface Translations {
  // ✅ DYNAMIC SECTIONS: Translation Maker auto-genera estas secciones
  // Ejemplos: makerPathTranslations, projectFlowTranslations, dashboardTranslations
  // NO ES NECESARIO declararlas aquí - TypeScript las acepta automáticamente
  [key: string]: any; // Permite cualquier sección dinámica
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
    newRag: string;
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
    tooltips: {
      addFavorite: string;
      removeFavorite: string;
    };
    confirmDelete: string;
    authorFallback: string;
  };
  externalAccess: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allTypes: string;
    retry: string;
    deleteConfirm: string;
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
      titleEdit: string;
      titleCreate: string;
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
      activate: string;
      deactivate: string;
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
    stats: {
      notebooks: string;
      projects: string;
      prompts: string;
      links: string;
      assistants: string;
      apps: string;
      vibeCoding: string;
      total: string;
    };
    about: string;
    standardLanguages: string;
    customLanguages: string;
    addCustomLanguage: string;
    manageLanguages: string;
    languageManager: {
      title: string;
      subtitle: string;
      addNew: string;
      languageCode: string;
      languageCodePlaceholder: string;
      languageName: string;
      languageNamePlaceholder: string;
      uploadJSON: string;
      selectFile: string;
      addLanguage: string;
      deleteLanguage: string;
      deleteConfirm: string;
      languageAdded: string;
      languageDeleted: string;
      errorInvalidJSON: string;
      errorDuplicateCode: string;
      availableLanguages: string;
      noCustomLanguages: string;
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
      projectFlow: {
        title: string;
        description: string;
        badge1: string;
        badge2: string;
      };
      cancel: string;
    };
    noDescription: string;
    tooltips: {
      open: string;
    };
  };
  projectFlow: {
    title: string;
    backToMakerPath: string;
    configuration: string;
    ragLibrary: string;
    pasteJson: string;
    jsonPlaceholder: string;
    parseAndRender: string;
    pasteJsonFirst: string;
    pasteJsonHint: string;
    availablePaths: string;
    nodeConfiguration: string;
    general: string;
    nodeName: string;
    requiredStep: string;
    requiredNode: string;
    inputsAndConfiguration: string;
    promptLibrary: string;
    aiPromptTemplateEditor: string;
    systemPromptForGeneration: string;
    geminiEngine: string;
    noKey: string;
    keyNeeded: string;
    selectGeminiKey: string;
    runGeneration: string;
    library: string;
    required: string;
    end: string;
    closePanel: string;
    deploy: string;
    save: string;
    testWorkflow: string;
    changesAreSavedLocally: string;
    selectRagSource: string;
    nodeTypes: {
      fetchData: string;
      inputPrompt: string;
      aiAnalysisGeneration: string;
      selectFile: string;
      selectRagSource: string;
      compileAndExport: string;
      userInputAndAiRefinement: string;
    };
    modal: {
      title: string;
      subtitle: string;
      blankProject: string;
      blankProjectDesc: string;
      makerPaths: string;
      makerPathsDesc: string;
      viewTemplates: string;
      startNow: string;
    };
    ragSelector: {
      title: string;
      subtitle: string;
      loading: string;
      noRags: string;
      selectSources: string;
      backToList: string;
      noSources: string;
      confirm: string;
      saving: string;
      errorLoad: string;
      errorSave: string;
      retry: string;
      infoSelectLibrary: string;
      infoSelectSources: string;
    };
    ragChat: {
      title: string;
      subtitle: string;
      loadingSources: string;
      errorNoSources: string;
      errorLoadSources: string;
      useLastResponse: string;
      savedPrompt: string;
      savingPrompt: string;
      failedSave: string;
      sendPlaceholder: string;
      send: string;
      thinking: string;
      retry: string;
      sourcesLoaded: string;
      emptyTitle: string;
      emptySubtitle: string;
    };
    imageGenerator: {
      title: string;
      subtitle: string;
      promptLabel: string;
      placeholder: string;
      ctrlEnterHint: string;
      charsTruncated: string;
      longPromptWarning: string;
      generateBtn: string;
      generatingBtn: string;
      imageTitle: string;
      regenerate: string;
      download: string;
      errorEmpty: string;
      errorTimeout: string;
      errorFailed: string;
    };
    outputSaver: {
      title: string;
      subtitle: string;
      imageLabel: string;
      downloadBtn: string;
      downloadedBtn: string;
      downloadHint: string;
      noImageTitle: string;
      noImageSubtitle: string;
      errorDownload: string;
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
    moduleOrchestrator: string;
    quickActions: string;
    successFinalize: string;
    errorFinalize: string;
    backToPaths: string;
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
      module: string;
      loadFromNotebook: string;
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
      templates: string;
      custom: string;
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
      emptyContainer: string;
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
    sourcePicker: {
      title: string;
      subtitle: string;
      loading: string;
      noSources: string;
      noSourcesDescription: string;
      selectButton: string;
      availableSources: string;
      availableSource: string;
      created: string;
    };
  };
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    next: string;
    select: string;
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
    errorSaving: string;
    errorDeleting: string;
    empty: string;
    characters: string;
  };
}

