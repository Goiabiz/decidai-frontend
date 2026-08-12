import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
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
import { showAppToast } from '../../lib/appToast';
import { formatDate } from '../../lib/formatDate';
import { useSession } from '../../contexts/SessionContext';
import { logAudit } from '../../services/auditLog';
import { listCamposContexto } from '../../services/camposContexto';
import { createTela, listTelas, softDeleteTela, updateTela, type TelaCampoPosicionado, type TelaComportamento, type TelaFieldArea, type TelaFieldWidth, type TelaInput, type TelaRecord, type TelaStatus, type TelaTabModo } from '../../services/telas';

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
  modo: TelaTabModo;
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
  area: TelaFieldArea;
  tabId: string;
  sectionId: string;
  largura: TelaFieldWidth;
  valorPadrao: string;
  ocultoUsuario: boolean;
  ordem: number;
};

type ScreenRecord = {
  id: string;
  nome: string;
  funcionalidade: string;
  status: TelaStatus;
  comportamento: TelaComportamento;
  descricao: string;
  tabs: ScreenTab[];
  sections: ScreenSection[];
  campos: ScreenField[];
  agente: boolean;
  atualizadoEm: string;
};

const statuses: TelaStatus[] = ['Ativa', 'Inativa', 'Rascunho'];
const displayBehaviors: TelaComportamento[] = ['Exibir ao abrir funcionalidade', 'Exibir como atalho'];

const systemFields: AvailableField[] = [
  { id: 'std-codigo', campo: 'Código', tipo: 'Texto curto', descricao: 'Identificador do registro.', origem: 'Padrão do sistema' },
  { id: 'std-criado-em', campo: 'Criado em', tipo: 'Data e hora', descricao: 'Data e hora de criação.', origem: 'Padrão do sistema' },
  { id: 'std-criado-por', campo: 'Criado por', tipo: 'Texto curto', descricao: 'Usuário que criou o registro.', origem: 'Padrão do sistema' },
  { id: 'std-descricao', campo: 'Descrição', tipo: 'Parágrafo / Rich text', descricao: 'Descrição principal do registro.', origem: 'Padrão do sistema' },
  { id: 'std-responsavel', campo: 'Responsável', tipo: 'Texto curto', descricao: 'Responsável pelo registro.', origem: 'Padrão do sistema' },
  { id: 'std-status', campo: 'Status', tipo: 'Lista seleção única', descricao: 'Situação operacional do registro.', origem: 'Padrão do sistema' },
  { id: 'std-titulo', campo: 'Título', tipo: 'Texto curto', descricao: 'Título principal do registro.', origem: 'Padrão do sistema' },
];

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

const cloneScreen = (screen: ScreenRecord): ScreenRecord => ({
  ...screen,
  tabs: screen.tabs.map((tab) => ({ ...tab })),
  sections: screen.sections.map((section) => ({ ...section })),
  campos: screen.campos.map((field) => ({ ...field })),
});

function telaToScreenRecord(tela: TelaRecord, allFields: AvailableField[]): ScreenRecord {
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  return {
    id: tela.id,
    nome: tela.nome,
    funcionalidade: tela.funcionalidade,
    status: tela.status,
    comportamento: tela.comportamento,
    descricao: tela.descricao,
    agente: tela.agente,
    atualizadoEm: tela.atualizadoEm,
    tabs: tela.tabs.map((tab) => ({ id: tab.id, nome: tab.nome, modo: tab.modo })),
    sections: tela.sections.map((section) => ({ id: section.id, tabId: section.tabId, nome: section.nome, colunas: section.colunas, ordem: section.ordem })),
    campos: tela.campos.map((campo) => {
      const refId = campo.campoContextoId || campo.campoSistemaChave || '';
      const base = fieldById.get(refId);
      return {
        id: refId,
        campo: base?.campo || '(campo removido)',
        tipo: base?.tipo || '-',
        descricao: base?.descricao || '',
        origem: campo.campoSistemaChave ? 'Padrão do sistema' : 'Personalizado',
        instanceId: campo.id,
        obrigatorio: campo.obrigatorio,
        visivel: campo.visivel,
        area: campo.area,
        tabId: campo.tabId,
        sectionId: campo.sectionId || 'contexto-global',
        largura: campo.largura,
        valorPadrao: campo.valorPadrao,
        ocultoUsuario: campo.ocultoUsuario,
        ordem: campo.ordem,
      };
    }),
  };
}

