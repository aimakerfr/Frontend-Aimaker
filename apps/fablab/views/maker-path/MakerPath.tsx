import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHub } from './components/ProjectsHub';
import { TemplateSelector } from './components/TemplateSelector';
import { DeployProject } from './components/DeployProject';
import { AssemblyObjects } from './components/AssemblyObjects';

type ActiveView = 'hub' | 'template' | 'deploy' | 'assembly';

const MakerPathView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('hub');
  const [intention, setIntention] = useState('');

  const handleGoToTemplates = (userIntention: string) => {
    setIntention(userIntention);
    setActiveView('template');
  };

  const handleProductCreated = (productId: number) => {
    navigate(`/product/notebook/${productId}`);
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
    return (
      <AssemblyObjects
        onBack={() => setActiveView('hub')}
        onProductCreated={handleProductCreated}
      />
    );
  }

  return (
    <ProjectsHub
      onGoToTemplates={handleGoToTemplates}
      onGoToDeploy={() => setActiveView('deploy')}
      onGoToAssembly={() => setActiveView('assembly')}
    />
  );
};

export default MakerPathView;
