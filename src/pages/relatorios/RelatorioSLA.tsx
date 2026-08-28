import { useEffect, useMemo, useState } from 'react';
import { Clock3, Gauge, Inbox, MessageCircleReply } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';
import { useSession } from '../../contexts/SessionContext';
import { listAtendimentoSla, type AtendimentoSla } from '../../services/atendimentos';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';

function formatDuracao(segundos: number | null): string {
  if (segundos === null || Number.isNaN(segundos) || segundos < 0) return '—';
  if (segundos < 60) return `${Math.round(segundos)}s`;
  if (segundos < 3600) return `${Math.round(segundos / 60)}min`;
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, item) => soma + item, 0) / valores.length;
}

type CanalResumo = {
  canal: string;
  volume: number;
  taxaResposta: number;
  mediaPrimeiraResposta: number | null;
  mediaResolucao: number | null;
};

export default function RelatorioSLA() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const [linhas, setLinhas] = useState<AtendimentoSla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!clienteId) {
      setLinhas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    listAtendimentoSla(clienteId).then((rows) => {
      if (active) { setLinhas(rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [clienteId]);

  const resumo = useMemo(() => {
    const total = linhas.length;
    const comResposta = linhas.filter((item) => item.tem_resposta);
    const resolvidos = linhas.filter((item) => item.tempo_resolucao_segundos !== null);
    const taxaResposta = total > 0 ? (comResposta.length / total) * 100 : null;
    const mediaPrimeiraResposta = media(comResposta.map((item) => item.tempo_primeira_resposta_segundos!));
    const mediaResolucao = media(resolvidos.map((item) => item.tempo_resolucao_segundos!));

    const porCanal = new Map<string, AtendimentoSla[]>();
    for (const item of linhas) {
      const lista = porCanal.get(item.canal) || [];
      lista.push(item);
      porCanal.set(item.canal, lista);
    }
    const canais: CanalResumo[] = Array.from(porCanal.entries())
      .map(([canal, items]) => {
        const respondidos = items.filter((item) => item.tem_resposta);
        const finalizados = items.filter((item) => item.tempo_resolucao_segundos !== null);
        return {
          canal,
          volume: items.length,
          taxaResposta: (respondidos.length / items.length) * 100,
          mediaPrimeiraResposta: media(respondidos.map((item) => item.tempo_primeira_resposta_segundos!)),
          mediaResolucao: media(finalizados.map((item) => item.tempo_resolucao_segundos!)),
        };
      })
      .sort((a, b) => b.volume - a.volume);

    return { total, taxaResposta, mediaPrimeiraResposta, mediaResolucao, canais };
  }, [linhas]);

  const linhasRelatorio: StandardReportRow[] = useMemo(() => linhas.map((item) => ({
    canal: item.canal,
    status: item.status,
    prioridade: item.prioridade,
    criado_em: item.criado_em,
    primeira_resposta: item.tem_resposta ? formatDuracao(item.tempo_primeira_resposta_segundos) : 'Sem resposta',
    resolucao: item.resolvido_em ? formatDuracao(item.tempo_resolucao_segundos) : 'Em aberto',
  })), [linhas]);

  if (!clienteId) {
    return (
      <>
        <PageHeader title="SLA de Atendimento" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver o SLA de atendimento dele.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="SLA de Atendimento" subtitle="Tempo de primeira resposta, tempo de resolução e volume real por canal, medidos a partir dos atendimentos do Unified Inbox e da Central de Atendimento." />

      <div className="kpi-grid four">
        <KpiCard label="Atendimentos no período" value={String(resumo.total)} icon={<Inbox size={20} />} tone="blue" />
        <KpiCard
          label="Taxa de resposta"
          value={resumo.taxaResposta === null ? '—' : `${resumo.taxaResposta.toFixed(0)}%`}
          tooltip="Percentual de atendimentos com pelo menos uma resposta pública da equipe."
          icon={<MessageCircleReply size={20} />}
          tone="green"
        />
        <KpiCard
          label="Tempo médio de 1ª resposta"
          value={formatDuracao(resumo.mediaPrimeiraResposta)}
          tooltip="Do momento em que o atendimento foi criado até a primeira resposta pública de um usuário da equipe."
          icon={<Clock3 size={20} />}
          tone="orange"
        />
        <KpiCard
          label="Tempo médio de resolução"
          value={formatDuracao(resumo.mediaResolucao)}
          tooltip="Do momento em que o atendimento foi criado até ele entrar em status Concluído ou Cancelado."
          icon={<Gauge size={20} />}
          tone="purple"
        />
      </div>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Volume e SLA por canal</h3>
          <span className="small-muted">{resumo.canais.length} canal(is) com atendimento registrado</span>
        </div>
        {loading ? (
          <p className="empty-note">Carregando...</p>
        ) : resumo.canais.length === 0 ? (
          <p className="empty-note">Nenhum atendimento registrado ainda para este cliente.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>Volume</th>
                  <th>Taxa de resposta</th>
                  <th>Tempo médio de 1ª resposta</th>
                  <th>Tempo médio de resolução</th>
                </tr>
              </thead>
              <tbody>
                {resumo.canais.map((item) => (
                  <tr key={item.canal}>
                    <td>{item.canal}</td>
                    <td>{item.volume}</td>
                    <td>{item.taxaResposta.toFixed(0)}%</td>
                    <td>{formatDuracao(item.mediaPrimeiraResposta)}</td>
                    <td>{formatDuracao(item.mediaResolucao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StandardReportPage
        title="Atendimentos -- detalhe de SLA"
        description="Um atendimento por linha, com tempo de primeira resposta e de resolução calculados."
        filename="relatorio-sla-atendimento"
        funcionalidade="relatorio_sla_atendimento"
        columns={[
          { key: 'canal', label: 'Canal' },
          { key: 'status', label: 'Status' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'criado_em', label: 'Criado em' },
          { key: 'primeira_resposta', label: '1ª resposta' },
          { key: 'resolucao', label: 'Resolução' },
        ]}
        rows={linhasRelatorio}
        loading={loading}
        filters={[
          { key: 'canal', label: 'Canal' },
          { key: 'status', label: 'Status' },
          { key: 'prioridade', label: 'Prioridade' },
        ]}
        dateColumnKey="criado_em"
        emptyMessage="Nenhum atendimento encontrado para os filtros selecionados."
      />
    </>
  );
}
