import { LayoutGrid, Columns3, Filter, PanelRight, X, Save, RotateCcw } from 'lucide-react';
import type { PageKey } from '../App';

const labels: Partial<Record<PageKey, string>> = {
  dashboard: 'Dashboard',
  alertas: 'Alertas Inteligentes',
  analise: 'Análise e Ações',
  base: 'Base de Conhecimento',
  atendimento: 'Central de Atendimento',
  'param-admin': 'Parametrização'
};

const moduleOptions: Partial<Record<PageKey, string[]>> = {
  dashboard: ['Cards executivos', 'Evolução de alertas', 'Resumo do dia', 'Impactos recentes'],
  alertas: ['KPIs de alertas', 'Lista de alertas', 'Filtros por criticidade', 'Painel de detalhe'],
  analise: ['Fila de pendências', 'Histórico de decisão', 'Responsável', 'Prazo e validação'],
  base: ['Documentos', 'Fontes', 'Curadoria', 'Tags e trechos indexados'],
  atendimento: ['Atendimentos', 'Tickets', 'Integrações', 'SLA e canal'],
  'param-admin': ['Clientes', 'Integrações', 'Usuários', 'Aparência e permissões']
};

export function WorkspaceCustomizeModal({
  activePage,
  open,
  onClose
}: {
  activePage: PageKey;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="workspace-modal-backdrop" role="dialog" aria-modal="true">
      <section className="workspace-modal">
        <header className="workspace-modal-header">
          <div>
            <span className="modal-eyebrow">Área de trabalho</span>
            <h2>Personalizar {labels[activePage]}</h2>
            <p>Configure a visão do módulo para reduzir ruído e destacar o que importa para sua operação.</p>
          </div>
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Fechar personalização">
            <X size={18} />
          </button>
        </header>

        <div className="workspace-modal-body">
          <section className="workspace-option-card highlight">
            <div className="workspace-option-icon"><LayoutGrid size={20} /></div>
            <div>
              <h3>Modelo padrão do módulo</h3>
              <p>Comece com a visão recomendada para este módulo e ajuste apenas o necessário.</p>
              <div className="workspace-tags">
                {moduleOptions[activePage].map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          </section>

          <div className="workspace-grid">
            <section className="workspace-option-card">
              <div className="workspace-option-icon"><Columns3 size={19} /></div>
              <h3>Colunas da tabela</h3>
              <label><input type="checkbox" defaultChecked /> Exibir status</label>
              <label><input type="checkbox" defaultChecked /> Exibir responsável</label>
              <label><input type="checkbox" defaultChecked /> Exibir prioridade/criticidade</label>
              <label><input type="checkbox" /> Exibir data de atualização</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><Filter size={19} /></div>
              <h3>Filtros rápidos</h3>
              <label><input type="checkbox" defaultChecked /> Salvar filtros por usuário</label>
              <label><input type="checkbox" defaultChecked /> Fixar filtros frequentes</label>
              <label><input type="checkbox" /> Abrir sempre com pendentes</label>
              <label><input type="checkbox" /> Agrupar por módulo/status</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><PanelRight size={19} /></div>
              <h3>Painel lateral</h3>
              <label><input type="radio" name="panel" defaultChecked /> Aberto por padrão</label>
              <label><input type="radio" name="panel" /> Recolhido por padrão</label>
              <label><input type="checkbox" defaultChecked /> Abrir prévia ao clicar na linha</label>
              <label><input type="checkbox" defaultChecked /> Permitir detalhe expandido</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><LayoutGrid size={19} /></div>
              <h3>Cards e indicadores</h3>
              <label><input type="checkbox" defaultChecked /> Mostrar KPIs principais</label>
              <label><input type="checkbox" defaultChecked /> Mostrar listas recentes</label>
              <label><input type="checkbox" /> Ocultar gráficos demonstrativos</label>
              <label><input type="checkbox" /> Compactar espaçamento</label>
            </section>
          </div>

          <section className="workspace-roadmap-note">
            <strong>Roadmap:</strong> essas preferências serão gravadas por usuário/perfil e conectadas ao Supabase em etapa futura.
          </section>
        </div>

        <footer className="workspace-modal-footer">
          <button className="secondary-btn"><RotateCcw size={16} /> Restaurar padrão</button>
          <button className="primary"><Save size={16} /> Salvar preferências</button>
        </footer>
      </section>
    </div>
  );
}


