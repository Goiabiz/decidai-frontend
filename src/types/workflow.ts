import type { StatusCategory } from '../lib/statusCategory';

export type WorkflowStatusNode = {
  id: string;
  label: string;
  categoria: StatusCategory;
  posX: number;
  posY: number;
};

export type WorkflowTransition = {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
};

export type Fluxo = {
  id: string;
  nome: string;
  statuses: WorkflowStatusNode[];
  transitions: WorkflowTransition[];
};
