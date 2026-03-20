import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ApplicationDeploymentFullPage from '@apps/fablab/modules/application-deployment/View';

const Deployer: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const idParam = params.get('id');
  const numericId = idParam ? Number(idParam) : NaN;
  const hasValidId = Number.isFinite(numericId) && numericId > 0;

  useEffect(() => {
    if (!hasValidId) {
      // If no valid id in query, redirect to the creation page
      navigate('/deployer/new', { replace: true });
    }
  }, [hasValidId, navigate]);

  if (!hasValidId) return null;

  return <ApplicationDeploymentFullPage makerPathId={numericId} />;
};

export default Deployer;