function screenToTelaInput(form: ScreenRecord): TelaInput {
  return {
    nome: form.nome,
    funcionalidade: form.funcionalidade,
    status: form.status,
    comportamento: form.comportamento,
    descricao: form.descricao,
    agente: form.agente,
    tabs: form.tabs.map((tab, index) => ({ id: tab.id, nome: tab.nome, modo: tab.modo, ordem: index + 1 })),
    sections: form.sections.map((section) => ({ id: section.id, tabId: section.tabId, nome: section.nome, colunas: section.colunas, ordem: section.ordem })),
    campos: form.campos.map((field): TelaCampoPosicionado => ({
      id: field.instanceId,
      tabId: field.tabId,
      sectionId: field.area === 'Contexto' ? null : field.sectionId,
      area: field.area,
      largura: field.largura,
      obrigatorio: field.obrigatorio,
      visivel: field.visivel,
      ocultoUsuario: field.ocultoUsuario,
      valorPadrao: field.valorPadrao,
      ordem: field.ordem,
      campoContextoId: field.origem === 'Personalizado' ? field.id : null,
      campoSistemaChave: field.origem === 'Padrão do sistema' ? field.id : null,
    })),
  };
}

const statusTone = (status: TelaStatus) => {
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

function widthClass(width: TelaFieldWidth) {
  if (width === 'Inteira') return 'span-full';
  if (width === 'Terço') return 'span-third';
  return 'span-half';
}

// ---- dnd-kit: paleta de campos disponíveis (arrasta para criar um campo novo na tela) ----
function PaletteFieldButton({ field, onAdd }: { field: AvailableField; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.id}`,
    data: { kind: 'palette', fieldId: field.id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={isDragging ? 'dragging' : ''}
      onClick={onAdd}
      {...listeners}
      {...attributes}
    >
      <Plus size={15} />
      <span>{field.campo}</span>
      <strong>{field.tipo}</strong>
    </button>
  );
}

// ---- dnd-kit: campo já posicionado na tela (arrasta pra mover entre seção/contexto, ou solta fora pra remover) ----
function FieldCard({
  field,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  field: ScreenField;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (key: keyof ScreenField, value: ScreenField[keyof ScreenField]) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${field.instanceId}`,
    data: { kind: 'field', instanceId: field.instanceId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mini-field-card ${widthClass(field.largura)} ${expanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="mini-field-top">
        <span className="drag-handle" {...listeners} {...attributes}><GripVertical size={15} /></span>
        <strong>{field.campo}</strong>
        <button type="button" onClick={onToggleExpand}><Settings2 size={15} /></button>
      </div>
      {renderPreviewInput(field.tipo)}

      {expanded && (
        <div className="inline-field-config">
          <label>Largura
            <select value={field.largura} onChange={(event) => onUpdate('largura', event.target.value as TelaFieldWidth)}>
              <option>Inteira</option>
              <option>Metade</option>
              <option>Terço</option>
            </select>
          </label>
          <label>Valor padrão
            <input value={field.valorPadrao} onChange={(event) => onUpdate('valorPadrao', event.target.value)} placeholder="Valor padrão" />
          </label>
          <label><input type="checkbox" checked={field.obrigatorio} onChange={(event) => onUpdate('obrigatorio', event.target.checked)} /> Obrigatório</label>
          <label><input type="checkbox" checked={!field.ocultoUsuario} onChange={(event) => onUpdate('ocultoUsuario', !event.target.checked)} /> Exibir para usuário</label>
          <label><input type="checkbox" checked={field.visivel} onChange={(event) => onUpdate('visivel', event.target.checked)} /> Visível na tela</label>
          <button className="danger-inline-btn" type="button" onClick={onRemove}>Remover campo</button>
        </div>
      )}
    </div>
  );
}

// ---- dnd-kit: chip de campo de contexto (mesma lógica de arraste do FieldCard, layout mais compacto) ----
function ContextFieldChip({ field }: { field: ScreenField }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${field.instanceId}`,
    data: { kind: 'field', instanceId: field.instanceId },
  });

  return (
    <div ref={setNodeRef} className={`mini-context-field ${isDragging ? 'dragging' : ''}`}>
      <span className="drag-handle" {...listeners} {...attributes}><GripVertical size={14} /></span>
      <span>{field.campo}</span>
      <small>{field.tipo}</small>
    </div>
  );
}

// ---- dnd-kit: área de soltar (seção da tela) ----
function SectionDropZone({
  section,
  children,
}: {
  section: ScreenSection;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { kind: 'section', sectionId: section.id },
  });

  return (
    <section ref={setNodeRef} className={`screen-section-block columns-${section.colunas} ${isOver ? 'drop-target-active' : ''}`}>
      {children}
    </section>
  );
}

// ---- dnd-kit: área de soltar (contexto global) ----
function ContextDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'context-drop', data: { kind: 'context' } });
  return (
    <aside ref={setNodeRef} className={`jira-mini-context global-context ${isOver ? 'drop-target-active' : ''}`}>
      {children}
    </aside>
  );
}

export function FormulariosTelas() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [customFields, setCustomFields] = useState<AvailableField[]>([]);
  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [search, setSearch] = useState('');
  const [funcionalidade, setFuncionalidade] = useState('');
  const [status, setStatus] = useState('');
  const [selectedScreen, setSelectedScreen] = useState<ScreenRecord | null>(null);
  const [form, setForm] = useState<ScreenRecord>(emptyScreen);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [activeTabId, setActiveTabId] = useState('principal');
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const allAvailableFields = useMemo(() => [...systemFields, ...customFields].sort((a, b) => a.campo.localeCompare(b.campo)), [customFields]);

  const carregar = async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    const camposResult = await listCamposContexto(clienteId);
    const fieldsFromCampos: AvailableField[] = camposResult.items
      .filter((campo) => campo.usarTela)
      .map((campo) => ({ id: campo.id, campo: campo.nome, tipo: campo.tipo, descricao: campo.descricao, origem: 'Personalizado' as const }));
    setCustomFields(fieldsFromCampos);

    const allFields = [...systemFields, ...fieldsFromCampos];
    const telasResult = await listTelas(clienteId);
    const mapped = telasResult.items.map((tela) => telaToScreenRecord(tela, allFields));
    setScreens(mapped);
    setSelectedScreen((current) => current ?? mapped[0] ?? null);
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, [clienteId]);

  const screensAtivas = screens;

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const functionalityFilter = normalizeFilterText(funcionalidade);
    const statusFilter = normalizeFilterText(status);

    return screensAtivas.filter((item) => {
      const text = normalizeFilterText([item.nome, item.funcionalidade, item.status, item.descricao, item.comportamento].join(' '));
      return (!query || text.includes(query))
        && (!functionalityFilter || normalizeFilterText(item.funcionalidade) === functionalityFilter)
        && (!statusFilter || normalizeFilterText(item.status) === statusFilter);
    });
  }, [screensAtivas, search, funcionalidade, status]);

  const availableToAdd = useMemo(() => {
    const alreadyUsed = new Set(form.campos.map((field) => field.id));
    const query = normalizeFilterText(fieldSearch);

    return allAvailableFields
      .filter((field) => {
        const text = normalizeFilterText(`${field.campo} ${field.tipo} ${field.descricao}`);
        return !alreadyUsed.has(field.id) && (!query || text.includes(query));
      })
      .sort((a, b) => a.campo.localeCompare(b.campo));
  }, [form.campos, fieldSearch, allAvailableFields]);

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
    const tab = { id: `tab-${Date.now()}`, nome: `Aba ${form.tabs.length + 1}`, modo: 'Campos' as TelaTabModo };
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

  const addField = (fieldId: string, targetArea: TelaFieldArea = 'Principal', sectionId = activeSections[0]?.id || 'sec-principal') => {
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

  const moveExistingField = (instanceId: string, area: TelaFieldArea, sectionId = activeSections[0]?.id || 'sec-principal') => {
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

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { kind: 'palette' | 'field'; fieldId?: string; instanceId?: string } | undefined;
    if (!data) return;
    if (data.kind === 'palette') {
      setActiveDragLabel(allAvailableFields.find((field) => field.id === data.fieldId)?.campo || null);
    } else {
      setActiveDragLabel(form.campos.find((field) => field.instanceId === data.instanceId)?.campo || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLabel(null);
    const { active, over } = event;
    const activeData = active.data.current as { kind: 'palette' | 'field'; fieldId?: string; instanceId?: string } | undefined;
    if (!activeData) return;

    if (!over) {
      // Soltou fora de qualquer área reconhecida: se era um campo já posicionado, remove sem confirmação
      // (mesmo comportamento do protótipo nativo original).
      if (activeData.kind === 'field' && activeData.instanceId) {
        void removeField(activeData.instanceId, false);
      }
      return;
    }

    const overData = over.data.current as { kind: 'section' | 'context'; sectionId?: string } | undefined;
    if (!overData) return;

    const targetArea: TelaFieldArea = overData.kind === 'context' ? 'Contexto' : 'Principal';
    const targetSectionId = overData.kind === 'section' ? overData.sectionId : undefined;

    if (activeData.kind === 'palette' && activeData.fieldId) {
      addField(activeData.fieldId, targetArea, targetSectionId);
    } else if (activeData.kind === 'field' && activeData.instanceId) {
      moveExistingField(activeData.instanceId, targetArea, targetSectionId);
    }
  };

  const saveScreen = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome da tela é obrigatório.';
    if (!form.funcionalidade.trim()) nextErrors.funcionalidade = 'Funcionalidade é obrigatória.';
    if (!form.status.trim()) nextErrors.status = 'Status é obrigatório.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }

    const input = screenToTelaInput(form);
    setSalvando(true);
    try {
      if (editingId) {
        await updateTela(editingId, clienteId, input);
        showAppToast('Tela atualizada.', 'success');
      } else {
        await createTela(clienteId, input);
        showAppToast('Tela criada.', 'success');
      }
      await carregar();
      setForm(cloneScreen(emptyScreen));
      setEditingId(null);
      setActiveTabId('principal');
      setExpandedFieldId(null);
      setIsFormOpen(false);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a tela.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const deleteScreen = async (id: string) => {
    const item = screens.find((screen) => screen.id === id);
    const confirmed = await confirmApp({
      title: 'Excluir tela',
      description: `Excluir a tela "${item?.nome || id}"? O registro fica oculto, não é apagado de verdade.`,
      confirmLabel: 'Excluir tela',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await softDeleteTela(id);
      await carregar();
      showAppToast('Tela excluída.', 'info');

      void logAudit({
        usuarioNome: session?.user.displayName || 'Desconhecido',
        usuarioEmail: session?.user.email || '',
        modulo: 'formularios_telas',
        funcionalidade: 'exclusao_tela',
        operacao: 'delete',
        registroId: id,
        dadosAntes: item,
        observacao: `Tela "${item?.nome || id}" excluída (soft delete).`,
      });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir a tela.', 'error');
    }
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
          <span className="small-muted">{loading ? '...' : `${filtered.length} de ${screensAtivas.length} registros`}</span>
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
                  <td><strong>{item.nome}</strong>{item.atualizadoEm && <div className="table-subtitle">Atualizado em {formatDate(item.atualizadoEm)}</div>}</td>
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
                      <button title="Excluir tela" onClick={() => void deleteScreen(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-note">Nenhuma tela cadastrada ainda.</td></tr>
              )}
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

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="jira-builder-content">
                <main className="jira-builder-canvas">
                  <section className="builder-config-strip">
                    <label>
                      <FieldLabel required info="Nome desta tela configurável.">Tela</FieldLabel>
                      <input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Nome da tela" />
                      {errors.nome && <small className="field-error">{errors.nome}</small>}
                    </label>
                    <label>
                      <FieldLabel required info="A qual funcionalidade do sistema esta tela pertence.">Funcionalidade</FieldLabel>
                      <select value={form.funcionalidade} onChange={(event) => updateForm('funcionalidade', event.target.value)}>
                        {funcionalidades.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      <FieldLabel info="Define se a tela abre direto ou aparece como atalho.">Exibição</FieldLabel>
                      <select value={form.comportamento} onChange={(event) => updateForm('comportamento', event.target.value as TelaComportamento)}>
                        {displayBehaviors.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      <FieldLabel required info="Define se a tela pode ser usada na operação.">Status</FieldLabel>
                      <select value={form.status} onChange={(event) => updateForm('status', event.target.value as TelaStatus)}>
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
                        <select value={activeTab.modo} onChange={(event) => updateTab(activeTab.id, { modo: event.target.value as TelaTabModo })}>
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
                          <SectionDropZone key={section.id} section={section}>
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
                                  <FieldCard
                                    key={field.instanceId}
                                    field={field}
                                    expanded={expandedFieldId === field.instanceId}
                                    onToggleExpand={() => setExpandedFieldId(expandedFieldId === field.instanceId ? null : field.instanceId)}
                                    onUpdate={(key, value) => updateScreenField(field.instanceId, key, value)}
                                    onRemove={() => removeField(field.instanceId)}
                                  />
                                ))}
                                {fields.length === 0 && <div className="drop-empty">Arraste campos para esta seção.</div>}
                              </div>
                            )}
                          </SectionDropZone>
                        );
                      })}
                    </div>

                    <ContextDropZone>
                      <strong>Campos de contexto</strong>
                      <p>Contexto único da tela, válido para todas as abas.</p>
                      {fieldsInGlobalContext.map((field) => (
                        <ContextFieldChip key={field.instanceId} field={field} />
                      ))}
                      {fieldsInGlobalContext.length === 0 && <p className="empty-note">Arraste campos para o contexto.</p>}
                    </ContextDropZone>
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
                        <PaletteFieldButton
                          key={field.id}
                          field={field}
                          onAdd={() => addField(field.id, 'Principal', activeSections[0]?.id)}
                        />
                      ))}
                      {availableToAdd.length === 0 && <p className="empty-note">Nenhum campo disponível.</p>}
                    </div>
                  </section>
                </aside>
              </div>

              <DragOverlay>
                {activeDragLabel ? <div className="mini-field-drag-preview">{activeDragLabel}</div> : null}
              </DragOverlay>
            </DndContext>

            <div className="cadastro-modal-footer">
              <button onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="secondary-btn" onClick={() => setIsPreviewOpen(true)}><Eye size={16} /> Pré-visualizar</button>
              <button className="primary" disabled={salvando} onClick={() => void saveScreen()}>{salvando ? 'Salvando...' : 'Salvar tela'}</button>
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

export default FormulariosTelas;
