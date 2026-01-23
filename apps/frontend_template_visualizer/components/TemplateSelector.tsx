import React, { useState } from 'react';
import FrontendTemplateVisualizer from './FrontendTemplateVisualizer';

const TemplateSelector: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('simple_header.html');

  const handleDownload = async () => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const fileUrl = `${baseUrl}/frontend_templates/${selectedTemplate}`;
    
    try {
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      const blob = new Blob([text], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedTemplate;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Delay revocation to ensure browser has started the download
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
      // If fetch fails, we can't really "force" a download of a cross-origin resource 
      // that the browser wants to display, but we can try to open it in a way 
      // that might trigger a download if the server sends Content-Disposition.
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        padding: '10px 20px',
        backgroundColor: '#f1f3f5',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#343a40' }}>Visualiseur de modèles</h1>
      </div>
      <div style={{ 
        padding: '10px 20px', 
        display: 'flex', 
        gap: '10px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #dee2e6',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setSelectedTemplate('simple_header.html')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: selectedTemplate === 'simple_header.html' ? '#007bff' : '#f8f9fa',
              color: selectedTemplate === 'simple_header.html' ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}
          >
            Header
          </button>
          <button
            onClick={() => setSelectedTemplate('simple-footer-bem.html')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: selectedTemplate === 'simple-footer-bem.html' ? '#007bff' : '#f8f9fa',
              color: selectedTemplate === 'simple-footer-bem.html' ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}
          >
            Footer
          </button>
        </div>

        <button
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Download Template
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FrontendTemplateVisualizer templateName={selectedTemplate} />
      </div>
    </div>
  );
};

export default TemplateSelector;
