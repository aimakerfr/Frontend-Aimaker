import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHub } from './components/ProjectsHub';
import { TemplateSelector } from './components/TemplateSelector';
import { DeployProject } from './components/DeployProject';
// import { AssemblyObjects } from './components/AssemblyObjects';

type ActiveView = 'hub' | 'template' | 'deploy' | 'assembly';

const MakerPathView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('hub');
  const [intention, setIntention] = useState('');

  const handleGoToTemplates = (userIntention: string) => {
    setIntention(userIntention);
    setActiveView('template');
  };

  const handleProductCreated = (productId: number, templateId: string) => {
    // Map template types to their corresponding routes
    const routeMap: Record<string, string> = {
      'rag_chat_maker': 'notebook',
      'landing_page_maker': 'landing-page',
      'image_generator_rag': 'image-generator',
      'translation_maker': 'notebook', // Default to notebook until specific route is created
      'architect_ai': 'notebook', // Default to notebook until specific route is created
      'module_connector': 'notebook', // Default to notebook until specific route is created
      'custom': 'notebook' // Default
    };
    
    const route = routeMap[templateId] || 'notebook';
    navigate(`/product/${route}/${productId}`);
  };

  if (activeView === 'template') {
    return (
      <TemplateSelector
        intention={intention}
        onBack={() => setActiveView('hub')}
        onProductCreated={handleProductCreated}
      />
    );
  }

  if (activeView === 'deploy') {
    return <DeployProject onBack={() => setActiveView('hub')} />;
  }

  if (activeView === 'assembly') {
    // Legacy in-place assembly view: now we navigate to /assembler/new
    navigate('dashboard/assembler/new');
    return null;
  }

  return (
    <ProjectsHub
      onGoToTemplates={handleGoToTemplates}
      onGoToDeploy={() => setActiveView('deploy')}
      onGoToAssembly={() => navigate('/dashboard/assembler/new')}
    />
  );
};

export default MakerPathView;
