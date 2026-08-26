import type { ExportFormat } from '../components/ExportAction';

export type ReportExportColumn = { key: string; label: string };
export type ReportExportRow = Record<string, string | number | null | undefined>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function exportXlsx(filename: string, title: string, columns: ReportExportColumn[], rows: ReportExportRow[]) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31) || 'Relatório');
  sheet.columns = columns.map((column) => ({ header: column.label, key: column.key, width: Math.max(column.label.length + 4, 14) }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`);
}

async function exportPdf(filename: string, title: string, columns: ReportExportColumn[], rows: ReportExportRow[]) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? '-'))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 36, 29] },
  });
  doc.save(`${filename}.pdf`);
}

/**
 * XLSX real via exceljs (não `xlsx`/SheetJS -- essa tinha CVE de prototype pollution/ReDoS
 * sem correção disponível na versão npm, achado ao instalar). PDF real via jspdf +
 * jspdf-autotable. Import dinâmico nos dois -- só carrega quando alguém realmente clica em
 * Exportar, não infla o bundle principal.
 */
export async function exportReportRows(params: {
  format: ExportFormat;
  filename: string;
  title: string;
  columns: ReportExportColumn[];
  rows: ReportExportRow[];
}): Promise<void> {
  const { format, filename, title, columns, rows } = params;
  if (format === 'xlsx') await exportXlsx(filename, title, columns, rows);
  else await exportPdf(filename, title, columns, rows);
}
