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
    noDescription: string;
    tooltips: {
      open: string;
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
      useTailwind: string;
      active: string;
      module: string;
      loadFromNotebook: string;
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
  assistant: {
    title: string;
    thinkingMode: string;
    deepThinking: string;
    placeholder: string;
    welcomeMessage: string;
  };
  serverTools: {
    title: string;
    subtitle: string;
    editUrl: string;
    open: string;
    access: string;
    tools: {
      llm: { name: string; description: string };
      n8n: { name: string; description: string };
      perplexity: { name: string; description: string };
      promptOptimize: { name: string; description: string };
      imageGen: { name: string; description: string };
      admin: { name: string; description: string };
    };
  };
  tools: {
    title: string;
    subtitle: string;
    secureTool: string;
    experimental: string;
    items: {
      webSearch: { name: string; description: string };
      docGen: { name: string; description: string };
      dataAnalysis: { name: string; description: string };
      audioTranscription: { name: string; description: string };
    };
  };
  assistantDetails: {
    title: string;
    systemInstructions: string;
    instructionsPlaceholder: string;
    instructionsHint: string;
    conversationStarters: string;
    optionPlaceholder: string;
    addOption: string;
    knowledgeBase: string;
    uploadDocuments: string;
    uploadHint: string;
    capabilities: string;
    imageGeneration: string;
    platform: string;
    platformPlaceholder: string;
    assistantUrl: string;
    baseUrl: string;
    errorNotAssistant: string;
    errorLoadingDetails: string;
    errorSaving: string;
  };
  projectDetails: {
    title: string;
    appName: string;
    category: string;
    filesUrl: string;
    deploymentUrl: string;
    databaseUrl: string;
    databaseName: string;
    placeholderAppName: string;
    placeholderCategory: string;
    placeholderFilesUrl: string;
    placeholderDeploymentUrl: string;
    placeholderDatabaseUrl: string;
    placeholderDatabaseName: string;
    errorNotProject: string;
    errorLoading: string;
    errorSaving: string;
  };
  projectView: {
    configTitle: string;
    configSubtitle: string;
    type: string;
    project: string;
    publish: string;
    published: string;
    projectType: string;
    types: {
      landingPage: string;
      app: string;
      automation: string;
    };
    fav: string;
    context: string;
    contextPlaceholder: string;
    resourceUrls: string;
    privateUrlLabel: string;
    publicUrlLabel: string;
    publishModalTitle: string;
    publishModalDesc: string;
    confirm: string;
    errorNotAvailable: string;
    notProject: string;
    errorLoading: string;
    saveSuccess: string;
    saveError: string;
    loading: string;
    backToLibrary: string;
  };
  saveStatusModal: {
    successTitle: string;
    errorTitle: string;
    close: string;
  };
  promptEditor: {
    title: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    copy: string;
    advancedConfig: string;
    hideAdvanced: string;
    showAdvanced: string;
    extraContext: string;
    extraContextPlaceholder: string;
    outputFormat: string;
    outputFormatPlaceholder: string;
    errorNotPrompt: string;
    errorLoading: string;
    errorSavingBody: string;
    saving: string;
  };
  publicAssistant: {
    loading: string;
    errorNotAvailable: string;
    errorPrivate: string;
    errorNotAssistant: string;
    errorLoading: string;
    publicView: string;
    errorProcessing: string;
  };
  publicProject: {
    loading: string;
    errorPrivate: string;
    errorNotProject: string;
    errorLoading: string;
    errorNotFound: string;
    back: string;
    public: string;
    favorite: string;
    noDescription: string;
    unknownAuthor: string;
    liveProject: string;
    deploymentUrl: string;
    visit: string;
    projectInfo: string;
    appName: string;
    category: string;
    filesRepo: string;
    database: string;
    projectContext: string;
    viewModeTitle: string;
    viewModeDesc: string;
    noCategory: string;
    language: string;
    status: string;
    type: string;
    types: {
      landingPage: string;
      app: string;
      automation: string;
      project: string;
    };
  };
  publicPrompt: {
    loading: string;
    errorPrivate: string;
    errorNotPrompt: string;
    errorLoading: string;
    errorNotFound: string;
    back: string;
    publicView: string;
    readOnly: string;
    author: string;
    language: string;
    type: string;
    descriptionTitle: string;
    noDescription: string;
    contentTitle: string;
    noContent: string;
    infoTitle: string;
    infoDesc: string;
  };
  administration: {
    title: string;
    subtitle: string;
    inDevelopment: string;
    availableSoon: string;
  };
  toolView: {
    labels: {
      type: string;
      title: string;
      description: string;
      category: string;
      language: string;
    };
    placeholders: {
      title: string;
      description: string;
    };
    actions: {
      save: string;
      saving: string;
      publish: string;
      published: string;
      addFavorite: string;
      removeFavorite: string;
      copy: string;
      copied: string;
      open: string;
    };
    urls: {
      title: string;
      privateLabel: string;
      publicLabel: string;
    };
    categories: {
      marketing: string;
      sales: string;
      development: string;
      hr: string;
    };
    languages: {
      spanish: string;
      english: string;
      french: string;
    };
    visibility: {
      private: string;
      public: string;
    };
    messages: {
      errorLoading: string;
      errorSaving: string;
      errorPublishing: string;
      successSave: string;
      successPublish: string;
      notFound: string;
      backToLibrary: string;
    };
    types: {
      assistant: {
        title: string;
        subtitle: string;
        saveSuccess: string;
      };
      project: {
        title: string;
        subtitle: string;
        saveSuccess: string;
      };
      prompt: {
        title: string;
        subtitle: string;
        saveSuccess: string;
      };
    };
  };
  templateVisualizer: {
    title: string;
    header: string;
    footer: string;
    download: string;
  };
  detailsView: {
    title: string;
    subtitle: string;
    type: string;
    name: string;
    language: string;
    languages: {
      fr: string;
      en: string;
      es: string;
    };
    description: string;
    visibility: string;
    private: string;
    public: string;
    readOnlyInfo: string;
    privateUrl: string;
    publicUrl: string;
    copyUrl: string;
    openTab: string;
    cancel: string;
    updating: string;
    update: string;
    titleView: string;
    subtitleView: string;
    urlLabel: string;
    edit: string;
    open: string;
  };
  publishModals: {
    prompt: {
      title: string;
      message: string;
      confirm: string;
      cancel: string;
    };
    assistant: {
      title: string;
      message: string;
      confirm: string;
      cancel: string;
    };
    project: {
      title: string;
      message: string;
      confirm: string;
      cancel: string;
    };
  };
  formGeneral: {
    title: string;
    update: string;
    type: string;
    titleLabel: string;
    url: string;
    language: string;
    description: string;
    descriptionPlaceholder: string;
    visibility: string;
    private: string;
    public: string;
    details: string;
    category: string;
    selectCategory: string;
    categoryOptions: {
      analysis: string;
      development: string;
      design: string;
      education: string;
      ecommerce: string;
      marketing: string;
      research: string;
      other: string;
    };
    selectedHelper: string;
    notModifiableHelper: string;
    definedInProfileHelper: string;
  };
  notebook: {
    noTitle: string;
    header: {
      back: string;
      ragMultimodal: string;
    };
    settings: {
      titlePlaceholder: string;
      descriptionPlaceholder: string;
      private: string;
      public: string;
      openPublicLink: string;
      favorite: string;
      addFavorite: string;
      visiblePublicly: string;
      categories: {
        marketing: string;
        development: string;
        research: string;
        analysis: string;
      };
    };
    sourcePanel: {
      title: string;
      total: string;
      empty: string;
      add: string;
      modal: {
        title: string;
        subtitle: string;
        tabs: {
          pdf: string;
          html: string;
          image: string;
          video: string;
          url: string;
          translation: string;
          text: string;
        };
        placeholders: {
          selectFile: string;
          uploadHtml: string;
          uploadImage: string;
          uploadVideo: string;
          youtubeUrl: string;
          webLink: string;
          webLinkHint: string;
          textLabel: string;
          textPlaceholder: string;
          paste: string;
          translationTitle: string;
          translationDesc: string;
          downloadTemplate: string;
          uploadTranslation: string;
          translationHint: string;
          newSource: string;
        };
        footer: {
          synthesizing: string;
        };
      };
      preview: {
        title: string;
        subtitle: string;
        htmlDocument: string;
        document: string;
        ragHint: string;
        openNewTab: string;
        downloadFile: string;
        visitLink: string;
      };
    };
    chat: {
      overview: string;
      analyzing: string;
      sourcesCount: string;
      synthesis: string;
      breakdown: string;
      topics: string;
      questions: string;
      start: string;
      startSub: string;
      synthesizing: string;
      placeholder: string;
    };
    publishModal: {
      makePrivate: string;
      publish: string;
      makePrivateDesc: string;
      publishDesc: string;
      confirm: string;
    };
  };
}
  