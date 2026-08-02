import { useMemo, useState } from 'react';
import {
  Ban,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Download,
  Home,
  Info,
  KeyRound,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  UserCog,
  VenusAndMars,
  X,
} from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';
import type { PageProps } from '../../App';
import type { PanelDetail } from '../../components/RightPanel';

type UserStatus = 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente';

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

type UserRecord = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  perfil: string;
  status: UserStatus;
  unidade: string;
  cargo: string;
  genero: string;
  nascimento: string;
  endereco: string;
  ultimoLogin: string;
  mfa: boolean;
  acessoAgente: boolean;
  foto?: string;
};

type UserFormState = {
  foto: string;
  nome: string;
  cpf: string;
  email: string;
  genero: string;
  nascimento: string;
  endereco: string;
  perfil: string;
  status: UserStatus;
  unidade: string;
  cargo: string;
  phones: PhoneRecord[];
  mfa: boolean;
  acessoAgente: boolean;
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
  nome: '',
  cpf: '',
  email: '',
  genero: '',
  nascimento: '',
  endereco: '',
  perfil: 'Administrador',
  status: 'Ativo',
  unidade: '',
  cargo: '',
  phones: [{ id: 'phone-1', tipo: 'Celular', pais: '+55', numero: '' }],
  mfa: false,
  acessoAgente: false,
};

const mockUsuarios: UserRecord[] = [
  {
    id: 'USR-0001',
    nome: 'Bruno Oliveira',
    cpf: '***.***.***-01',
    email: 'bruno@exemplo.com',
    telefone: 'ðŸ‡§ðŸ‡· +55 (11) 99999-0001',
    perfil: 'Administrador',
    status: 'Ativo',
    unidade: 'Administração Central',
    cargo: 'Gestor do ambiente',
    genero: 'Masculino',
    nascimento: '1986-07-31',
    endereco: 'Rua Exemplo, 100 - Centro',
    ultimoLogin: 'Hoje 17:42',
    mfa: true,
    acessoAgente: true,
  },
  {
    id: 'USR-0002',
    nome: 'Operador Atendimento',
    cpf: '***.***.***-02',
    email: 'atendimento@exemplo.com',
    telefone: 'ðŸ‡§ðŸ‡· +55 (11) 99999-0002',
    perfil: 'Atendimento',
    status: 'Ativo',
    unidade: 'Suporte Faturamento',
    cargo: 'Operador',
    genero: 'Não informado',
    nascimento: '',
    endereco: '',
    ultimoLogin: 'Ontem 15:10',
    mfa: false,
    acessoAgente: true,
  },
  {
    id: 'USR-0003',
    nome: 'Auditoria Técnica',
    cpf: '***.***.***-03',
    email: 'auditoria@exemplo.com',
    telefone: 'ðŸ‡§ðŸ‡· +55 (11) 99999-0003',
    perfil: 'Auditoria',
    status: 'Pendente',
    unidade: 'Qualidade',
    cargo: 'Auditor',
    genero: 'Não informado',
    nascimento: '',
    endereco: '',
    ultimoLogin: '-',
    mfa: false,
    acessoAgente: false,
  },
];

const perfis = ['Administrador', 'Atendimento', 'Auditoria', 'Gestor', 'Operador'];
const statusList: UserStatus[] = ['Ativo', 'Bloqueado', 'Inativo', 'Pendente'];
const generos = ['Feminino', 'Masculino'];
const unidades = ['Administração Central', 'Atendimento', 'Produto', 'Qualidade', 'Suporte Faturamento'];

