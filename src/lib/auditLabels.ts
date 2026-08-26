import type { AuditOperacao } from '../services/auditLog';

export const OPERACAO_LABELS: Record<AuditOperacao, string> = {
  insert: 'Criação',
  update: 'Edição',
  delete: 'Exclusão',
  login: 'Login',
  export: 'Exportação',
  print: 'Impressão',
  external_link: 'Link externo',
  agent_action: 'Ação de agente',
  acesso_suporte_iniciado: 'Acesso de suporte iniciado',
  acesso_suporte_encerrado: 'Acesso de suporte encerrado',
};

export const OPERACAO_TONE: Record<AuditOperacao, string> = {
  insert: 'green',
  update: 'blue',
  delete: 'red',
  login: 'gray',
  export: 'purple',
  print: 'purple',
  external_link: 'blue',
  agent_action: 'orange',
  acesso_suporte_iniciado: 'yellow',
  acesso_suporte_encerrado: 'yellow',
};
