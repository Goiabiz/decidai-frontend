import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { STATUS_CATEGORY_LABELS, STATUS_CATEGORY_ORDER, type StatusCategory } from '../../lib/statusCategory';

export type StatusNodeData = {
  label: string;
  categoria: StatusCategory;
  onRename: (label: string) => void;
  onCategoriaChange: (categoria: StatusCategory) => void;
  onDelete: () => void;
};

export function StatusNode({ data }: NodeProps & { data: StatusNodeData }) {
  return (
    <div className={`status-flow-node tone-${data.categoria}`}>
      <Handle type="target" position={Position.Left} />
      <div className="status-flow-node-top">
        <input
          className="status-flow-node-label"
          value={data.label}
          onChange={(event) => data.onRename(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
        />
        <button type="button" className="status-flow-node-delete" onClick={data.onDelete} title="Remover status">
          <X size={12} />
        </button>
      </div>
      <div className="status-flow-node-category-picker" onPointerDown={(event) => event.stopPropagation()}>
        {STATUS_CATEGORY_ORDER.map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={`status-flow-node-category-dot tone-${categoria} ${data.categoria === categoria ? 'active' : ''}`}
            title={STATUS_CATEGORY_LABELS[categoria]}
            onClick={() => data.onCategoriaChange(categoria)}
          />
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default StatusNode;
