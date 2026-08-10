import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import { StatusNode, type StatusNodeData } from './StatusNode';
import type { Fluxo } from '../../types/workflow';
import type { StatusCategory } from '../../lib/statusCategory';

const nodeTypes = { status: StatusNode };

function buildInitialNodes(fluxo: Fluxo): Node<StatusNodeData>[] {
  return fluxo.statuses.map((status) => ({
    id: status.id,
    type: 'status',
    position: { x: status.posX, y: status.posY },
    data: { label: status.label, categoria: status.categoria } as StatusNodeData,
  }));
}

function buildInitialEdges(fluxo: Fluxo): Edge[] {
  return fluxo.transitions.map((transition) => ({
    id: transition.id,
    source: transition.fromId,
    target: transition.toId,
    label: transition.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 },
  }));
}

export type FlowCanvasHandle = {
  getFluxo: () => Fluxo;
};

export const FlowCanvas = forwardRef<FlowCanvasHandle, { fluxo: Fluxo }>(function FlowCanvas({ fluxo }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StatusNodeData>>(buildInitialNodes(fluxo));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(buildInitialEdges(fluxo));

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, label } } : node)));
  }, [setNodes]);

  const updateNodeCategoria = useCallback((id: string, categoria: StatusCategory) => {
    setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, categoria } } : node)));
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const nodesWithHandlers = useMemo(
    () => nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onRename: (label: string) => updateNodeLabel(node.id, label),
        onCategoriaChange: (categoria: StatusCategory) => updateNodeCategoria(node.id, categoria),
        onDelete: () => deleteNode(node.id),
      },
    })),
    [nodes, updateNodeLabel, updateNodeCategoria, deleteNode],
  );

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.5 } }, eds));
  }, [setEdges]);

  const addStatus = useCallback(() => {
    const id = `status-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id,
      type: 'status',
      position: { x: 60 + (nds.length % 3) * 210, y: 60 + Math.floor(nds.length / 3) * 130 },
      data: { label: 'Novo status', categoria: 'novo' as StatusCategory } as StatusNodeData,
    }]);
  }, [setNodes]);

  useImperativeHandle(ref, () => ({
    getFluxo: () => ({
      ...fluxo,
      statuses: nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        categoria: node.data.categoria,
        posX: node.position.x,
        posY: node.position.y,
      })),
      transitions: edges.map((edge) => ({
        id: edge.id,
        fromId: edge.source,
        toId: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      })),
    }),
  }), [fluxo, nodes, edges]);

  return (
    <div className="flow-canvas-wrap">
      <div className="flow-canvas-toolbar">
        <span>Arraste para reposicionar, conecte os pontos para criar transições.</span>
        <button type="button" className="secondary-btn flow-canvas-add-btn" onClick={addStatus}>
          <Plus size={15} /> Novo status
        </button>
      </div>
      <div className="flow-canvas-stage">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          deleteKeyCode={['Backspace', 'Delete']}
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

export default FlowCanvas;
