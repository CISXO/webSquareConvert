'use client';

import { useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { ComponentNode } from '@/lib/types';
import GroupNode from './GroupNode';

const INTO_PREFIX = 'into:';

/** id -> 부모 그룹 id ('__body__' = 최상위) */
function buildParentMap(nodes: ComponentNode[], parentId: string, map: Map<string, string>) {
  for (const n of nodes) {
    map.set(n.id, parentId);
    if (n.isGroup) buildParentMap(n.children, n.id, map);
  }
}

interface Props {
  tree: ComponentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  onMoveNode: (activeId: string, parentId: string, beforeId: string | null) => void;
}

export default function ComponentTree({ tree, selectedId, onSelect, onMoveUp, onMoveDown, onReorder, onMoveNode }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    buildParentMap(tree, '__body__', map);
    return map;
  }, [tree]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (overId.startsWith(INTO_PREFIX)) {
      onMoveNode(activeId, overId.slice(INTO_PREFIX.length), null);
      return;
    }
    const targetParent = parentOf.get(overId) ?? '__body__';
    onMoveNode(activeId, targetParent, overId);
  };

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        XML을 파싱하면 컴포넌트 트리가 표시됩니다.
      </div>
    );
  }

  const shared = { selectedId, onSelect, onMoveUp, onMoveDown, onReorder, onMoveNode };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {tree.length > 1 ? (
        <div className="rounded-xl border border-dashed border-blue-300 dark:border-blue-700 p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide">body</span>
            <span className="text-[11px] text-gray-400">({tree.length}개)</span>
          </div>
          <GroupNode groupId="__body__" nodes={tree} {...shared} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tree.map(node => (
            <div key={node.id} className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {node.tagName}
                </span>
                {node.xmlId && (
                  <span className="text-[11px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    #{node.xmlId}
                  </span>
                )}
              </div>
              {node.isGroup ? (
                <GroupNode groupId={node.id} nodes={node.children} {...shared} />
              ) : (
                <div className="text-xs text-gray-400 italic px-1">
                  {node.tagName} {node.xmlId ? `#${node.xmlId}` : ''} — 단일 컴포넌트
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DndContext>
  );
}
