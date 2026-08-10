import { useState } from 'react';
import { Handshake } from 'lucide-react';
import { submitPartnerApplication, type PartnerSubmissionInput } from '../services/marketplace';

const emptyForm: PartnerSubmissionInput = {
  empresaNome: '',
  contatoNome: '',
  contatoEmail: '',
  contatoTelefone: '',
  appNome: '',
  appDescricao: '',
  categoriaSugerida: '',
  websiteUrl: '',
};

export function PartnerSubmission() {
  const [form, setForm] = useState<PartnerSubmissionInput>(emptyForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const update = <K extends keyof PartnerSubmissionInput>(key: K, value: PartnerSubmissionInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const enviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    if (!form.empresaNome.trim() || !form.contatoNome.trim() || !form.contatoEmail.trim() || !form.appNome.trim() || !form.appDescricao.trim()) {
      setErro('Preencha empresa, contato, e-mail, nome e descrição do app.');
      return;
    }
    setEnviando(true);
    try {
      const { ok } = await submitPartnerApplication(form);
      if (ok) {
        setEnviado(true);
      } else {
        setErro('Não foi possível enviar agora. Tente novamente em instantes.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-shell">
        <header className="portal-header">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--green-900)', display: 'grid', placeItems: 'center', flex: 'none' }}>
            <Handshake size={20} color="#fff" />
          </div>
          <div>
            <strong>Marketplace DecidAI — Seja um parceiro</strong>
            <span>Conte sobre o seu app ou conector — nossa equipe entra em contato após a análise.</span>
          </div>
        </header>

        {enviado ? (
          <section className="portal-card">
            <h1>Recebemos sua submissão</h1>
            <p className="portal-sub">Obrigado pelo interesse! Nossa equipe vai analisar e entrar em contato pelo e-mail informado.</p>
          </section>
        ) : (
          <form className="portal-card portal-form" onSubmit={enviar}>
            <h1>Cadastrar app/conector</h1>
            <p className="portal-sub">Split padrão de 75/25 (parceiro/DecidAI), com taxa promocional de 85/15 para os primeiros parceiros.</p>

            <div className="portal-field-grid">
              <label className="portal-field">
                <span>Empresa *</span>
                <input value={form.empresaNome} onChange={(event) => update('empresaNome', event.target.value)} placeholder="Nome da sua empresa" />
              </label>
              <label className="portal-field">
                <span>Site</span>
                <input value={form.websiteUrl} onChange={(event) => update('websiteUrl', event.target.value)} placeholder="https://..." />
              </label>
              <label className="portal-field">
                <span>Seu nome *</span>
                <input value={form.contatoNome} onChange={(event) => update('contatoNome', event.target.value)} placeholder="Nome do responsável" />
              </label>
              <label className="portal-field">
                <span>Telefone</span>
                <input value={form.contatoTelefone} onChange={(event) => update('contatoTelefone', event.target.value)} placeholder="(00) 00000-0000" />
              </label>
            </div>

            <label className="portal-field">
              <span>E-mail de contato *</span>
              <input type="email" value={form.contatoEmail} onChange={(event) => update('contatoEmail', event.target.value)} placeholder="voce@empresa.com" />
            </label>

            <div className="portal-field-grid">
              <label className="portal-field">
                <span>Nome do app/conector *</span>
                <input value={form.appNome} onChange={(event) => update('appNome', event.target.value)} placeholder="Ex.: MeuERP Connector" />
              </label>
              <label className="portal-field">
                <span>Categoria sugerida</span>
                <input value={form.categoriaSugerida} onChange={(event) => update('categoriaSugerida', event.target.value)} placeholder="Ex.: ERP, CRM, Pagamentos..." />
              </label>
            </div>

            <label className="portal-field">
              <span>Descrição *</span>
              <textarea value={form.appDescricao} onChange={(event) => update('appDescricao', event.target.value)} placeholder="O que o seu app/conector faz e por que ele ajudaria clientes DecidAI." />
            </label>

            {erro && <p className="portal-sub" style={{ color: 'var(--red-500)' }}>{erro}</p>}

            <button type="submit" className="portal-submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar submissão'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PartnerSubmission;
