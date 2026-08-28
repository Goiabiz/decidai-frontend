import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  Home,
  Info,
  KeyRound,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Upload,
  User,
  VenusAndMars,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppToast } from '../../lib/appToast';
import { confirmApp } from '../../lib/appConfirm';
import { formatDate } from '../../lib/formatDate';
import { formatCep, lookupCep } from '../../lib/viaCep';
import { ExportAction, type ExportFormat } from '../../components/ExportAction';
import { useSession } from '../../contexts/SessionContext';
import { logAudit } from '../../services/auditLog';
import { uploadAvatar } from '../../services/storage';
import {
  approveAccessRequest,
  inviteUsuarioCliente,
  listPerfisAcesso,
  listUsuariosClienteFull,
  resendUsuarioClienteInvite,
  setUsuarioClienteStatus,
  softDeleteUsuarioCliente,
  updateUsuarioCliente,
  type PerfilAcesso,
  type UsuarioClienteFull,
  type UsuarioClienteInput,
} from '../../services/auth';
import type { PageProps } from '../../App';
import type { PanelDetail } from '../../components/RightPanel';

type UserStatus = 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente' | 'Solicitação';

type CountryCode = {
  pais: string;
  code: string;
  iso: string;
};

type PhoneRecord = {
  id: string;
  tipo: 'Celular' | 'Fixo' | 'Comercial';
  pais: string;
  numero: string;
};

type EnderecoState = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const emptyEndereco: EnderecoState = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

function formatEndereco(endereco: EnderecoState) {
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(', ');
  const linha2 = [endereco.bairro, [endereco.cidade, endereco.uf].filter(Boolean).join('/')].filter(Boolean).join(' - ');
  return [linha1, endereco.complemento, linha2, endereco.cep].filter(Boolean).join(' - ');
}

type UserRecord = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  telefoneIso: string;
  perfilAcessoId: string;
  perfilNome: string;
  status: UserStatus;
  unidade: string;
  cargo: string;
  genero: string;
  nascimento: string;
  endereco: EnderecoState;
  foto: string;
};

type UserFormState = {
  foto: string;
  fotoFile: File | null;
  nome: string;
  cpf: string;
  email: string;
  genero: string;
  nascimento: string;
  endereco: EnderecoState;
  perfilAcessoId: string;
  status: UserStatus;
  unidade: string;
  cargo: string;
  phones: PhoneRecord[];
};

const COUNTRY_CODES: CountryCode[] = [
  { pais: 'África do Sul', code: '+27', iso: 'za' },
  { pais: 'Alemanha', code: '+49', iso: 'de' },
  { pais: 'Angola', code: '+244', iso: 'ao' },
  { pais: 'Argentina', code: '+54', iso: 'ar' },
  { pais: 'Austrália', code: '+61', iso: 'au' },
  { pais: 'Bolívia', code: '+591', iso: 'bo' },
  { pais: 'Brasil', code: '+55', iso: 'br' },
  { pais: 'Canadá', code: '+1', iso: 'ca' },
  { pais: 'Chile', code: '+56', iso: 'cl' },
  { pais: 'China', code: '+86', iso: 'cn' },
  { pais: 'Colômbia', code: '+57', iso: 'co' },
  { pais: 'Coreia do Sul', code: '+82', iso: 'kr' },
  { pais: 'Costa Rica', code: '+506', iso: 'cr' },
  { pais: 'Cuba', code: '+53', iso: 'cu' },
  { pais: 'Equador', code: '+593', iso: 'ec' },
  { pais: 'Espanha', code: '+34', iso: 'es' },
  { pais: 'Estados Unidos', code: '+1', iso: 'us' },
  { pais: 'França', code: '+33', iso: 'fr' },
  { pais: 'Índia', code: '+91', iso: 'in' },
  { pais: 'Irlanda', code: '+353', iso: 'ie' },
  { pais: 'Itália', code: '+39', iso: 'it' },
  { pais: 'Japão', code: '+81', iso: 'jp' },
  { pais: 'México', code: '+52', iso: 'mx' },
  { pais: 'Moçambique', code: '+258', iso: 'mz' },
  { pais: 'Panamá', code: '+507', iso: 'pa' },
  { pais: 'Paraguai', code: '+595', iso: 'py' },
  { pais: 'Peru', code: '+51', iso: 'pe' },
  { pais: 'Portugal', code: '+351', iso: 'pt' },
  { pais: 'Reino Unido', code: '+44', iso: 'gb' },
  { pais: 'República Dominicana', code: '+1', iso: 'do' },
  { pais: 'Uruguai', code: '+598', iso: 'uy' },
  { pais: 'Venezuela', code: '+58', iso: 've' },
];

const emptyForm: UserFormState = {
  foto: '',
  fotoFile: null,
  nome: '',
  cpf: '',
  email: '',
  genero: '',
  nascimento: '',
  endereco: emptyEndereco,
  perfilAcessoId: '',
  status: 'Ativo',
  unidade: '',
  cargo: '',
  phones: [{ id: 'phone-1', tipo: 'Celular', pais: 'br', numero: '' }],
};

const statusList: UserStatus[] = ['Ativo', 'Bloqueado', 'Inativo', 'Pendente', 'Solicitação'];
const generos = ['Feminino', 'Masculino'];

