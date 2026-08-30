import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Download,
  Edit3,
  FileDown,
  FileSpreadsheet,
  Info,
  MapPin,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';
import { formatCep, lookupCep } from '../../lib/viaCep';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import { createUnidade, listUnidades, updateUnidade, type UnidadeInput, type UnidadeRecord, type UnidadeSetor, type UnidadeStatus, type UnidadeTipo } from '../../services/unidades';

const unitTypes: UnidadeTipo[] = ['Cliente', 'Filial', 'Fornecedor', 'Matriz', 'Prestador'];
const unitStatuses: UnidadeStatus[] = ['Ativa', 'Bloqueada', 'Inativa', 'Pendente'];

const emptyUnit: UnidadeRecord = {
  id: '',
  nome: '',
  tipo: 'Matriz',
  status: 'Ativa',
  responsavel: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  pais: 'Brasil',
  latitude: '',
  longitude: '',
  setores: [{ id: 'setor-1', nome: '', responsavel: '' }],
  dados: {},
};

const toneByStatus = (status: UnidadeStatus) => {
  if (status === 'Ativa') return 'green';
  if (status === 'Pendente') return 'orange';
  if (status === 'Bloqueada') return 'red';
  return 'blue';
};

const toneByType = (type: UnidadeTipo) => {
  if (type === 'Matriz') return 'green';
  if (type === 'Cliente') return 'blue';
  if (type === 'Prestador') return 'purple';
  if (type === 'Fornecedor') return 'orange';
  return 'cyan';
};

function InfoTip({ text }: { text: string }) {
  return <span className="field-info-tip" data-tooltip={text}><Info size={14} /></span>;
}

function RequiredMark() {
  return <em className="required-mark">*</em>;
}

function FieldLabel({ children, info, required }: { children: React.ReactNode; info: string; required?: boolean }) {
  return <span className="form-label-text">{children} {required && <RequiredMark />} <InfoTip text={info} /></span>;
}

function address(unit: UnidadeRecord) {
  const parts = [unit.logradouro, unit.numero, unit.complemento, unit.bairro, unit.cidade, unit.uf, unit.pais].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Endereço não informado';
}

function fieldsByType(type: UnidadeTipo) {
  if (type === 'Matriz') return [['razaoSocial', 'Razão social'], ['cnpj', 'CNPJ'], ['inscricaoMunicipal', 'Inscrição municipal'], ['site', 'Site']];
  if (type === 'Filial') return [['horarioFuncionamento', 'Horário de funcionamento'], ['areaAtendimento', 'Área de atendimento'], ['capacidadeOperacional', 'Capacidade operacional']];
  if (type === 'Prestador') return [['documento', 'CNPJ/CPF'], ['tipoPrestacao', 'Tipo de prestação'], ['contrato', 'Contrato vinculado'], ['vigenciaContrato', 'Vigência do contrato'], ['slaContratado', 'SLA contratado']];
  if (type === 'Fornecedor') return [['cnpj', 'CNPJ'], ['categoriaFornecimento', 'Categoria de fornecimento'], ['condicaoPagamento', 'Condição de pagamento'], ['prazoEntrega', 'Prazo médio de entrega'], ['canalPedido', 'Canal de pedido']];
  return [['documento', 'CNPJ/CPF'], ['tipoCliente', 'Tipo de cliente'], ['planoContrato', 'Plano/contrato'], ['statusComercial', 'Status comercial'], ['canalPrincipal', 'Canal principal']];
}

function LocationSummary({ unit }: { unit: UnidadeRecord }) {
  const hasCoordinates = Boolean(unit.latitude && unit.longitude);
  return (
    <div className="unit-location-summary">
      <MapPin size={18} />
      <div>
        <strong>{hasCoordinates ? `${unit.latitude}, ${unit.longitude}` : 'Coordenadas não informadas'}</strong>
        <small>{address(unit)}</small>
      </div>
    </div>
  );
}

