import { useEffect, useMemo, useState } from 'react';
import type { AvailablePath, WorkflowStep } from '../types';
import { objectRequestService, type StoredWorkflow } from '../services/ObjectRequestService';

export type WorkflowLibraryItem = StoredWorkflow;

const toAvailablePath = (wf: StoredWorkflow): AvailablePath => {
  return {
    id: wf.id,
    name: wf.name,
    description: wf.description,
    outputType: wf.outputType,
  };
};

export const useWorkflowLibrary = () => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return objectRequestService.subscribe(() => {
      setVersion((v) => v + 1);
    });
  }, []);

  const workflows = useMemo(() => {
    void version;
    return objectRequestService.getWorkflows();
  }, [version]);

  const availablePaths = useMemo(() => workflows.map(toAvailablePath), [workflows]);

  const getWorkflowSteps = (id: string): WorkflowStep[] => {
    const wf = objectRequestService.getWorkflow(id);
    return (wf?.steps as any) || [];
  };

  const upsertWorkflow = (wf: Omit<StoredWorkflow, 'updatedAt'>) => {
    return objectRequestService.upsertWorkflow(wf);
  };

  const deleteWorkflow = (id: string) => {
    objectRequestService.deleteWorkflow(id);
  };

  return {
    workflows,
    availablePaths,
    getWorkflowSteps,
    upsertWorkflow,
    deleteWorkflow,
    ensureSeed: objectRequestService.ensureSeed.bind(objectRequestService),
    getWorkflow: objectRequestService.getWorkflow.bind(objectRequestService),
  };
};
