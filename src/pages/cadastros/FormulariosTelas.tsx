import { useMemo, useState } from 'react';
import {
  Copy,
  Edit3,
  Eye,
  GripVertical,
  Info,
  LayoutTemplate,
  Plus,
  Search,
  Settings2,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';
import { confirmApp } from '../../lib/appConfirm';

type ScreenStatus = 'Ativa' | 'Inativa' | 'Rascunho';
type DisplayBehavior = 'Exibir ao abrir funcionalidade' | 'Exibir como atalho';
type FieldArea = 'Principal' | 'Contexto';
type TabMode = 'Campos' | 'Lista';
type FieldWidth = 'Inteira' | 'Metade' | 'Terço';

type AvailableField = {
  id: string;
  campo: string;
  tipo: string;
  descricao: string;
  origem: 'Padrão do sistema' | 'Personalizado';
};

type ScreenTab = {
  id: string;
  nome: string;
  modo: TabMode;
};

type ScreenSection = {
  id: string;
  tabId: string;
  nome: string;
  colunas: 1 | 2 | 3;
  ordem: number;
};

type ScreenField = AvailableField & {
  instanceId: string;
  obrigatorio: boolean;
  visivel: boolean;
  area: FieldArea;
  tabId: string;
  sectionId: string;
  largura: FieldWidth;
  valorPadrao: string;
  ocultoUsuario: boolean;
  ordem: number;
};

type ScreenRecord = {
  id: string;
  nome: string;
  funcionalidade: string;
  status: ScreenStatus;
  comportamento: DisplayBehavior;
  descricao: string;
  tabs: ScreenTab[];
  sections: ScreenSection[];
  campos: ScreenField[];
  agente: boolean;
  atualizadoEm: string;
};

const statuses: ScreenStatus[] = ['Ativa', 'Inativa', 'Rascunho'];
const displayBehaviors: DisplayBehavior[] = ['Exibir ao abrir funcionalidade', 'Exibir como atalho'];

const systemFields: AvailableField[] = [
  { id: 'std-codigo', campo: 'Código', tipo: 'Texto curto', descricao: 'Identificador do registro.', origem: 'Padrão do sistema' },
  { id: 'std-criado-em', campo: 'Criado em', tipo: 'Data e hora', descricao: 'Data e hora de criação.', origem: 'Padrão do sistema' },
  { id: 'std-criado-por', campo: 'Criado por', tipo: 'Texto curto', descricao: 'Usuário que criou o registro.', origem: 'Padrão do sistema' },
  { id: 'std-descricao', campo: 'Descrição', tipo: 'Parágrafo / Rich text', descricao: 'Descrição principal do registro.', origem: 'Padrão do sistema' },
  { id: 'std-responsavel', campo: 'Responsável', tipo: 'Texto curto', descricao: 'Responsável pelo registro.', origem: 'Padrão do sistema' },
  { id: 'std-status', campo: 'Status', tipo: 'Lista seleção única', descricao: 'Situação operacional do registro.', origem: 'Padrão do sistema' },
  { id: 'std-titulo', campo: 'Título', tipo: 'Texto curto', descricao: 'Título principal do registro.', origem: 'Padrão do sistema' },
];

const customFields: AvailableField[] = [
  { id: 'cus-anexo-contrato', campo: 'Anexos do contrato', tipo: 'Anexo', descricao: 'Documentos anexados ao registro.', origem: 'Personalizado' },
  { id: 'cus-classificacao', campo: 'Classificação comercial', tipo: 'Lista seleção única', descricao: 'Classificação do cliente ou fornecedor.', origem: 'Personalizado' },
  { id: 'cus-data-inicio', campo: 'Data de início do contrato', tipo: 'Data', descricao: 'Data inicial de vigência.', origem: 'Personalizado' },
  { id: 'cus-orientacao', campo: 'Descrição da orientação', tipo: 'Parágrafo / Rich text', descricao: 'Texto formatado para orientação ou descrição.', origem: 'Personalizado' },
  { id: 'cus-margem', campo: 'Margem comercial', tipo: 'Percentual', descricao: 'Percentual comercial aplicado.', origem: 'Personalizado' },
  { id: 'cus-modulo-funcionalidade', campo: 'Módulo e funcionalidade', tipo: 'Lista em cascata', descricao: 'Lista dependente por módulo e funcionalidade.', origem: 'Personalizado' },
  { id: 'cus-telefone', campo: 'Telefone do responsável', tipo: 'Telefone', descricao: 'Telefone principal para contato.', origem: 'Personalizado' },
  { id: 'cus-valor', campo: 'Valor mensal', tipo: 'Moeda', descricao: 'Valor financeiro mensal.', origem: 'Personalizado' },
];

const allAvailableFields = [...systemFields, ...customFields].sort((a, b) => a.campo.localeCompare(b.campo));
const funcionalidades = ['Alertas', 'Atendimentos', 'Base de Conhecimento', 'Campos', 'Serviços', 'Telas', 'Unidades', 'Usuários'];

const defaultTab: ScreenTab = { id: 'principal', nome: 'Principal', modo: 'Campos' };
const defaultSection: ScreenSection = { id: 'sec-principal', tabId: 'principal', nome: 'Dados principais', colunas: 2, ordem: 1 };

const emptyScreen: ScreenRecord = {
  id: '',
  nome: '',
  funcionalidade: 'Usuários',
  status: 'Rascunho',
  comportamento: 'Exibir como atalho',
  descricao: '',
  tabs: [defaultTab],
  sections: [defaultSection],
  campos: [],
  agente: true,
  atualizadoEm: '',
};

const mockScreens: ScreenRecord[] = [
  {
    id: 'TEL-0001',
    nome: 'Cadastro de usuários',
    funcionalidade: 'Usuários',
    status: 'Ativa',
    comportamento: 'Exibir ao abrir funcionalidade',
    descricao: 'Tela principal do cadastro de usuários.',
    agente: true,
    atualizadoEm: 'Hoje 18:20',
    tabs: [defaultTab],
    sections: [defaultSection],
    campos: [
      { ...systemFields[6], instanceId: 'f1', obrigatorio: true, visivel: true, area: 'Principal', tabId: 'principal', sectionId: 'sec-principal', largura: 'Metade', valorPadrao: '', ocultoUsuario: false, ordem: 1 },
      { ...systemFields[4], instanceId: 'f2', obrigatorio: false, visivel: true, area: 'Contexto', tabId: 'contexto-global', sectionId: 'contexto-global', largura: 'Inteira', valorPadrao: '', ocultoUsuario: false, ordem: 2 },
    ],
  },
  {
    id: 'TEL-0002',
    nome: 'Quadro comercial do cliente',
    funcionalidade: 'Unidades',
    status: 'Rascunho',
    comportamento: 'Exibir como atalho',
    descricao: 'Visualização em lista para dados comerciais do cliente.',
    agente: false,
    atualizadoEm: 'Ontem 15:10',
    tabs: [{ id: 'principal', nome: 'Principal', modo: 'Lista' }],
    sections: [{ id: 'sec-comercial', tabId: 'principal', nome: 'Comercial', colunas: 3, ordem: 1 }],
    campos: [
      { ...customFields[1], instanceId: 'f3', obrigatorio: false, visivel: true, area: 'Principal', tabId: 'principal', sectionId: 'sec-comercial', largura: 'Metade', valorPadrao: '', ocultoUsuario: false, ordem: 1 },
      { ...customFields[2], instanceId: 'f4', obrigatorio: false, visivel: true, area: 'Principal', tabId: 'principal', sectionId: 'sec-comercial', largura: 'Metade', valorPadrao: '', ocultoUsuario: false, ordem: 2 },
    ],
  },
];

const cloneScreen = (screen: ScreenRecord): ScreenRecord => ({
  ...screen,
  tabs: screen.tabs.map((tab) => ({ ...tab })),
  sections: screen.sections.map((section) => ({ ...section })),
  campos: screen.campos.map((field) => ({ ...field })),
});

const statusTone = (status: ScreenStatus) => {
  if (status === 'Ativa') return 'green';
  if (status === 'Rascunho') return 'orange';
  return 'blue';
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

function renderPreviewInput(type: string) {
  if (type === 'Lista seleção única' || type === 'Lista seleção múltipla') return <select disabled><option>Selecione</option></select>;
  if (type === 'Lista em cascata') return <div className="cascade-preview-row"><select disabled><option>Lista principal</option></select><select disabled><option>Lista dependente</option></select></div>;
  if (type === 'Checkbox') return <div className="preview-checkbox-line"><input type="checkbox" disabled /> <span>Opção configurada</span></div>;
  if (type === 'Parágrafo / Rich text') return <textarea disabled placeholder="Editor de texto formatado" />;
  if (type === 'Data') return <input type="date" disabled />;
  if (type === 'Data e hora') return <input type="datetime-local" disabled />;
  if (type === 'Hora') return <input type="time" disabled />;
  if (type === 'Anexo') return <button className="secondary-btn" disabled>Anexar arquivo</button>;
  return <input placeholder={type} disabled />;
}

function widthClass(width: FieldWidth) {
  if (width === 'Inteira') return 'span-full';
  if (width === 'Terço') return 'span-third';
  return 'span-half';
}

export function FormulariosTelas() {
  const [screens, setScreens] = useState<ScreenRecord[]>(mockScreens);
  const [search, setSearch] = useState('');
  const [funcionalidade, setFuncionalidade] = useState('');
  const [status, setStatus] = useState('');
  const [selectedScreen, setSelectedScreen] = useState<ScreenRecord | null>(mockScreens[0]);
  const [form, setForm] = useState<ScreenRecord>(emptyScreen);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [activeTabId, setActiveTabId] = useState('principal');
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(null);
  const [fieldDropHandled, setFieldDropHandled] = useState(false);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const functionalityFilter = normalizeFilterText(funcionalidade);
    const statusFilter = normalizeFilterText(status);

    return screens.filter((item) => {
      const text = normalizeFilterText([item.nome, item.funcionalidade, item.status, item.descricao, item.comportamento].join(' '));
      return (!query || text.includes(query))
        && (!functionalityFilter || normalizeFilterText(item.funcionalidade) === functionalityFilter)
        && (!statusFilter || normalizeFilterText(item.status) === statusFilter);
    });
  }, [screens, search, funcionalidade, status]);

  const availableToAdd = useMemo(() => {
    const alreadyUsed = new Set(form.campos.map((field) => field.id));
    const query = normalizeFilterText(fieldSearch);

    return allAvailableFields
      .filter((field) => {
        const text = normalizeFilterText(`${field.campo} ${field.tipo} ${field.descricao}`);
        return !alreadyUsed.has(field.id) && (!query || text.includes(query));
      })
      .sort((a, b) => a.campo.localeCompare(b.campo));
  }, [form.campos, fieldSearch]);

  const activeTab = form.tabs.find((tab) => tab.id === activeTabId) || form.tabs[0];
  const activeSections = form.sections.filter((section) => section.tabId === activeTab.id).sort((a, b) => a.ordem - b.ordem);

  const openNewScreen = () => {
    setForm(cloneScreen(emptyScreen));
    setEditingId(null);
    setActiveTabId('principal');
    setExpandedFieldId(null);
    setIsFormOpen(true);
  };

  const openEditScreen = (screen: ScreenRecord) => {
    const next = cloneScreen(screen);
    setForm(next);
    setEditingId(screen.id);
    setActiveTabId(next.tabs[0]?.id || 'principal');
    setExpandedFieldId(null);
    setIsFormOpen(true);
  };

  const openCopyScreen = (screen: ScreenRecord) => {
    const next = cloneScreen(screen);
    next.id = '';
    next.nome = `${screen.nome} cópia`;
    next.status = 'Rascunho';
    next.atualizadoEm = '';
    next.campos = next.campos.map((field, index) => ({ ...field, instanceId: `copy-field-${Date.now()}-${index}` }));
    setForm(next);
    setEditingId(null);
    setActiveTabId(next.tabs[0]?.id || 'principal');
    setExpandedFieldId(null);
    setIsFormOpen(true);
  };

  const updateForm = <K extends keyof ScreenRecord>(key: K, value: ScreenRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
  };

  const updateTab = (id: string, values: Partial<ScreenTab>) => {
    setForm((current) => ({ ...current, tabs: current.tabs.map((tab) => tab.id === id ? { ...tab, ...values } : tab) }));
  };

  const updateSection = (id: string, values: Partial<ScreenSection>) => {
    setForm((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...values } : section) }));
  };

  const addTab = () => {
    const tab = { id: `tab-${Date.now()}`, nome: `Aba ${form.tabs.length + 1}`, modo: 'Campos' as TabMode };
    const section = { id: `sec-${Date.now()}`, tabId: tab.id, nome: 'Dados principais', colunas: 2 as 1 | 2 | 3, ordem: 1 };
    setForm((current) => ({ ...current, tabs: [...current.tabs, tab], sections: [...current.sections, section] }));
    setActiveTabId(tab.id);
  };

  const addSection = () => {
    const section = {
      id: `sec-${Date.now()}`,
      tabId: activeTab.id,
      nome: `Seção ${activeSections.length + 1}`,
      colunas: 2 as 1 | 2 | 3,
      ordem: activeSections.length + 1,
    };
    setForm((current) => ({ ...current, sections: [...current.sections, section] }));
  };

  const addField = (fieldId: string, targetArea: FieldArea = 'Principal', sectionId = activeSections[0]?.id || 'sec-principal') => {
    const field = allAvailableFields.find((item) => item.id === fieldId);
    if (!field) return;

    setForm((current) => {
      if (current.campos.some((item) => item.id === fieldId)) return current;
      const targetSection = current.sections.find((section) => section.id === sectionId);
      return {
        ...current,
        campos: [
          ...current.campos,
          {
            ...field,
            instanceId: `screen-field-${Date.now()}`,
            obrigatorio: false,
            visivel: true,
            area: targetArea,
            tabId: targetArea === 'Contexto' ? 'contexto-global' : (targetSection?.tabId || activeTab.id),
            sectionId: targetArea === 'Contexto' ? 'contexto-global' : sectionId,
            largura: targetArea === 'Contexto' ? 'Inteira' : targetSection?.colunas === 1 ? 'Inteira' : 'Metade',
            valorPadrao: '',
            ocultoUsuario: false,
            ordem: current.campos.length + 1,
          },
        ],
      };
    });
    setFieldSearch('');
  };

  const moveExistingField = (instanceId: string, area: FieldArea, sectionId = activeSections[0]?.id || 'sec-principal') => {
    setForm((current) => {
      const targetSection = current.sections.find((section) => section.id === sectionId);
      return {
        ...current,
        campos: current.campos.map((field) => field.instanceId === instanceId ? {
          ...field,
          area,
          tabId: area === 'Contexto' ? 'contexto-global' : (targetSection?.tabId || activeTab.id),
          sectionId: area === 'Contexto' ? 'contexto-global' : sectionId,
        } : field),
      };
    });
  };

  const updateScreenField = (instanceId: string, key: keyof ScreenField, value: ScreenField[keyof ScreenField]) => {
    setForm((current) => ({
      ...current,
      campos: current.campos.map((field) => field.instanceId === instanceId ? { ...field, [key]: value } : field),
    }));
  };

  const removeField = async (instanceId: string, confirm = true) => {
    const item = form.campos.find((field) => field.instanceId === instanceId);
    if (confirm) {
      const confirmed = await confirmApp({
        title: 'Remover campo da tela',
        description: `Remover o campo "${item?.campo || instanceId}" desta tela?`,
        confirmLabel: 'Remover campo',
        tone: 'danger',
      });
      if (!confirmed) return;
    }
    setForm((current) => ({
      ...current,
      campos: current.campos.filter((field) => field.instanceId !== instanceId).map((field, index) => ({ ...field, ordem: index + 1 })),
    }));
  };

  const handleDrop = (area: FieldArea, sectionId?: string) => {
    setFieldDropHandled(true);

    if (draggedFieldId) {
      addField(draggedFieldId, area, sectionId);
      setDraggedFieldId(null);
      return;
    }

    if (draggedInstanceId) {
      moveExistingField(draggedInstanceId, area, sectionId);
      setDraggedInstanceId(null);
    }
  };

  const handleFieldDragStart = (instanceId: string) => {
    setDraggedInstanceId(instanceId);
    setFieldDropHandled(false);
  };

  const handleFieldDragEnd = (instanceId: string) => {
    if (!fieldDropHandled) {
      removeField(instanceId, false);
    }

    setDraggedInstanceId(null);
    setFieldDropHandled(false);
  };

  const saveScreen = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome da tela é obrigatório.';
    if (!form.funcionalidade.trim()) nextErrors.funcionalidade = 'Funcionalidade é obrigatória.';
    if (!form.status.trim()) nextErrors.status = 'Status é obrigatório.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (editingId) {
      const updated: ScreenRecord = { ...form, id: editingId, atualizadoEm: 'Agora' };
      setScreens((current) => current.map((screen) => screen.id === editingId ? updated : screen));
      setSelectedScreen(updated);
    } else {
      const nextScreen: ScreenRecord = {
        ...form,
        id: `TEL-${String(screens.length + 1).padStart(4, '0')}`,
        atualizadoEm: 'Agora',
      };
      setScreens((current) => [nextScreen, ...current]);
      setSelectedScreen(nextScreen);
    }

    setForm(cloneScreen(emptyScreen));
    setEditingId(null);
    setActiveTabId('principal');
    setExpandedFieldId(null);
    setIsFormOpen(false);
  };

  const deleteScreen = async (id: string) => {
    const item = screens.find((screen) => screen.id === id);
    const confirmed = await confirmApp({
      title: 'Excluir tela',
      description: `Excluir a tela "${item?.nome || id}"?`,
      confirmLabel: 'Excluir tela',
      tone: 'danger',
    });
    if (!confirmed) return;
    setScreens((current) => current.filter((screen) => screen.id !== id));
  };

  const previewScreen = isFormOpen ? form : selectedScreen;
  const previewActiveTab = previewScreen?.tabs.find((tab) => tab.id === activeTabId) || previewScreen?.tabs[0];
  const previewSections = (previewScreen?.sections || []).filter((section) => section.tabId === previewActiveTab?.id).sort((a, b) => a.ordem - b.ordem);

  const fieldsInGlobalContext = form.campos.filter((field) => field.visivel && field.area === 'Contexto');

  return (
    <>
      <PageHeader
        title="Telas"
        action={<button className="primary-small" onClick={openNewScreen}><Plus size={16} /> Nova tela</button>}
      />

      <section className="card cadastro-functional-card no-side-detail">
        <div className="section-title-row">
          <h3>Cadastro de telas</h3>
          <span className="small-muted">{filtered.length} de {screens.length} registros</span>
        </div>

        <div className="smart-filter-bar cadastro-filter-bar">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tela, funcionalidade ou descrição..." />
          </div>
          <select value={funcionalidade} onChange={(event) => setFuncionalidade(event.target.value)}>
            <option value="">Todas as funcionalidades</option>
            {funcionalidades.map((item) => <option key={item} value={item}>{item}</option>)}
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
                <th>Tela</th>
                <th>Descrição</th>
                <th>Funcionalidade</th>
                <th>Exibição</th>
                <th>Status</th>
                <th>Campos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="clickable-row" onClick={() => setSelectedScreen(item)}>
                  <td><strong>{item.nome}</strong><div className="table-subtitle">{item.id}</div></td>
                  <td className="description-cell">{item.descricao || '-'}</td>
                  <td>{item.funcionalidade}</td>
                  <td>{item.comportamento}</td>
                  <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  <td>{item.campos.length}</td>
                  <td>
                    <div className="row-action-group" onClick={(event) => event.stopPropagation()}>
                      <button title="Pré-visualizar" onClick={() => { setSelectedScreen(item); setActiveTabId(item.tabs[0]?.id || 'principal'); setIsPreviewOpen(true); }}><Eye size={16} /></button>
                      <button title="Editar tela" onClick={() => openEditScreen(item)}><Edit3 size={16} /></button>
                      <button title="Copiar tela" onClick={() => openCopyScreen(item)}><Copy size={16} /></button>
                      <button title="Excluir tela" onClick={() => deleteScreen(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop screen-builder-backdrop">
          <div className="screen-builder-modal jira-like-builder v25-5">
            <div className="cadastro-modal-header">
              <strong>{editingId ? 'Editar tela' : 'Nova tela'}</strong>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={18} /></button>
            </div>

            <div className="jira-builder-content">
              <main className="jira-builder-canvas">
                <section className="builder-config-strip">
                  <label>
                    <FieldLabel required info="Nome usado para identificar a tela configurável.">Tela</FieldLabel>
                    <input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Nome da tela" />
                    {errors.nome && <small className="field-error">{errors.nome}</small>}
                  </label>
                  <label>
                    <FieldLabel required info="Funcionalidade onde esta tela será usada.">Funcionalidade</FieldLabel>
                    <select value={form.funcionalidade} onChange={(event) => updateForm('funcionalidade', event.target.value)}>
                      {funcionalidades.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <FieldLabel info="Define se a tela abre direto ou aparece como atalho.">Exibição</FieldLabel>
                    <select value={form.comportamento} onChange={(event) => updateForm('comportamento', event.target.value as DisplayBehavior)}>
                      {displayBehaviors.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <FieldLabel required info="Define se a tela pode ser usada na operação.">Status</FieldLabel>
                    <select value={form.status} onChange={(event) => updateForm('status', event.target.value as ScreenStatus)}>
                      {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                </section>

                <section className="visual-tabs-bar jira-tabs v25-5-tabs">
                  {form.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={activeTabId === tab.id ? 'active' : ''}
                      onClick={() => setActiveTabId(tab.id)}
                      type="button"
                    >
                      <input
                        value={tab.nome}
                        onFocus={() => setActiveTabId(tab.id)}
                        onClick={() => setActiveTabId(tab.id)}
                        onChange={(event) => updateTab(tab.id, { nome: event.target.value })}
                      />
                    </button>
                  ))}
                  <button type="button" className="tab-plus-button" onClick={addTab}>+</button>

                  <div className="tab-toolbar-inline">
                    <label>Visual
                      <select value={activeTab.modo} onChange={(event) => updateTab(activeTab.id, { modo: event.target.value as TabMode })}>
                        <option>Campos</option>
                        <option>Lista</option>
                      </select>
                    </label>
                    <button className="secondary-btn" type="button" onClick={addSection}><Plus size={16} /> Seção</button>
                    <button className="secondary-btn" type="button" onClick={() => setIsPreviewOpen(true)}><Eye size={16} /> Pré-visualizar</button>
                  </div>
                </section>

                <section className="jira-mini-screen">
                  <div className="jira-mini-main sectioned-builder">
                    {activeSections.map((section) => {
                      const fields = form.campos.filter((field) => field.visivel && field.area === 'Principal' && field.sectionId === section.id);

                      return (
                        <section
                          key={section.id}
                          className={`screen-section-block columns-${section.colunas}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop('Principal', section.id)}
                        >
                          <div className="screen-section-header">
                            <LayoutTemplate size={17} />
                            <input value={section.nome} onChange={(event) => updateSection(section.id, { nome: event.target.value })} />
                            <select value={section.colunas} onChange={(event) => updateSection(section.id, { colunas: Number(event.target.value) as 1 | 2 | 3 })}>
                              <option value={1}>1 coluna</option>
                              <option value={2}>2 colunas</option>
                              <option value={3}>3 colunas</option>
                            </select>
                          </div>

                          {activeTab.modo === 'Lista' ? (
                            <div className="board-preview full">
                              <div className="board-group-title"><Table2 size={18} /> {section.nome || 'Grupo'}</div>
                              <table>
                                <thead>
                                  <tr>
                                    {fields.map((field) => <th key={field.instanceId}>{field.campo}</th>)}
                                    {fields.length === 0 && <th>Solte campos aqui</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {fields.map((field) => <td key={field.instanceId}>{field.tipo}</td>)}
                                    {fields.length === 0 && <td>Prévia da linha</td>}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="mini-field-grid">
                              {fields.map((field) => (
                                <div
                                  key={field.instanceId}
                                  className={`mini-field-card ${widthClass(field.largura)} ${expandedFieldId === field.instanceId ? 'expanded' : ''}`}
                                  draggable
                                  onDragStart={() => handleFieldDragStart(field.instanceId)}
                                  onDragEnd={() => handleFieldDragEnd(field.instanceId)}
                                >
                                  <div className="mini-field-top">
                                    <GripVertical size={15} />
                                    <strong>{field.campo}</strong>
                                    <button type="button" onClick={() => setExpandedFieldId(expandedFieldId === field.instanceId ? null : field.instanceId)}><Settings2 size={15} /></button>
                                  </div>
                                  {renderPreviewInput(field.tipo)}

                                  {expandedFieldId === field.instanceId && (
                                    <div className="inline-field-config">
                                      <label>Largura
                                        <select value={field.largura} onChange={(event) => updateScreenField(field.instanceId, 'largura', event.target.value as FieldWidth)}>
                                          <option>Inteira</option>
                                          <option>Metade</option>
                                          <option>Terço</option>
                                        </select>
                                      </label>
                                      <label>Valor padrão
                                        <input value={field.valorPadrao} onChange={(event) => updateScreenField(field.instanceId, 'valorPadrao', event.target.value)} placeholder="Valor padrão" />
                                      </label>
                                      <label><input type="checkbox" checked={field.obrigatorio} onChange={(event) => updateScreenField(field.instanceId, 'obrigatorio', event.target.checked)} /> Obrigatório</label>
                                      <label><input type="checkbox" checked={!field.ocultoUsuario} onChange={(event) => updateScreenField(field.instanceId, 'ocultoUsuario', !event.target.checked)} /> Exibir para usuário</label>
                                      <label><input type="checkbox" checked={field.visivel} onChange={(event) => updateScreenField(field.instanceId, 'visivel', event.target.checked)} /> Visível na tela</label>
                                      <button className="danger-inline-btn" type="button" onClick={() => removeField(field.instanceId)}>Remover campo</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {fields.length === 0 && <div className="drop-empty">Arraste campos para esta seção.</div>}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>

                  <aside
                    className="jira-mini-context global-context"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop('Contexto')}
                  >
                    <strong>Campos de contexto</strong>
                    <p>Contexto único da tela, válido para todas as abas.</p>
                    {fieldsInGlobalContext.map((field) => (
                      <div
                        className="mini-context-field"
                        key={field.instanceId}
                        draggable
                        onDragStart={() => handleFieldDragStart(field.instanceId)}
                        onDragEnd={() => handleFieldDragEnd(field.instanceId)}
                      >
                        <GripVertical size={14} />
                        <span>{field.campo}</span>
                        <small>{field.tipo}</small>
                      </div>
                    ))}
                    {fieldsInGlobalContext.length === 0 && <p className="empty-note">Arraste campos para o contexto.</p>}
                  </aside>
                </section>
              </main>

              <aside className="jira-field-sidebar v25-5-sidebar">
                <section className="field-sidebar-section">
                  <h3>Campos</h3>
                  <div className="smart-search builder-field-search">
                    <Search size={17} />
                    <input value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} placeholder="Digite para pesquisar todos os campos" />
                  </div>

                  <div className="available-field-list jira-field-list no-origin">
                    {availableToAdd.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        draggable
                        onDragStart={() => setDraggedFieldId(field.id)}
                        onDragEnd={() => setDraggedFieldId(null)}
                        onClick={() => addField(field.id, 'Principal', activeSections[0]?.id)}
                      >
                        <Plus size={15} />
                        <span>{field.campo}</span>
                        <strong>{field.tipo}</strong>
                      </button>
                    ))}
                    {availableToAdd.length === 0 && <p className="empty-note">Nenhum campo disponível.</p>}
                  </div>
                </section>
              </aside>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="secondary-btn" onClick={() => setIsPreviewOpen(true)}><Eye size={16} /> Pré-visualizar</button>
              <button className="primary" onClick={saveScreen}>Salvar tela</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && previewScreen && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="form-preview-modal wide">
            <div className="cadastro-modal-header">
              <div><strong>Pré-visualização</strong><p>{previewScreen.nome || 'Tela sem nome'} • {previewScreen.funcionalidade}</p></div>
              <button className="icon-btn" onClick={() => setIsPreviewOpen(false)}><X size={18} /></button>
            </div>
            <div className="form-preview-body">
              <section className="preview-card">
                <div className="visual-tabs-bar preview v25-5-tabs">
                  {previewScreen.tabs.map((tab) => <button key={tab.id} type="button" className={activeTabId === tab.id ? 'active' : ''} onClick={() => setActiveTabId(tab.id)}>{tab.nome}</button>)}
                </div>
                <div className="jira-mini-screen preview">
                  <div className="jira-mini-main sectioned-builder">
                    {previewSections.map((section) => {
                      const fields = previewScreen.campos.filter((field) => field.visivel && field.area === 'Principal' && field.sectionId === section.id && !field.ocultoUsuario);
                      return (
                        <section className={`screen-section-block columns-${section.colunas}`} key={section.id}>
                          <div className="screen-section-header preview-only">
                            <LayoutTemplate size={17} />
                            <strong>{section.nome}</strong>
                          </div>
                          <div className="mini-field-grid">
                            {fields.map((field) => (
                              <div key={field.instanceId} className={`mini-field-card ${widthClass(field.largura)}`}>
                                <div className="mini-field-top"><strong>{field.campo} {field.obrigatorio && <RequiredMark />}</strong></div>
                                {renderPreviewInput(field.tipo)}
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                  <aside className="jira-mini-context global-context">
                    <strong>Contexto</strong>
                    {previewScreen.campos.filter((field) => field.visivel && field.area === 'Contexto' && !field.ocultoUsuario).map((field) => (
                      <div className="mini-context-field" key={field.instanceId}><span>{field.campo}</span><small>{field.tipo}</small></div>
                    ))}
                  </aside>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
