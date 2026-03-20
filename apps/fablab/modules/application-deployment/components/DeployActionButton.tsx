import React, { useState } from 'react';
import { useLanguage } from '@apps/fablab/language/useLanguage';
import { applicationDeploymentService } from '../services/applicationDeployment.service';

type Props = {
  deploymentId: number;
  status?: string | null;
  hasFiles: boolean;
  onAfter?: () => void | Promise<void>;
};

/**
 * Renders a single action button for a deployment depending on current state:
 * - If status === 'deployment_failed' → show a red "Re-Deploy" button
 * - Else if hasFiles (filesUrl present) → show a blue "Deploy" button
 * - Else → render nothing
 */
const DeployActionButton: React.FC<Props> = ({ deploymentId, status, hasFiles, onAfter }) => {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const showReDeploy = (status || '').toLowerCase() === 'deployment_failed';
  const showDeploy = !showReDeploy && !!hasFiles;

  if (!showReDeploy && !showDeploy) return null;

  const label = showReDeploy
    ? (t?.projectFlow?.reDeploy || 'Re-Deploy')
    : (t?.projectFlow?.deploy || 'Deploy');

  const classes = showReDeploy
    ? 'px-3 py-1.5 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700'
    : 'px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700';

  return (
    <button
      disabled={busy}
      aria-busy={busy}
      onClick={async () => {
        try {
          setBusy(true);
          await applicationDeploymentService.deploy({ application_deployment_id: deploymentId });
          await onAfter?.();
        } catch {
          // Silent
        } finally {
          setBusy(false);
        }
      }}
      className={`${classes} ${busy ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {busy ? (t?.common?.loading || 'Loading…') : label}
    </button>
  );
};

export default DeployActionButton;
