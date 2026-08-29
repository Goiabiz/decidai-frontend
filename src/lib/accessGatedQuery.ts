/**
 * RLS de tabela restrita a staff (ex.: auditoria_usuario) devolve lista vazia pra quem não
 * tem permissão -- não erro. Uma tela que trata "vazio" como "não há nada" mente pro usuário.
 * Esse padrão já foi escrito na mão em 2 lugares (SegurancaAuditoria.tsx,
 * reportAdapters.ts:loadAuditoriaReport) -- este helper centraliza pra tela nova não precisar
 * reinventar. Reforma de arquitetura 29/08.
 */
export type GatedResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'vazio' }
  | { status: 'sem_permissao' };

export async function queryWithAccessGate<T>(
  hasAccess: boolean,
  loader: () => Promise<T>,
  isEmpty: (data: T) => boolean = (data) => Array.isArray(data) && data.length === 0,
): Promise<GatedResult<T>> {
  if (!hasAccess) return { status: 'sem_permissao' };
  const data = await loader();
  if (isEmpty(data)) return { status: 'vazio' };
  return { status: 'ok', data };
}
