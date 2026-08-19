import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import { FlowTriggerNode, type FlowTriggerNodeData } from './FlowTriggerNode';
import { FlowStepNode, type FlowStepNodeData } from './FlowStepNode';
import type { FlowStep, FlowStepType, FlowTriggerType } from '../../services/flows';

const nodeTypes = { trigger: FlowTriggerNode, step: FlowStepNode };

const TRIGGER_NODE_ID = 'trigger';
const NODE_X = 260;
const NODE_Y_STEP = 168;
const NODE_Y_START = 40;

function reorder(steps: FlowStep[]): FlowStep[] {
  return steps.map((step, index) => ({ ...step, stepOrder: index + 1 }));
}

export type FlowBuilderCanvasHandle = {
  getSteps: () => FlowStep[];
};

export type FlowBuilderCanvasProps = {
  initialSteps: FlowStep[];
  triggerType: FlowTriggerType;
  cronExpression: string | null;
};

export const FlowBuilderCanvas = forwardRef<FlowBuilderCanvasHandle, FlowBuilderCanvasProps>(function FlowBuilderCanvas(
  { initialSteps, triggerType, cronExpression },
  ref,
) {
  const [steps, setSteps] = useState<FlowStep[]>(() => reorder(initialSteps));

  const addStep = useCallback(() => {
    setSteps((current) => reorder([...current, {
      stepOrder: current.length + 1,
      stepType: 'instrucao',
      instruction: '',
      requiresHumanApproval: false,
      config: {},
    }]));
  }, []);

  const updateStep = useCallback((index: number, patch: Partial<FlowStep>) => {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps((current) => reorder(current.filter((_, i) => i !== index)));
  }, []);

  const moveStep = useCallback((index: number, direction: -1 | 1) => {
    setSteps((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return reorder(next);
    });
  }, []);

  useImperativeHandle(ref, () => ({
    getSteps: () => steps,
  }), [steps]);

  const nodes: Node[] = useMemo(() => {
    const triggerNode: Node<FlowTriggerNodeData> = {
      id: TRIGGER_NODE_ID,
      type: 'trigger',
      position: { x: NODE_X, y: NODE_Y_START },
      draggable: false,
      selectable: false,
      data: { triggerType, cronExpression },
    };

    const stepNodes: Node<FlowStepNodeData>[] = steps.map((step, index) => ({
      id: `step-${index}`,
      type: 'step',
      position: { x: NODE_X, y: NODE_Y_START + (index + 1) * NODE_Y_STEP },
      draggable: false,
      data: {
        stepOrder: step.stepOrder,
        stepType: step.stepType,
        instruction: step.instruction,
        requiresHumanApproval: step.requiresHumanApproval,
        actionType: typeof step.config.action_type === 'string' ? step.config.action_type : '',
        isFirst: index === 0,
        isLast: index === steps.length - 1,
        onChangeType: (type: FlowStepType) => updateStep(index, { stepType: type }),
        onChangeInstruction: (instruction: string) => updateStep(index, { instruction }),
        onChangeRequiresApproval: (value: boolean) => updateStep(index, { requiresHumanApproval: value }),
        onChangeActionType: (value: string) => updateStep(index, { config: { ...step.config, action_type: value } }),
        onMoveUp: () => moveStep(index, -1),
        onMoveDown: () => moveStep(index, 1),
        onDelete: () => removeStep(index),
      },
    }));

    return [triggerNode, ...stepNodes];
  }, [steps, triggerType, cronExpression, updateStep, moveStep, removeStep]);

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];
    const ids = [TRIGGER_NODE_ID, ...steps.map((_, index) => `step-${index}`)];
    for (let i = 0; i < ids.length - 1; i++) {
      list.push({
        id: `${ids[i]}-${ids[i + 1]}`,
        source: ids[i],
        target: ids[i + 1],
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5 },
      });
    }
    return list;
  }, [steps]);

  return (
    <div className="flow-canvas-wrap">
      <div className="flow-canvas-toolbar">
        <span>Os passos rodam em ordem, de cima para baixo. Use as setas em cada passo para reordenar.</span>
        <button type="button" className="secondary-btn flow-canvas-add-btn" onClick={addStep}>
          <Plus size={15} /> Novo passo
        </button>
      </div>
      <div className="flow-canvas-stage flow-builder-stage">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          panOnScroll
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
});

export default FlowBuilderCanvas;
