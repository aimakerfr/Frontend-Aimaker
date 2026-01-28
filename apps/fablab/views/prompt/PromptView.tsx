import React from 'react';
import { useParams } from 'react-router-dom';
import ToolViewCard from '../tool/ToolViewCard';
import PromptDetails from './PromptDetails';

const PromptView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toolId = id ? parseInt(id, 10) : null;


  return (
    <div className="flex justify-center p-4 md:p-8 relative bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      <ToolViewCard toolId={toolId}>
        {toolId && <PromptDetails toolId={toolId} />}
      </ToolViewCard>
    </div>
  );
};

export default PromptView;
