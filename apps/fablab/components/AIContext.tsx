import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Workflow, Database, Zap, Image as ImageIcon, Settings, ExternalLink, Edit2, Save, X } from 'lucide-react';

interface ServerTool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  url: string;
  isExternal: boolean;
  internalRoute?: string;
}

const AIContext: React.FC = () => {
  const navigate = useNavigate();
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  const [tools, setTools] = useState<ServerTool[]>([
    {
      id: 'llm',
      name: 'LLM',
      description: 'Large Language Models - Ollama',
      icon: Bot,
      color: 'from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40',
      url: 'https://ollama.aimaker.fr/auth?redirect=%2F',
      isExternal: true
    },
    {
      id: 'n8n_workflow',
      name: 'n8n Workflow',
      description: 'Automation & Integration',
      icon: Workflow,
      color: 'from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40',
      url: 'https://n8n.utopiamaker.com/',
      isExternal: true
    },
    {
      id: 'perplexity_index',
      name: 'Perplexity Index',
      description: 'Search & Knowledge Base',
      icon: Database,
      color: 'from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40',
      url: '',
      isExternal: false,
      internalRoute: '/dashboard/perplexity-index'
    },
    {
      id: 'api_prompt_optimize',
      name: 'API Prompt Optimize',
      description: 'Optimize your prompts',
      icon: Zap,
      color: 'from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40',
      url: '',
      isExternal: false,
      internalRoute: '/dashboard/prompt-optimize'
    },
    {
      id: 'image_generation',
      name: 'Image Generation',
      description: 'AI-powered image creation',
      icon: ImageIcon,
      color: 'from-green-100 to-teal-100 dark:from-green-900/40 dark:to-teal-900/40',
      url: '',
      isExternal: false,
      internalRoute: '/dashboard/image-generation'
    },
    {
      id: 'administration',
      name: 'Administration',
      description: 'System management',
      icon: Settings,
      color: 'from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40',
      url: '',
      isExternal: false,
      internalRoute: '/dashboard/administration'
    }
  ]);

  const handleToolClick = (tool: ServerTool) => {
    if (tool.isExternal) {
      window.open(tool.url, '_blank');
    } else if (tool.internalRoute) {
      navigate(tool.internalRoute);
    }
  };

  const handleEditUrl = (toolId: string, currentUrl: string) => {
    setEditingTool(toolId);
    setEditUrl(currentUrl);
  };

  const handleSaveUrl = (toolId: string) => {
    setTools(tools.map(tool => 
      tool.id === toolId ? { ...tool, url: editUrl } : tool
    ));
    setEditingTool(null);
    setEditUrl('');
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setEditUrl('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="text-indigo-600 dark:text-indigo-400" />
          Server Tools
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Accede a las herramientas de servidor e integraciones externas.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isEditing = editingTool === tool.id;

          return (
            <div
              key={tool.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Header con gradiente */}
              <div className={`h-32 bg-gradient-to-br ${tool.color} relative overflow-hidden border-b border-gray-200 dark:border-gray-700`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon size={48} className="text-gray-700 dark:text-gray-300" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </div>

                {/* URL Edit for External Tools */}
                {tool.isExternal && (
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="https://..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveUrl(tool.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Save size={14} />
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tool.url}
                        </div>
                        <button
                          onClick={() => handleEditUrl(tool.id, tool.url)}
                          className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded transition-colors"
                          title="Editar URL"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleToolClick(tool)}
                  disabled={isEditing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tool.isExternal ? (
                    <>
                      Abrir
                      <ExternalLink size={18} />
                    </>
                  ) : (
                    <>
                      Acceder
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIContext;