const statusTone = (status: UserStatus) => {
  if (status === 'Ativo') return 'green';
  if (status === 'Pendente') return 'orange';
  if (status === 'Bloqueado') return 'red';
  if (status === 'Solicitação') return 'purple';
  return 'blue';
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const isValidPhone = (value: string) => {
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 11;
};

const isValidCpf = (value: string) => {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (const digit of base) {
      total += Number(digit) * factor;
      factor -= 1;
    }

    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcDigit(cpf.slice(0, 9), 10) === Number(cpf[9]) && calcDigit(cpf.slice(0, 10), 11) === Number(cpf[10]);
};

/** Busca por ISO do país, não pelo código de discagem — vários países dividem o mesmo código (+1 = Canadá/EUA/Rep. Dominicana). */
const getCountry = (iso: string) => COUNTRY_CODES.find((item) => item.iso === iso) || COUNTRY_CODES[6];

const countryPhoneLabel = (iso: string) => {
  const country = getCountry(iso);
  return `${country.pais} ${country.code}`;
};

const formatTelefoneFull = (iso: string, numero: string) => `${countryPhoneLabel(iso)} ${numero}`;

/** Telefone compacto pros Detalhes: só o número pra Brasil, bandeira + número pros demais países. */
function formatTelefoneCompact(telefone: string, iso: string) {
  const label = countryPhoneLabel(iso);
  const numero = telefone.startsWith(label) ? telefone.slice(label.length).trim() : telefone;
  if (iso === 'br') return numero;
  return <><FlagIcon iso={iso} /> {numero}</>;
}

function mapUsuarioToRecord(usuario: UsuarioClienteFull): UserRecord {
  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    email: usuario.email,
    telefone: usuario.telefone,
    telefoneIso: usuario.telefoneIso,
    perfilAcessoId: usuario.perfilAcessoId || '',
    perfilNome: usuario.perfilNome || '-',
    status: (usuario.status as UserStatus) || 'Ativo',
    unidade: usuario.unidade,
    cargo: usuario.cargo,
    genero: usuario.sexo || 'Não informado',
    nascimento: usuario.nascimento,
    endereco: {
      cep: usuario.cep,
      logradouro: usuario.logradouro,
      numero: usuario.numero,
      complemento: usuario.complemento,
      bairro: usuario.bairro,
      cidade: usuario.cidade,
      uf: usuario.uf,
    },
    foto: usuario.fotoUrl,
  };
}

const buildDetail = (usuario: UserRecord): PanelDetail => ({
  title: usuario.nome,
  subtitle: usuario.email,
  badge: usuario.status,
  badgeTone: usuario.status,
  description: 'Usuário cadastrado para acesso operacional ao ambiente.',
  meta: [
    { label: 'Telefone', value: usuario.telefone },
    { label: 'Perfil', value: usuario.perfilNome },
    { label: 'Unidade', value: usuario.unidade || '-' },
    { label: 'Cargo', value: usuario.cargo },
    { label: 'Sexo', value: usuario.genero },
    { label: 'Nascimento', value: usuario.nascimento ? formatDate(usuario.nascimento) : '-' },
    { label: 'Endereço', value: formatEndereco(usuario.endereco) || '-' },
  ],
  actions: ['Editar usuário', 'Gerenciar permissões', 'Enviar/Reenviar convite', 'Bloquear acesso'],
});

function InfoTip({ text }: { text: string }) {
  return <span className="field-info-tip" data-tooltip={text}><Info size={14} /></span>;
}

function RequiredMark() {
  return <em className="required-mark">*</em>;
}

function FieldLabel({ children, info, required }: { children: React.ReactNode; info: string; required?: boolean }) {
  return <span className="form-label-text">{children} {required && <RequiredMark />} <InfoTip text={info} /></span>;
}

function FlagIcon({ iso }: { iso: string }) {
  return <img className="country-flag-img" src={`https://flagcdn.com/w20/${iso}.png`} alt="" loading="lazy" />;
}

function phoneIcon(tipo: PhoneRecord['tipo']) {
  if (tipo === 'Comercial') return <Briefcase size={17} />;
  if (tipo === 'Fixo') return <Home size={17} />;
  return <Smartphone size={17} />;
}

function CountryPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = getCountry(value);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className="country-picker" ref={ref}>
      <button type="button" className="country-picker-button" onClick={() => setIsOpen((current) => !current)}>
        <FlagIcon iso={selected.iso} />
        <span>{selected.pais} {selected.code}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="country-picker-menu">
          {COUNTRY_CODES.map((item) => (
            <button
              type="button"
              key={item.iso}
              className={item.iso === selected.iso ? 'active' : ''}
              onClick={() => {
                onChange(item.iso);
                setIsOpen(false);
              }}
            >
              <FlagIcon iso={item.iso} />
              <span>{item.pais}</span>
              <strong>{item.code}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Usuarios({ onSelectDetail, onOpenDetail }: PageProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [usuarios, setUsuarios] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState<PerfilAcesso[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approvingUser, setApprovingUser] = useState<UserRecord | null>(null);
  const [approvePerfilId, setApprovePerfilId] = useState('');
  const [approving, setApproving] = useState(false);

  const carregar = async () => {
    if (!clienteId) { setUsuarios([]); setLoading(false); return; }
    setLoading(true);
    try {
      const items = await listUsuariosClienteFull(clienteId);
      const mapped = items.map(mapUsuarioToRecord);
      setUsuarios(mapped);
      setSelectedUser((current) => current ? mapped.find((item) => item.id === current.id) ?? mapped[0] ?? null : mapped[0] ?? null);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar os usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, [clienteId]);

  useEffect(() => {
    if (!clienteId) { setPerfisDisponiveis([]); return; }
    listPerfisAcesso(clienteId).then(setPerfisDisponiveis).catch(() => setPerfisDisponiveis([]));
  }, [clienteId]);

  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('mousedown', closeMenu);
    return () => window.removeEventListener('mousedown', closeMenu);
  }, [openMenuId]);

  useEffect(() => {
    if (!window.sessionStorage.getItem('radar-sus-open-new-user')) return;
    window.sessionStorage.removeItem('radar-sus-open-new-user');
    setEditingUserId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }, []);

  useEffect(() => {
    if (!window.sessionStorage.getItem('radar-sus-open-import-users')) return;
    window.sessionStorage.removeItem('radar-sus-open-import-users');
    setIsImportOpen(true);
  }, []);

  const filteredUsuarios = useMemo(() => {
    const query = normalizeFilterText(search);
    const statusFilter = normalizeFilterText(status);
    const perfilFilterNorm = normalizeFilterText(perfilFiltro);

    return usuarios.filter((usuario) => {
      const text = normalizeFilterText([
        usuario.nome,
        usuario.cpf,
        usuario.email,
        usuario.telefone,
        usuario.perfilNome,
        usuario.status,
        usuario.unidade,
        usuario.cargo,
      ].join(' '));

      return (!query || text.includes(query))
        && (!statusFilter || normalizeFilterText(usuario.status) === statusFilter)
        && (!perfilFilterNorm || usuario.perfilAcessoId === perfilFiltro);
    });
  }, [usuarios, search, status, perfilFiltro]);

  const updateForm = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
  };

  const updateEndereco = <K extends keyof EnderecoState>(key: K, value: EnderecoState[K]) => {
    setForm((current) => ({ ...current, endereco: { ...current.endereco, [key]: value } }));
  };

  const searchCepUsuario = async () => {
    if (!form.endereco.cep.trim()) {
      setErrors((current) => ({ ...current, cep: 'Informe um CEP para buscar o endereço.' }));
      return;
    }

    setCepLoading(true);
    const address = await lookupCep(form.endereco.cep);
    setCepLoading(false);

    if (!address) {
      setErrors((current) => ({ ...current, cep: 'CEP não encontrado.' }));
      return;
    }

    setForm((current) => ({
      ...current,
      endereco: { ...current.endereco, logradouro: address.logradouro, bairro: address.bairro, cidade: address.cidade, uf: address.uf },
    }));
    setErrors((current) => ({ ...current, cep: '' }));
  };

  const updatePhone = (id: string, field: keyof PhoneRecord, value: string) => {
    setForm((current) => ({
      ...current,
      phones: current.phones.map((phone) => phone.id === id ? { ...phone, [field]: value } : phone),
    }));
    setErrors((current) => ({ ...current, telefone: '' }));
  };

  const addPhone = () => {
    setForm((current) => ({
      ...current,
      phones: [...current.phones, { id: `phone-${Date.now()}`, tipo: 'Fixo', pais: 'br', numero: '' }],
    }));
  };

  const removePhone = (id: string) => {
    setForm((current) => ({
      ...current,
      phones: current.phones.length === 1 ? current.phones : current.phones.filter((phone) => phone.id !== id),
    }));
  };

  const handleSelectUser = (usuario: UserRecord) => {
    setSelectedUser(usuario);
    onSelectDetail?.(buildDetail(usuario));
  };

  const updateStatus = async (id: string, nextStatus: UserStatus) => {
    setUsuarios((current) => current.map((usuario) => usuario.id === id ? { ...usuario, status: nextStatus } : usuario));
    setSelectedUser((current) => current?.id === id ? { ...current, status: nextStatus } : current);
    try {
      await setUsuarioClienteStatus(id, nextStatus);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível atualizar o status.', 'error');
      void carregar();
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const principalPhone = form.phones[0]?.numero || '';

    if (!form.nome.trim()) nextErrors.nome = 'Nome é obrigatório.';
    if (!form.email.trim()) nextErrors.email = 'E-mail é obrigatório.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'Informe um e-mail válido.';

    if (!principalPhone.trim()) nextErrors.telefone = 'Telefone é obrigatório.';
    else if (!isValidPhone(principalPhone)) nextErrors.telefone = 'Informe um telefone válido.';

    if (!form.perfilAcessoId) nextErrors.perfil = 'Perfil é obrigatório.';
    if (form.cpf.trim() && !isValidCpf(form.cpf)) nextErrors.cpf = 'CPF inválido.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openEditModal = (usuario: UserRecord) => {
    setEditingUserId(usuario.id);
    setForm({
      foto: usuario.foto,
      fotoFile: null,
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
      genero: usuario.genero === 'Não informado' ? '' : usuario.genero,
      nascimento: usuario.nascimento,
      endereco: usuario.endereco,
      perfilAcessoId: usuario.perfilAcessoId,
      status: usuario.status,
      unidade: usuario.unidade,
      cargo: usuario.cargo,
      phones: [{ id: 'phone-1', tipo: 'Celular', pais: usuario.telefoneIso, numero: usuario.telefone.replace(countryPhoneLabel(usuario.telefoneIso), '').trim() }],
    });
    setIsFormOpen(true);
  };

  const deleteUser = async (usuario: UserRecord) => {
    const confirmed = await confirmApp({
      title: 'Excluir usuário',
      description: `Excluir o usuário "${usuario.nome}"? O registro fica oculto, não é apagado de verdade.`,
      confirmLabel: 'Excluir usuário',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await softDeleteUsuarioCliente(usuario.id);
      setUsuarios((current) => current.filter((item) => item.id !== usuario.id));
      setSelectedUser((current) => current?.id === usuario.id ? null : current);
      showAppToast('Usuário excluído.', 'success');

      void logAudit({
        usuarioNome: session?.user.displayName || 'Desconhecido',
        usuarioEmail: session?.user.email || '',
        modulo: 'usuarios',
        funcionalidade: 'exclusao_usuario',
        operacao: 'delete',
        registroId: usuario.id,
        dadosAntes: usuario,
        observacao: `Usuário "${usuario.nome}" (${usuario.email}) excluído (soft delete).`,
      });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir o usuário.', 'error');
    }
  };

  const handleSaveUser = async () => {
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }
    if (!validateForm()) return;

    setSaving(true);
    try {
      const mainPhone = form.phones[0];
      const input: UsuarioClienteInput = {
        nome: form.nome,
        email: form.email,
        cpf: onlyDigits(form.cpf) ? form.cpf : '',
        telefone: formatTelefoneFull(mainPhone.pais, mainPhone.numero),
        telefoneIso: mainPhone.pais,
        cargo: form.cargo,
        sexo: form.genero,
        nascimento: form.nascimento,
        fotoUrl: form.foto,
        cep: form.endereco.cep,
        logradouro: form.endereco.logradouro,
        numero: form.endereco.numero,
        complemento: form.endereco.complemento,
        bairro: form.endereco.bairro,
        cidade: form.endereco.cidade,
        uf: form.endereco.uf,
        unidade: form.unidade,
        perfilAcessoId: form.perfilAcessoId,
      };

      if (editingUserId) {
        if (form.fotoFile) {
          input.fotoUrl = await uploadAvatar(clienteId, editingUserId, form.fotoFile);
        }
        await updateUsuarioCliente(editingUserId, input);
        showAppToast('Usuário atualizado.', 'success');
      } else {
        const created = await inviteUsuarioCliente(clienteId, input);
        if (form.fotoFile) {
          const fotoUrl = await uploadAvatar(clienteId, created.id, form.fotoFile);
          await updateUsuarioCliente(created.id, { ...input, fotoUrl });
        }
        showAppToast(`Usuário criado. Convite real enviado para ${form.email}.`, 'success');
      }

      setForm(emptyForm);
      setEditingUserId(null);
      setIsFormOpen(false);
      await carregar();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o usuário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openApprove = (usuario: UserRecord) => {
    setApprovingUser(usuario);
    setApprovePerfilId('');
  };

  const confirmApprove = async () => {
    if (!approvingUser || !approvePerfilId) return;
    setApproving(true);
    try {
      await approveAccessRequest(approvingUser.id, approvePerfilId);
      const perfilNome = perfisDisponiveis.find((item) => item.id === approvePerfilId)?.nome || '';
      setUsuarios((current) => current.map((item) => item.id === approvingUser.id
        ? { ...item, status: 'Ativo', perfilNome }
        : item));
      setSelectedUser((current) => current?.id === approvingUser.id ? { ...current, status: 'Ativo', perfilNome } : current);
      showAppToast(`Acesso de ${approvingUser.nome} aprovado.`, 'success');
      setApprovingUser(null);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível aprovar o acesso.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const enviarConvite = async (usuario: UserRecord) => {
    try {
      await resendUsuarioClienteInvite(usuario.email);
      showAppToast(`Convite enviado para ${usuario.email}.`, 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível enviar o convite.', 'error');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const baixarModeloImportacao = () => {
    const header = 'nome;email;cpf;telefone;unidade;cargo';
    const exemplo = 'Maria Souza;maria.souza@exemplo.com;000.000.000-00;(11) 90000-0000;Unidade Central;Analista';
    const blob = new Blob([`﻿${header}\n${exemplo}\n`], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'modelo-importacao-usuarios.csv');
  };

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map((value) => value.trim());
  };

  const importarArquivo = async (file: File) => {
    if (!clienteId) return;
    if (!/\.csv$/i.test(file.name)) {
      showAppToast('Por enquanto só CSV é suportado para importação real — XLSX/XLS chegam numa fase futura.', 'warning');
      return;
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      showAppToast('Arquivo vazio ou sem linhas de dados.', 'warning');
      return;
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headerCols = parseCsvLine(lines[0], delimiter).map((value) => value.toLowerCase());
    const indexOf = (name: string) => headerCols.indexOf(name);
    const iNome = indexOf('nome');
    const iEmail = indexOf('email');
    if (iNome === -1 || iEmail === -1) {
      showAppToast('O arquivo precisa ter pelo menos as colunas "nome" e "email".', 'warning');
      return;
    }
    const iCpf = indexOf('cpf');
    const iTelefone = indexOf('telefone');
    const iUnidade = indexOf('unidade');
    const iCargo = indexOf('cargo');

    const linhasValidas: Array<{ nome: string; email: string; cpf: string; telefone: string; unidade: string; cargo: string }> = [];
    let ignorados = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i], delimiter);
      const nome = cols[iNome]?.trim();
      const email = cols[iEmail]?.trim();
      if (!nome || !email) { ignorados++; continue; }
      linhasValidas.push({
        nome,
        email,
        cpf: iCpf >= 0 ? cols[iCpf] : '',
        telefone: iTelefone >= 0 ? cols[iTelefone] : '',
        unidade: iUnidade >= 0 ? cols[iUnidade] : '',
        cargo: iCargo >= 0 ? cols[iCargo] : '',
      });
    }

    if (linhasValidas.length === 0) {
      showAppToast('Nenhuma linha válida encontrada no arquivo.', 'warning');
      return;
    }

    const confirmed = await confirmApp({
      title: 'Importar usuários',
      description: `Isso envia um convite real por e-mail para ${linhasValidas.length} pessoa(s). Confirma?`,
      confirmLabel: 'Enviar convites',
    });
    if (!confirmed) return;

    let sucesso = 0;
    for (const linha of linhasValidas) {
      try {
        await inviteUsuarioCliente(clienteId, {
          nome: linha.nome,
          email: linha.email,
          cpf: linha.cpf,
          telefone: linha.telefone ? formatTelefoneFull('br', linha.telefone) : '',
          telefoneIso: 'br',
          cargo: linha.cargo,
          sexo: '',
          nascimento: '',
          fotoUrl: '',
          cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
          unidade: linha.unidade,
          perfilAcessoId: '',
        });
        sucesso++;
      } catch {
        ignorados++;
      }
    }

    if (sucesso > 0) {
      void logAudit({
        usuarioNome: session?.user.displayName || 'Desconhecido',
        usuarioEmail: session?.user.email || '',
        modulo: 'usuarios',
        funcionalidade: 'importacao_usuarios',
        operacao: 'insert',
        observacao: `Importação em lote: ${sucesso} convite(s) enviado(s), ${ignorados} linha(s) ignorada(s).`,
      });
      await carregar();
    }

    showAppToast(
      `${sucesso} convite(s) enviado(s)${ignorados > 0 ? `, ${ignorados} linha(s) ignorada(s)` : ''}.`,
      sucesso > 0 ? 'success' : 'warning',
    );
  };

  const exportarUsuarios = async (format: ExportFormat) => {
    const headerRow = ['Nome', 'CPF', 'E-mail', 'Telefone', 'Perfil', 'Status', 'Unidade', 'Cargo'];
    const linhas = filteredUsuarios.map((usuario) => [
      usuario.nome, usuario.cpf, usuario.email, usuario.telefone, usuario.perfilNome, usuario.status, usuario.unidade, usuario.cargo,
    ]);

    if (format === 'xlsx') {
      const csv = [headerRow, ...linhas]
        .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      downloadBlob(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }), 'usuarios.csv');
    } else {
      const texto = [headerRow.join(' | '), '-'.repeat(80), ...linhas.map((row) => row.join(' | '))].join('\n');
      downloadBlob(new Blob([texto], { type: 'text/plain;charset=utf-8' }), `usuarios-${format}.txt`);
    }

    void logAudit({
      usuarioNome: session?.user.displayName || 'Desconhecido',
      usuarioEmail: session?.user.email || '',
      modulo: 'usuarios',
      funcionalidade: 'exportacao_usuarios',
      operacao: 'export',
      observacao: `Exportação de ${linhas.length} usuário(s) em formato ${format}.`,
    });
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Usuários" />
        <section className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver os usuários dele.</section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        action={(
          <div className="header-actions">
            <button className="secondary-btn" onClick={() => setIsImportOpen(true)}><Upload size={16} /> Importar</button>
            <ExportAction filename="usuarios" onExport={exportarUsuarios} />
            <button className="primary-small" onClick={() => { setEditingUserId(null); setForm(emptyForm); setIsFormOpen(true); }}><Plus size={16} /> Novo usuário</button>
          </div>
        )}
      />

      <section className="card user-functional-card">
        <div className="section-title-row">
          <h3>Cadastro de usuários</h3>
          <span className="small-muted">{loading ? '...' : `${filteredUsuarios.length} de ${usuarios.length} registros`}</span>
        </div>

        <div className="smart-filter-bar users-filter-bar">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuário, CPF, e-mail, perfil ou unidade..." />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            {statusList.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={perfilFiltro} onChange={(event) => setPerfilFiltro(event.target.value)}>
            <option value="">Todos os perfis</option>
            {perfisDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </div>

        <div className="users-layout-grid">
          <div className="users-table-wrap">
            <div className="users-table-scroll">
            <table>
              <thead>
                <tr><th>Usuário</th><th>Perfil</th><th>Unidade</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: 24 }}>Carregando...</td></tr>
                )}
                {!loading && filteredUsuarios.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate-500)', padding: 24 }}>Nenhum usuário encontrado.</td></tr>
                )}
                {!loading && filteredUsuarios.map((usuario) => {
                  const detail = buildDetail(usuario);
                  return (
                    <tr key={usuario.id} className="clickable-row" onClick={() => handleSelectUser(usuario)}>
                      <td>
                        <div className="user-row-identity">
                          <div className="user-avatar-small">
                            {usuario.foto ? <img src={usuario.foto} alt={usuario.nome} /> : usuario.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div><strong>{usuario.nome}</strong><div className="table-subtitle">{usuario.email}</div></div>
                        </div>
                      </td>
                      <td>{usuario.perfilNome}</td>
                      <td>{usuario.unidade || '-'}<div className="table-subtitle">{usuario.cargo}</div></td>
                      <td><Badge tone={statusTone(usuario.status)}>{usuario.status}</Badge></td>
                      <td>
                        <div className="row-action-group" onClick={(event) => event.stopPropagation()}>
                          {usuario.status === 'Pendente' ? (
                            <button title="Enviar convite" onClick={() => void enviarConvite(usuario)}>
                              <Mail size={16} />
                            </button>
                          ) : usuario.status === 'Solicitação' ? (
                            <button title="Aprovar solicitação" onClick={() => openApprove(usuario)}>
                              <CheckCircle2 size={16} />
                            </button>
                          ) : (
                            <span className="row-action-spacer" aria-hidden="true" />
                          )}
                          <button title="Gerenciar acesso" onClick={() => onOpenDetail?.(detail)}><KeyRound size={16} /></button>
                          {usuario.status === 'Bloqueado'
                            ? <button title="Ativar" onClick={() => void updateStatus(usuario.id, 'Ativo')}><CheckCircle2 size={16} /></button>
                            : <button title="Bloquear" onClick={() => void updateStatus(usuario.id, 'Bloqueado')}><Ban size={16} /></button>}
                          <div className="row-menu-wrap">
                            <button title="Mais ações" onClick={() => setOpenMenuId(openMenuId === usuario.id ? null : usuario.id)}><MoreHorizontal size={16} /></button>
                            {openMenuId === usuario.id && (
                              <div className="row-more-menu" onClick={(event) => event.stopPropagation()}>
                                <button onClick={() => { openEditModal(usuario); setOpenMenuId(null); }}><Edit3 size={15} /> Editar usuário</button>
                                <button className="danger" onClick={() => { void deleteUser(usuario); setOpenMenuId(null); }}><Trash2 size={15} /> Excluir usuário</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          <aside className="user-detail-inline">
            <div className="section-title-row">
              <h3>Detalhes</h3>
              {selectedUser && <Badge tone={statusTone(selectedUser.status)}>{selectedUser.status}</Badge>}
            </div>

            {selectedUser ? (
              <>
                <div className="user-profile-box">
                  <div className="user-avatar-large">
                    {selectedUser.foto ? <img src={selectedUser.foto} alt={selectedUser.nome} /> : selectedUser.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div><strong>{selectedUser.nome}</strong><span>{selectedUser.email}</span></div>
                </div>

                <div className="detail-grid compact">
                  <span>Telefone</span><strong>{formatTelefoneCompact(selectedUser.telefone, selectedUser.telefoneIso)}</strong>
                  <span>Perfil</span><strong>{selectedUser.perfilNome}</strong>
                  <span>Unidade</span><strong>{selectedUser.unidade || '-'}</strong>
                  <span>Cargo</span><strong>{selectedUser.cargo}</strong>
                  <span>Endereço</span><strong>{formatEndereco(selectedUser.endereco) || '-'}</strong>
                </div>

                <div className="panel-actions user-actions">
                  <button className="primary" onClick={() => openEditModal(selectedUser)}>Editar usuário</button>
                  <button onClick={() => onOpenDetail?.(buildDetail(selectedUser))}>Gerenciar permissões</button>
                  {selectedUser.status === 'Pendente' && (
                    <button onClick={() => void enviarConvite(selectedUser)}>Enviar convite</button>
                  )}
                  {selectedUser.status === 'Solicitação' && (
                    <button className="primary" onClick={() => openApprove(selectedUser)}>Aprovar solicitação</button>
                  )}
                  {selectedUser.status === 'Bloqueado'
                    ? <button onClick={() => void updateStatus(selectedUser.id, 'Ativo')}>Reativar acesso</button>
                    : <button className="danger" onClick={() => void updateStatus(selectedUser.id, 'Bloqueado')}>Bloquear acesso</button>}
                </div>
              </>
            ) : <p className="empty-note">Selecione um usuário para visualizar os detalhes.</p>}
          </aside>
        </div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop user-modal-backdrop">
          <div className="user-form-modal user-form-modal-v213">
            <div className="user-modal-header">
              <strong>{editingUserId ? 'Editar usuário' : 'Novo usuário'}</strong>
              <button className="icon-btn" onClick={() => { setIsFormOpen(false); setEditingUserId(null); }}><X size={18} /></button>
            </div>

            {!editingUserId && (
              <p className="section-description" style={{ padding: '0 24px' }}>
                Ao salvar, um convite real é enviado por e-mail. A pessoa só passa a existir de verdade no sistema quando clicar no link e confirmar o acesso.
              </p>
            )}

            <div className="user-modal-content">
              <aside className="user-photo-column">
                <label className="profile-photo-card">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => updateForm('foto', String(reader.result || ''));
                      reader.readAsDataURL(file);
                      updateForm('fotoFile', file);
                    }}
                  />
                  <div className="profile-photo-preview">
                    {form.foto ? <img src={form.foto} alt="Foto do usuário" /> : <Camera size={34} />}
                  </div>
                  <strong>Foto do usuário</strong>
                  <small>Clique para adicionar ou alterar a foto exibida no perfil.</small>
                </label>
              </aside>

              <div className="user-form-sections">
                <section className="user-form-section">
                  <h3>Dados pessoais</h3>
                  <div className="user-form-grid-v213">
                    <label>
                      <FieldLabel required info="Nome e sobrenome completos da pessoa.">Nome completo</FieldLabel>
                      <div className="input-with-icon"><User size={17} /><input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Informe o nome do usuário" /></div>
                      {errors.nome && <small className="field-error">{errors.nome}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Documento de identificação da pessoa (opcional). Preenchido, precisa ser um CPF válido.">CPF</FieldLabel>
                      <input
                        value={form.cpf}
                        onChange={(event) => updateForm('cpf', formatCpf(event.target.value))}
                        onBlur={() => {
                          if (form.cpf.trim() && !isValidCpf(form.cpf)) setErrors((current) => ({ ...current, cpf: 'CPF inválido.' }));
                        }}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      {errors.cpf && <small className="field-error">{errors.cpf}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Sexo da pessoa (opcional).">Sexo</FieldLabel>
                      <div className="input-with-icon"><VenusAndMars size={17} /><select value={form.genero} onChange={(event) => updateForm('genero', event.target.value)}>
                        <option value="">Selecione</option>
                        {generos.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select></div>
                    </label>
                    <label>
                      <FieldLabel info="Data de nascimento da pessoa (opcional).">Data de nascimento</FieldLabel>
                      <div className="input-with-icon"><Calendar size={17} /><input type="date" value={form.nascimento} onChange={(event) => updateForm('nascimento', event.target.value)} /></div>
                    </label>
                  </div>
                </section>

                <section className="user-form-section">
                  <h3>Contato e endereço</h3>
                  <div className="user-form-grid-v213">
                    <label>
                      <FieldLabel required info="Obrigatório. E-mail válido da pessoa — recebe o convite real de acesso.">E-mail</FieldLabel>
                      <div className="input-with-icon"><Mail size={17} /><input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="usuario@dominio.com" disabled={!!editingUserId} /></div>
                      {errors.email && <small className="field-error">{errors.email}</small>}
                    </label>
                  </div>

                  <div className="section-title-row">
                    <h3>Endereço <small className="muted">(opcional)</small></h3>
                    <button className="secondary-btn" type="button" disabled={cepLoading} onClick={() => void searchCepUsuario()}><MapPin size={15} /> {cepLoading ? 'Buscando...' : 'Buscar CEP'}</button>
                  </div>
                  <div className="user-form-grid-v213">
                    <label>
                      <FieldLabel info="CEP do endereço. Buscar preenche rua, bairro, cidade e UF automaticamente.">CEP</FieldLabel>
                      <input value={form.endereco.cep} onChange={(event) => updateEndereco('cep', formatCep(event.target.value))} placeholder="00000-000" maxLength={9} />
                      {errors.cep && <small className="field-error">{errors.cep}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Nome da rua, avenida ou logradouro.">Logradouro</FieldLabel>
                      <input value={form.endereco.logradouro} onChange={(event) => updateEndereco('logradouro', event.target.value)} placeholder="Rua, avenida, praça..." />
                    </label>
                    <label>
                      <FieldLabel info="Número do imóvel.">Número</FieldLabel>
                      <input value={form.endereco.numero} onChange={(event) => updateEndereco('numero', event.target.value)} placeholder="Número" />
                    </label>
                    <label>
                      <FieldLabel info="Complemento do endereço, quando houver.">Complemento</FieldLabel>
                      <input value={form.endereco.complemento} onChange={(event) => updateEndereco('complemento', event.target.value)} placeholder="Sala, bloco, andar..." />
                    </label>
                    <label>
                      <FieldLabel info="Bairro do endereço.">Bairro</FieldLabel>
                      <input value={form.endereco.bairro} onChange={(event) => updateEndereco('bairro', event.target.value)} placeholder="Bairro" />
                    </label>
                    <label>
                      <FieldLabel info="Cidade do endereço.">Cidade</FieldLabel>
                      <input value={form.endereco.cidade} onChange={(event) => updateEndereco('cidade', event.target.value)} placeholder="Cidade" />
                    </label>
                    <label>
                      <FieldLabel info="Estado (sigla de duas letras).">UF</FieldLabel>
                      <input value={form.endereco.uf} onChange={(event) => updateEndereco('uf', event.target.value.toUpperCase().slice(0, 2))} placeholder="UF" maxLength={2} />
                    </label>
                  </div>

                  <div className="phone-section-v213">
                    <div className="section-title-row">
                      <h3>Telefones <RequiredMark /> <InfoTip text="Informe pelo menos um telefone. O primeiro será tratado como telefone principal." /></h3>
                      <button className="secondary-btn" type="button" onClick={addPhone}><Plus size={15} /> Adicionar telefone</button>
                    </div>

                    {form.phones.map((phone) => (
                      <div className="phone-card-row phone-card-row-custom" key={phone.id}>
                        <div className="phone-type-icon">{phoneIcon(phone.tipo)}</div>
                        <select value={phone.tipo} onChange={(event) => updatePhone(phone.id, 'tipo', event.target.value as PhoneRecord['tipo'])}>
                          <option>Celular</option>
                          <option>Fixo</option>
                          <option>Comercial</option>
                        </select>
                        <CountryPicker value={phone.pais} onChange={(code) => updatePhone(phone.id, 'pais', code)} />
                        <input value={phone.numero} onChange={(event) => updatePhone(phone.id, 'numero', event.target.value)} placeholder="(00) 00000-0000" />
                        <button className="icon-btn" type="button" title="Remover telefone" onClick={() => removePhone(phone.id)}><X size={16} /></button>
                      </div>
                    ))}

                    {errors.telefone && <small className="field-error">{errors.telefone}</small>}
                  </div>
                </section>

                <section className="user-form-section">
                  <h3>Acesso e vínculo</h3>
                  <div className="user-form-grid-v213">
                    <label>
                      <FieldLabel required info="Obrigatório. Define o conjunto de permissões e ações possíveis no sistema.">Perfil</FieldLabel>
                      <select value={form.perfilAcessoId} onChange={(event) => updateForm('perfilAcessoId', event.target.value)}>
                        <option value="">Selecione</option>
                        {perfisDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                      </select>
                      {errors.perfil && <small className="field-error">{errors.perfil}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Opcional. Lotação/setor da pessoa dentro do ambiente.">Unidade</FieldLabel>
                      <input value={form.unidade} onChange={(event) => updateForm('unidade', event.target.value)} placeholder="Ex.: Administração Central" />
                    </label>
                    <label>
                      <FieldLabel info="Situação inicial do usuário no ambiente.">Status</FieldLabel>
                      <select value={form.status} onChange={(event) => updateForm('status', event.target.value as UserStatus)}>
                        {statusList.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      <FieldLabel info="Cargo ou função exercida pelo usuário.">Cargo</FieldLabel>
                      <input value={form.cargo} onChange={(event) => updateForm('cargo', event.target.value)} placeholder="Cargo/função" />
                    </label>
                  </div>
                </section>
              </div>
            </div>

            <div className="user-modal-footer">
              <button onClick={() => { setIsFormOpen(false); setEditingUserId(null); }}>Cancelar</button>
              <button className="primary" disabled={saving} onClick={() => void handleSaveUser()}>
                {saving ? 'Salvando...' : editingUserId ? 'Salvar alterações' : 'Enviar convite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="modal-backdrop small-action-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setIsImportOpen(false); }}>
          <div className="small-action-modal">
            <div className="user-modal-header">
              <strong>Importar usuários</strong>
              <button className="icon-btn" onClick={() => setIsImportOpen(false)}><X size={18} /></button>
            </div>
            <div className="small-action-modal-body">
              <p>Cadastro em lote por CSV (colunas: nome, email, cpf, telefone, unidade, cargo) — cada linha recebe um convite real por e-mail. XLSX/XLS chegam numa fase futura.</p>
              <div className="action-options-grid">
                <button onClick={baixarModeloImportacao}><Download size={18} /> Baixar modelo CSV</button>
                <label className="secondary-btn" style={{ cursor: 'pointer' }}>
                  <Upload size={18} /> Selecionar arquivo
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void importarArquivo(file);
                      setIsImportOpen(false);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      {approvingUser && (
        <div className="modal-backdrop small-action-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setApprovingUser(null); }}>
          <div className="small-action-modal">
            <div className="user-modal-header">
              <strong>Aprovar solicitação de acesso</strong>
              <button className="icon-btn" onClick={() => setApprovingUser(null)}><X size={18} /></button>
            </div>
            <div className="small-action-modal-body">
              <p>
                <strong>{approvingUser.nome}</strong> ({approvingUser.email}) se cadastrou sozinho e foi
                vinculado automaticamente pelo domínio do e-mail. Escolha o perfil de acesso para aprovar.
              </p>
              <label className="login-field" style={{ marginTop: 12 }}>
                <span>Perfil de acesso</span>
                <select value={approvePerfilId} onChange={(event) => setApprovePerfilId(event.target.value)}>
                  <option value="">Selecione um perfil</option>
                  {perfisDisponiveis.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>
                  ))}
                </select>
              </label>
              <div className="panel-actions" style={{ marginTop: 16 }}>
                <button className="primary" disabled={!approvePerfilId || approving} onClick={() => void confirmApprove()}>
                  {approving ? 'Aprovando...' : 'Aprovar acesso'}
                </button>
                <button onClick={() => setApprovingUser(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Usuarios;
