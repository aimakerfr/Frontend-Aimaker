/**
 * Language types and interfaces
 * Centralizes all translation type definitions
 */
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
      projectFlow: {
        title: string;
        description: string;
        badge1: string;
        badge2: string;
      };
      cancel: string;
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
