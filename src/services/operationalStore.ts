import type { PanelDetail } from '../components/RightPanel';
import { persistAuditLog, persistOperationalHistory, persistOperationalPatch, persistRoadmapItem } from './operationalSupabase';

export type OperationalPatch = {
  title: string;
  status?: string;
  prioridade?: string;
  responsavel?: string;
  resumo?: string;
  descartado?: boolean;
  revisao?: boolean;
  updatedAt: string;
};

export type OperationalHistory = {
  id: string;
  title: string;
  action: string;
  description: string;
  user: string;
  createdAt: string;
};

export type GeneratedRoadmapItem = {
  id: string;
  origem: string;
  resumo: string;
  criticidade: string;
  responsavel: string;
  prazo: string;
  status: string;
  createdAt: string;
};

const PATCHES_KEY = 'radar-sus-operational-patches';
const HISTORY_KEY = 'radar-sus-operational-history';
const ROADMAP_KEY = 'radar-sus-generated-roadmap';
const USER = 'Moises Mattos';

const now = () => new Date().toISOString();
const eventName = 'radar-sus-operational-updated';

const readObject = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const readArray = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(eventName));
};

export const getOperationalEventName = () => eventName;

export const getDetailKey = (detail: PanelDetail | string) => {
  if (typeof detail === 'string') return detail;
  return detail.title;
};

export const getPatch = (detail: PanelDetail | string): OperationalPatch | null => {
  const patches = readObject<Record<string, OperationalPatch>>(PATCHES_KEY, {});
  return patches[getDetailKey(detail)] ?? null;
};

export const getAllPatches = () => readObject<Record<string, OperationalPatch>>(PATCHES_KEY, {});

export const addHistory = (title: string, action: string, description: string) => {
  const history = readArray<OperationalHistory>(HISTORY_KEY);
  history.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    action,
    description,
    user: USER,
    createdAt: now()
  });
  write(HISTORY_KEY, history.slice(0, 200));

  persistOperationalHistory(history[0]).catch(() => undefined);
  persistAuditLog({
    usuarioNome: USER,
    modulo: 'Workspace',
    operacao: 'agent_action',
    origem: 'histórico operacional local',
    registroId: history[0].id,
    dadosDepois: history[0],
    observacao: `${action}: ${description}`
  }).catch(() => undefined);
};

export const getHistory = (detail: PanelDetail | string) => {
  const title = getDetailKey(detail);
  return readArray<OperationalHistory>(HISTORY_KEY).filter((item) => item.title === title);
};

export const updateOperationalPatch = (detail: PanelDetail, patch: Partial<OperationalPatch>) => {
  const title = getDetailKey(detail);
  const patches = readObject<Record<string, OperationalPatch>>(PATCHES_KEY, {});
  const previous = patches[title];

  patches[title] = {
    ...previous,
    title,
    ...patch,
    updatedAt: now()
  };

  write(PATCHES_KEY, patches);

  persistOperationalPatch(patches[title]).catch(() => undefined);
  persistAuditLog({
    usuarioNome: USER,
    modulo: 'Workspace',
    operacao: 'update',
    origem: 'edição inline',
    registroId: title,
    dadosAntes: previous,
    dadosDepois: patches[title]
  }).catch(() => undefined);

  const changed = Object.entries(patch)
    .filter(([key]) => key !== 'title' && key !== 'updatedAt')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  addHistory(title, 'Atualização inline', changed || 'Item atualizado na área de trabalho.');
};

export const discardItem = (detail: PanelDetail) => {
  updateOperationalPatch(detail, { status: 'Descartado', descartado: true });
  addHistory(detail.title, 'Item descartado', 'O item foi descartado operacionalmente nesta POC.');
};

export const markReview = (detail: PanelDetail) => {
  updateOperationalPatch(detail, { status: 'Aguardando revisão do PO', revisao: true });
  addHistory(detail.title, 'Revisão solicitada', 'O item foi marcado para revisão do PO.');
};

export const createRoadmapItem = (detail: PanelDetail) => {
  const roadmap = readArray<GeneratedRoadmapItem>(ROADMAP_KEY);
  const existing = roadmap.find((item) => item.origem === detail.title);

  if (existing) {
    addHistory(detail.title, 'Roadmap já existente', 'Já existe um item de roadmap gerado a partir deste registro.');
    return existing;
  }

  const item: GeneratedRoadmapItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    origem: detail.title,
    resumo: `Decisão — ${detail.title}`,
    criticidade: detail.badge || 'Média',
    responsavel: USER,
    prazo: new Date().toLocaleDateString('pt-BR'),
    status: 'Pendente',
    createdAt: now()
  };

  roadmap.unshift(item);
  write(ROADMAP_KEY, roadmap);

  persistRoadmapItem(item).catch(() => undefined);
  persistAuditLog({
    usuarioNome: USER,
    modulo: 'Roadmap',
    operacao: 'insert',
    origem: detail.title,
    registroId: item.id,
    dadosDepois: item
  }).catch(() => undefined);

  addHistory(detail.title, 'Item enviado para Roadmap', 'Foi gerado um item de roadmap a partir deste registro.');
  return item;
};

export const getGeneratedRoadmapItems = () => readArray<GeneratedRoadmapItem>(ROADMAP_KEY);

export const clearOperationalLocalData = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PATCHES_KEY);
  window.localStorage.removeItem(HISTORY_KEY);
  window.localStorage.removeItem(ROADMAP_KEY);
  window.dispatchEvent(new CustomEvent(eventName));
};

