// Local atomic service wrapper for Application Deployment
// Keeps the module self-contained while leveraging core implementation

export {
  ApplicationDeploymentService,
  applicationDeploymentService,
} from '@core/application-deployment/applicationDeployment.service';

export type {
  ApplicationDeployment,
  CreateApplicationDeploymentResponse,
  UploadFilesResponse,
  DeployResponse,
} from '@core/application-deployment/applicationDeployment.service';
