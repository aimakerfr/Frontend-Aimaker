const MODELS_DATA = {
  "text": [
    { "id": "gpt-5.4-2026-03-05",          "label": "GPT-5.4",           "editeur": "openai",    "inputPer1M": 2.5, "outputPer1M": 15,  "description": "Dernière génération OpenAI, performances de pointe en raisonnement et créativité." },
    { "id": "gpt-5.2-2025-12-11",          "label": "GPT-5.2",           "editeur": "openai",    "inputPer1M": 1.75, "outputPer1M": 14, "description": "Modèle avancé avec raisonnement amélioré et large fenêtre de contexte." },
    { "id": "gpt-4.1-2025-04-14",         "label": "GPT-4.1",           "editeur": "openai",    "inputPer1M": 2,    "outputPer1M": 8,  "description": "Modèle phare d'OpenAI, excellent en codage et suivi d'instructions complexes." },
    { "id": "gpt-5-mini-2025-08-07",       "label": "GPT-5 Mini",        "editeur": "openai",    "inputPer1M": 0.25, "outputPer1M": 2,  "description": "Petit modèle rapide et économique, idéal pour les tâches simples du quotidien." },
    { "id": "claude-opus-4-6",             "label": "Claude Opus 4.6",   "editeur": "anthropic", "inputPer1M": 5,    "outputPer1M": 25, "description": "Modèle le plus puissant d'Anthropic, excelle en analyse approfondie et tâches complexes." },
    { "id": "claude-sonnet-4-5-20250929",  "label": "Claude Sonnet 4.5", "editeur": "anthropic", "inputPer1M": 3,    "outputPer1M": 15, "description": "Équilibre optimal entre performance et coût, très bon en rédaction et codage." },
    { "id": "claude-haiku-4-5-20251001",   "label": "Claude Haiku 4.5",  "editeur": "anthropic", "inputPer1M": 1,    "outputPer1M": 5,  "description": "Modèle rapide et abordable, parfait pour les réponses courtes et le traitement en masse." },
    { "id": "gemini-3.1-pro-preview",      "label": "Gemini 3.1 Pro",    "editeur": "google",    "inputPer1M": 2,    "outputPer1M": 12, "description": "Dernier modèle Pro de Google, performant en raisonnement multimodal et long contexte." },
    { "id": "gemini-3-flash-preview",      "label": "Gemini 3 Flash",    "editeur": "google",    "inputPer1M": 0.5,  "outputPer1M": 3.0, "description": "Dernier modèle FLash, combinant rapidité et une intelligence de pointe." },
    { "id": "gemini-3.1-flash-lite-preview", "label": "Gemini 3.1 Flash Lite",  "editeur": "google",    "inputPer1M": 0.25,  "outputPer1M": 1.5, "description": "Modèle ultra-rapide et économique de Google, bon rapport qualité-prix." },
    { "id": "mistral-large-latest",        "label": "Mistral Large 3",   "editeur": "mistral",   "inputPer1M": 0.5,    "outputPer1M": 1.5,  "description": "Le modèle phare et le plus performant de Mistral. Cocorico." },
    { "id": "mistral-small-latest",          "label": "Mistral Small 3.2",  "editeur": "mistral", "inputPer1M": 0.1, "outputPer1M": 0.3,"description": "Petit modèle, extremement rapide et économique, parfait pour les tâches simples." },
    { "id": "labs-mistral-small-creative", "label": "Mistral Small Creative", "editeur": "mistral", "inputPer1M": 0.1,  "outputPer1M": 0.3,  "description": "Petit modèle finement réglé pour l'écriture créative, les jeux de rôle et les discussions en ligne." },
    { "id": "ministral-8b-latest",         "label": "Ministral 8B",      "editeur": "mistral",   "inputPer1M": 0.15,  "outputPer1M": 0.15,"description": "Modèle compact (8B) optimisé pour la rapidité d'exécution et l'edge computing." }
  ],
  "image": [
    { "id": "gemini-3-pro-image-preview",    "label": "Nano Banana Pro", "editeur": "google", "inputPer1M": 2,   "outputPer1M": 12, "imageOutput": 0.134, "description": "Génération d'images via Gemini Pro, haute qualité et bonne compréhension des prompts." },
    { "id": "gemini-3.1-flash-image-preview", "label": "Nano Banana 2",  "editeur": "google", "inputPer1M": 0.5, "outputPer1M": 3,  "imageOutput": 0.134, "description": "Génération d'images rapide et économique basée sur Gemini Flash." },
    { "id": "gpt-image-1.5",                 "label": "GPT Image 1.5",  "editeur": "openai", "inputPer1M": 5,   "outputPer1M": 10, "imageOutput": 0.2,   "description": "Modèle de génération d'images d'OpenAI, excellent en réalisme et créativité." }
  ],
  "search": [
    { "id": "sonar-pro",            "label": "Sonar Pro",            "editeur": "perplexity", "inputPer1M": 3, "outputPer1M": 15, "description": "Recherche web avancée avec synthèse de sources multiples et citations." },
    { "id": "sonar-reasoning-pro",  "label": "Sonar Reasoning Pro",  "editeur": "perplexity", "inputPer1M": 2, "outputPer1M": 8,  "description": "Recherche web avec raisonnement approfondi pour les questions complexes." }
  ],
  "tts": [
    { "id": "gpt-4o-mini-tts",                  "label": "OpenAI (gpt-4o-mini-tts)",          "editeur": "openai",  "prix": "$12/1M car.",  "description": "Synthèse vocale rapide et expressive d'OpenAI." },
    { "id": "gemini-2.5-flash-preview-tts",      "label": "Google (Gemini 2.5 Flash TTS)",     "editeur": "google",  "prix": "$0.25 / $1.5",  "description": "Synthèse vocale de Google via Gemini, voix naturelles multilingues." }
  ],
  "stt": [
    { "id": "whisper-1",              "label": "OpenAI (Whisper)",           "editeur": "openai",  "prix": "$0.006/min",  "description": "Transcription audio précise et multilingue par OpenAI." },
    { "id": "gemini-3.1-flash-lite-preview", "label": "Google (Gemini 3.1 Flash Lite)", "editeur": "google",  "prix": "$0.25 / $1.5",  "description": "Transcription audio via Gemini Flash Lite, rapide et polyvalent." },
    { "id": "voxtral-mini-latest",    "label": "Mistral (Voxtral Mini 2)",  "editeur": "mistral", "prix": "$0.003/min",  "description": "Modèle de transcription de pointe par Mistral, léger et rapide." }
  ]
};
