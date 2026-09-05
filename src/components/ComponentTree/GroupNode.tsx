'use client';

import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ComponentNode } from '@/lib/types';
import ComponentCard from './ComponentCard';

interface Props {
  groupId: string;
  children: ComponentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  depth?: number;
}

export default function GroupNode({ groupId, children, selectedId, onSelect, onMoveUp, onMoveDown, onReorder, depth = 0 }: Props) {
  // 아코디언: 이 그룹 내에서 1개만 확장
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = children.findIndex(c => c.id === active.id);
    const newIndex = children.findIndex(c => c.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) onReorder(groupId, oldIndex, newIndex);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedChildId(prev => (prev === id ? null : id));
  };

  if (children.length === 0) {
    return <p className="text-xs text-gray-400 italic px-1">비어있는 그룹</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex flex-col gap-2"
          style={{ paddingLeft: depth > 0 ? `${depth * 8}px` : undefined }}
        >
          {children.map((node, idx) => (
            <ComponentCard
              key={node.id}
              node={node}
              index={idx}
              total={children.length}
              parentId={groupId}
              isSelected={selectedId === node.id}
              isExpanded={expandedChildId === node.id}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleExpand={handleToggleExpand}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onReorder={onReorder}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
