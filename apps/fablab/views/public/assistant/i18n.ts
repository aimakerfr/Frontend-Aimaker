import type { Language } from './types';

export type { Language };

type TranslationKey = 
  | 'config.instrLabel'
  | 'config.instrPlaceholder'
  | 'config.warningLabel'
  | 'config.warningText'
  | 'config.startersLabel'
  | 'config.addOption'
  | 'config.knowledgeLabel'
  | 'config.uploadTitle'
  | 'config.uploadDesc'
  | 'config.selectFiles'
  | 'config.capabilitiesLabel'
  | 'config.imageGen'
  | 'preview.statusBar'
  | 'preview.emptyTitle'
  | 'preview.emptyDesc'
  | 'preview.placeholder'
  | 'preview.thinking'
  | 'chatInput.file';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'config.instrLabel': 'System Instructions',
    'config.instrPlaceholder': 'Define behavior, tone, and limits...',
    'config.warningLabel': 'Note',
    'config.warningText': 'This is where you shape the intelligence of your Assistant.',
    'config.startersLabel': 'Conversation Starters',
    'config.addOption': 'Add an option',
    'config.knowledgeLabel': 'Knowledge Base',
    'config.uploadTitle': 'Upload your documents',
    'config.uploadDesc': 'PDF, DOCX or TXT to enrich the context.',
    'config.selectFiles': 'Select Files',
    'config.capabilitiesLabel': 'Features & Tools',
    'config.imageGen': 'Image Generation',
    'preview.statusBar': 'Test your assistant\'s behavior here',
    'preview.emptyTitle': 'New Assistant',
    'preview.emptyDesc': 'Start chatting to test your AI\'s current configuration.',
    'preview.placeholder': 'Send a message to {name}...',
    'preview.thinking': 'The assistant is thinking...',
    'chatInput.file': 'File',
  },
  fr: {
    'config.instrLabel': 'Instructions du Système',
    'config.instrPlaceholder': 'Définissez le comportement, le ton et les limites...',
    'config.warningLabel': 'Aviso',
    'config.warningText': "C'est ici que vous façonnez l'intelligence de votre Assistant.",
    'config.startersLabel': 'Amorces de conversation',
    'config.addOption': 'Ajouter une option',
    'config.knowledgeLabel': 'Base de connaissances',
    'config.uploadTitle': 'Charger vos documents',
    'config.uploadDesc': 'PDF, DOCX ou TXT pour enrichir le contexte.',
    'config.selectFiles': 'Sélectionner les fichiers',
    'config.capabilitiesLabel': 'Fonctionnalités & Outils',
    'config.imageGen': "Génération d'images",
    'preview.statusBar': 'Testez le comportement de votre assistant ici',
    'preview.emptyTitle': 'Nouveau Assistant',
    'preview.emptyDesc': 'Commencez à discuter pour tester la configuration actuelle de votre IA.',
    'preview.placeholder': 'Envoyer un message à {name}...',
    'preview.thinking': "L'assistant réfléchit...",
    'chatInput.file': 'Fichier',
  },
  es: {
    'config.instrLabel': 'Instrucciones del Sistema',
    'config.instrPlaceholder': 'Define el comportamiento, tono y límites...',
    'config.warningLabel': 'Nota',
    'config.warningText': 'Aquí es donde moldeas la inteligencia de tu Asistente.',
    'config.startersLabel': 'Iniciadores de conversación',
    'config.addOption': 'Añadir opción',
    'config.knowledgeLabel': 'Base de conocimientos',
    'config.uploadTitle': 'Cargar documentos',
    'config.uploadDesc': 'PDF, DOCX o TXT para enriquecer el contexto.',
    'config.selectFiles': 'Seleccionar archivos',
    'config.capabilitiesLabel': 'Capacidades y Herramientas',
    'config.imageGen': 'Generación de imágenes',
    'preview.statusBar': 'Prueba el comportamiento de tu asistente aquí',
    'preview.emptyTitle': 'Nuevo Asistente',
    'preview.emptyDesc': 'Comienza a chatear para probar la configuración actual de tu IA.',
    'preview.placeholder': 'Enviar un mensaje a {name}...',
    'preview.thinking': 'El asistente está pensando...',
    'chatInput.file': 'Archivo',
  }
};

export function getTranslation(language: Language, key: TranslationKey, params?: Record<string, string>): string {
  let text = translations[language][key] || translations.en[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
  }
  
  return text;
}
