import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import { formatDateTime } from '../../lib/formatDate';
import { formatCurrencyBrl as formatBrl } from '../../lib/formatCurrency';
import { listAdminPlanPricing, updatePlanPricing, type AdminPlanPricing } from '../../services/billing';

const PLAN_LABELS: Record<string, string> = { basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise' };

type DraftValue = { monthlyPriceBrl: string; overagePricePerUsdBrl: string };

function toDraft(plan: AdminPlanPricing): DraftValue {
  return {
    monthlyPriceBrl: plan.monthlyPriceBrl === null ? '' : String(plan.monthlyPriceBrl),
    overagePricePerUsdBrl: plan.overagePricePerUsdBrl === null ? '' : String(plan.overagePricePerUsdBrl),
  };
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(value);
}

export function PlanosPrecificacao() {
  const { isSupport } = useSession();

  const [plans, setPlans] = useState<AdminPlanPricing[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftValue>>({});
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listAdminPlanPricing()
      .then((result) => {
        setPlans(result);
        setDrafts(Object.fromEntries(result.map((plan) => [plan.code, toDraft(plan)])));
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar preço dos planos.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSupport) { setLoading(false); return; }
    load();
  }, [isSupport]);

  const updateDraft = (code: string, key: keyof DraftValue, value: string) => {
    setDrafts((current) => ({ ...current, [code]: { ...current[code], [key]: value } }));
  };

  const handleSave = async (plan: AdminPlanPricing) => {
    const draft = drafts[plan.code];
    const monthlyPriceBrl = Number(draft?.monthlyPriceBrl);
    const overagePricePerUsdBrl = Number(draft?.overagePricePerUsdBrl);

    if (!draft?.monthlyPriceBrl.trim() || !Number.isFinite(monthlyPriceBrl) || monthlyPriceBrl < 0) {
      showAppToast('Mensalidade precisa ser um número maior ou igual a zero.', 'warning');
      return;
    }
    if (!draft?.overagePricePerUsdBrl.trim() || !Number.isFinite(overagePricePerUsdBrl) || overagePricePerUsdBrl < 0) {
      showAppToast('Preço do excedente precisa ser um número maior ou igual a zero.', 'warning');
      return;
    }

    setSavingCode(plan.code);
    try {
      const result = await updatePlanPricing(plan.code, monthlyPriceBrl, overagePricePerUsdBrl);
      if ('error' in result) { showAppToast(result.error, 'warning'); return; }
      showAppToast(`Preço do plano ${PLAN_LABELS[plan.code] || plan.code} atualizado.`, 'success');
      load();
    } finally {
      setSavingCode(null);
    }
  };

  if (!isSupport) {
    return (
      <>
        <PageHeader title="Preço dos Planos" />
        <section className="card audit-clean-card">
          <p className="muted">
            A edição de preço dos planos é visível apenas para a equipe da operadora (suporte/administração).
            Fale com quem administra a plataforma se precisar alterar um valor.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Preço dos Planos"
        subtitle="Mensalidade e preço do excedente de uso de IA para basic/pro/enterprise. O plano trial é sempre R$0 e não é editável aqui."
      />

      <section className="card audit-clean-card">
        <div className="section-title-row">
          <div className="v3464-admin-title" style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <span><Coins size={22} /></span>
            <div>
              <h3 style={{ margin: 0 }}>Planos comerciais</h3>
              <p className="section-description" style={{ margin: 0 }}>
                Toda troca de plano e fechamento de fatura usa o valor gravado aqui. Sem SQL direto — a gravação é
                staff-only, validada no servidor.
              </p>
            </div>
          </div>
          <Badge tone="blue">{loading ? '...' : `${plans.length} plano(s)`}</Badge>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plano</th>
                <th>Mensalidade (R$)</th>
                <th>Franquia de uso incluída</th>
                <th>Excedente (R$ por US$1 além da franquia)</th>
                <th>Última atualização</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const draft = drafts[plan.code] ?? toDraft(plan);
                const saving = savingCode === plan.code;
                return (
                  <tr key={plan.code}>
                    <td><strong>{PLAN_LABELS[plan.code] || plan.name}</strong></td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={draft.monthlyPriceBrl}
                        placeholder="não confirmado"
                        onChange={(event) => updateDraft(plan.code, 'monthlyPriceBrl', event.target.value)}
                        style={{ width: 120 }}
                      />
                    </td>
                    <td className="table-subtitle">{formatUsd(plan.includedCreditsUsd)}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={draft.overagePricePerUsdBrl}
                        placeholder="não confirmado"
                        onChange={(event) => updateDraft(plan.code, 'overagePricePerUsdBrl', event.target.value)}
                        style={{ width: 120 }}
                      />
                    </td>
                    <td className="table-subtitle">{formatDateTime(plan.updatedAt)}</td>
                    <td>
                      <button className="secondary-btn" disabled={saving} onClick={() => void handleSave(plan)}>
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && plans.length === 0 && <p className="empty-note">Nenhum plano encontrado.</p>}
        </div>

        {!loading && plans.some((plan) => plan.monthlyPriceBrl === null || plan.overagePricePerUsdBrl === null) && (
          <p className="section-description" style={{ marginTop: 12 }}>
            Planos com valor "não confirmado" ainda não têm preço comercial definido — fechamento de fatura trata
            como R$0 até que um valor real seja salvo aqui.
          </p>
        )}
      </section>
    </>
  );
}

export default PlanosPrecificacao;
