'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ComponentNode } from '@/lib/types';
import ComponentCard from './ComponentCard';

interface Props {
  groupId: string;
  nodes: ComponentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  onMoveNode: (activeId: string, parentId: string, beforeId: string | null) => void;
  depth?: number;
}

export default function GroupNode({
  groupId, nodes, selectedId, onSelect,
  onMoveUp, onMoveDown, onReorder, onMoveNode, depth = 0,
}: Props) {
  // 아코디언: 이 그룹 내에서 1개만 확장
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: 'into:' + groupId });

  const handleToggleExpand = (id: string) => {
    setExpandedChildId(prev => (prev === id ? null : id));
  };

  if (nodes.length === 0) {
    return (
      <div
        ref={setDropRef}
        className={`text-xs italic px-2 py-3 rounded-lg border border-dashed transition-colors ${
          isOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-500'
            : 'border-gray-200 dark:border-gray-700 text-gray-400'
        }`}
      >
        비어있는 그룹 — 여기로 드래그하여 추가
      </div>
    );
  }

  return (
    <SortableContext items={nodes.map(c => c.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setDropRef}
        className={`flex flex-col gap-2 rounded-lg transition-colors ${
          isOver ? 'outline outline-2 outline-dashed outline-blue-400 bg-blue-50/40 dark:bg-blue-900/10' : ''
        }`}
        style={{ paddingLeft: depth > 0 ? `${depth * 8}px` : undefined }}
      >
        {nodes.map((node, idx) => (
          <ComponentCard
            key={node.id}
            node={node}
            index={idx}
            total={nodes.length}
            parentId={groupId}
            isSelected={selectedId === node.id}
            isExpanded={expandedChildId === node.id}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleExpand={handleToggleExpand}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
            onMoveNode={onMoveNode}
          />
        ))}
      </div>
    </SortableContext>
  );
}
