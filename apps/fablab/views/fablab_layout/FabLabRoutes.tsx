import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProjectBuilderView from '../project/ProjectBuilderView';
import CreationPathView from '../project/CreationPathView';
import Library from '../library/Library';
import ProfileSection from '../../components/ProfileSection';
import AIContext from '../../components/AIContext';
import MakerPathView from '../maker-path/MakerPath';
import ProjectPlanner from '../projects/ProjectPlanner';
import PathCreationModules from '../path-creation-modules/App';
import ExternalAccess from '../external-access/ExternalAccess';
import ObjectsLibrary from '../objects/ObjectsLibrary';
import ProjectExplorer from '../objects/ProjectExplorer';
import Products from '../products/Products';
import NotebookAssembler from '../assembler/NotebookAssemblerLite';
import LandingPageAssembler from '../assembler/LandingPageAssembler';
import AssemblerNew from '../assembler/AssemblerNew';
import AssemblerMakerPathsView from '../../modules/assemblies/AssemblerMakerPathsView';
import DeployerNew from '../../modules/deployer-new/View';
import Deployer from '../deployer/Deployer';
import ApplicationsManagement from '../applications/ApplicationsManagement';
import ApiKeyManager from '../api-proxy/ApiKeyManager';
import FablabChatView from '../chat/FablabChatView';
import { UserProfile } from '../../types';

interface FabLabRoutesProps {
  user: UserProfile;
}

export const FabLabRoutes: React.FC<FabLabRoutesProps> = ({ user }) => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard/chat" replace />} />
      <Route path="/chat" element={<FablabChatView />} />
      <Route path="/library" element={<Library />} />
      <Route path="/objects-library" element={<ObjectsLibrary />} />
      <Route path="/objects-library/:id" element={<ProjectExplorer />} />
      <Route path="/profile" element={<ProfileSection user={user} />} />
      <Route path="/context" element={<AIContext />} />
      <Route path="/maker-path" element={<MakerPathView />} />
      <Route path="/maker-path/:id" element={<ProjectPlanner />} />
      <Route path="/project-builder" element={<ProjectBuilderView />} />
      <Route path="/creation-path" element={<CreationPathView />} />
      <Route path="/maker-path/modules/:id" element={<PathCreationModules />} />
      <Route path="/assembler" element={<AssemblerMakerPathsView />} />
      <Route path="/assembler/notebook" element={<NotebookAssembler />} />
      <Route path="/assembler/landing_page" element={<LandingPageAssembler />} />
      <Route path="/assembler/new" element={<AssemblerNew />} />
      <Route path="/applications/new" element={<DeployerNew />} />
      <Route path="/applications/deployer" element={<Deployer />} />
      <Route path="/applications" element={<ApplicationsManagement />} />
      <Route path="/products" element={<Products />} />
      <Route path="/api-key-manager" element={<ApiKeyManager />} />
      <Route path="/tools" element={<ExternalAccess />} />
    </Routes>
  );
};
