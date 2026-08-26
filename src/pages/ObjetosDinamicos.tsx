import { ArrowLeft, Edit3, FlaskConical, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { showAppConfirm } from '../lib/appConfirm';
import { showAppToast } from '../lib/appToast';
import {
  listarObjetosDinamicos, obterObjetoDinamico, listarRegistrosDinamicos,
  criarRegistroDinamico, editarRegistroDinamico, excluirRegistroDinamico,
  type ObjetoDinamicoRecord, type ObjetoDinamicoCompleto, type RegistroDinamico, type CampoDinamico,
} from '../services/objetosDinamicos';

// Adaptive Application Engine, Onda G2 -- UI Schema Engine. Renderiza formulário/tabela a
// partir da DEFINIÇÃO declarada pela Imya (não schema fixo) -- resolve a limitação real do
// construtor "Jira-like" antigo (campos_contexto/telas), que nunca teve onde o dado de fato
// ficasse. Navegação em 2 níveis dentro de 1 única rota, porque objetos são dinâmicos e não
// cabem no sistema de rotas estático (PageKey) do app.

const ESTADO_TONE: Record<ObjetoDinamicoRecord['estado'], string> = {
  DRAFT: 'gray',
  SANDBOX: 'blue',
  PUBLISHED: 'green',
  ARCHIVED: 'gray',
};

const ESTADO_LABEL: Record<ObjetoDinamicoRecord['estado'], string> = {
  DRAFT: 'Rascunho',
  SANDBOX: 'Sandbox (teste)',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

function inputTypeForCampo(tipo: string): string {
  if (tipo === 'Número' || tipo === 'Moeda' || tipo === 'Percentual') return 'number';
  if (tipo === 'Data') return 'date';
  if (tipo === 'Data e hora') return 'datetime-local';
  if (tipo === 'E-mail') return 'email';
  if (tipo === 'Telefone') return 'tel';
  return 'text';
}

function CampoInput({ campo, value, onChange }: { campo: CampoDinamico; value: unknown; onChange: (value: unknown) => void }) {
  if (campo.tipo === 'Parágrafo / Rich text') {
    return <textarea rows={3} value={(value as string) || ''} onChange={(event) => onChange(event.target.value)} />;
  }
  if (campo.tipo === 'Checkbox' || campo.tipo === 'Sim/Não') {
    return <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />;
  }
  const inputType = inputTypeForCampo(campo.tipo);
  return (
    <input
      type={inputType}
      value={(value as string | number) ?? ''}
      onChange={(event) => onChange(inputType === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)}
    />
  );
}

function RegistroFormModal({
  objeto, editing, onClose, onSaved,
}: {
  objeto: ObjetoDinamicoCompleto;
  editing: RegistroDinamico | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dados, setDados] = useState<Record<string, unknown>>(() => editing?.dados ?? {});
  const [salvando, setSalvando] = useState(false);

  const save = async () => {
    setSalvando(true);
    try {
      if (editing) {
        await editarRegistroDinamico(editing.id, dados);
        showAppToast('Registro atualizado.', 'success');
      } else {
        await criarRegistroDinamico(objeto.id, dados);
        showAppToast('Registro criado.', 'success');
      }
      onSaved();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o registro.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="modal-backdrop cadastro-modal-backdrop">
      <div className="agent-modal">
        <div className="cadastro-modal-header">
          <strong>{editing ? 'Editar registro' : `Novo registro — ${objeto.nome}`}</strong>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="cadastro-modal-content">
          <section className="cadastro-form-section">
            <div className="cadastro-form-grid">
              {objeto.campos.map((campo) => (
                <label key={campo.id}>
                  <span>{campo.nome}{campo.obrigatorio ? ' *' : ''}</span>
                  <CampoInput campo={campo} value={dados[campo.nome]} onChange={(value) => setDados((current) => ({ ...current, [campo.nome]: value }))} />
                </label>
              ))}
            </div>
          </section>
        </div>
        <div className="cadastro-modal-footer">
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar registro'}</button>
        </div>
      </div>
    </div>
  );
}

function ObjetoDetalhe({ objetoId, onVoltar }: { objetoId: string; onVoltar: () => void }) {
  const [objeto, setObjeto] = useState<ObjetoDinamicoCompleto | null>(null);
  const [registros, setRegistros] = useState<RegistroDinamico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegistroDinamico | null>(null);

  const carregar = async () => {
    setLoading(true);
    const [objetoResult, registrosResult] = await Promise.all([obterObjetoDinamico(objetoId), listarRegistrosDinamicos(objetoId)]);
    if (objetoResult.error) showAppToast(objetoResult.error, 'error');
    if (registrosResult.error) showAppToast(registrosResult.error, 'error');
    setObjeto(objetoResult.objeto);
    setRegistros(registrosResult.items);
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, [objetoId]);

  const remove = (registro: RegistroDinamico) => {
    void showAppConfirm({
      title: 'Excluir registro',
      description: 'Excluir este registro? O registro fica oculto, não é apagado de verdade.',
      confirmLabel: 'Excluir registro',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await excluirRegistroDinamico(registro.id);
          await carregar();
          showAppToast('Registro excluído.', 'info');
        } catch (error) {
          showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir o registro.', 'error');
        }
      },
    });
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (!objeto) return <p className="muted">Objeto não encontrado.</p>;

  return (
    <>
      <button className="icon-btn" onClick={onVoltar} style={{ marginBottom: 12 }}><ArrowLeft size={16} /> Voltar</button>
      <section className="card fields-api-card">
        <div className="section-title-row">
          <div>
            <h3>{objeto.nome} <Badge tone={ESTADO_TONE[objeto.estado]}>{ESTADO_LABEL[objeto.estado]}</Badge></h3>
            {objeto.descricao && <p className="section-description">{objeto.descricao}</p>}
          </div>
          {objeto.estado === 'PUBLISHED' && (
            <button className="primary-small" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Novo registro</button>
          )}
        </div>

        {objeto.estado !== 'PUBLISHED' && (
          <p className="muted">Este objeto ainda não foi publicado — só objetos publicados aceitam registro por aqui.</p>
        )}

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                {objeto.campos.map((campo) => <th key={campo.id}>{campo.nome}</th>)}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  {objeto.campos.map((campo) => (
                    <td key={campo.id}>
                      {registro.ehTeste && campo.ordem === 0 && <span title="Registro de teste"><FlaskConical size={12} style={{ marginRight: 4 }} /></span>}
                      {String(registro.dados[campo.nome] ?? '—')}
                    </td>
                  ))}
                  <td>
                    <div className="row-action-group">
                      <button title="Editar" onClick={() => { setEditing(registro); setModalOpen(true); }}><Edit3 size={16} /></button>
                      <button title="Excluir" onClick={() => remove(registro)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr><td colSpan={objeto.campos.length + 1} className="empty-note">Nenhum registro ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <RegistroFormModal
          objeto={objeto}
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); void carregar(); }}
        />
      )}
    </>
  );
}

