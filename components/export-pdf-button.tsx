'use client';

import type { CaseWithDisplay } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportPdfButton({ cases, category }: { cases: CaseWithDisplay[]; category: string }) {
  function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const title = category === 'ambassador' ? 'Ambassador Case List' : 'Rehabilitation Case List';
    const date = new Date().toLocaleDateString();

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${date}`, 14, 21);

    const headers = category === 'ambassador'
      ? ['Case #', 'Name', 'Species', 'Active Problems', 'Treatments', 'Plan', 'Notes']
      : ['Case #', 'WRMD #', 'Species', 'Active Problems', 'Treatments', 'Plan', 'Notes'];

    const rows = cases.map(c => [
      c.caseNumber,
      category === 'ambassador' ? (c.commonName || '') : (c.wrmdCaseNumber || ''),
      c.species,
      c.activeProblems,
      c.currentTreatments,
      c.plan,
      '', // empty notes column for manual writing
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 18 },  // Case #
        1: { cellWidth: 18 },  // WRMD #
        2: { cellWidth: 28 },  // Species
        3: { cellWidth: 50 },  // Active Problems
        4: { cellWidth: 50 },  // Treatments
        5: { cellWidth: 50 },  // Plan
        6: { cellWidth: 40 },  // Notes
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`${title.toLowerCase().replace(/ /g, '-')}-${date}.pdf`);
  }

  if (cases.length === 0) return null;

  return (
    <button
      onClick={exportPdf}
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors no-print"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PDF
    </button>
  );
}
