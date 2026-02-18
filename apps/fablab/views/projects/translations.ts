
import { Language } from './types';

export const translations: Record<Language, any> = {
  en: {
    title: "AI Architect Roadmap",
    subtitle: "From Zero to AI 'Programs' - The Official Route",
    phases: ["Principle", "Phase 0", "Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"],
    principle: {
      title: "Fundamental Principle",
      quote: "A program is not code. A program is a consistent way of thinking and deciding. The AI executes; the human designs the thinking.",
      desc: "Before we touch any tool, understand that your job is to build the logic, not the syntax. You are an architect of instructions.",
      btn: "I Understand - Start Phase 0"
    },
    phase0: {
      title: "Phase 0: Define Your Goal",
      rule: "5 Minute Rule",
      desc: "Write this without AI assistance. If you can't define it in 5 minutes, the project doesn't exist yet.",
      serves: "It serves for:",
      helps: "It helps:",
      target: "Target Audience:",
      problem: "Problem it solves:",
      result: "Expected Final Result:",
      placeholders: {
        serves: "e.g. Automating client onboarding reports",
        helps: "e.g. Save 2 hours of manual data entry",
        target: "e.g. Independent real estate agents",
        problem: "What is the pain point?",
        result: "e.g. A DOC summary ready for the client"
      }
    },
    phase1: {
      title: "Phase 1: Guided Research",
      tool: "Tool:",
      desc: "Think like an expert. Use these exact structures to gather knowledge.",
      ruleTitle: "Research Rule:",
      ruleDesc: "Only save information that is: 1) Repeated in multiple sources, 2) Applicable in practice, 3) Easy to explain.",
      questions: [
        "What are the best practices for {serves}?",
        "What common mistakes are made when {serves}?",
        "How do experts work when they need to {serves}?",
        "What steps does a professional follow to achieve {result}?"
      ]
    },
    phase2: {
      title: "Phase 2: Knowledge Notebook",
      desc: "Build your Knowledge Base. Upload your research and notes. Organize them into these 4 sources:",
      s1: "Source 01: Goal",
      s1Desc: "Your Objective Declaration from Phase 0.",
      s2: "Source 02: Expert Focus",
      s2Desc: "Best practices and how professionals think.",
      s3: "Source 03: Mistakes",
      s3Desc: "Common errors and what to avoid.",
      s4: "Source 04: Criteria",
      s4Desc: "Language, key concepts, and quality metrics.",
      synth: "Synthesize with AI Training:",
      synthDesc: "Paste the result of 'Summarize key knowledge for a beginner' from NotebookLM here:",
      synthPlaceholder: "Paste Source 05 - Synthesis here..."
    },
    phase3: {
      title: "Phase 3: Logic Design",
      desc: "Convert knowledge into instructions. This IS the 'Program'.",
      role: "Professional Role:",
      exp: "Experience Level:",
      style: "Communication Style:",
      process: "Logical Process (Workflow):",
      stepPlaceholder: "Step {n}: AI should...",
      optimizeBtn: "Optimize Prompt with AI"
    },
    phase4: {
      title: "Phase 4: Optimized Prompt",
      master: "Your Master Instruction:",
      copy: "Copy Optimized Prompt",
      improved: "What was improved?",
      improvements: [
        "Eliminated ambiguity in the Role description.",
        "Structured the output format for consistency.",
        "Added quality constraints based on your context."
      ]
    },
    phase5: {
      title: "Phase 5: Execute in Google AI Studio",
      settings: "Settings:",
      structure: "Structure:",
      structureDesc: "Paste your optimized prompt in the 'System Instructions' block.",
      launchTitle: "Launch Sequence",
      launchDesc: "You have built a logical machine. Run your first test cases.",
      openBtn: "Open Google AI Studio"
    },
    phase6: {
      title: "Phase 6: Iteration & Mastery",
      desc: "Creation is never finished. Refine your program based on real use.",
      checklistTitle: "Checklist for Success:",
      checkItems: [
        "Tool handles edge cases gracefully.",
        "Output is consistently formatted.",
        "Expert logic is visible in responses."
      ],
      refinementTitle: "Add these for refinement:",
      masteryTitle: "Roadmap Complete!",
      masteryDesc: "You have evolved from a user to an AI Architect.",
      newProject: "Start a New Project"
    },
    common: {
      back: "Back",
      next: "Next Phase",
      nextReview: "Final Review",
      loading: "Optimizing...",
      copySuccess: "Copied to clipboard!",
      resetConfirm: "Reset everything and start a new project?"
    }
  },
  es: {
    title: "Ruta del Arquitecto IA",
    subtitle: "De Cero a 'Programas' con IA - La Ruta Oficial",
    phases: ["Principio", "Fase 0", "Fase 1", "Fase 2", "Fase 3", "Fase 4", "Fase 5", "Fase 6"],
    principle: {
      title: "Principio Fundamental",
      quote: "Un programa no es código. Un programa es una forma consistente de pensar y decidir. La IA ejecuta; la persona diseña el pensamiento.",
      desc: "Antes de tocar cualquier herramienta, entiende que tu trabajo es construir la lógica, no la sintaxis. Eres un arquitecto de instrucciones.",
      btn: "Entiendo - Empezar Fase 0"
    },
    phase0: {
      title: "Fase 0: Definir Objetivo",
      rule: "Regla de 5 Minutos",
      desc: "Escribe esto sin ayuda de IA. Si no puedes definirlo en 5 minutos, el proyecto aún no existe.",
      serves: "Sirve para:",
      helps: "Ayuda a:",
      target: "Público Objetivo:",
      problem: "Problema que resuelve:",
      result: "Resultado Final Esperado:",
      placeholders: {
        serves: "ej. Automatizar reportes de clientes",
        helps: "ej. Ahorrar 2 horas de entrada manual",
        target: "ej. Agentes inmobiliarios independientes",
        problem: "¿Cuál es el punto de dolor?",
        result: "ej. Un resumen DOC listo para el cliente"
      }
    },
    phase1: {
      title: "Fase 1: Investigación Guiada",
      tool: "Herramienta:",
      desc: "Piensa como un experto. Usa estas estructuras exactas para reunir conocimiento.",
      ruleTitle: "Regla de Investigación:",
      ruleDesc: "Solo guarda información que: 1) Se repita en varias fuentes, 2) Sea aplicable en la práctica, 3) Sea fácil de explicar.",
      questions: [
        "¿Cuáles son las mejores prácticas para {serves}?",
        "¿Qué errores comunes se cometen al {serves}?",
        "¿Cómo trabajan los expertos cuando necesitan {serves}?",
        "¿Qué pasos sigue un profesional para lograr {result}?"
      ]
    },
    phase2: {
      title: "Fase 2: Cuaderno de Conocimiento",
      desc: "Construye tu base de conocimiento. Sube tus resúmenes y notas. Organízalos en estas 4 fuentes:",
      s1: "Fuente 01: Objetivo",
      s1Desc: "Tu declaración de objetivo de la Fase 0.",
      s2: "Fuente 02: Enfoque Experto",
      s2Desc: "Mejores prácticas y cómo piensan los profesionales.",
      s3: "Fuente 03: Errores",
      s3Desc: "Errores comunes y qué evitar.",
      s4: "Fuente 04: Criterios",
      s4Desc: "Lenguaje, conceptos clave y métricas de calidad.",
      synth: "Sintetizar con Entrenamiento IA:",
      synthDesc: "Pega aquí el resultado de 'Resumir conocimiento clave para un principiante' de NotebookLM:",
      synthPlaceholder: "Pega la Fuente 05 - Síntesis aquí..."
    },
    phase3: {
      title: "Fase 3: Diseño Lógico",
      desc: "Convierte conocimiento en instrucciones. Esto ES el 'Programa'.",
      role: "Rol Profesional:",
      exp: "Nivel de Experiencia:",
      style: "Estilo de Comunicación:",
      process: "Proceso Lógico (Workflow):",
      stepPlaceholder: "Paso {n}: La IA debe...",
      optimizeBtn: "Optimizar Prompt con IA"
    },
    phase4: {
      title: "Fase 4: Prompt Optimizado",
      master: "Tu Instrucción Maestra:",
      copy: "Copiar Prompt Optimizado",
      improved: "¿Qué se mejoró?",
      improvements: [
        "Se eliminó la ambigüedad en la descripción del Rol.",
        "Se estructuró el formato de salida para consistencia.",
        "Se añadieron restricciones de calidad basadas en tu contexto."
      ]
    },
    phase5: {
      title: "Fase 5: Ejecutar en Google AI Studio",
      settings: "Configuración:",
      structure: "Estructura:",
      structureDesc: "Pega tu prompt optimizado en el bloque de 'System Instructions'.",
      launchTitle: "Secuencia de Lanzamiento",
      launchDesc: "Has construido una máquina lógica. Realiza tus primeras pruebas.",
      openBtn: "Abrir Google AI Studio"
    },
    phase6: {
      title: "Fase 6: Iteración y Maestría",
      desc: "La creación nunca termina. Refina tu programa basado en el uso real.",
      checklistTitle: "Lista para el Éxito:",
      checkItems: [
        "La herramienta maneja casos extremos con gracia.",
        "La salida tiene un formato consistente.",
        "La lógica experta es visible en las respuestas."
      ],
      refinementTitle: "Añade esto para refinar:",
      masteryTitle: "¡Ruta Completada!",
      masteryDesc: "Has evolucionado de usuario a Arquitecto de IA.",
      newProject: "Empezar Nuevo Proyecto"
    },
    common: {
      back: "Atrás",
      next: "Siguiente Fase",
      nextReview: "Revisión Final",
      loading: "Optimizando...",
      copySuccess: "¡Copiado al portapapeles!",
      resetConfirm: "¿Resetear todo y empezar un nuevo proyecto?"
    }
  },
  fr: {
    title: "Parcours de l'Architecte IA",
    subtitle: "De Zéro à des 'Programmes' IA - La Route Officielle",
    phases: ["Principe", "Phase 0", "Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"],
    principle: {
      title: "Principe Fondamental",
      quote: "Un programme n'est pas du code. Un programme est une manière cohérente de penser et de décider. L'IA exécute ; l'humain conçoit la pensée.",
      desc: "Avant de toucher à un outil, comprenez que votre travail consiste à construire la logique, pas la syntaxe. Vous êtes un architecte d'instructions.",
      btn: "Je Comprends - Démarrer Phase 0"
    },
    phase0: {
      title: "Phase 0 : Définir Votre Objectif",
      rule: "Règle des 5 Minutes",
      desc: "Écrivez ceci sans l'aide de l'IA. Si vous ne pouvez pas le définir en 5 minutes, le projet n'existe pas encore.",
      serves: "Sert à :",
      helps: "Aide à :",
      target: "Public Cible :",
      problem: "Problème résolu :",
      result: "Résultat Final Attendu :",
      placeholders: {
        serves: "ex. Automatisation des rapports clients",
        helps: "ex. Gain de 2 heures de saisie manuelle",
        target: "ex. Agents immobiliers indépendants",
        problem: "Quel est le point de douleur ?",
        result: "ex. Un résumé DOC prêt pour le client"
      }
    },
    phase1: {
      title: "Phase 1 : Recherche Guidée",
      tool: "Outil :",
      desc: "Pensez comme un expert. Utilisez ces structures exactes pour rassembler des connaissances.",
      ruleTitle: "Règle de Recherche :",
      ruleDesc: "Ne conservez que les informations : 1) Répétées dans plusieurs sources, 2) Applicables en pratique, 3) Faciles à expliquer.",
      questions: [
        "Quelles sont les meilleures pratiques pour {serves} ?",
        "Quelles erreurs courantes sont commises lors de {serves} ?",
        "Comment travaillent les experts lorsqu'ils ont besoin de {serves} ?",
        "Quelles étapes un professionnel suit-il pour atteindre {result} ?"
      ]
    },
    phase2: {
      title: "Phase 2 : Carnet de Connaissances",
      desc: "Construisez votre base de connaissances. Téléchargez vos recherches et notes. Organisez-les en ces 4 sources :",
      s1: "Source 01 : Objectif",
      s1Desc: "Votre déclaration d'objectif de la Phase 0.",
      s2: "Source 02 : Focus Expert",
      s2Desc: "Meilleures pratiques et mode de pensée des professionnels.",
      s3: "Source 03 : Erreurs",
      s3Desc: "Erreurs courantes et pièges à éviter.",
      s4: "Source 04 : Critères",
      s4Desc: "Langage, concepts clés et mesures de qualité.",
      synth: "Synthétiser avec l'IA :",
      synthDesc: "Collez ici le résultat de 'Résumer les connaissances pour un débutant' de NotebookLM :",
      synthPlaceholder: "Collez la Source 05 - Synthèse ici..."
    },
    phase3: {
      title: "Phase 3 : Conception Logique",
      desc: "Convertissez les connaissances en instructions. C'EST le 'Programme'.",
      role: "Rôle Professionnel :",
      exp: "Niveau d'Expérience :",
      style: "Style de Communication :",
      process: "Processus Logique (Workflow) :",
      stepPlaceholder: "Étape {n} : L'IA doit...",
      optimizeBtn: "Optimiser le Prompt avec l'IA"
    },
    phase4: {
      title: "Phase 4 : Prompt Optimisé",
      master: "Votre Instruction Maîtresse :",
      copy: "Copier le Prompt Optimisé",
      improved: "Qu'est-ce qui a été amélioré ?",
      improvements: [
        "Élimination de l'ambiguïté dans la description du rôle.",
        "Structuration du format de sortie pour la cohérence.",
        "Ajout de contraintes de qualité basées sur votre contexte."
      ]
    },
    phase5: {
      title: "Phase 5 : Exécuter dans Google AI Studio",
      settings: "Paramètres :",
      structure: "Structure :",
      structureDesc: "Collez votre prompt optimisé dans le bloc 'System Instructions'.",
      launchTitle: "Séquence de Lancement",
      launchDesc: "Vous avez construit une machine logique. Lancez vos premiers tests.",
      openBtn: "Ouvrir Google AI Studio"
    },
    phase6: {
      title: "Phase 6 : Itération et Maîtrise",
      desc: "La création n'est jamais terminée. Affinez votre programme selon l'usage réel.",
      checklistTitle: "Liste de Contrôle du Succès :",
      checkItems: [
        "L'outil gère les cas limites avec élégance.",
        "La sortie est formatée de manière cohérente.",
        "La logique experte est visible dans les réponses."
      ],
      refinementTitle: "Ajoutez ceci pour affiner :",
      masteryTitle: "Feuille de route terminée !",
      masteryDesc: "Vous êtes passé du statut d'utilisateur à celui d'Architecte IA.",
      newProject: "Démarrer un Nouveau Projet"
    },
    common: {
      back: "Retour",
      next: "Phase Suivante",
      nextReview: "Examen Final",
      loading: "Optimisation...",
      copySuccess: "Copié dans le presse-papiers !",
      resetConfirm: "Réinitialiser tout et démarrer un nouveau projet ?"
    }
  }
};
