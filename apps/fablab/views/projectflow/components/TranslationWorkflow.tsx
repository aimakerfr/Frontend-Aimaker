import React, { useState } from 'react';
import { Globe, FileCode, Download, Sparkles } from 'lucide-react';
import TranslationProcessor from './TranslationProcessor';
import TranslationSaver from './TranslationSaver';
import LanguageManager from './LanguageManager';

interface TranslationWorkflowProps {
    makerPathId?: number;
    variableIndexNumber?: number;
    stepId?: number;
    onMarkStepComplete?: (stepId: number) => void;
    onNextStep?: (currentStepId: number) => void;
}

/**
 * Integrated Translation Workflow with all options
 * Combines: Processing, Saving, and Language Management
 */
const TranslationWorkflow: React.FC<TranslationWorkflowProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'process' | 'save' | 'languages'>('process');

    const tabs = [
        { id: 'process' as const, label: 'Procesar', icon: FileCode, description: 'Extraer y traducir' },
        { id: 'save' as const, label: 'Guardar', icon: Download, description: 'Descargar o aplicar' },
        { id: 'languages' as const, label: 'Idiomas', icon: Globe, description: 'Gestionar idiomas' },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Mode Tabs */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Sistema de Traducción Flexible
                        </h2>
                        <p className="text-xs text-gray-500">
                            Todo es opcional - Tú decides qué hacer
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <Icon size={18} />
                            <div className="text-left">
                                <div className="text-sm font-bold">{tab.label}</div>
                                <div className="text-[10px] opacity-70">{tab.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'process' && (
                    <div className="animate-in fade-in duration-300">
                        <TranslationProcessor {...props} />
                    </div>
                )}

                {activeTab === 'save' && (
                    <div className="animate-in fade-in duration-300">
                        <TranslationSaver {...props} />
                    </div>
                )}

                {activeTab === 'languages' && (
                    <div className="animate-in fade-in duration-300">
                        <LanguageManager
                            makerPathId={props.makerPathId}
                            variableIndexNumber={props.variableIndexNumber}
                            onLanguageAdded={(lang) => {
                                console.log('New language added:', lang);
                                // TODO: Refresh language selector in profile
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            💡 Flujo Completamente Flexible
                        </h4>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                            <li><strong>Procesar:</strong> Extrae texto, traduce, genera código i18n (todo opcional)</li>
                            <li><strong>Guardar:</strong> Descarga JSONs o aplica cambios al proyecto (tú decides)</li>
                            <li><strong>Idiomas:</strong> Exporta, importa o crea nuevos idiomas fácilmente</li>
                        </ul>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-2">
                            ✅ Puedes avanzar sin hacer nada obligatorio - todo es opcional
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslationWorkflow;