export function UnidadesCentrosCusto() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnidadeRecord | null>(null);
  const [form, setForm] = useState<UnidadeRecord>(emptyUnit);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);

  const unidadesQuery = useQuery({
    queryKey: ['unidades', clienteId],
    queryFn: () => listUnidades(clienteId as string),
    enabled: !!clienteId,
  });
  const units = unidadesQuery.data?.items ?? [];
  const loading = unidadesQuery.isLoading;

  // Seleciona a 1ª unidade só na carga inicial (sem seleção ainda) -- mesmo comportamento de
  // antes, sem sobrescrever a escolha do usuário quando a lista é revalidada.
  useEffect(() => {
    if (selectedUnit || units.length === 0) return;
    setSelectedUnit(units[0]);
  }, [units, selectedUnit]);

  const saveMutation = useMutation({
    mutationFn: (input: UnidadeInput) => (editingUnitId
      ? updateUnidade(editingUnitId, clienteId as string, input)
      : createUnidade(clienteId as string, input)),
    onSuccess: (nextUnit) => {
      queryClient.invalidateQueries({ queryKey: ['unidades', clienteId] });
      setSelectedUnit(nextUnit);
      showAppToast(editingUnitId ? 'Unidade atualizada.' : 'Unidade criada.', 'success');
      setForm(emptyUnit);
      setEditingUnitId(null);
      setIsFormOpen(false);
    },
    onError: (error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a unidade.', 'error'),
  });

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const typeFilter = normalizeFilterText(type);
    const statusFilter = normalizeFilterText(status);

    return units.filter((unit) => {
      const text = normalizeFilterText([unit.nome, unit.tipo, unit.status, unit.cidade, unit.uf, unit.responsavel, unit.email].join(' '));
      return (!query || text.includes(query))
        && (!typeFilter || normalizeFilterText(unit.tipo) === typeFilter)
        && (!statusFilter || normalizeFilterText(unit.status) === statusFilter);
    });
  }, [units, search, type, status]);

  const updateForm = <K extends keyof UnidadeRecord>(key: K, value: UnidadeRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
  };

  const updateData = (key: string, value: string) => setForm((current) => ({ ...current, dados: { ...current.dados, [key]: value } }));

  const updateSector = (id: string, key: keyof UnidadeSetor, value: string) => {
    setForm((current) => ({
      ...current,
      setores: current.setores.map((sector) => sector.id === id ? { ...sector, [key]: value } : sector),
    }));
  };

  const addSector = () => setForm((current) => ({ ...current, setores: [...current.setores, { id: `setor-${Date.now()}`, nome: '', responsavel: '' }] }));
  const removeSector = (id: string) => setForm((current) => ({ ...current, setores: current.setores.length === 1 ? current.setores : current.setores.filter((sector) => sector.id !== id) }));

  const searchCep = async () => {
    if (!form.cep.trim()) {
      setErrors((current) => ({ ...current, cep: 'Informe um CEP para buscar o endereço.' }));
      return;
    }

    setCepLoading(true);
    const address = await lookupCep(form.cep);
    setCepLoading(false);

    if (!address) {
      setErrors((current) => ({ ...current, cep: 'CEP não encontrado.' }));
      return;
    }

    setForm((current) => ({
      ...current,
      logradouro: address.logradouro,
      bairro: address.bairro,
      cidade: address.cidade,
      uf: address.uf,
      pais: current.pais || 'Brasil',
    }));
    setErrors((current) => ({ ...current, cep: '' }));
  };

  const openCreateModal = () => {
    setEditingUnitId(null);
    setForm(emptyUnit);
    setIsFormOpen(true);
  };

  const openEditModal = (unit: UnidadeRecord) => {
    setEditingUnitId(unit.id);
    setForm(unit);
    setIsFormOpen(true);
  };

  const saveUnit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome da unidade é obrigatório.';
    if (!form.tipo.trim()) nextErrors.tipo = 'Tipo da unidade é obrigatório.';
    if (!form.status.trim()) nextErrors.status = 'Status é obrigatório.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }

    const input: UnidadeInput = { ...form, setores: form.setores.map(({ nome, responsavel }) => ({ nome, responsavel })) };
    saveMutation.mutate(input);
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Unidades" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver as unidades dele.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Unidades"
        action={(
          <div className="header-actions">
            <button className="secondary-btn" onClick={() => setIsImportOpen(true)}><Upload size={16} /> Importar</button>
            <button className="secondary-btn" onClick={() => setIsExportOpen(true)}><Download size={16} /> Exportar</button>
            <button className="primary-small" onClick={openCreateModal}><Plus size={16} /> Nova unidade</button>
          </div>
        )}
      />

      <section className="card unit-functional-card">
        <div className="section-title-row"><h3>Cadastro de unidades</h3><span className="small-muted">{loading ? '...' : `${filtered.length} de ${units.length} registros`}</span></div>

        <div className="smart-filter-bar units-filter-bar">
          <div className="smart-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar unidade, responsável, cidade ou e-mail..." /></div>
          <select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos os tipos</option>{unitTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{unitStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>

        <div className="units-layout-grid">
          <div className="units-table-wrap">
            <table>
              <thead><tr><th>Unidade</th><th>Tipo</th><th>Cidade/UF</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {filtered.map((unit) => (
                  <tr key={unit.id} className="clickable-row" onClick={() => setSelectedUnit(unit)}>
                    <td><strong>{unit.nome}</strong></td>
                    <td><Badge tone={toneByType(unit.tipo)}>{unit.tipo}</Badge></td>
                    <td>{unit.cidade && unit.uf ? `${unit.cidade}/${unit.uf}` : '-'}</td>
                    <td>{unit.responsavel || '-'}<div className="table-subtitle">{unit.email || '-'}</div></td>
                    <td><Badge tone={toneByStatus(unit.status)}>{unit.status}</Badge></td>
                    <td>
                      <div className="row-action-group" onClick={(event) => event.stopPropagation()}>
                        <button title="Editar unidade" onClick={() => openEditModal(unit)}><Edit3 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="empty-note">Nenhuma unidade cadastrada ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="unit-detail-inline">
            <div className="section-title-row"><h3>Detalhes</h3>{selectedUnit && <Badge tone={toneByStatus(selectedUnit.status)}>{selectedUnit.status}</Badge>}</div>
            {selectedUnit ? (
              <>
                <div className="unit-profile-box"><div className="unit-icon-large"><Building2 size={28} /></div><div><strong>{selectedUnit.nome}</strong><span>{selectedUnit.tipo}</span></div></div>
                <div className="detail-grid compact unit-detail-grid">
                  <span>Tipo</span><strong>{selectedUnit.tipo}</strong>
                  <span>Responsável</span><strong>{selectedUnit.responsavel || '-'}</strong>
                  <span>E-mail</span><strong>{selectedUnit.email || '-'}</strong>
                  <span>Telefone</span><strong>{selectedUnit.telefone || '-'}</strong>
                  <span>Endereço</span><strong>{address(selectedUnit)}</strong>
                  <span>Setores</span><strong>{selectedUnit.setores.length}</strong>
                </div>

                <div className="unit-map-detail-box">
                  <h4>Localização</h4>
                  <LocationSummary unit={selectedUnit} />
                </div>

                <div className="panel-actions user-actions"><button className="primary" onClick={() => openEditModal(selectedUnit)}>Editar unidade</button></div>

                <div className="unit-sector-list">
                  <h4>Setores</h4>
                  {selectedUnit.setores.length ? selectedUnit.setores.map((sector) => <div className="mini-row" key={sector.id}><span>{sector.nome}</span><strong>{sector.responsavel || '-'}</strong></div>) : <p className="empty-note">Nenhum setor vinculado.</p>}
                </div>
              </>
            ) : <p className="empty-note">{loading ? 'Carregando...' : 'Selecione uma unidade para visualizar os detalhes.'}</p>}
          </aside>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop unit-modal-backdrop">
          <div className="unit-form-modal">
            <div className="unit-modal-header"><strong>{editingUnitId ? 'Editar unidade' : 'Nova unidade'}</strong><button className="icon-btn" onClick={() => { setIsFormOpen(false); setEditingUnitId(null); }}><X size={18} /></button></div>

            <div className="unit-modal-content">
              <section className="unit-form-section">
                <h3>Identificação</h3>
                <div className="unit-form-grid">
                  <label><FieldLabel required info="Nome pelo qual a unidade é conhecida (ex.: matriz, nome da filial ou do parceiro).">Nome da unidade</FieldLabel><input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Informe o nome da unidade" />{errors.nome && <small className="field-error">{errors.nome}</small>}</label>
                  <label><FieldLabel required info="Classifica a unidade como Matriz, Filial, Prestador, Fornecedor ou Cliente.">Tipo</FieldLabel><select value={form.tipo} onChange={(event) => updateForm('tipo', event.target.value as UnidadeTipo)}>{unitTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select>{errors.tipo && <small className="field-error">{errors.tipo}</small>}</label>
                  <label><FieldLabel required info="Define se a unidade pode ser usada em vínculos e operações.">Status</FieldLabel><select value={form.status} onChange={(event) => updateForm('status', event.target.value as UnidadeStatus)}>{unitStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>{errors.status && <small className="field-error">{errors.status}</small>}</label>
                  <label><FieldLabel info="Responsável operacional ou administrativo pela unidade.">Responsável</FieldLabel><input value={form.responsavel} onChange={(event) => updateForm('responsavel', event.target.value)} placeholder="Nome do responsável" /></label>
                </div>
              </section>

              <section className="unit-form-section">
                <h3>Dados complementares</h3>
                <div className="unit-form-grid">
                  {fieldsByType(form.tipo).map(([key, label]) => <label key={key}><FieldLabel info={`Campo complementar aplicado para o tipo ${form.tipo}.`}>{label}</FieldLabel><input value={form.dados[key] || ''} onChange={(event) => updateData(key, event.target.value)} placeholder={label} /></label>)}
                </div>
              </section>

              <section className="unit-form-section">
                <h3>Contatos</h3>
                <div className="unit-form-grid">
                  <label><FieldLabel info="E-mail principal para contato com a unidade.">E-mail principal</FieldLabel><input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="unidade@dominio.com" /></label>
                  <label><FieldLabel info="Telefone principal da unidade.">Telefone principal</FieldLabel><input value={form.telefone} onChange={(event) => updateForm('telefone', event.target.value)} placeholder="+55 (00) 00000-0000" /></label>
                </div>
              </section>

              <section className="unit-form-section">
                <div className="section-title-row"><h3>Setores</h3><button className="secondary-btn" type="button" onClick={addSector}><Plus size={15} /> Adicionar setor</button></div>
                {form.setores.map((sector) => (
                  <div className="unit-sector-row" key={sector.id}>
                    <input value={sector.nome} onChange={(event) => updateSector(sector.id, 'nome', event.target.value)} placeholder="Nome do setor" />
                    <input value={sector.responsavel} onChange={(event) => updateSector(sector.id, 'responsavel', event.target.value)} placeholder="Responsável" />
                    <button className="icon-btn" type="button" onClick={() => removeSector(sector.id)}><X size={16} /></button>
                  </div>
                ))}
              </section>

              <section className="unit-form-section">
                <div className="section-title-row"><h3>Endereço e localização</h3><button className="secondary-btn" type="button" disabled={cepLoading} onClick={() => void searchCep()}><MapPin size={15} /> {cepLoading ? 'Buscando...' : 'Buscar CEP'}</button></div>
                <div className="unit-form-grid address-grid">
                  <label><FieldLabel info="CEP do endereço. Buscar preenche rua, bairro, cidade e UF automaticamente.">CEP</FieldLabel><input value={form.cep} onChange={(event) => updateForm('cep', formatCep(event.target.value))} placeholder="00000-000" maxLength={9} />{errors.cep && <small className="field-error">{errors.cep}</small>}</label>
                  <label><FieldLabel info="Nome da rua, avenida ou logradouro.">Logradouro</FieldLabel><input value={form.logradouro} onChange={(event) => updateForm('logradouro', event.target.value)} placeholder="Rua, avenida, praça..." /></label>
                  <label><FieldLabel info="Número do imóvel ou da unidade.">Número</FieldLabel><input value={form.numero} onChange={(event) => updateForm('numero', event.target.value)} placeholder="Número" /></label>
                  <label><FieldLabel info="Complemento do endereço.">Complemento</FieldLabel><input value={form.complemento} onChange={(event) => updateForm('complemento', event.target.value)} placeholder="Sala, bloco, andar..." /></label>
                  <label><FieldLabel info="Bairro retornado pelo CEP ou informado manualmente.">Bairro</FieldLabel><input value={form.bairro} onChange={(event) => updateForm('bairro', event.target.value)} placeholder="Bairro" /></label>
                  <label><FieldLabel info="Cidade da unidade.">Cidade</FieldLabel><input value={form.cidade} onChange={(event) => updateForm('cidade', event.target.value)} placeholder="Cidade" /></label>
                  <label><FieldLabel info="Unidade federativa.">UF</FieldLabel><input value={form.uf} onChange={(event) => updateForm('uf', event.target.value)} placeholder="UF" /></label>
                  <label><FieldLabel info="País da unidade.">País</FieldLabel><input value={form.pais} onChange={(event) => updateForm('pais', event.target.value)} placeholder="País" /></label>
                  <label><FieldLabel info="Latitude obtida via Google Maps ou outro provedor de geolocalização.">Latitude</FieldLabel><input value={form.latitude} onChange={(event) => updateForm('latitude', event.target.value)} placeholder="-23.55052" /></label>
                  <label><FieldLabel info="Longitude obtida via Google Maps ou outro provedor de geolocalização.">Longitude</FieldLabel><input value={form.longitude} onChange={(event) => updateForm('longitude', event.target.value)} placeholder="-46.63331" /></label>
                </div>
              </section>
            </div>

            <div className="unit-modal-footer"><button onClick={() => { setIsFormOpen(false); setEditingUnitId(null); }}>Cancelar</button><button className="primary" disabled={saveMutation.isPending} onClick={saveUnit}>{saveMutation.isPending ? 'Salvando...' : editingUnitId ? 'Salvar alterações' : 'Salvar unidade'}</button></div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="modal-backdrop small-action-modal-backdrop">
          <div className="small-action-modal">
            <div className="unit-modal-header"><strong>Importar unidades</strong><button className="icon-btn" onClick={() => setIsImportOpen(false)}><X size={18} /></button></div>
            <div className="small-action-modal-body">
              <p>Importação em lote ainda não está disponível — cadastre unidades uma a uma pelo botão "Nova unidade" por enquanto.</p>
              <div className="action-options-grid"><button disabled><FileSpreadsheet size={18} /> Baixar modelo XLSX</button><button disabled><FileDown size={18} /> Selecionar arquivo</button></div>
            </div>
          </div>
        </div>
      )}

      {isExportOpen && (
        <div className="modal-backdrop small-action-modal-backdrop">
          <div className="small-action-modal">
            <div className="unit-modal-header"><strong>Exportar unidades</strong><button className="icon-btn" onClick={() => setIsExportOpen(false)}><X size={18} /></button></div>
            <div className="small-action-modal-body">
              <p>Exportação ainda não está disponível pra esta tela.</p>
              <div className="action-options-grid"><button disabled><FileSpreadsheet size={18} /> XLSX</button><button disabled><FileDown size={18} /> CSV</button><button disabled><Download size={18} /> PDF</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UnidadesCentrosCusto;
