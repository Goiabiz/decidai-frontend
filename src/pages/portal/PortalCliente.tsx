import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Inbox, LifeBuoy, Lock, LogOut, Mail, Plus, Send, User } from 'lucide-react';
import markArrowDark from '../../assets/brand/mark-arrow-dark.svg';
import { showAppToast } from '../../lib/appToast';
import {
  createAtendimentoPortal,
  getChamadoPortal,
  listMeusChamadosPortal,
  replyAtendimentoPortal,
  formatProtocolo,
  type Atendimento,
  type AtendimentoMensagem,
} from '../../services/atendimentos';
import { getCurrentPortalUser, portalSignIn, portalSignOut, portalSignUp, type PortalUser } from '../../services/portalAuth';
import { getPortalConfiguracao, type PortalConfiguracao } from '../../services/portalConfig';

type View = 'carregando' | 'login' | 'cadastro' | 'confirmar-email' | 'dashboard' | 'novo' | 'detalhe';

function getClienteIdFromPath(): string {
  const parts = window.location.pathname.split('/').filter(Boolean); // ['portal', ':clienteId']
  return parts[1] || 'demo-client';
}

const STATUS_SLUGS: Record<string, string> = {
  'Novo': 'novo',
  'Em andamento': 'andamento',
  'Aguardando resposta': 'aguardando',
  'Concluído': 'concluido',
  'Cancelado': 'cancelado',
};

function statusSlug(status: string) {
  return STATUS_SLUGS[status] || 'novo';
}

function bannerAtivo(banner: PortalConfiguracao['banners'][number]): boolean {
  const agora = Date.now();
  if (banner.ativoDe && agora < new Date(banner.ativoDe).getTime()) return false;
  if (banner.ativoAte && agora > new Date(banner.ativoAte).getTime()) return false;
  return true;
}

const emptyLoginForm = { email: '', senha: '' };
const emptyCadastroForm = { nome: '', email: '', senha: '', confirmarSenha: '' };
const emptyNovoForm = { assunto: '', mensagem: '' };

