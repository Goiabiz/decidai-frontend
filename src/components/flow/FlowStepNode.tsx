import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowDown, ArrowUp, MessageSquareText, X, Zap } from 'lucide-react';
import type { FlowStepType } from '../../services/flows';

export type FlowStepNodeData = {
  stepOrder: number;
  stepType: FlowStepType;
  instruction: string;
  requiresHumanApproval: boolean;
  actionType: string;
  isFirst: boolean;
  isLast: boolean;
  onChangeType: (type: FlowStepType) => void;
  onChangeInstruction: (instruction: string) => void;
  onChangeRequiresApproval: (value: boolean) => void;
  onChangeActionType: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function FlowStepNode({ data }: NodeProps & { data: FlowStepNodeData }) {
  return (
    <div className={`flow-step-node tone-${data.stepType}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-step-node-top">
        <span className="flow-step-node-order">{data.stepOrder}</span>
        <div className="flow-step-node-type-picker" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className={`flow-step-node-type-btn ${data.stepType === 'instrucao' ? 'active' : ''}`}
            onClick={() => data.onChangeType('instrucao')}
            title="Instrução (o agente responde/decide)"
          >
            <MessageSquareText size={12} /> Instrução
          </button>
          <button
            type="button"
            className={`flow-step-node-type-btn ${data.stepType === 'acao' ? 'active' : ''}`}
            onClick={() => data.onChangeType('acao')}
            title="Ação (efeito real, sempre com confirmação humana)"
          >
            <Zap size={12} /> Ação
          </button>
        </div>
        <button type="button" className="flow-step-node-delete" onClick={data.onDelete} title="Remover passo">
          <X size={12} />
        </button>
      </div>

      <textarea
        className="flow-step-node-instruction"
        value={data.instruction}
        onChange={(event) => data.onChangeInstruction(event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        placeholder={data.stepType === 'acao' ? 'O que a ação deve fazer (ex.: reiniciar o serviço X)' : 'O que o agente deve fazer/responder neste passo'}
        rows={2}
      />

      {data.stepType === 'acao' && (
        <div onPointerDown={(event) => event.stopPropagation()}>
          <input
            className="flow-step-node-action-type"
            value={data.actionType}
            onChange={(event) => data.onChangeActionType(event.target.value)}
            placeholder="identificador da ação (ex.: restart_service)"
          />
          <label className="flow-step-node-approval">
            <input
              type="checkbox"
              checked={data.requiresHumanApproval}
              onChange={(event) => data.onChangeRequiresApproval(event.target.checked)}
            />
            Marcar como sensível (metadado)
          </label>
          <p className="flow-step-node-approval-note">Hoje toda ação sempre pausa para confirmação humana, independente desta marcação.</p>
        </div>
      )}

      <div className="flow-step-node-move" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" disabled={data.isFirst} onClick={data.onMoveUp} title="Mover para cima"><ArrowUp size={12} /></button>
        <button type="button" disabled={data.isLast} onClick={data.onMoveDown} title="Mover para baixo"><ArrowDown size={12} /></button>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default FlowStepNode;
