export type StatusCategory = 'novo' | 'andamento' | 'concluido' | 'cancelado';

export const STATUS_CATEGORY_ORDER: StatusCategory[] = ['novo', 'andamento', 'concluido', 'cancelado'];

export const STATUS_CATEGORY_LABELS: Record<StatusCategory, string> = {
  novo: 'Novo',
  andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

// Badge tone suffix — usar como <Badge tone={STATUS_CATEGORY_TONE[categoria]}>.
export const STATUS_CATEGORY_TONE: Record<StatusCategory, string> = {
  novo: 'status-novo',
  andamento: 'status-andamento',
  concluido: 'status-concluido',
  cancelado: 'status-cancelado',
};

// Todo rótulo de status customizado herda a cor de uma destas 4 categorias fixas
// (igual ao Jira: o texto é livre, a cor é da categoria). Mapa de rótulos legados
// conhecidos no app hoje, usado como fallback ao migrar dado existente.
const KNOWN_LABEL_CATEGORY: Record<string, StatusCategory> = {
  'novo': 'novo',
  'nova': 'novo',
  'pendente': 'novo',
  'a fazer': 'novo',
  'em andamento': 'andamento',
  'andamento': 'andamento',
  'aguardando resposta': 'andamento',
  'em análise': 'andamento',
  'em analise': 'andamento',
  'concluído': 'concluido',
  'concluido': 'concluido',
  'concluídas hoje': 'concluido',
  'ativo': 'concluido',
  'cancelado': 'cancelado',
  'cancelada': 'cancelado',
  'recusado': 'cancelado',
  'rejeitado': 'cancelado',
  'bloqueado': 'cancelado',
};

export function categorizeStatusLabel(label: string): StatusCategory {
  const key = label.trim().toLowerCase();
  return KNOWN_LABEL_CATEGORY[key] ?? 'novo';
}
