import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, FileSpreadsheet, FileText, X } from 'lucide-react';

export type ExportFormat = 'xlsx' | 'pdf';

export type ExportActionProps = {
  label?: string;
  title?: string;
  filename?: string;
  disabled?: boolean;
  className?: string;
  onExport?: (format: ExportFormat) => void | Promise<void>;
};

const options: Array<{ value: ExportFormat; label: string; description: string; icon: typeof FileText }> = [
  { value: 'xlsx', label: 'XLS', description: 'Planilha para análise e filtros', icon: FileSpreadsheet },
  { value: 'pdf', label: 'PDF', description: 'Relatório pronto para leitura ou impressão', icon: FileText },
];

function fallbackExport(filename: string, format: ExportFormat) {
  const suffix = format === 'xlsx' ? 'xlsx' : 'pdf';
  const content = `Exportação solicitada: ${format}\nArquivo: ${filename}\n`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.${suffix}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportAction({
  label = 'Exportar',
  title = 'Exportar',
  filename = 'consulta',
  disabled = false,
  className = '',
  onExport,
}: ExportActionProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<ExportFormat | null>(null);
  const normalizedFilename = useMemo(() => filename.toLowerCase().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'consulta', [filename]);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleExport = async (format: ExportFormat) => {
    setRunning(format);
    try {
      if (onExport) await onExport(format);
      else fallbackExport(normalizedFilename, format);
      setOpen(false);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className={`v363-export-action ${className}`} ref={ref}>
      <button type="button" className="v363-export-main" disabled={disabled} onClick={() => setOpen((value) => !value)}>
        <Download size={17} />
        {label}
      </button>

      {open && (
        <div className="v363-export-menu" role="dialog" aria-label={title}>
          <div className="v363-export-head">
            <strong>{title}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={15} /></button>
          </div>

          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button type="button" key={option.value} onClick={() => handleExport(option.value)} disabled={running !== null}>
                <Icon size={17} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                {running === option.value && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ExportButton = ExportAction;
export const ExportMenu = ExportAction;
export default ExportAction;
