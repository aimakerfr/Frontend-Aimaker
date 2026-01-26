import React from 'react';
import { useParams } from 'react-router-dom';
import Notebook from '@apps/notebook/Notebook';

const PublicNotebook: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return <Notebook isPublicView={true} />;
};

export default PublicNotebook;
