import { useEffect, useRef, useState } from 'react';
import { Camera, CreditCard, PackagePlus, ShieldCheck, UserCog, UserRound, Users, Wallet, Workflow, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { showAppToast } from '../lib/appToast';
import { useSession, usePermission } from '../contexts/SessionContext';
import { getAccountOverview, listPlans, type AccountOverview, type PlanDetails } from '../services/account';
import { requestPlanChange } from '../services/billing';
import { mfaConfirmEnrollment, mfaEnroll, mfaGetVerifiedFactor, mfaUnenroll, updateOwnAvatar } from '../services/auth';
import { uploadAvatar } from '../services/storage';

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function LimitRow({ icon, label, used, max, unlimitedThreshold = 999 }: { icon: React.ReactNode; label: string; used: number; max: number; unlimitedThreshold?: number }) {
  const unlimited = max >= unlimitedThreshold;
  const pct = unlimited ? 0 : Math.min(100, max > 0 ? (used / max) * 100 : 0);
  return (
    <div className="preference-row">
      <div>{icon}<span><strong>{label}</strong><small>{unlimited ? `${formatNumber(used)} em uso · sem limite prático` : `${formatNumber(used)} de ${formatNumber(max)} contratados`}</small></span></div>
      {!unlimited && (
        <div className="minha-conta-bar"><div className="minha-conta-bar-fill" style={{ width: `${pct}%` }} /></div>
      )}
    </div>
  );
}

export function MinhaConta() {
  const { session, isSupport, updateOwnPhoto } = useSession();
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaEnrollModal, setMfaEnrollModal] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  const clientId = session?.activeClientId ?? null;
  // creditos.plano.alterar (migration 123) libera pro staff da operadora E pro admin_cliente do
  // próprio ambiente -- antes era só staff (tipoAcesso), sem fluxo de self-service nenhum.
  const canChangePlan = usePermission('creditos.plano.alterar');

  useEffect(() => {
    mfaGetVerifiedFactor()
      .then((factor) => {
        setMfaEnabled(!!factor);
        setMfaFactorId(factor?.id ?? null);
      })
      .catch(() => { /* Supabase não configurado neste ambiente: segue sem MFA. */ })
      .finally(() => setMfaLoading(false));
  }, []);

  const handleMfaChange = async (value: string) => {
    if (value === 'ativo') {
      try {
        const enrollment = await mfaEnroll();
        setMfaEnrollModal(enrollment);
      } catch (error) {
        showAppToast(error instanceof Error ? error.message : 'Não foi possível iniciar a ativação do MFA.', 'error');
      }
      return;
    }

    if (!mfaFactorId) {
      setMfaEnabled(false);
      return;
    }
    setMfaBusy(true);
    try {
      await mfaUnenroll(mfaFactorId);
      setMfaEnabled(false);
      setMfaFactorId(null);
      showAppToast('Verificação em duas etapas desativada.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível desativar o MFA.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmarMfa = async () => {
    if (!mfaEnrollModal || mfaCode.trim().length !== 6) {
      showAppToast('Digite o código de 6 dígitos do aplicativo autenticador.', 'warning');
      return;
    }
    setMfaBusy(true);
    try {
      await mfaConfirmEnrollment(mfaEnrollModal.factorId, mfaCode.trim());
      setMfaEnabled(true);
      setMfaFactorId(mfaEnrollModal.factorId);
      setMfaEnrollModal(null);
      setMfaCode('');
      showAppToast('Verificação em duas etapas ativada.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Código inválido. Tente novamente.', 'error');
    } finally {
      setMfaBusy(false);
    }
  };

  const load = async () => {
    if (!clientId) {
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAccountOverview(clientId);
      setOverview(data);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar os dados da conta.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [clientId]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !clientId || !session || session.user.kind !== 'cliente') return;

    setUploadingPhoto(true);
    try {
      const fotoUrl = await uploadAvatar(clientId, session.user.registroId, file);
      await updateOwnAvatar(session.user.registroId, fotoUrl);
      updateOwnPhoto(fotoUrl);
      showAppToast('Foto atualizada.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível enviar a foto.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPlanSwitcher = async () => {
    if (plans.length === 0) {
      try {
        setPlans(await listPlans());
      } catch (error) {
        showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar os planos.', 'error');
        return;
      }
    }
    setChangingPlan(true);
  };

  const applyPlan = async (planoId: string) => {
    if (!clientId) return;
    setSaving(true);
    try {
      const result = await requestPlanChange(clientId, planoId);
      if ('error' in result) {
        showAppToast(result.error, 'error');
        return;
      }
      showAppToast('Plano atualizado. Os novos limites já valem a partir de agora; a próxima fatura divide o valor proporcionalmente entre os planos usados no período.', 'success');
      setChangingPlan(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (!clientId) {
    return (
      <>
        <PageHeader title="Minha conta" />
        <section className="card">
          <p className="muted">
            {isSupport
              ? 'Selecione um cliente no seletor de suporte, no topo da tela, para ver os dados de conta dele.'
              : 'Não foi possível identificar seu cliente. Fale com o suporte.'}
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Minha conta" />

      {session?.user.kind === 'cliente' && (
        <section className="card minha-conta-perfil-card">
          <button
            type="button"
            className="minha-conta-avatar"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            title="Alterar foto"
          >
            {session.user.fotoUrl ? <img src={session.user.fotoUrl} alt={session.user.displayName} /> : <UserRound size={28} />}
            <span className="minha-conta-avatar-overlay"><Camera size={16} /></span>
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => void handlePhotoChange(event)}
          />
          <div>
            <strong>{session.user.displayName}</strong>
            <small className="muted">{uploadingPhoto ? 'Enviando foto...' : 'Clique na foto para alterar'}</small>
          </div>
        </section>
      )}

      <section className="card preferences-list-card">
        <h3>Plano e limites {overview?.clientName ? `— ${overview.clientName}` : ''}</h3>

        {loading && <p className="muted">Carregando...</p>}

        {!loading && overview && (
          <>
            <div className="preference-row">
              <div><CreditCard size={22} /><span><strong>Plano atual</strong><small>{overview.plan?.name ?? 'Sem plano definido'}</small></span></div>
              {canChangePlan && (
                <button className="secondary-small" onClick={openPlanSwitcher}>Alterar plano</button>
              )}
            </div>

            {overview.plan && (
              <>
                <LimitRow icon={<Users size={22} />} label="Usuários" used={overview.usuariosAtivos} max={overview.plan.maxUsers} />
                <LimitRow icon={<UserCog size={22} />} label="Agentes" used={overview.agentesAtivos} max={overview.plan.maxAgents} />
                <LimitRow icon={<Workflow size={22} />} label="Canais" used={overview.canaisAtivos} max={overview.plan.maxChannels} />
                <LimitRow icon={<Wallet size={22} />} label="Tokens (mês atual)" used={overview.tokensConsumidos} max={overview.plan.monthlyTokenLimit} unlimitedThreshold={999999999} />
                <LimitRow icon={<PackagePlus size={22} />} label="Mensagens (mês atual)" used={overview.mensagensConsumidas} max={overview.plan.monthlyMessageLimit} unlimitedThreshold={999999999} />
              </>
            )}
          </>
        )}
      </section>

      <section className="card preferences-list-card">
        <h3>Pacotes adicionais</h3>
        <p className="muted">Contratação de pacotes avulsos (tokens, usuários, agentes) ainda depende da área comercial — fale com o suporte para adicionar.</p>
      </section>

      <section className="card preferences-list-card">
        <h3>Segurança</h3>
        <div className="preference-row">
          <div><ShieldCheck size={22} /><span><strong>Verificação em duas etapas</strong><small>Opcional — pede um código do aplicativo autenticador a cada login.</small></span></div>
          <select value={mfaEnabled ? 'ativo' : 'inativo'} disabled={mfaLoading || mfaBusy} onChange={(event) => void handleMfaChange(event.target.value)}>
            <option value="inativo">Desativado</option>
            <option value="ativo">Ativado</option>
          </select>
        </div>
      </section>

      {changingPlan && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <h2>Alterar plano</h2>
            <div className="v3464-modal-form">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  className="v3464-plugin"
                  disabled={saving}
                  onClick={() => applyPlan(plan.id)}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  <span>
                    <strong>{plan.name}</strong>
                    <small>{plan.description}</small>
                  </span>
                </button>
              ))}
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={() => setChangingPlan(false)} disabled={saving}>Cancelar</button>
            </footer>
          </section>
        </div>
      )}

      {mfaEnrollModal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => { setMfaEnrollModal(null); setMfaCode(''); }}><X size={18} /></button>
            <h2>Ativar verificação em duas etapas</h2>
            <p>Escaneie o QR code com um aplicativo autenticador (Google Authenticator, Authy, 1Password...) e digite o código gerado.</p>
            <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0' }}>
              <img src={mfaEnrollModal.qrCode} alt="QR code para configurar o autenticador" width={180} height={180} />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--slate-500)', textAlign: 'center', wordBreak: 'break-all' }}>
              Não consegue escanear? Cadastre manualmente: <code>{mfaEnrollModal.secret}</code>
            </p>
            <div className="v3464-modal-form">
              <label>Código de 6 dígitos
                <input
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                />
              </label>
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={() => { setMfaEnrollModal(null); setMfaCode(''); }} disabled={mfaBusy}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={confirmarMfa} disabled={mfaBusy}>{mfaBusy ? 'Confirmando...' : 'Confirmar'}</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

export default MinhaConta;
