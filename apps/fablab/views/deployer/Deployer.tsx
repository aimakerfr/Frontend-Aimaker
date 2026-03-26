import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ApplicationDeploymentFullPage from '@apps/fablab/modules/application-deployment/View';
import { DatabaseCreator } from '@apps/fablab/modules/database-creator';

const Deployer: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const idParam = params.get('id');
  const numericId = idParam ? Number(idParam) : NaN;
  const hasValidId = Number.isFinite(numericId) && numericId > 0;
  // Ensure the value passed to children is never NaN to satisfy stricter typings
  const makerPathId: number | null = hasValidId ? numericId : null;

  useEffect(() => {
    if (!hasValidId) {
      // If no valid id in queries, redirect to the creation page (moved under applications)
      navigate('/applications/new', { replace: true });
    }
  }, [hasValidId, navigate]);

  if (!hasValidId) return null;

  return (
    <ApplicationDeploymentFullPage
      makerPathId={makerPathId}
      DatabaseCreatorComponent={DatabaseCreator}
    />
  );
};

export default Deployer;
