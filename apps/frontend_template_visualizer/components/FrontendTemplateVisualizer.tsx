import React from 'react';

interface FrontendTemplateVisualizerProps {
  templateName: string;
}

const FrontendTemplateVisualizer: React.FC<FrontendTemplateVisualizerProps> = ({ templateName }) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const iframeSrc = `${baseUrl}/frontend_templates/${templateName}`;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        src={iframeSrc}
        title={`Template: ${templateName}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
      />
    </div>
  );
};

export default FrontendTemplateVisualizer;
