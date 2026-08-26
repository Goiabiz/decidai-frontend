import { useSession } from '../../contexts/SessionContext';
import { showAppToast } from '../../lib/appToast';
import { exportReportRows, type ReportExportColumn, type ReportExportRow } from '../../lib/reportExport';
import { logAudit } from '../../services/auditLog';
import type { ExportFormat } from '../../components/ExportAction';

/**
 * `ExportAction` não tem `catch` ao redor do `onExport` (só `finally`) -- falha aqui
 * precisa do próprio try/catch, senão vira rejeição não tratada. `operacao: 'export'`
 * já existe no tipo `AuditOperacao` mas nunca foi usada fora de Usuarios.tsx -- reaproveitando
 * o mesmo padrão pra todo relatório em vez de duplicar o boilerplate em cada tela.
 */
export function useReportExport() {
  const { session } = useSession();

  return async (params: {
    format: ExportFormat;
    filename: string;
    title: string;
    funcionalidade: string;
    columns: ReportExportColumn[];
    rows: ReportExportRow[];
  }) => {
    const { funcionalidade, ...exportParams } = params;
    try {
      await exportReportRows(exportParams);
      void logAudit({
        usuarioNome: session?.user.displayName || 'Desconhecido',
        usuarioEmail: session?.user.email || '',
        modulo: 'relatorios',
        funcionalidade,
        operacao: 'export',
        observacao: `Exportação de ${params.rows.length} registro(s) em formato ${params.format} (${params.title}).`,
      });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível exportar o relatório.', 'error');
    }
  };
}
