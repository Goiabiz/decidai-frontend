import { useMemo, useState } from 'react';
import {
  CheckSquare,
  Copy,
  Edit3,
  FileText,
  Info,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';

type FieldStatus = 'Ativo' | 'Inativo';
type FieldType =
  | 'Anexo'
  | 'Checkbox'
  | 'Data'
  | 'Data e hora'
  | 'E-mail'
  | 'Fórmula'
  | 'Hora'
  | 'JSON'
  | 'Link'
  | 'Lista em cascata'
  | 'Lista seleção múltipla'
  | 'Lista seleção única'
  | 'Moeda'
  | 'Número'
  | 'Parágrafo / Rich text'
  | 'Percentual'
  | 'Sim/Não'
  | 'Telefone'
  | 'Texto curto';

type FieldRecord = {
  id: string;
  nome: string;
  tipo: FieldType;
  status: FieldStatus;
  descricao: string;
  obrigatorioPadrao: boolean;
  permiteBusca: boolean;
  permiteAgente: boolean;
  mascara: string;
  valorPadrao: string;
  formula: string;
  opcoes: string[];
  listaPrincipal: string;
  listaDependente: string;
  permiteMultiplosNiveis: boolean;
  telas: number;
};

const fieldTypes: FieldType[] = [
  'Anexo',
  'Checkbox',
  'Data',
  'Data e hora',
  'E-mail',
  'Fórmula',
  'Hora',
  'JSON',
  'Link',
  'Lista em cascata',
  'Lista seleção múltipla',
  'Lista seleção única',
  'Moeda',
  'Número',
  'Parágrafo / Rich text',
  'Percentual',
  'Sim/Não',
  'Telefone',
  'Texto curto',
];

const statuses: FieldStatus[] = ['Ativo', 'Inativo'];

const emptyField: FieldRecord = {
  id: '',
  nome: '',
  tipo: 'Texto curto',
  status: 'Ativo',
  descricao: '',
  obrigatorioPadrao: false,
  permiteBusca: true,
  permiteAgente: true,
  mascara: '',
  valorPadrao: '',
  formula: '',
  opcoes: [''],
  listaPrincipal: '',
  listaDependente: '',
  permiteMultiplosNiveis: false,
  telas: 0,
};

const mockFields: FieldRecord[] = [
  {
    id: 'CAM-0001',
    nome: 'Telefone do responsável',
    tipo: 'Telefone',
    status: 'Ativo',
    descricao: 'Telefone principal para contato com o responsável.',
    obrigatorioPadrao: true,
    permiteBusca: true,
    permiteAgente: true,
    mascara: 'telefone internacional',
    valorPadrao: '',
    formula: '',
    opcoes: [],
    listaPrincipal: '',
    listaDependente: '',
    permiteMultiplosNiveis: false,
    telas: 2,
  },
  {
    id: 'CAM-0002',
    nome: 'Descrição da orientação',
    tipo: 'Parágrafo / Rich text',
    status: 'Ativo',
    descricao: 'Campo para texto formatado com orientação, observação ou instrução.',
    obrigatorioPadrao: false,
    permiteBusca: true,
    permiteAgente: true,
    mascara: '',
    valorPadrao: '',
    formula: '',
    opcoes: [],
    listaPrincipal: '',
    listaDependente: '',
    permiteMultiplosNiveis: false,
    telas: 1,
  },
  {
    id: 'CAM-0003',
    nome: 'Módulo e funcionalidade',
    tipo: 'Lista em cascata',
    status: 'Ativo',
    descricao: 'Lista dependente para selecionar primeiro o módulo e depois a funcionalidade.',
    obrigatorioPadrao: false,
    permiteBusca: true,
    permiteAgente: true,
    mascara: '',
    valorPadrao: '',
    formula: '',
    opcoes: ['Cadastros > Usuários', 'Cadastros > Unidades', 'Central de Atendimento > Alertas'],
    listaPrincipal: 'Módulo',
    listaDependente: 'Funcionalidade',
    permiteMultiplosNiveis: true,
    telas: 0,
  },
];

const statusTone = (status: FieldStatus) => status === 'Ativo' ? 'green' : 'blue';

function InfoTip({ text }: { text: string }) {
  return <span className="field-info-tip" data-tooltip={text}><Info size={14} /></span>;
}

function RequiredMark() {
  return <em className="required-mark">*</em>;
}

function FieldLabel({ children, info, required }: { children: React.ReactNode; info: string; required?: boolean }) {
  return <span className="form-label-text">{children} {required && <RequiredMark />} <InfoTip text={info} /></span>;
}

function needsOptions(type: FieldType) {
  return type === 'Lista seleção única' || type === 'Lista seleção múltipla' || type === 'Checkbox' || type === 'Lista em cascata';
}

function typeConfigurationText(type: FieldType) {
  if (type === 'Anexo') return 'Permite anexar documentos, imagens ou arquivos vinculados ao registro.';
  if (type === 'Checkbox') return 'Exibe opções marcáveis. Pode ser usado para uma ou várias confirmações simples.';
  if (type === 'Fórmula') return 'Calcula valor automaticamente. Aceita operações matemáticas, referências a campos e funções simples.';
  if (type === 'Telefone') return 'Valida número, permite país/código e pode diferenciar celular, fixo ou comercial.';
  if (type === 'E-mail') return 'Valida formato de e-mail e pode ser usado para contato, login ou notificação.';
  if (type === 'Lista em cascata') return 'Lista dependente: uma seleção carrega as opções da próxima lista. Ex.: Módulo → Funcionalidade.';
  if (type === 'Lista seleção única') return 'Exibe lista de opções e permite selecionar apenas uma.';
  if (type === 'Lista seleção múltipla') return 'Exibe lista de opções e permite selecionar várias.';
  if (type === 'Parágrafo / Rich text') return 'Texto longo com formatação, ideal para observações, orientações, descrições e conteúdo estruturado.';
  return 'Configuração básica de preenchimento, validação e exibição.';
}

function formulaHelp() {
  return [
    'Operações: +, -, *, /, %, parênteses',
    'Referência de campo: {valor_contrato}, {quantidade}, {prazo}',
    'Funções previstas: soma(), media(), diasEntre(), hoje(), arredondar()',
    'Exemplo: {valor_contrato} * ({percentual_comissao} / 100)',
  ];
}

export function CamposContexto() {
  const [fields, setFields] = useState<FieldRecord[]>(mockFields);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<FieldRecord>(emptyField);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const typeFilter = normalizeFilterText(type);
    const statusFilter = normalizeFilterText(status);

    return fields.filter((field) => {
      const text = normalizeFilterText([field.nome, field.tipo, field.status, field.descricao].join(' '));
      return (!query || text.includes(query))
        && (!typeFilter || normalizeFilterText(field.tipo) === typeFilter)
        && (!statusFilter || normalizeFilterText(field.status) === statusFilter);
    });
  }, [fields, search, type, status]);

  const updateForm = <K extends keyof FieldRecord>(key: K, value: FieldRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
  };

  const updateOption = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      opcoes: current.opcoes.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  };

  const addOption = () => setForm((current) => ({ ...current, opcoes: [...current.opcoes, ''] }));
  const removeOption = (index: number) => setForm((current) => ({ ...current, opcoes: current.opcoes.length === 1 ? current.opcoes : current.opcoes.filter((_, optionIndex) => optionIndex !== index) }));

  const saveField = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome do campo é obrigatório.';
    if (!form.tipo.trim()) nextErrors.tipo = 'Tipo do campo é obrigatório.';
    if (!form.status.trim()) nextErrors.status = 'Status é obrigatório.';
    if (needsOptions(form.tipo) && !form.opcoes.some((option) => option.trim())) nextErrors.opcoes = 'Informe ao menos uma opção.';
    if (form.tipo === 'Fórmula' && !form.formula.trim()) nextErrors.formula = 'Informe a fórmula do campo calculado.';
    if (form.tipo === 'Lista em cascata' && (!form.listaPrincipal.trim() || !form.listaDependente.trim())) nextErrors.cascata = 'Informe a lista principal e a lista dependente.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const nextField: FieldRecord = {
      ...form,
      id: `CAM-${String(fields.length + 1).padStart(4, '0')}`,
      opcoes: needsOptions(form.tipo) ? form.opcoes.filter((option) => option.trim()) : [],
    };

    setFields((current) => [nextField, ...current]);
    setForm(emptyField);
    setIsFormOpen(false);
  };

  const deleteField = (id: string) => {
    const item = fields.find((field) => field.id === id);
    if (!window.confirm(`Excluir o campo "${item?.nome || id}"? Essa ação não deve ser usada se o campo já estiver vinculado a uma tela em produção.`)) return;
    setFields((current) => current.filter((field) => field.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Campos"
        action={<button className="primary-small" onClick={() => setIsFormOpen(true)}><Plus size={16} /> Novo campo</button>}
      />

      <section className="card cadastro-functional-card no-side-detail">
        <div className="section-title-row">
          <h3>Cadastro de campos</h3>
          <span className="small-muted">{filtered.length} de {fields.length} registros</span>
        </div>

        <div className="smart-filter-bar cadastro-filter-bar">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar campo, tipo, descrição ou status..." />
          </div>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Todos os tipos</option>
            {fieldTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="cadastro-table-wrap full">
          <table>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Uso</th>
                <th>Agente</th>
                <th>Telas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((field) => (
                <tr key={field.id}>
                  <td><strong>{field.nome}</strong><div className="table-subtitle">{field.id}</div></td>
                  <td className="description-cell">{field.descricao || '-'}</td>
                  <td><Badge tone="blue">{field.tipo}</Badge></td>
                  <td><Badge tone={statusTone(field.status)}>{field.status}</Badge></td>
                  <td>{field.obrigatorioPadrao ? 'Obrigatório padrão' : 'Opcional padrão'}</td>
                  <td>{field.permiteAgente ? 'Permitido' : 'Não permitido'}</td>
                  <td>{field.telas}</td>
                  <td>
                    <div className="row-action-group">
                      <button title="Editar campo"><Edit3 size={16} /></button>
                      <button title="Duplicar campo"><Copy size={16} /></button>
                      <button title="Excluir campo" onClick={() => deleteField(field.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="cadastro-form-modal">
            <div className="cadastro-modal-header">
              <strong>Novo campo</strong>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Identificação</h3>
                <div className="cadastro-form-grid">
                  <label>
                    <FieldLabel required info="Nome usado para identificar o campo nas telas e regras.">Nome do campo</FieldLabel>
                    <input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Ex.: Telefone do responsável" />
                    {errors.nome && <small className="field-error">{errors.nome}</small>}
                  </label>
                  <label>
                    <FieldLabel required info="Define o comportamento, validação e forma de preenchimento do campo.">Tipo do campo</FieldLabel>
                    <select value={form.tipo} onChange={(event) => updateForm('tipo', event.target.value as FieldType)}>
                      {fieldTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    {errors.tipo && <small className="field-error">{errors.tipo}</small>}
                  </label>
                  <label>
                    <FieldLabel required info="Define se o campo pode ser usado em telas.">Status</FieldLabel>
                    <select value={form.status} onChange={(event) => updateForm('status', event.target.value as FieldStatus)}>
                      {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    {errors.status && <small className="field-error">{errors.status}</small>}
                  </label>
                  <label>
                    <FieldLabel info="Texto explicativo exibido em tooltips, ajuda da tela e contexto para o agente.">Descrição do campo</FieldLabel>
                    <input value={form.descricao} onChange={(event) => updateForm('descricao', event.target.value)} placeholder="Explique quando e como usar este campo" />
                  </label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Comportamento</h3>
                <div className="cadastro-switch-grid">
                  <label><input type="checkbox" checked={form.obrigatorioPadrao} onChange={(event) => updateForm('obrigatorioPadrao', event.target.checked)} /> Obrigatório por padrão</label>
                  <label><input type="checkbox" checked={form.permiteBusca} onChange={(event) => updateForm('permiteBusca', event.target.checked)} /> Permite busca/filtro</label>
                  <label><input type="checkbox" checked={form.permiteAgente} onChange={(event) => updateForm('permiteAgente', event.target.checked)} /> Permite uso por agente</label>
                </div>

                <div className="cadastro-form-grid single-line">
                  <label>
                    <FieldLabel info="Máscara ou padrão de preenchimento. Ex.: CPF, telefone, moeda, percentual.">Máscara</FieldLabel>
                    <input value={form.mascara} onChange={(event) => updateForm('mascara', event.target.value)} placeholder="Máscara ou regra visual" />
                  </label>
                  <label>
                    <FieldLabel info="Valor sugerido automaticamente quando o campo aparecer em uma tela.">Valor padrão</FieldLabel>
                    <input value={form.valorPadrao} onChange={(event) => updateForm('valorPadrao', event.target.value)} placeholder="Valor padrão" />
                  </label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Configuração do tipo</h3>
                <div className="type-config-note">
                  <SlidersHorizontal size={18} />
                  <span>{typeConfigurationText(form.tipo)}</span>
                </div>

                {form.tipo === 'Fórmula' && (
                  <div className="formula-config-box">
                    <label>
                      <FieldLabel required info="Informe a fórmula usando campos entre chaves e operações aceitas.">Fórmula</FieldLabel>
                      <input value={form.formula} onChange={(event) => updateForm('formula', event.target.value)} placeholder="{valor_contrato} * ({percentual_comissao} / 100)" />
                      {errors.formula && <small className="field-error">{errors.formula}</small>}
                    </label>
                    <div className="formula-help-list">
                      {formulaHelp().map((item) => <span key={item}><FileText size={14} /> {item}</span>)}
                    </div>
                  </div>
                )}

                {form.tipo === 'Lista em cascata' && (
                  <div className="cascade-config-box">
                    <div className="cadastro-form-grid">
                      <label>
                        <FieldLabel required info="Primeira seleção da cascata. Ex.: Módulo, Estado, Categoria.">Lista principal</FieldLabel>
                        <input value={form.listaPrincipal} onChange={(event) => updateForm('listaPrincipal', event.target.value)} placeholder="Ex.: Módulo" />
                      </label>
                      <label>
                        <FieldLabel required info="Lista carregada conforme a opção selecionada na lista principal.">Lista dependente</FieldLabel>
                        <input value={form.listaDependente} onChange={(event) => updateForm('listaDependente', event.target.value)} placeholder="Ex.: Funcionalidade" />
                      </label>
                    </div>
                    <label className="inline-check cascade-check"><input type="checkbox" checked={form.permiteMultiplosNiveis} onChange={(event) => updateForm('permiteMultiplosNiveis', event.target.checked)} /> Permite múltiplos níveis</label>
                    {errors.cascata && <small className="field-error">{errors.cascata}</small>}
                  </div>
                )}

                {needsOptions(form.tipo) && (
                  <div className="field-options-box">
                    <div className="section-title-row">
                      <h4>Opções disponíveis</h4>
                      <button className="secondary-btn" type="button" onClick={addOption}><Plus size={15} /> Adicionar opção</button>
                    </div>

                    {form.opcoes.map((option, index) => (
                      <div className="option-row" key={`option-${index}`}>
                        <input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={form.tipo === 'Lista em cascata' ? 'Ex.: Cadastros > Usuários' : `Opção ${index + 1}`} />
                        <button className="icon-btn" type="button" onClick={() => removeOption(index)}><Trash2 size={16} /></button>
                      </div>
                    ))}

                    {errors.opcoes && <small className="field-error">{errors.opcoes}</small>}
                  </div>
                )}
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="primary" onClick={saveField}>Salvar campo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