const statusTone = (status: UserStatus) => {
  if (status === 'Ativo') return 'green';
  if (status === 'Pendente') return 'orange';
  if (status === 'Bloqueado') return 'red';
  return 'blue';
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

const getCountry = (code: string) => COUNTRY_CODES.find((item) => item.code === code && item.iso === 'br') || COUNTRY_CODES.find((item) => item.code === code) || COUNTRY_CODES[6];

const countryPhoneLabel = (code: string) => {
  const country = getCountry(code);
  return `${country.pais} ${country.code}`;
};

const buildDetail = (usuario: UserRecord): PanelDetail => ({
  title: usuario.nome,
  subtitle: usuario.email,
  badge: usuario.status,
  badgeTone: usuario.status,
  description: 'Usuário cadastrado para acesso operacional ao ambiente.',
  meta: [
    { label: 'Código', value: usuario.id },
    { label: 'CPF', value: usuario.cpf },
    { label: 'Telefone', value: usuario.telefone },
    { label: 'Perfil', value: usuario.perfil },
    { label: 'Unidade', value: usuario.unidade || '-' },
    { label: 'Cargo', value: usuario.cargo },
    { label: 'Gênero', value: usuario.genero },
    { label: 'Nascimento', value: usuario.nascimento || '-' },
    { label: 'Endereço', value: usuario.endereco || '-' },
    { label: 'Último login', value: usuario.ultimoLogin },
    { label: 'MFA', value: usuario.mfa ? 'Ativo' : 'Não configurado' },
    { label: 'Agente', value: usuario.acessoAgente ? 'Permitido' : 'Não permitido' },
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

function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = getCountry(value);

  return (
    <div className="country-picker">
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
              key={`${item.pais}-${item.code}`}
              className={item.iso === selected.iso ? 'active' : ''}
              onClick={() => {
                onChange(item.code);
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
  const [usuarios, setUsuarios] = useState<UserRecord[]>(mockUsuarios);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [perfil, setPerfil] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(mockUsuarios[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredUsuarios = useMemo(() => {
    const query = normalizeFilterText(search);
    const statusFilter = normalizeFilterText(status);
    const perfilFilter = normalizeFilterText(perfil);

    return usuarios.filter((usuario) => {
      const text = normalizeFilterText([
        usuario.id,
        usuario.nome,
        usuario.cpf,
        usuario.email,
        usuario.telefone,
        usuario.perfil,
        usuario.status,
        usuario.unidade,
        usuario.cargo,
      ].join(' '));

      return (!query || text.includes(query))
        && (!statusFilter || normalizeFilterText(usuario.status) === statusFilter)
        && (!perfilFilter || normalizeFilterText(usuario.perfil) === perfilFilter);
    });
  }, [usuarios, search, status, perfil]);

  const updateForm = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
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
      phones: [...current.phones, { id: `phone-${Date.now()}`, tipo: 'Fixo', pais: '+55', numero: '' }],
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

  const updateStatus = (id: string, nextStatus: UserStatus) => {
    setUsuarios((current) => current.map((usuario) => usuario.id === id ? { ...usuario, status: nextStatus } : usuario));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const principalPhone = form.phones[0]?.numero || '';

    if (!form.email.trim()) nextErrors.email = 'E-mail é obrigatório.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'Informe um e-mail válido.';

    if (!principalPhone.trim()) nextErrors.telefone = 'Telefone é obrigatório.';
    else if (!isValidPhone(principalPhone)) nextErrors.telefone = 'Informe um telefone válido.';

    if (!form.perfil.trim()) nextErrors.perfil = 'Perfil é obrigatório.';
    if (form.cpf.trim() && !isValidCpf(form.cpf)) nextErrors.cpf = 'CPF inválido.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveUser = () => {
    if (!validateForm()) return;
    const mainPhone = form.phones[0];

    const nextUser: UserRecord = {
      id: `USR-${String(usuarios.length + 1).padStart(4, '0')}`,
      nome: form.nome || form.email,
      cpf: form.cpf || '-',
      email: form.email,
      telefone: `${countryPhoneLabel(mainPhone.pais)} ${mainPhone.numero}`,
      perfil: form.perfil,
      status: form.status,
      unidade: form.unidade,
      cargo: form.cargo || '-',
      genero: form.genero || 'Não informado',
      nascimento: form.nascimento,
      endereco: form.endereco,
      ultimoLogin: '-',
      mfa: form.mfa,
      acessoAgente: form.acessoAgente,
      foto: form.foto,
    };

    setUsuarios((current) => [nextUser, ...current]);
    setSelectedUser(nextUser);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Usuários"
        action={(
          <div className="header-actions">
            <button className="secondary-btn"><Upload size={16} /> Importar</button>
            <button className="secondary-btn"><Download size={16} /> Exportar</button>
            <button className="primary-small" onClick={() => setIsFormOpen(true)}><Plus size={16} /> Novo usuário</button>
          </div>
        )}
      />

      <section className="card user-functional-card">
        <div className="section-title-row">
          <h3>Cadastro de usuários</h3>
          <span className="small-muted">{filteredUsuarios.length} de {usuarios.length} registros</span>
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
          <select value={perfil} onChange={(event) => setPerfil(event.target.value)}>
            <option value="">Todos os perfis</option>
            {perfis.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="users-layout-grid">
          <div className="users-table-wrap">
            <table>
              <thead>
                <tr><th>Usuário</th><th>Perfil</th><th>Unidade</th><th>Status</th><th>Segurança</th><th>Último login</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => {
                  const detail = buildDetail(usuario);
                  return (
                    <tr key={usuario.id} className="clickable-row" onClick={() => handleSelectUser(usuario)}>
                      <td><strong>{usuario.nome}</strong><div className="table-subtitle">{usuario.email}</div></td>
                      <td>{usuario.perfil}</td>
                      <td>{usuario.unidade || '-'}<div className="table-subtitle">{usuario.cargo}</div></td>
                      <td><Badge tone={statusTone(usuario.status)}>{usuario.status}</Badge></td>
                      <td>
                        <div className="security-flags">
                          <span className={usuario.mfa ? 'ok' : 'warn'}><ShieldCheck size={14} /> MFA</span>
                          <span className={usuario.acessoAgente ? 'ok' : 'muted'}><UserCog size={14} /> Agente</span>
                        </div>
                      </td>
                      <td>{usuario.ultimoLogin}</td>
                      <td>
                        <div className="row-action-group" onClick={(event) => event.stopPropagation()}>
                          <button title="Enviar/Reenviar convite"><Mail size={16} /></button>
                          <button title="Gerenciar acesso" onClick={() => onOpenDetail?.(detail)}><KeyRound size={16} /></button>
                          {usuario.status === 'Bloqueado'
                            ? <button title="Ativar" onClick={() => updateStatus(usuario.id, 'Ativo')}><CheckCircle2 size={16} /></button>
                            : <button title="Bloquear" onClick={() => updateStatus(usuario.id, 'Bloqueado')}><Ban size={16} /></button>}
                          <button title="Mais ações"><MoreHorizontal size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  <span>Código</span><strong>{selectedUser.id}</strong>
                  <span>CPF</span><strong>{selectedUser.cpf}</strong>
                  <span>Telefone</span><strong>{selectedUser.telefone}</strong>
                  <span>Perfil</span><strong>{selectedUser.perfil}</strong>
                  <span>Unidade</span><strong>{selectedUser.unidade || '-'}</strong>
                  <span>Cargo</span><strong>{selectedUser.cargo}</strong>
                  <span>Gênero</span><strong>{selectedUser.genero}</strong>
                  <span>Nascimento</span><strong>{selectedUser.nascimento || '-'}</strong>
                  <span>Endereço</span><strong>{selectedUser.endereco || '-'}</strong>
                  <span>MFA</span><strong>{selectedUser.mfa ? 'Ativo' : 'Não configurado'}</strong>
                  <span>Agente</span><strong>{selectedUser.acessoAgente ? 'Permitido' : 'Não permitido'}</strong>
                </div>

                <div className="panel-actions user-actions">
                  <button className="primary">Editar usuário</button>
                  <button>Gerenciar permissões</button>
                  <button>Enviar/Reenviar convite</button>
                  <button className="danger">Bloquear acesso</button>
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
              <strong>Novo usuário</strong>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={18} /></button>
            </div>

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
                      <FieldLabel info="Nome exibido nas telas, histórico, auditoria e perfil do usuário.">Nome completo</FieldLabel>
                      <div className="input-with-icon"><User size={17} /><input value={form.nome} onChange={(event) => updateForm('nome', event.target.value)} placeholder="Informe o nome do usuário" /></div>
                    </label>
                    <label>
                      <FieldLabel info="CPF usado como identificação complementar. Quando preenchido, o sistema valida o número.">CPF</FieldLabel>
                      <input value={form.cpf} onChange={(event) => updateForm('cpf', event.target.value)} placeholder="000.000.000-00" />
                      {errors.cpf && <small className="field-error">{errors.cpf}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Informação cadastral objetiva do usuário.">Gênero</FieldLabel>
                      <div className="input-with-icon"><VenusAndMars size={17} /><select value={form.genero} onChange={(event) => updateForm('genero', event.target.value)}>
                        <option value="">Selecione</option>
                        {generos.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select></div>
                    </label>
                    <label>
                      <FieldLabel info="Informação cadastral opcional de nascimento.">Data de nascimento</FieldLabel>
                      <div className="input-with-icon"><Calendar size={17} /><input type="date" value={form.nascimento} onChange={(event) => updateForm('nascimento', event.target.value)} /></div>
                    </label>
                  </div>
                </section>

                <section className="user-form-section">
                  <h3>Contato e endereço</h3>
                  <div className="user-form-grid-v213">
                    <label>
                      <FieldLabel required info="Obrigatório. Usado para login, envio ou reenvio de convite e recuperação de acesso.">E-mail</FieldLabel>
                      <div className="input-with-icon"><Mail size={17} /><input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="usuario@dominio.com" /></div>
                      {errors.email && <small className="field-error">{errors.email}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Endereço residencial ou administrativo, conforme regra do cliente.">Endereço</FieldLabel>
                      <input value={form.endereco} onChange={(event) => updateForm('endereco', event.target.value)} placeholder="Rua, número, bairro, cidade e UF" />
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
                      <select value={form.perfil} onChange={(event) => updateForm('perfil', event.target.value)}>
                        {perfis.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      {errors.perfil && <small className="field-error">{errors.perfil}</small>}
                    </label>
                    <label>
                      <FieldLabel info="Opcional. Define a principal lotação operacional do usuário quando existir mais de uma unidade.">Unidade</FieldLabel>
                      <select value={form.unidade} onChange={(event) => updateForm('unidade', event.target.value)}>
                        <option value="">Selecione</option>
                        {unidades.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
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

                  <div className="access-check-grid">
                    <label className="inline-check"><input type="checkbox" checked={form.mfa} onChange={(event) => updateForm('mfa', event.target.checked)} /> Exigir MFA no primeiro acesso</label>
                    <label className="inline-check"><input type="checkbox" checked={form.acessoAgente} onChange={(event) => updateForm('acessoAgente', event.target.checked)} /> Permitir uso assistido por agente</label>
                  </div>
                </section>
              </div>
            </div>

            <div className="user-modal-footer">
              <button onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="primary" onClick={handleSaveUser}>Salvar usuário</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
