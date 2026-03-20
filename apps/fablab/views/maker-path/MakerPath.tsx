import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHub } from './components/ProjectsHub';
import { DeployProject } from './components/DeployProject';
// import { AssemblyObjects } from './components/AssemblyObjects';

type ActiveView = 'hub' | 'deploy' | 'assembly';

const MakerPathView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('hub');

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
      onGoToDeploy={() => setActiveView('deploy')}
      onGoToAssembly={() => navigate('/dashboard/assembler/new')}
    />
  );
};

export default MakerPathView;
