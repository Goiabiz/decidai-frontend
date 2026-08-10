import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { Badge } from './Badge';

export type KanbanColumnDef = { id: string; label: string; tone: string };
export type KanbanItem = { id: string; columnId: string };

type KanbanCardProps<T extends KanbanItem> = { item: T; renderCard: (item: T) => ReactNode };

function KanbanCard<T extends KanbanItem>({ item, renderCard }: KanbanCardProps<T>) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 } : undefined;

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`kanban-card ${isDragging ? 'dragging' : ''}`} style={style}>
      {renderCard(item)}
    </div>
  );
}

function KanbanColumn<T extends KanbanItem>({ column, items, renderCard }: { column: KanbanColumnDef; items: T[]; renderCard: (item: T) => ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'drop-target-active' : ''}`}>
      <div className="kanban-column-header">
        <Badge tone={column.tone}>{column.label}</Badge>
        <span className="kanban-column-count">{items.length}</span>
      </div>
      <div className="kanban-column-body">
        {items.length === 0 && <p className="kanban-column-empty">Nada aqui.</p>}
        {items.map((item) => <KanbanCard key={item.id} item={item} renderCard={renderCard} />)}
      </div>
    </div>
  );
}

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  onMove,
  renderCard,
}: {
  columns: KanbanColumnDef[];
  items: T[];
  onMove: (itemId: string, columnId: string) => void;
  renderCard: (item: T) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const columnId = String(over.id);
    if (!columns.some((column) => column.id === columnId)) return;
    onMove(String(active.id), columnId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} items={items.filter((item) => item.columnId === column.id)} renderCard={renderCard} />
        ))}
      </div>
    </DndContext>
  );
}

export default KanbanBoard;
