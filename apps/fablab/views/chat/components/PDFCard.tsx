import { Download, FileText } from 'lucide-react';

const PDFCard = ({ fileName, onDownload }: { fileName: string; onDownload: () => void }) => {
  return (
    <div className="fablab-pdf-card">
      <div className="fablab-pdf-icon">
        <FileText size={32} />
      </div>
      <div className="fablab-pdf-info">
        <div className="fablab-pdf-filename">{fileName}</div>
        <div className="fablab-pdf-type">PDF Document</div>
      </div>
      <button
        type="button"
        className="fablab-pdf-download-btn"
        onClick={onDownload}
      >
        <Download size={16} />
        Download
      </button>
    </div>
  );
};

export default PDFCard;
