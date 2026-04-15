import { jsPDF } from 'jspdf';

export const generateDocumentPDF = (content: string): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;

  doc.setFontSize(16);
  doc.text('Documento de Conversacion', margin, 20);

  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, 30);

  doc.setFontSize(12);
  const lines = doc.splitTextToSize(content, maxWidth);
  doc.text(lines, margin, 45);

  return doc.output('dataurlstring');
};