export function ObjetosDinamicos() {
  const [items, setItems] = useState<ObjetoDinamicoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const result = await listarObjetosDinamicos();
    if (result.error) showAppToast(result.error, 'error');
    setItems(result.items);
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, []);

  if (selecionado) {
    return (
      <>
        <PageHeader title="Objetos Dinâmicos" />
        <ObjetoDetalhe objetoId={selecionado} onVoltar={() => { setSelecionado(null); void carregar(); }} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Objetos Dinâmicos" />
      <section className="card fields-api-card">
        <div className="section-title-row">
          <div>
            <h3>Objetos criados pela Imya</h3>
            <p className="section-description">
              Estruturas que você descreveu em conversa e a Imya criou pra você (Adaptive Application Engine). Criação
              de objeto/campo novo continua sendo feita conversando com a Imya — aqui você usa o que já foi definido.
            </p>
          </div>
          <span className="small-muted">{loading ? '...' : `${items.length} objeto(s)`}</span>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr><th>Nome</th><th>Estado</th><th>Versão</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} onClick={() => setSelecionado(item.id)} style={{ cursor: 'pointer' }}>
                  <td><strong>{item.nome}</strong>{item.descricao && <><br /><small className="table-subtitle">{item.descricao}</small></>}</td>
                  <td><Badge tone={ESTADO_TONE[item.estado]}>{ESTADO_LABEL[item.estado]}</Badge></td>
                  <td>{item.versaoAtual}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={3} className="empty-note">Nenhum objeto ainda — peça pra Imya criar um cadastro novo em conversa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default ObjetosDinamicos;
