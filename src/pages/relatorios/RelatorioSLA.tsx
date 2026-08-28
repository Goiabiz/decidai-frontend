import { useEffect, useMemo, useState } from 'react';
import { Clock3, Gauge, Inbox, MessageCircleReply, Target } from 'lucide-react';
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

function formatMetaLabel(dentro: boolean | null): string {
  if (dentro === null) return 'Sem meta';
  return dentro ? 'Dentro do prazo' : 'Estourou';
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, item) => soma + item, 0) / valores.length;
}

function percentual(dentro: number, avaliados: number): string {
  if (avaliados === 0) return '—';
  return `${Math.round((dentro / avaliados) * 100)}%`;
}

type CanalResumo = {
  canal: string;
  volume: number;
  taxaResposta: number;
  mediaPrimeiraResposta: number | null;
  mediaResolucao: number | null;
};

type ServicoResumo = {
  servico: string;
  volume: number;
  avaliadosPrimeiraResposta: number;
  dentroPrimeiraResposta: number;
  avaliadosResolucao: number;
  dentroResolucao: number;
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

    const comServico = linhas.filter((item) => item.servico_id !== null);
    const avaliadosPrimeiraResposta = linhas.filter((item) => item.primeira_resposta_dentro_meta !== null);
    const dentroPrimeiraResposta = avaliadosPrimeiraResposta.filter((item) => item.primeira_resposta_dentro_meta === true);
    const avaliadosResolucao = linhas.filter((item) => item.resolucao_dentro_meta !== null);
    const dentroResolucao = avaliadosResolucao.filter((item) => item.resolucao_dentro_meta === true);

    const porServico = new Map<string, AtendimentoSla[]>();
    for (const item of comServico) {
      const chave = item.servico_nome || 'Serviço removido';
      const lista = porServico.get(chave) || [];
      lista.push(item);
      porServico.set(chave, lista);
    }
    const servicos: ServicoResumo[] = Array.from(porServico.entries())
      .map(([servico, items]) => ({
        servico,
        volume: items.length,
        avaliadosPrimeiraResposta: items.filter((item) => item.primeira_resposta_dentro_meta !== null).length,
        dentroPrimeiraResposta: items.filter((item) => item.primeira_resposta_dentro_meta === true).length,
        avaliadosResolucao: items.filter((item) => item.resolucao_dentro_meta !== null).length,
        dentroResolucao: items.filter((item) => item.resolucao_dentro_meta === true).length,
      }))
      .sort((a, b) => b.volume - a.volume);

    return {
      total,
      taxaResposta,
      mediaPrimeiraResposta,
      mediaResolucao,
      canais,
      comServicoCount: comServico.length,
      avaliadosPrimeiraResposta: avaliadosPrimeiraResposta.length,
      dentroPrimeiraResposta: dentroPrimeiraResposta.length,
      avaliadosResolucao: avaliadosResolucao.length,
      dentroResolucao: dentroResolucao.length,
      servicos,
    };
  }, [linhas]);

  const linhasRelatorio: StandardReportRow[] = useMemo(() => linhas.map((item) => ({
    canal: item.canal,
    status: item.status,
    prioridade: item.prioridade,
    criado_em: item.criado_em,
    servico: item.servico_nome || '-',
    primeira_resposta: item.tem_resposta ? formatDuracao(item.tempo_primeira_resposta_segundos) : 'Sem resposta',
    meta_primeira_resposta: formatMetaLabel(item.primeira_resposta_dentro_meta),
    resolucao: item.resolvido_em ? formatDuracao(item.tempo_resolucao_segundos) : 'Em aberto',
    meta_resolucao: formatMetaLabel(item.resolucao_dentro_meta),
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

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Cumprimento de meta (SLA configurado)</h3>
          <span className="small-muted">{resumo.comServicoCount} de {resumo.total} atendimento(s) vinculado(s) a um serviço</span>
        </div>
        {resumo.comServicoCount === 0 ? (
          <p className="empty-note">
            Nenhum atendimento vinculado a um serviço ainda -- a comparação com a meta configurada
            (Central de Atendimento → Serviços → aba SLA) aparece aqui assim que um atendimento novo
            for criado com o campo "Serviço" preenchido. Atendimentos já existentes, sem serviço, não
            entram nessa comparação (não é erro -- vínculo é opcional, de propósito).
          </p>
        ) : (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 18 }}>
              <KpiCard
                label="Dentro da meta de 1ª resposta"
                value={percentual(resumo.dentroPrimeiraResposta, resumo.avaliadosPrimeiraResposta)}
                trend={`${resumo.dentroPrimeiraResposta} de ${resumo.avaliadosPrimeiraResposta} avaliados`}
                icon={<Target size={20} />}
                tone="green"
              />
              <KpiCard
                label="Dentro da meta de resolução"
                value={percentual(resumo.dentroResolucao, resumo.avaliadosResolucao)}
                trend={`${resumo.dentroResolucao} de ${resumo.avaliadosResolucao} avaliados`}
                icon={<Target size={20} />}
                tone="purple"
              />
            </div>
            <p className="small-muted" style={{ marginBottom: 12 }}>
              Comparação por tempo corrido (do momento em que o atendimento foi criado até o evento
              real) contra o prazo configurado em minutos. Réguas com calendário "comercial" (horário
              comercial) não têm a contagem pausada fora do expediente aqui -- a meta pode aparecer
              mais apertada do que a régua realmente pretende nesse caso.
            </p>
            <div className="simple-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th>Volume</th>
                    <th>Dentro da meta de 1ª resposta</th>
                    <th>Dentro da meta de resolução</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.servicos.map((item) => (
                    <tr key={item.servico}>
                      <td>{item.servico}</td>
                      <td>{item.volume}</td>
                      <td>{percentual(item.dentroPrimeiraResposta, item.avaliadosPrimeiraResposta)} ({item.dentroPrimeiraResposta}/{item.avaliadosPrimeiraResposta})</td>
                      <td>{percentual(item.dentroResolucao, item.avaliadosResolucao)} ({item.dentroResolucao}/{item.avaliadosResolucao})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <StandardReportPage
        title="Atendimentos -- detalhe de SLA"
        description="Um atendimento por linha, com tempo de primeira resposta e de resolução calculados, e o cumprimento da meta configurada quando o atendimento tem serviço vinculado."
        filename="relatorio-sla-atendimento"
        funcionalidade="relatorio_sla_atendimento"
        columns={[
          { key: 'canal', label: 'Canal' },
          { key: 'status', label: 'Status' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'criado_em', label: 'Criado em' },
          { key: 'servico', label: 'Serviço' },
          { key: 'primeira_resposta', label: '1ª resposta' },
          { key: 'meta_primeira_resposta', label: 'Meta 1ª resposta' },
          { key: 'resolucao', label: 'Resolução' },
          { key: 'meta_resolucao', label: 'Meta resolução' },
        ]}
        rows={linhasRelatorio}
        loading={loading}
        filters={[
          { key: 'canal', label: 'Canal' },
          { key: 'status', label: 'Status' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'servico', label: 'Serviço' },
        ]}
        dateColumnKey="criado_em"
        emptyMessage="Nenhum atendimento encontrado para os filtros selecionados."
      />
    </>
  );
}
