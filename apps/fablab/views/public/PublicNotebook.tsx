import React from 'react';
import { useParams } from 'react-router-dom';
import Notebook from '@apps/fablab/views/notebook/Notebook';

const PublicNotebook: React.FC = () => {
  useParams<{ id: string; }>();

  return <Notebook isPublicView={true} />;
};

export default PublicNotebook;
