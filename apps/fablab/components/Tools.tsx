import React, { useState } from 'react';
import { ToolConfig } from '../types';
import { Globe, FileText, BarChart2, Mic, ShieldCheck, AlertCircle } from 'lucide-react';

const Tools: React.FC = () => {
  const [tools, setTools] = useState<ToolConfig[]>([
    { id: 'web-search', name: 'Web Search', description: 'Access real-time information from the internet.', isEnabled: true, isSecure: true },
    { id: 'doc-gen', name: 'Document Generation', description: 'Create PDFs and Word documents automatically.', isEnabled: true, isSecure: true },
    { id: 'data-analysis', name: 'Data Analysis', description: 'Analyze CSVs and spreadsheets.', isEnabled: false, isSecure: true },
    { id: 'audio-transcription', name: 'Audio Transcription', description: 'Convert speech to text with high accuracy.', isEnabled: true, isSecure: true },
  ]);

  const toggleTool = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, isEnabled: !t.isEnabled } : t));
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'web-search': return <Globe size={24} className="text-blue-500" />;
      case 'doc-gen': return <FileText size={24} className="text-orange-500" />;
      case 'data-analysis': return <BarChart2 size={24} className="text-purple-500" />;
      case 'audio-transcription': return <Mic size={24} className="text-red-500" />;
      default: return <Globe size={24} />;
    }
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tools & Capabilities</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage external capabilities accessible by your FabLabs.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {tools.map((tool) => (
           <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex items-start gap-4">
             <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
               {getIcon(tool.id)}
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                 <button 
                  onClick={() => toggleTool(tool.id)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    tool.isEnabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                 >
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    tool.isEnabled ? 'left-5' : 'left-1'
                   }`}></div>
                 </button>
               </div>
               <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-3">{tool.description}</p>
               
               {tool.isSecure ? (
                 <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-full">
                   <ShieldCheck size={12} />
                   <span>Secure Tool</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 w-fit px-2 py-1 rounded-full">
                   <AlertCircle size={12} />
                   <span>Experimental</span>
                 </div>
               )}
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default Tools;
