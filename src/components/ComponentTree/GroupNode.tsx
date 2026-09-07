'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ComponentNode } from '@/lib/types';
import ComponentCard from './ComponentCard';

interface Props {
  groupId: string;
  nodes: ComponentNode[];
  selectedId: string | null;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  depth?: number;
}

export default function GroupNode({
  groupId, nodes, selectedId, expanded, onToggleExpand, onSelect,
  onMoveUp, onMoveDown, onReorder, depth = 0,
}: Props) {
  if (nodes.length === 0) {
    return (
      <div className="text-xs italic px-2 py-2 rounded border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
        비어있는 그룹
      </div>
    );
  }

  return (
    <SortableContext items={nodes.map(c => c.id)} strategy={verticalListSortingStrategy}>
      <div
        className="flex flex-col gap-1"
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
            isExpanded={expanded.has(node.id)}
            selectedId={selectedId}
            expanded={expanded}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
          />
        ))}
      </div>
    </SortableContext>
  );
}
