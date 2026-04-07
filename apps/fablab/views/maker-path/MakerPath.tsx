import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsHub } from './components/ProjectsHub';
// import { AssemblyObjects } from './components/AssemblyObjects';

type ActiveView = 'hub' | 'deploy' | 'assembly';

const MakerPathView: React.FC = () => {
  const navigate = useNavigate();
  const [activeView] = useState<ActiveView>('hub');

  if (activeView === 'deploy') {
    navigate('dashboard/applications/new');
    return null;
  }

  if (activeView === 'assembly') {
    // Legacy in-place assembly view: now we navigate to /assembler/new
    navigate('dashboard/assembler/new');
    return null;
  }

  return (
    <ProjectsHub
      onGoToDeploy={() => navigate('/dashboard/applications/new')}
      onGoToAssembly={() => navigate('/dashboard/assembler/new')}
    />
  );
};

export default MakerPathView;
