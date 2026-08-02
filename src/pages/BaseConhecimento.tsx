import { useMemo, useState } from 'react';
import {
  Archive,
  BellPlus,
  BookOpen,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileImage,
  FileText,
  Image,
  Info,
  Link2,
  Paperclip,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { PageHeader } from '../components/PageHeader';
import { normalizeFilterText } from '../components/SmartFilters';
import { confirmApp } from '../lib/appConfirm';

type KnowledgeState = 'Ativo' | 'Arquivado';

type AttachmentKind = 'Imagem' | 'Arquivo';

type KnowledgeAttachment = {
  id: string;
  nome: string;
  tipo: AttachmentKind;
  tamanho: string;
  dataUrl?: string;
};

type KnowledgeRecord = {
  id: string;
  titulo: string;
  resumo: string;
  situacao: KnowledgeState;
  fonte: string;
  linkFonte: string;
  dataFonte: string;
  classificacao: string;
  assunto: string;
  tags: string[];
  responsavel: string;
  conteudo: string;
  versao: string;
  linkExterno: string;
  origemDetectada: string;
  anexos: KnowledgeAttachment[];
  alertas: number;
  tarefas: number;
  atendimentos: number;
};

type KnowledgePageProps = {
  onSelectDetail?: (detail: unknown) => void;
  onOpenDetail?: (detail: unknown) => void;
};

const classifications = ['Comercial', 'Integração', 'Operacional', 'Produto', 'Regra de negócio', 'Regulatório', 'Suporte'];

const emptyKnowledge: KnowledgeRecord = {
  id: '',
  titulo: '',
  resumo: '',
  situacao: 'Ativo',
  fonte: '',
  linkFonte: '',
  dataFonte: '',
  classificacao: 'Produto',
  assunto: '',
  tags: [],
  responsavel: '',
  conteudo: '',
  versao: '1.0',
  linkExterno: '',
  origemDetectada: 'Cadastro manual',
  anexos: [],
  alertas: 0,
  tarefas: 0,
  atendimentos: 0,
};

const mockKnowledge: KnowledgeRecord[] = [
  {
    id: 'CON-0001',
    titulo: 'Política de atendimento ao cliente',
    resumo: 'Orientação geral para padronizar atendimento, registro e encaminhamento de solicitações.',
    situacao: 'Ativo',
    fonte: 'Nota operacional Produto',
    linkFonte: '',
    dataFonte: '2026-07-23',
    classificacao: 'Regra de negócio',
    assunto: 'Atendimento e relacionamento',
    tags: ['Atendimento', 'Processo', 'Relacionamento'],
    responsavel: 'Produto',
    conteudo: 'O atendimento deve registrar contexto, responsável, evidências e próximo passo para manter rastreabilidade operacional.',
    versao: '1.0',
    linkExterno: 'https://wiki.radar-sus.local/conhecimento/CON-0001',
    origemDetectada: 'Decisão interna',
    anexos: [],
    alertas: 1,
    tarefas: 2,
    atendimentos: 3,
  },
  {
    id: 'CON-0002',
    titulo: 'Procedimento de análise de solicitação',
    resumo: 'Conhecimento base para orientar análise, classificação e acompanhamento de solicitações recebidas por canais digitais.',
    situacao: 'Ativo',
    fonte: 'Fonte institucional',
    linkFonte: 'https://exemplo.com/fonte',
    dataFonte: '2026-07-30',
    classificacao: 'Integração',
    assunto: 'Solicitações',
    tags: ['Solicitação', 'Análise', 'Encaminhamento'],
    responsavel: 'Produto',
    conteudo: 'A orientação deve ser clara, objetiva e indicar quais evidências são necessárias para análise ou encaminhamento.',
    versao: '0.9',
    linkExterno: 'https://wiki.radar-sus.local/conhecimento/CON-0002',
    origemDetectada: 'Página/Site',
    anexos: [],
    alertas: 0,
    tarefas: 1,
    atendimentos: 1,
  },
];

function RequiredMark() {
  return <em className="required-mark">*</em>;
}

function InfoTip({ text }: { text: string }) {
  return <span className="field-info-tip" data-tooltip={text}><Info size={14} /></span>;
}

function FieldLabel({ children, info, required }: { children: React.ReactNode; info: string; required?: boolean }) {
  return <span className="form-label-text">{children} {required && <RequiredMark />} <InfoTip text={info} /></span>;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildExternalLink(id: string) {
  return `https://wiki.radar-sus.local/conhecimento/${id}`;
}

export function BaseConhecimento(_: KnowledgePageProps) {
  const [items, setItems] = useState<KnowledgeRecord[]>(mockKnowledge);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('');
  const [selected, setSelected] = useState<KnowledgeRecord | null>(mockKnowledge[0]);
  const [form, setForm] = useState<KnowledgeRecord>(emptyKnowledge);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewAttachment, setPreviewAttachment] = useState<KnowledgeAttachment | null>(null);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const classFilter = normalizeFilterText(classification);

    return items.filter((item) => {
      const text = normalizeFilterText([
        item.titulo,
        item.resumo,
        item.situacao,
        item.fonte,
        item.classificacao,
        item.assunto,
        item.tags.join(' '),
        item.origemDetectada,
      ].join(' '));

      return (!query || text.includes(query))
        && (!classFilter || normalizeFilterText(item.classificacao) === classFilter);
    });
  }, [items, search, classification]);

  const updateForm = <K extends keyof KnowledgeRecord>(key: K, value: KnowledgeRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [String(key)]: '' }));
  };

  const openNewKnowledge = () => {
    setForm(emptyKnowledge);
    setTagInput('');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      const attachment: KnowledgeAttachment = {
        id: `ATT-${Date.now()}-${file.name}`,
        nome: file.name,
        tipo: file.type.startsWith('image/') ? 'Imagem' : 'Arquivo',
        tamanho: formatFileSize(file.size),
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const withData = { ...attachment, dataUrl: String(reader.result || '') };
          setForm((current) => ({ ...current, anexos: [...current.anexos, withData] }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((current) => ({ ...current, anexos: [...current.anexos, attachment] }));
      }
    });
  };

  const removeAttachment = async (id: string) => {
    const item = form.anexos.find((attachment) => attachment.id === id);
    const confirmed = await confirmApp({
      title: 'Remover anexo',
      description: `Remover o anexo "${item?.nome || id}"?`,
      confirmLabel: 'Remover anexo',
      tone: 'danger',
    });
    if (!confirmed) return;
    setForm((current) => ({ ...current, anexos: current.anexos.filter((attachment) => attachment.id !== id) }));
  };

  const saveKnowledge = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.titulo.trim()) nextErrors.titulo = 'Título é obrigatório.';
    if (!form.resumo.trim()) nextErrors.resumo = 'Resumo é obrigatório.';
    if (!form.conteudo.trim()) nextErrors.conteudo = 'Conteúdo é obrigatório.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const id = `CON-${String(items.length + 1).padStart(4, '0')}`;
    const nextItem: KnowledgeRecord = {
      ...form,
      id,
      situacao: 'Ativo',
      origemDetectada: 'Cadastro manual',
      linkExterno: buildExternalLink(id),
      tags: tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    setItems((current) => [nextItem, ...current]);
    setSelected(nextItem);
    setForm(emptyKnowledge);
    setTagInput('');
    setIsFormOpen(false);
  };

  const archiveKnowledge = async (id: string) => {
    const item = items.find((knowledge) => knowledge.id === id);
    const confirmed = await confirmApp({
      title: 'Arquivar conhecimento',
      description: `Arquivar o conhecimento "${item?.titulo || id}"? Ele deixa de aparecer como ativo, mas permanece consultável no histórico.`,
      confirmLabel: 'Arquivar',
    });
    if (!confirmed) return;
    setItems((current) => current.map((knowledge) => knowledge.id === id ? { ...knowledge, situacao: 'Arquivado' } : knowledge));
    setSelected((current) => current?.id === id ? { ...current, situacao: 'Arquivado' } : current);
  };

  const restoreKnowledge = (id: string) => {
    setItems((current) => current.map((knowledge) => knowledge.id === id ? { ...knowledge, situacao: 'Ativo' } : knowledge));
    setSelected((current) => current?.id === id ? { ...current, situacao: 'Ativo' } : current);
  };

  const deleteKnowledge = async (id: string) => {
    const item = items.find((knowledge) => knowledge.id === id);
    const confirmed = await confirmApp({
      title: 'Excluir conhecimento',
      description: `Excluir definitivamente o conhecimento "${item?.titulo || id}"?`,
      confirmLabel: 'Excluir conhecimento',
      tone: 'danger',
    });
    if (!confirmed) return;
    setItems((current) => current.filter((knowledge) => knowledge.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const generateAlert = (item: KnowledgeRecord) => {
    setItems((current) => current.map((knowledge) => knowledge.id === item.id ? { ...knowledge, alertas: knowledge.alertas + 1 } : knowledge));
    setSelected((current) => current?.id === item.id ? { ...current, alertas: current.alertas + 1 } : current);
    setToast(`Alerta gerado a partir do conhecimento ${item.id}.`);
    window.setTimeout(() => setToast(''), 2400);
  };

  const copyExternalLink = async (item: KnowledgeRecord) => {
    try {
      await navigator.clipboard.writeText(item.linkExterno);
      setToast('Link externo copiado.');
    } catch {
      setToast(item.linkExterno);
    }

    window.setTimeout(() => setToast(''), 2400);
  };

  return (
    <>
      <PageHeader
        title="Base de Conhecimento"
        action={<button className="primary-small" onClick={openNewKnowledge}><Plus size={16} /> Novo conhecimento</button>}
      />

      {toast && <div className="inline-toast">{toast}</div>}

      <section className="card knowledge-functional-card simplified">
        <div className="section-title-row">
          <h3>Conhecimentos registrados</h3>
          <span className="small-muted">{filtered.length} de {items.length} registros</span>
        </div>

        <div className="smart-filter-bar knowledge-filter-bar simplified">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conhecimento, assunto, tag, fonte ou origem identificada..." />
          </div>
          <select value={classification} onChange={(event) => setClassification(event.target.value)}>
            <option value="">Todas as classificações</option>
            {classifications.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="knowledge-table-wrap full">
          <table>
            <thead>
              <tr>
                <th>Conhecimento</th>
                <th>Classificação</th>
                <th>Origem identificada</th>
                <th>Anexos</th>
                <th>Relações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={item.situacao === 'Arquivado' ? 'archived-row' : ''} onClick={() => setSelected(item)}>
                  <td>
                    <strong>{item.titulo}</strong>
                    <div className="table-subtitle">{item.id} • {item.resumo}</div>
                    <div className="knowledge-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    {item.situacao === 'Arquivado' && <Badge tone="blue">Arquivado</Badge>}
                  </td>
                  <td>{item.classificacao}</td>
                  <td>{item.origemDetectada}</td>
                  <td>{item.anexos.length}</td>
                  <td>{item.alertas} alertas • {item.tarefas} tarefas</td>
                  <td>
                    <div className="row-action-group" onClick={(event) => event.stopPropagation()}>
                      <button title="Editar conhecimento"><Edit3 size={16} /></button>
                      <button title="Gerar alerta" onClick={() => generateAlert(item)}><BellPlus size={16} /></button>
                      <button title="Copiar link externo" onClick={() => copyExternalLink(item)}><Share2 size={16} /></button>
                      {item.situacao === 'Ativo'
                        ? <button title="Arquivar" onClick={() => archiveKnowledge(item.id)}><Archive size={16} /></button>
                        : <button title="Restaurar" onClick={() => restoreKnowledge(item.id)}><BookOpen size={16} /></button>}
                      <button title="Excluir" onClick={() => deleteKnowledge(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <section className="knowledge-inline-preview">
            <div className="section-title-row">
              <div>
                <h3>{selected.titulo}</h3>
                <p className="section-description">{selected.resumo}</p>
              </div>
              <div className="header-actions">
                <button className="secondary-btn" onClick={() => generateAlert(selected)}><BellPlus size={16} /> Gerar alerta</button>
                <button className="secondary-btn" onClick={() => copyExternalLink(selected)}><Link2 size={16} /> Link externo</button>
              </div>
            </div>

            <div className="knowledge-preview-grid">
              <div className="knowledge-description-box">
                <h4>Conteúdo</h4>
                <p>{selected.conteudo}</p>
              </div>

              <div className="knowledge-description-box">
                <h4>Anexos e imagens</h4>
                {selected.anexos.length === 0 ? (
                  <p>Nenhum anexo registrado.</p>
                ) : (
                  <div className="knowledge-attachment-list">
                    {selected.anexos.map((attachment) => (
                      <button key={attachment.id} onClick={() => setPreviewAttachment(attachment)}>
                        {attachment.tipo === 'Imagem' ? <Image size={18} /> : <FileText size={18} />}
                        <span>{attachment.nome}</span>
                        <small>{attachment.tamanho}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="knowledge-form-modal simplified">
            <div className="cadastro-modal-header">
              <strong>Novo conhecimento</strong>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Identificação</h3>
                <div className="cadastro-form-grid">
                  <label>
                    <FieldLabel required info="Título objetivo usado para busca, leitura e compartilhamento.">Título</FieldLabel>
                    <input value={form.titulo} onChange={(event) => updateForm('titulo', event.target.value)} placeholder="Ex.: Regra de exportação Atendimento" />
                    {errors.titulo && <small className="field-error">{errors.titulo}</small>}
                  </label>
                  <label>
                    <FieldLabel info="Classificação principal para busca, governança e sugestão do agente.">Classificação</FieldLabel>
                    <select value={form.classificacao} onChange={(event) => updateForm('classificacao', event.target.value)}>
                      {classifications.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    <FieldLabel info="Assunto, módulo, tema ou área relacionada.">Assunto</FieldLabel>
                    <input value={form.assunto} onChange={(event) => updateForm('assunto', event.target.value)} placeholder="Ex.: Atendimento e relacionamento" />
                  </label>
                  <label>
                    <FieldLabel info="Responsável pela curadoria ou validação do conhecimento.">Responsável</FieldLabel>
                    <input value={form.responsavel} onChange={(event) => updateForm('responsavel', event.target.value)} placeholder="Produto, Suporte, Comercial..." />
                  </label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Fonte</h3>
                <div className="cadastro-form-grid">
                  <label><FieldLabel info="Nome da fonte, documento, reunião, ticket, site ou base usada.">Fonte</FieldLabel><input value={form.fonte} onChange={(event) => updateForm('fonte', event.target.value)} placeholder="Nome da fonte" /></label>
                  <label><FieldLabel info="Link da fonte quando existir.">Link da fonte</FieldLabel><input value={form.linkFonte} onChange={(event) => updateForm('linkFonte', event.target.value)} placeholder="https://..." /></label>
                  <label><FieldLabel info="Data da publicação, decisão ou coleta da fonte.">Data da fonte</FieldLabel><input type="date" value={form.dataFonte} onChange={(event) => updateForm('dataFonte', event.target.value)} /></label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Conteúdo</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2">
                    <FieldLabel required info="Resumo curto para leitura rápida, lista e compartilhamento externo.">Resumo</FieldLabel>
                    <input value={form.resumo} onChange={(event) => updateForm('resumo', event.target.value)} placeholder="Resumo do conhecimento" />
                    {errors.resumo && <small className="field-error">{errors.resumo}</small>}
                  </label>
                  <label className="span-2">
                    <FieldLabel required info="Conteúdo principal da base. Pode receber orientação, regra, evidência ou decisão.">Conteúdo</FieldLabel>
                    <textarea value={form.conteudo} onChange={(event) => updateForm('conteudo', event.target.value)} placeholder="Descreva a orientação, regra, evidência ou decisão..." />
                    {errors.conteudo && <small className="field-error">{errors.conteudo}</small>}
                  </label>
                  <label className="span-2">
                    <FieldLabel info="Tags separadas por vírgula para busca e sugestão do agente.">Tags</FieldLabel>
                    <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Atendimento, Relacionamento, Processo" />
                  </label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Imagens e arquivos</h3>
                <label className="knowledge-upload-box">
                  <Paperclip size={30} />
                  <strong>Adicionar imagens ou arquivos</strong>
                  <span>Permite anexar documentos, evidências, prints e imagens para consulta ou download.</span>
                  <input type="file" multiple onChange={(event) => handleFiles(event.target.files)} />
                </label>

                {form.anexos.length > 0 && (
                  <div className="knowledge-attachment-list form">
                    {form.anexos.map((attachment) => (
                      <div key={attachment.id}>
                        {attachment.tipo === 'Imagem' ? <FileImage size={18} /> : <FileText size={18} />}
                        <span>{attachment.nome}</span>
                        <small>{attachment.tamanho}</small>
                        <button onClick={() => removeAttachment(attachment.id)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="cadastro-form-section">
                <h3>Compartilhamento externo</h3>
                <div className="external-link-preview">
                  <ExternalLink size={20} />
                  <div>
                    <strong>Link externo será gerado ao salvar</strong>
                    <span>Usado para consulta por usuários fora do sistema, como uma página de wiki.</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="primary" onClick={saveKnowledge}>Salvar conhecimento</button>
            </div>
          </div>
        </div>
      )}

      {previewAttachment && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="attachment-preview-modal">
            <div className="cadastro-modal-header">
              <strong>{previewAttachment.nome}</strong>
              <button className="icon-btn" onClick={() => setPreviewAttachment(null)}><X size={18} /></button>
            </div>
            <div className="attachment-preview-body">
              {previewAttachment.tipo === 'Imagem' && previewAttachment.dataUrl
                ? <img src={previewAttachment.dataUrl} alt={previewAttachment.nome} />
                : <div className="file-download-placeholder"><Download size={34} /><strong>Arquivo disponível para download</strong><span>{previewAttachment.tamanho}</span></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BaseConhecimento;
