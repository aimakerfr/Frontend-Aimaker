import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, MoreVertical, FileText, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { generateFastDescription } from '../services/geminiService';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Marketing Assistant', description: 'Social media posts and email campaigns generator.', icon: '📢', docCount: 12, status: 'indexed' },
    { id: '2', name: 'Tech Docs Reviewer', description: 'Analyzes technical documentation for clarity and errors.', icon: '📝', docCount: 45, status: 'indexing' },
    { id: '3', name: 'Product Ideation', description: 'Brainstorming partner for new product features.', icon: '💡', docCount: 5, status: 'draft' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDesc = async () => {
    if (!newProjectName) return;
    setIsGenerating(true);
    const prompt = `Write a short, professional, one-sentence description for an AI workspace (Project) named "${newProjectName}". Keep it under 15 words.`;
    const desc = await generateFastDescription(prompt);
    if (desc) {
      setNewProjectDesc(desc.trim());
    }
    setIsGenerating(false);
  };

  const handleCreate = () => {
    if (!newProjectName) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDesc || 'No description provided.',
      icon: '🚀',
      docCount: 0,
      status: 'draft',
    };
    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your dedicated AI workspaces.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                {project.icon}
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <MoreVertical size={20} />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{project.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 h-10 line-clamp-2">{project.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FileText size={16} />
                <span>{project.docCount} docs</span>
              </div>
              <div className="flex items-center gap-1.5">
                {project.status === 'indexed' && <CheckCircle size={16} className="text-green-500" />}
                {project.status === 'indexing' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
                {project.status === 'draft' && <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {project.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Marketing Pro"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button 
                    onClick={handleGenerateDesc}
                    disabled={isGenerating || !newProjectName}
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {isGenerating ? 'Generating...' : 'Auto-generate'}
                  </button>
                </div>
                <textarea 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={!newProjectName}
                className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;