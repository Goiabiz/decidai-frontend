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

export type InvoicePdfData = {
  id: string;
  clientName: string;
  planCode: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  statusLabel: string;
  paidAtLabel: string | null;
  items: Array<{ description: string; amountBrl: number }>;
  totalAmountBrl: number;
  gatewayQrCode: string | null;
};

function formatDateBr(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBrl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Fatura como documento real (não a tabela genérica de exportReportRows -- 1 registro por
 * linha faz sentido pra lista de transações, não pra um documento comercial único). Layout
 * fixo: cabeçalho DecidAI + dados da fatura, tabela de itens (billing_invoice_items real),
 * total, status/vencimento. Mesma dupla jspdf + jspdf-autotable dos relatórios, import
 * dinâmico igual.
 */
export async function exportInvoicePdf(invoice: InvoicePdfData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait' });

  doc.setFontSize(18);
  doc.setTextColor(16, 36, 29);
  doc.text('DecidAI', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text('Fatura', 14, 27);

  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  const infoLines = [
    `Cliente: ${invoice.clientName}`,
    `Plano: ${invoice.planCode}`,
    `Período: ${formatDateBr(invoice.periodStart)} a ${formatDateBr(invoice.periodEnd)}`,
    `Vencimento: ${formatDateBr(invoice.dueDate)}`,
    `Status: ${invoice.statusLabel}${invoice.paidAtLabel ? ` (paga em ${invoice.paidAtLabel})` : ''}`,
  ];
  infoLines.forEach((line, index) => doc.text(line, 14, 38 + index * 6));

  const tableStartY = 38 + infoLines.length * 6 + 6;
  autoTable(doc, {
    startY: tableStartY,
    head: [['Descrição', 'Valor']],
    body: invoice.items.length > 0
      ? invoice.items.map((item) => [item.description, formatBrl(item.amountBrl)])
      : [['Sem itens (fatura zerada)', formatBrl(0)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 36, 29] },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setTextColor(16, 36, 29);
  doc.text(`Total: ${formatBrl(invoice.totalAmountBrl)}`, 14, finalY + 10);

  if (invoice.gatewayQrCode) {
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text('Pix copia-e-cola:', 14, finalY + 20);
    doc.setFont('courier', 'normal');
    doc.text(doc.splitTextToSize(invoice.gatewayQrCode, 180), 14, finalY + 26);
    doc.setFont('helvetica', 'normal');
  }

  doc.save(`fatura-${invoice.periodStart}-a-${invoice.periodEnd}-${invoice.id.slice(0, 8)}.pdf`);
}
