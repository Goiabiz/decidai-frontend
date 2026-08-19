import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Clock } from 'lucide-react';
import type { FlowTriggerType } from '../../services/flows';

export type FlowTriggerNodeData = {
  triggerType: FlowTriggerType;
  cronExpression: string | null;
};

// Só exibição -- edição real dos campos de trigger fica no formulário acima do canvas
// (FlowEditor), pra não duplicar estado entre dois lugares. O nó existe pra deixar visível,
// no próprio canvas, que toda cadeia de passos começa por um disparo.
export function FlowTriggerNode({ data }: NodeProps & { data: FlowTriggerNodeData }) {
  return (
    <div className="flow-step-node flow-trigger-node">
      <div className="flow-step-node-top">
        {data.triggerType === 'cron' ? <Clock size={14} /> : <Zap size={14} />}
        <span className="flow-step-node-title">{data.triggerType === 'cron' ? 'Disparo agendado' : 'Disparo manual'}</span>
      </div>
      {data.triggerType === 'cron' && (
        <p className="flow-step-node-sub">{data.cronExpression || 'expressão cron não definida'}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default FlowTriggerNode;
