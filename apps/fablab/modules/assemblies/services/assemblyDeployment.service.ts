import { applicationDeploymentService } from '@core/application-deployment/applicationDeployment.service';

/**
 * Service to handle assembly deployment logic
 */
export const deployAssembly = async (makerPathId: number): Promise<void> => {
  try {
    console.log(`Starting deployment for makerPathId: ${makerPathId}`);
    
    // 1. Create the deployment record
    const deployment = await applicationDeploymentService.createDeployment({ 
      maker_path_id: makerPathId 
    });
    
    console.log('Deployment record created:', deployment);

    // 2. Trigger the actual deployment
    const result = await applicationDeploymentService.deploy({
      application_deployment_id: deployment.id
    });

    console.log('Deployment triggered successfully:', result);
    alert(`Deployment started successfully for ID: ${deployment.id}`);
  } catch (error) {
    console.error('Failed to deploy assembly:', error);
    alert('Failed to deploy assembly. Check console for details.');
    throw error;
  }
};
