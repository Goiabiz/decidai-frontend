import { LayoutGrid, Columns3, Filter, PanelRight, X, Save, RotateCcw } from 'lucide-react';
import type { PageKey } from '../App';

const labels: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  alertas: 'Alertas Inteligentes',
  analise: 'AnÃ¡lise e AÃ§Ãµes',
  base: 'Base de Conhecimento',
  atendimento: 'Central de Atendimento',
  config: 'ParametrizaÃ§Ã£o'
};

const moduleOptions: Record<PageKey, string[]> = {
  dashboard: ['Cards executivos', 'EvoluÃ§Ã£o de alertas', 'Resumo do dia', 'Impactos recentes'],
  alertas: ['KPIs de alertas', 'Lista de alertas', 'Filtros por criticidade', 'Painel de detalhe'],
  analise: ['Fila de pendÃªncias', 'HistÃ³rico de decisÃ£o', 'ResponsÃ¡vel', 'Prazo e validaÃ§Ã£o'],
  base: ['Documentos', 'Fontes', 'Curadoria', 'Tags e trechos indexados'],
  atendimento: ['Atendimentos', 'Tickets', 'IntegraÃ§Ãµes', 'SLA e canal'],
  config: ['Clientes', 'IntegraÃ§Ãµes', 'UsuÃ¡rios', 'AparÃªncia e permissÃµes']
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
            <span className="modal-eyebrow">Ãrea de trabalho</span>
            <h2>Personalizar {labels[activePage]}</h2>
            <p>Configure a visÃ£o do mÃ³dulo para reduzir ruÃ­do e destacar o que importa para sua operaÃ§Ã£o.</p>
          </div>
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Fechar personalizaÃ§Ã£o">
            <X size={18} />
          </button>
        </header>

        <div className="workspace-modal-body">
          <section className="workspace-option-card highlight">
            <div className="workspace-option-icon"><LayoutGrid size={20} /></div>
            <div>
              <h3>Modelo padrÃ£o do mÃ³dulo</h3>
              <p>Comece com a visÃ£o recomendada para este mÃ³dulo e ajuste apenas o necessÃ¡rio.</p>
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
              <label><input type="checkbox" defaultChecked /> Exibir responsÃ¡vel</label>
              <label><input type="checkbox" defaultChecked /> Exibir prioridade/criticidade</label>
              <label><input type="checkbox" /> Exibir data de atualizaÃ§Ã£o</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><Filter size={19} /></div>
              <h3>Filtros rÃ¡pidos</h3>
              <label><input type="checkbox" defaultChecked /> Salvar filtros por usuÃ¡rio</label>
              <label><input type="checkbox" defaultChecked /> Fixar filtros frequentes</label>
              <label><input type="checkbox" /> Abrir sempre com pendentes</label>
              <label><input type="checkbox" /> Agrupar por mÃ³dulo/status</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><PanelRight size={19} /></div>
              <h3>Painel lateral</h3>
              <label><input type="radio" name="panel" defaultChecked /> Aberto por padrÃ£o</label>
              <label><input type="radio" name="panel" /> Recolhido por padrÃ£o</label>
              <label><input type="checkbox" defaultChecked /> Abrir prÃ©via ao clicar na linha</label>
              <label><input type="checkbox" defaultChecked /> Permitir detalhe expandido</label>
            </section>

            <section className="workspace-option-card">
              <div className="workspace-option-icon"><LayoutGrid size={19} /></div>
              <h3>Cards e indicadores</h3>
              <label><input type="checkbox" defaultChecked /> Mostrar KPIs principais</label>
              <label><input type="checkbox" defaultChecked /> Mostrar listas recentes</label>
              <label><input type="checkbox" /> Ocultar grÃ¡ficos demonstrativos</label>
              <label><input type="checkbox" /> Compactar espaÃ§amento</label>
            </section>
          </div>

          <section className="workspace-roadmap-note">
            <strong>Roadmap:</strong> essas preferÃªncias serÃ£o gravadas por usuÃ¡rio/perfil e conectadas ao Supabase em etapa futura.
          </section>
        </div>

        <footer className="workspace-modal-footer">
          <button className="secondary-btn"><RotateCcw size={16} /> Restaurar padrÃ£o</button>
          <button className="primary"><Save size={16} /> Salvar preferÃªncias</button>
        </footer>
      </section>
    </div>
  );
}

