type Option = {
  label: string;
  value: string;
};

type Props = {
  search: string;
  onSearch: (value: string) => void;
  status?: string;
  onStatus?: (value: string) => void;
  prioridade?: string;
  onPrioridade?: (value: string) => void;
  responsavel?: string;
  onResponsavel?: (value: string) => void;
  modulo?: string;
  onModulo?: (value: string) => void;
  placeholder?: string;
};

const statusOptions: Option[] = [
  { label: 'Todos os status', value: '' },
  { label: 'Novo', value: 'novo' },
  { label: 'Em análise', value: 'análise' },
  { label: 'Em andamento', value: 'andamento' },
  { label: 'Monitorando', value: 'monitor' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Concluído', value: 'concl' }
];

const prioridadeOptions: Option[] = [
  { label: 'Todas as prioridades', value: '' },
  { label: 'Crítico', value: 'crit' },
  { label: 'Alta', value: 'alta' },
  { label: 'Média', value: 'méd' },
  { label: 'Baixa', value: 'baix' }
];

const responsaveis: Option[] = [
  { label: 'Todos responsáveis', value: '' },
  { label: 'Bruno Oliveira', value: 'bruno' },
  { label: 'Moises Mattos', value: 'moises' },
  { label: 'Mariana Lima', value: 'mariana' },
  { label: 'Juliana Costa', value: 'juliana' },
  { label: 'Rafael Mendes', value: 'rafael' }
];

const modulos: Option[] = [
  { label: 'Todos os módulos', value: '' },
  { label: 'Faturamento', value: 'faturamento' },
  { label: 'Integrações', value: 'integracoes' },
  { label: 'Cadastros', value: 'cadastros' },
  { label: 'Relatórios', value: 'relatorios' },
  { label: 'Parametrização', value: 'config' }
];

export function SmartFilters({
  search,
  onSearch,
  status = '',
  onStatus,
  prioridade = '',
  onPrioridade,
  responsavel = '',
  onResponsavel,
  modulo = '',
  onModulo,
  placeholder = 'Buscar por título, origem, cliente ou módulo...'
}: Props) {
  return (
    <div className="smart-filters">
      <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} />

      {onStatus && (
        <select value={status} onChange={(event) => onStatus(event.target.value)}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}

      {onPrioridade && (
        <select value={prioridade} onChange={(event) => onPrioridade(event.target.value)}>
          {prioridadeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}

      {onResponsavel && (
        <select value={responsavel} onChange={(event) => onResponsavel(event.target.value)}>
          {responsaveis.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}

      {onModulo && (
        <select value={modulo} onChange={(event) => onModulo(event.target.value)}>
          {modulos.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </div>
  );
}

export const normalizeFilterText = (value?: string | number | null) =>
  String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
