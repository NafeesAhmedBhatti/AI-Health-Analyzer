import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  title: string;
  type: string;
  generatedAt: string;
  userName?: string;
  sections: {
    heading: string;
    content: string;
    data?: Record<string, string | number>[];
  }[];
}

export function generatePDF(report: ReportData): Buffer {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(3, 0, 20);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Title
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Health Analyzer', 14, 18);

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(14);
  doc.text(report.title, 14, 30);

  doc.setTextColor(136, 136, 170);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}${report.userName ? `  |  Patient: ${report.userName}` : ''}`, 14, 40);

  // Disclaimer
  doc.setFillColor(255, 0, 110, 0.08);
  doc.rect(14, 50, pageWidth - 28, 14, 'F');
  doc.setTextColor(255, 0, 110);
  doc.setFontSize(8);
  doc.text('DISCLAIMER: This report is AI-generated and for informational purposes only. It does not constitute medical advice.', 16, 58);

  let y = 72;

  report.sections.forEach((section) => {
    if (y > 260) { doc.addPage(); y = 20; }

    // Section heading
    doc.setTextColor(0, 212, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.heading, 14, y);
    y += 6;

    // Section content
    doc.setTextColor(136, 136, 170);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.content, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;

    // Table data
    if (section.data && section.data.length > 0) {
      const headers = Object.keys(section.data[0]);
      const rows = section.data.map((row) => headers.map((h) => String(row[h])));
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [10, 10, 26], textColor: [0, 212, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: [15, 15, 35], textColor: [136, 136, 170], fontSize: 8 },
        alternateRowStyles: { fillColor: [20, 20, 45] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    y += 4;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(85, 85, 119);
    doc.setFontSize(7);
    doc.text(`AI Health Analyzer Report  |  Page ${i} of ${pageCount}  |  © ${new Date().getFullYear()}`, 14, doc.internal.pageSize.getHeight() - 8);
  }

  return Buffer.from(doc.output('arraybuffer'));
}