export function PortalCliente() {
  const clienteId = useMemo(getClienteIdFromPath, []);
  const [config, setConfig] = useState<PortalConfiguracao | null>(null);
  const [view, setView] = useState<View>('carregando');
  const [authTab, setAuthTab] = useState<'login' | 'cadastro'>('login');
  const [usuario, setUsuario] = useState<PortalUser | null>(null);

  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [cadastroForm, setCadastroForm] = useState(emptyCadastroForm);
  const [enviandoAuth, setEnviandoAuth] = useState(false);

  const [chamados, setChamados] = useState<Atendimento[]>([]);
  const [carregandoChamados, setCarregandoChamados] = useState(false);

  const [novoForm, setNovoForm] = useState(emptyNovoForm);
  const [enviandoNovo, setEnviandoNovo] = useState(false);

  const [chamadoSelecionado, setChamadoSelecionado] = useState<{ atendimento: Atendimento; mensagens: AtendimentoMensagem[] } | null>(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [enviandoResposta, setEnviandoResposta] = useState(false);

  useEffect(() => {
    getPortalConfiguracao(clienteId).then(({ config: cfg }) => setConfig(cfg));
  }, [clienteId]);

  const carregarMeusChamados = async (usuarioPortalId: string) => {
    setCarregandoChamados(true);
    try {
      const { chamados: lista } = await listMeusChamadosPortal(usuarioPortalId, clienteId);
      setChamados(lista);
    } finally {
      setCarregandoChamados(false);
    }
  };

  useEffect(() => {
    getCurrentPortalUser(clienteId).then((found) => {
      if (found) {
        setUsuario(found);
        setView('dashboard');
        carregarMeusChamados(found.id);
      } else {
        setView('login');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const fazerLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginForm.email.trim() || !loginForm.senha) {
      showAppToast('Informe e-mail e senha.', 'warning');
      return;
    }
    setEnviandoAuth(true);
    try {
      const outcome = await portalSignIn({ clienteId, email: loginForm.email.trim(), senha: loginForm.senha });
      if (outcome.user) {
        setUsuario(outcome.user);
        setLoginForm(emptyLoginForm);
        setView('dashboard');
        carregarMeusChamados(outcome.user.id);
      }
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível entrar.', 'error');
    } finally {
      setEnviandoAuth(false);
    }
  };

  const fazerCadastro = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cadastroForm.nome.trim() || !cadastroForm.email.trim() || !cadastroForm.senha) {
      showAppToast('Preencha nome, e-mail e senha.', 'warning');
      return;
    }
    if (cadastroForm.senha.length < 6) {
      showAppToast('A senha precisa ter pelo menos 6 caracteres.', 'warning');
      return;
    }
    if (cadastroForm.senha !== cadastroForm.confirmarSenha) {
      showAppToast('As senhas não conferem.', 'warning');
      return;
    }
    setEnviandoAuth(true);
    try {
      const outcome = await portalSignUp({
        clienteId,
        nome: cadastroForm.nome.trim(),
        email: cadastroForm.email.trim(),
        senha: cadastroForm.senha,
      });
      if (outcome.pendingEmailConfirmation) {
        setView('confirmar-email');
        return;
      }
      if (outcome.user) {
        setUsuario(outcome.user);
        setCadastroForm(emptyCadastroForm);
        setView('dashboard');
        carregarMeusChamados(outcome.user.id);
        showAppToast('Conta criada com sucesso.', 'success');
      }
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível criar a conta.', 'error');
    } finally {
      setEnviandoAuth(false);
    }
  };

  const sair = async () => {
    await portalSignOut();
    setUsuario(null);
    setChamados([]);
    setChamadoSelecionado(null);
    setView('login');
  };

  const abrirNovoChamado = () => {
    setNovoForm(emptyNovoForm);
    setView('novo');
  };

  const enviarNovoChamado = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!usuario || !novoForm.assunto.trim() || !novoForm.mensagem.trim()) {
      showAppToast('Preencha assunto e mensagem.', 'warning');
      return;
    }
    setEnviandoNovo(true);
    try {
      const { protocolo } = await createAtendimentoPortal({
        clienteId,
        usuarioPortalId: usuario.id,
        solicitanteNome: usuario.nome,
        solicitanteEmail: usuario.email,
        assunto: novoForm.assunto.trim(),
        mensagem: novoForm.mensagem.trim(),
      });
      showAppToast(`Chamado ${protocolo} registrado.`, 'success');
      setNovoForm(emptyNovoForm);
      setView('dashboard');
      carregarMeusChamados(usuario.id);
    } finally {
      setEnviandoNovo(false);
    }
  };

  const abrirChamado = async (atendimento: Atendimento) => {
    if (!usuario) return;
    const resultado = await getChamadoPortal(atendimento.id, usuario.id);
    setChamadoSelecionado(resultado);
    setView('detalhe');
  };

  const enviarResposta = async () => {
    if (!chamadoSelecionado || !respostaTexto.trim() || !usuario) return;
    setEnviandoResposta(true);
    try {
      await replyAtendimentoPortal(chamadoSelecionado.atendimento.id, usuario.nome, respostaTexto.trim());
      setChamadoSelecionado({
        ...chamadoSelecionado,
        mensagens: [...chamadoSelecionado.mensagens, {
          id: `temp-${Date.now()}`,
          atendimento_id: chamadoSelecionado.atendimento.id,
          tipo: 'publica',
          autor_nome: usuario.nome,
          texto: respostaTexto.trim(),
          criado_em: new Date().toISOString(),
        }],
      });
      setRespostaTexto('');
      showAppToast('Mensagem enviada.', 'success');
    } finally {
      setEnviandoResposta(false);
    }
  };

  const brandStyle: CSSProperties = config
    ? ({ '--portal-primaria': config.corPrimaria, '--portal-destaque': config.corDestaque } as CSSProperties)
    : {};

  const bannersAtivos = (config?.banners || []).filter(bannerAtivo).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="portal-page" style={brandStyle}>
      <div className="portal-shell">
        <header className="portal-header">
          <img src={config?.logoUrl || markArrowDark} alt="" width={40} height={40} />
          <div>
            <strong>{config?.nomePortal || 'Central de Ajuda'}</strong>
            <span>{usuario ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Acompanhe ou abra um novo chamado'}</span>
          </div>
          {usuario && (
            <button type="button" className="portal-logout-btn" onClick={sair} title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </header>

        {config?.anuncioAtivo && config.anuncioTexto && (
          <div className="portal-anuncio" style={{ background: config.anuncioCorFundo }}>{config.anuncioTexto}</div>
        )}

        {(view === 'login' || view === 'cadastro' || view === 'dashboard') && config?.heroTitulo && (
          <a
            className="portal-hero"
            href={config.heroLinkUrl || undefined}
            target={config.heroLinkUrl ? '_blank' : undefined}
            rel={config.heroLinkUrl ? 'noreferrer' : undefined}
            style={config.heroImagemUrl ? { backgroundImage: `url(${config.heroImagemUrl})` } : undefined}
          >
            <strong>{config.heroTitulo}</strong>
            {config.heroSubtitulo && <span>{config.heroSubtitulo}</span>}
          </a>
        )}

        {view === 'carregando' && <div className="portal-card"><p className="portal-sub">Carregando...</p></div>}

        {(view === 'login' || view === 'cadastro') && (
          <>
            <div className="portal-tabs">
              <button type="button" className={authTab === 'login' ? 'active' : ''} onClick={() => { setAuthTab('login'); setView('login'); }}>
                <Lock size={16} /> Entrar
              </button>
              <button type="button" className={authTab === 'cadastro' ? 'active' : ''} onClick={() => { setAuthTab('cadastro'); setView('cadastro'); }}>
                <User size={16} /> Criar conta
              </button>
            </div>

            {view === 'login' && (
              <form className="portal-card portal-form" onSubmit={fazerLogin}>
                <h1>Entrar</h1>
                <p className="portal-sub">Use a conta criada neste portal para abrir e acompanhar seus chamados.</p>
                <label className="portal-field">
                  <span><Mail size={14} /> E-mail</span>
                  <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((c) => ({ ...c, email: event.target.value }))} placeholder="voce@email.com" required />
                </label>
                <label className="portal-field">
                  <span><Lock size={14} /> Senha</span>
                  <input type="password" value={loginForm.senha} onChange={(event) => setLoginForm((c) => ({ ...c, senha: event.target.value }))} placeholder="Sua senha" required />
                </label>
                <button type="submit" className="portal-submit" disabled={enviandoAuth}>
                  {enviandoAuth ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            )}

            {view === 'cadastro' && (
              <form className="portal-card portal-form" onSubmit={fazerCadastro}>
                <h1>Criar conta</h1>
                <p className="portal-sub">Sua conta fica ligada só a este portal.</p>
                <label className="portal-field">
                  <span><User size={14} /> Nome</span>
                  <input value={cadastroForm.nome} onChange={(event) => setCadastroForm((c) => ({ ...c, nome: event.target.value }))} placeholder="Seu nome" required />
                </label>
                <label className="portal-field">
                  <span><Mail size={14} /> E-mail</span>
                  <input type="email" value={cadastroForm.email} onChange={(event) => setCadastroForm((c) => ({ ...c, email: event.target.value }))} placeholder="voce@email.com" required />
                </label>
                <div className="portal-field-grid">
                  <label className="portal-field">
                    <span><Lock size={14} /> Senha</span>
                    <input type="password" value={cadastroForm.senha} onChange={(event) => setCadastroForm((c) => ({ ...c, senha: event.target.value }))} placeholder="Mínimo 6 caracteres" required />
                  </label>
                  <label className="portal-field">
                    <span><Lock size={14} /> Confirmar senha</span>
                    <input type="password" value={cadastroForm.confirmarSenha} onChange={(event) => setCadastroForm((c) => ({ ...c, confirmarSenha: event.target.value }))} placeholder="Repita a senha" required />
                  </label>
                </div>
                <button type="submit" className="portal-submit" disabled={enviandoAuth}>
                  {enviandoAuth ? 'Criando...' : 'Criar conta'}
                </button>
              </form>
            )}
          </>
        )}

        {view === 'confirmar-email' && (
          <div className="portal-card portal-confirm">
            <div className="portal-confirm-icon"><Mail size={32} /></div>
            <h1>Confirme seu e-mail</h1>
            <p className="portal-sub">Enviamos um link de confirmação para {cadastroForm.email}. Depois de confirmar, volte aqui e entre normalmente.</p>
            <button type="button" className="portal-link-btn" onClick={() => { setView('login'); setAuthTab('login'); }}>Voltar para o login</button>
          </div>
        )}

        {bannersAtivos.length > 0 && (view === 'login' || view === 'cadastro' || view === 'dashboard') && (
          <div className="portal-banners">
            {bannersAtivos.map((banner) => (
              <a key={banner.id} href={banner.linkUrl || undefined} target={banner.linkUrl ? '_blank' : undefined} rel="noreferrer" className="portal-banner">
                <img src={banner.imagemUrl} alt={banner.textoAlt} />
              </a>
            ))}
          </div>
        )}

        {view === 'dashboard' && usuario && (
          <>
            <div className="portal-dashboard-head">
              <h1>Meus chamados</h1>
              <button type="button" className="portal-submit portal-submit-inline" onClick={abrirNovoChamado}>
                <Plus size={16} /> Novo chamado
              </button>
            </div>

            <div className="portal-card portal-chamados-list">
              {carregandoChamados && <p className="portal-sub">Carregando...</p>}
              {!carregandoChamados && chamados.length === 0 && (
                <div className="portal-empty">
                  <Inbox size={26} />
                  <p>Você ainda não abriu nenhum chamado.</p>
                </div>
              )}
              {chamados.map((chamado) => (
                <button key={chamado.id} type="button" className="portal-chamado-item" onClick={() => abrirChamado(chamado)}>
                  <div>
                    <strong>{chamado.assunto}</strong>
                    <span>{formatProtocolo(chamado)} • {new Date(chamado.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span className={`portal-status-badge status-${statusSlug(chamado.status)}`}>{chamado.status}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'novo' && usuario && (
          <form className="portal-card portal-form" onSubmit={enviarNovoChamado}>
            <h1>Novo chamado</h1>
            <p className="portal-sub">Conte o que você precisa — nossa equipe responde por aqui mesmo.</p>
            <label className="portal-field">
              <span>Assunto</span>
              <input value={novoForm.assunto} onChange={(event) => setNovoForm((c) => ({ ...c, assunto: event.target.value }))} placeholder="Resuma em poucas palavras" required />
            </label>
            <label className="portal-field">
              <span>Mensagem</span>
              <textarea value={novoForm.mensagem} onChange={(event) => setNovoForm((c) => ({ ...c, mensagem: event.target.value }))} placeholder="Descreva sua solicitação com detalhes..." required />
            </label>
            <button type="submit" className="portal-submit" disabled={enviandoNovo}>
              {enviandoNovo ? 'Enviando...' : <>Enviar chamado <Send size={16} /></>}
            </button>
            <button type="button" className="portal-link-btn" onClick={() => setView('dashboard')}>Cancelar</button>
          </form>
        )}

        {view === 'detalhe' && chamadoSelecionado && (
          <div className="portal-card portal-ticket">
            <button type="button" className="portal-link-btn portal-back-link" onClick={() => setView('dashboard')}>← Meus chamados</button>
            <div className="portal-ticket-head">
              <div>
                <strong>{chamadoSelecionado.atendimento.assunto}</strong>
                <span>Protocolo {formatProtocolo(chamadoSelecionado.atendimento)}</span>
              </div>
              <span className={`portal-status-badge status-${statusSlug(chamadoSelecionado.atendimento.status)}`}>{chamadoSelecionado.atendimento.status}</span>
            </div>

            <div className="portal-timeline">
              {chamadoSelecionado.mensagens.map((mensagem) => (
                <div key={mensagem.id} className="portal-timeline-item">
                  <div className="portal-timeline-head">
                    <strong>{mensagem.autor_nome || 'Você'}</strong>
                    <small>{new Date(mensagem.criado_em).toLocaleString('pt-BR')}</small>
                  </div>
                  <p>{mensagem.texto}</p>
                </div>
              ))}
            </div>

            {chamadoSelecionado.atendimento.status !== 'Concluído' && chamadoSelecionado.atendimento.status !== 'Cancelado' && (
              <div className="portal-reply-box">
                <textarea value={respostaTexto} onChange={(event) => setRespostaTexto(event.target.value)} placeholder="Escreva uma mensagem..." />
                <button type="button" className="portal-submit" onClick={enviarResposta} disabled={enviandoResposta || !respostaTexto.trim()}>
                  {enviandoResposta ? 'Enviando...' : <>Responder <Send size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        <footer className="portal-footer">
          <div className="portal-footer-brand"><LifeBuoy size={13} /> Powered by DecidAI</div>
          {config && config.linksRodape.length > 0 && (
            <div className="portal-footer-links">
              {config.linksRodape.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.titulo}</a>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

export default PortalCliente;
