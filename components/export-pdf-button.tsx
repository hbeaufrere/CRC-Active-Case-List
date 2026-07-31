'use client';

import type { CaseWithDisplay, SortColumn } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCaseSort } from './case-sort-context';
import { sortCases } from '@/lib/utils';

export default function ExportPdfButton({ cases, category }: { cases: CaseWithDisplay[]; category: string }) {
  const { column, direction } = useCaseSort();

  function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const isRehab = category !== 'ambassador';
    const title = isRehab ? 'Rehabilitation Case List' : 'Ambassador Case List';
    const date = new Date().toLocaleDateString();

    // Match the on-screen order: `cases` already reflects the active search and
    // urgency filter, and this applies whatever column the person sorted by.
    const sortColumn: SortColumn | null = !isRehab && column === 'daysInCare' ? null : column;
    const rowsSource = sortCases(cases, sortColumn, direction);

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${date}`, 14, 21);

    const headers = isRehab
      ? ['Case #', 'WRMD #', 'Species', 'Days', 'Active Problems', 'Treatments', 'Plan', 'Notes']
      : ['Case #', 'Name', 'Species', 'Active Problems', 'Treatments', 'Plan', 'Notes'];

    const rows = rowsSource.map(c => {
      const shared = [c.species];
      if (isRehab) shared.push(c.daysInCare == null ? '' : `${c.daysInCare}d`);
      return [
        c.caseNumber,
        isRehab ? (c.wrmdCaseNumber || '') : (c.commonName || ''),
        ...shared,
        c.activeProblems,
        c.currentTreatments,
        c.plan,
        '', // empty notes column for manual writing
      ];
    });

    // Letter landscape leaves ~251mm between the margins.
    const columnStyles: Record<number, { cellWidth: number }> = isRehab
      ? {
          0: { cellWidth: 17 },  // Case #
          1: { cellWidth: 17 },  // WRMD #
          2: { cellWidth: 26 },  // Species
          3: { cellWidth: 12 },  // Days
          4: { cellWidth: 45 },  // Active Problems
          5: { cellWidth: 45 },  // Treatments
          6: { cellWidth: 45 },  // Plan
          7: { cellWidth: 42 },  // Notes
        }
      : {
          0: { cellWidth: 18 },  // Case #
          1: { cellWidth: 22 },  // Name
          2: { cellWidth: 28 },  // Species
          3: { cellWidth: 47 },  // Active Problems
          4: { cellWidth: 47 },  // Treatments
          5: { cellWidth: 47 },  // Plan
          6: { cellWidth: 42 },  // Notes
        };

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
      columnStyles,
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
