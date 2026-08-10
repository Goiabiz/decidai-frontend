import type { Fluxo } from '../types/workflow';

export type FlowTemplate = {
  key: string;
  nome: string;
  descricao: string;
  fluxo: Omit<Fluxo, 'id'>;
};

const X = (col: number) => 60 + col * 220;
const Y = (row: number) => 80 + row * 140;

export const flowTemplates: FlowTemplate[] = [
  {
    key: 'desenvolvimento-produto',
    nome: 'Desenvolvimento de Produto',
    descricao: 'Da ideia validada até a publicação — inclui aprovação, fila de desenvolvimento e validação/QA.',
    fluxo: {
      nome: 'Desenvolvimento de Produto',
      statuses: [
        { id: 'nova', label: 'Nova', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'em-analise', label: 'Em Análise', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'aprovado', label: 'Aprovado', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'rejeitado', label: 'Rejeitado', categoria: 'cancelado', posX: X(2), posY: Y(1) },
        { id: 'fila-desenvolvimento', label: 'Fila de Desenvolvimento', categoria: 'andamento', posX: X(3), posY: Y(0) },
        { id: 'em-desenvolvimento', label: 'Em Desenvolvimento', categoria: 'andamento', posX: X(4), posY: Y(0) },
        { id: 'em-validacao', label: 'Em Validação/QA', categoria: 'andamento', posX: X(5), posY: Y(0) },
        { id: 'aguardando-publicacao', label: 'Aguardando Publicação', categoria: 'andamento', posX: X(6), posY: Y(0) },
        { id: 'concluido', label: 'Concluído', categoria: 'concluido', posX: X(7), posY: Y(0) },
        { id: 'cancelado', label: 'Cancelado', categoria: 'cancelado', posX: X(4), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'nova', toId: 'em-analise' },
        { id: 't2', fromId: 'em-analise', toId: 'aprovado' },
        { id: 't3', fromId: 'em-analise', toId: 'rejeitado' },
        { id: 't4', fromId: 'aprovado', toId: 'fila-desenvolvimento' },
        { id: 't5', fromId: 'fila-desenvolvimento', toId: 'em-desenvolvimento' },
        { id: 't6', fromId: 'em-desenvolvimento', toId: 'em-validacao' },
        { id: 't7', fromId: 'em-validacao', toId: 'em-desenvolvimento', label: 'Retrabalho' },
        { id: 't8', fromId: 'em-validacao', toId: 'aguardando-publicacao' },
        { id: 't9', fromId: 'aguardando-publicacao', toId: 'concluido' },
        { id: 't10', fromId: 'fila-desenvolvimento', toId: 'cancelado' },
        { id: 't11', fromId: 'em-desenvolvimento', toId: 'cancelado' },
      ],
    },
  },
  {
    key: 'suporte-produto',
    nome: 'Suporte de Produto',
    descricao: 'Triagem e escalonamento técnico N1/N2/N3, com espera por retorno do cliente.',
    fluxo: {
      nome: 'Suporte de Produto',
      statuses: [
        { id: 'novo-chamado', label: 'Novo Chamado', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'triagem', label: 'Triagem', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'atendimento-n1', label: 'Em Atendimento N1', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'escalado-n2', label: 'Escalado N2', categoria: 'andamento', posX: X(3), posY: Y(0) },
        { id: 'escalado-n3', label: 'Escalado N3/Especialista', categoria: 'andamento', posX: X(4), posY: Y(0) },
        { id: 'aguardando-cliente', label: 'Aguardando Cliente', categoria: 'andamento', posX: X(3), posY: Y(1) },
        { id: 'resolvido', label: 'Resolvido', categoria: 'concluido', posX: X(5), posY: Y(0) },
        { id: 'cancelado', label: 'Cancelado', categoria: 'cancelado', posX: X(1), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'novo-chamado', toId: 'triagem' },
        { id: 't2', fromId: 'triagem', toId: 'atendimento-n1' },
        { id: 't3', fromId: 'atendimento-n1', toId: 'escalado-n2' },
        { id: 't4', fromId: 'escalado-n2', toId: 'escalado-n3' },
        { id: 't5', fromId: 'atendimento-n1', toId: 'aguardando-cliente' },
        { id: 't6', fromId: 'escalado-n2', toId: 'aguardando-cliente' },
        { id: 't7', fromId: 'escalado-n3', toId: 'aguardando-cliente' },
        { id: 't8', fromId: 'aguardando-cliente', toId: 'atendimento-n1', label: 'Cliente respondeu' },
        { id: 't9', fromId: 'atendimento-n1', toId: 'resolvido' },
        { id: 't10', fromId: 'escalado-n2', toId: 'resolvido' },
        { id: 't11', fromId: 'escalado-n3', toId: 'resolvido' },
        { id: 't12', fromId: 'triagem', toId: 'cancelado' },
        { id: 't13', fromId: 'atendimento-n1', toId: 'cancelado' },
      ],
    },
  },
  {
    key: 'atendimento-cliente',
    nome: 'Atendimento ao Cliente',
    descricao: 'Fluxo simples de atendimento direto ao cliente final.',
    fluxo: {
      nome: 'Atendimento ao Cliente',
      statuses: [
        { id: 'novo', label: 'Novo', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'em-atendimento', label: 'Em Atendimento', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'aguardando-resposta', label: 'Aguardando Resposta do Cliente', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'resolvido', label: 'Resolvido', categoria: 'concluido', posX: X(3), posY: Y(0) },
        { id: 'cancelado', label: 'Cancelado', categoria: 'cancelado', posX: X(1), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'novo', toId: 'em-atendimento' },
        { id: 't2', fromId: 'em-atendimento', toId: 'aguardando-resposta' },
        { id: 't3', fromId: 'aguardando-resposta', toId: 'em-atendimento', label: 'Cliente respondeu' },
        { id: 't4', fromId: 'em-atendimento', toId: 'resolvido' },
        { id: 't5', fromId: 'aguardando-resposta', toId: 'resolvido' },
        { id: 't6', fromId: 'em-atendimento', toId: 'cancelado' },
      ],
    },
  },
  {
    key: 'gestao-incidentes',
    nome: 'Gestão de Incidentes',
    descricao: 'Modelo ITSM padrão para tratar incidentes urgentes, do diagnóstico ao monitoramento pós-correção.',
    fluxo: {
      nome: 'Gestão de Incidentes',
      statuses: [
        { id: 'identificado', label: 'Identificado', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'investigando', label: 'Investigando', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'causa-identificada', label: 'Causa Identificada', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'corrigindo', label: 'Corrigindo', categoria: 'andamento', posX: X(3), posY: Y(0) },
        { id: 'monitorando', label: 'Monitorando', categoria: 'andamento', posX: X(4), posY: Y(0) },
        { id: 'resolvido', label: 'Resolvido', categoria: 'concluido', posX: X(5), posY: Y(0) },
        { id: 'falso-positivo', label: 'Falso Positivo', categoria: 'cancelado', posX: X(1), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'identificado', toId: 'investigando' },
        { id: 't2', fromId: 'investigando', toId: 'causa-identificada' },
        { id: 't3', fromId: 'causa-identificada', toId: 'corrigindo' },
        { id: 't4', fromId: 'corrigindo', toId: 'monitorando' },
        { id: 't5', fromId: 'monitorando', toId: 'resolvido' },
        { id: 't6', fromId: 'investigando', toId: 'falso-positivo' },
      ],
    },
  },
  {
    key: 'onboarding-cliente',
    nome: 'Onboarding de Cliente',
    descricao: 'Do contrato assinado até o cliente ativo — provisionamento, configuração e treinamento.',
    fluxo: {
      nome: 'Onboarding de Cliente',
      statuses: [
        { id: 'contrato-assinado', label: 'Contrato Assinado', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'provisionamento', label: 'Provisionamento do Ambiente', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'configuracao-inicial', label: 'Configuração Inicial', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'treinamento', label: 'Treinamento', categoria: 'andamento', posX: X(3), posY: Y(0) },
        { id: 'go-live', label: 'Go-live', categoria: 'andamento', posX: X(4), posY: Y(0) },
        { id: 'ativo', label: 'Ativo', categoria: 'concluido', posX: X(5), posY: Y(0) },
        { id: 'cancelado', label: 'Cancelado', categoria: 'cancelado', posX: X(2), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'contrato-assinado', toId: 'provisionamento' },
        { id: 't2', fromId: 'provisionamento', toId: 'configuracao-inicial' },
        { id: 't3', fromId: 'configuracao-inicial', toId: 'treinamento' },
        { id: 't4', fromId: 'treinamento', toId: 'go-live' },
        { id: 't5', fromId: 'go-live', toId: 'ativo' },
        { id: 't6', fromId: 'provisionamento', toId: 'cancelado' },
        { id: 't7', fromId: 'configuracao-inicial', toId: 'cancelado' },
      ],
    },
  },
  {
    key: 'solicitacao-acesso',
    nome: 'Solicitação de Acesso/Permissão',
    descricao: 'Fluxo curto de aprovação de acesso — do pedido à concessão ou negativa do gestor.',
    fluxo: {
      nome: 'Solicitação de Acesso/Permissão',
      statuses: [
        { id: 'solicitado', label: 'Solicitado', categoria: 'novo', posX: X(0), posY: Y(0) },
        { id: 'aprovacao-gestor', label: 'Aprovação do Gestor', categoria: 'andamento', posX: X(1), posY: Y(0) },
        { id: 'provisionando-acesso', label: 'Provisionando Acesso', categoria: 'andamento', posX: X(2), posY: Y(0) },
        { id: 'concedido', label: 'Concedido', categoria: 'concluido', posX: X(3), posY: Y(0) },
        { id: 'negado', label: 'Negado', categoria: 'cancelado', posX: X(1), posY: Y(1) },
      ],
      transitions: [
        { id: 't1', fromId: 'solicitado', toId: 'aprovacao-gestor' },
        { id: 't2', fromId: 'aprovacao-gestor', toId: 'provisionando-acesso' },
        { id: 't3', fromId: 'provisionando-acesso', toId: 'concedido' },
        { id: 't4', fromId: 'aprovacao-gestor', toId: 'negado' },
      ],
    },
  },
];

export function getFlowTemplate(key: string): FlowTemplate | undefined {
  return flowTemplates.find((template) => template.key === key);
}
