'use client';

import { useMemo, useState, useCallback } from 'react';
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

/** 트리 안 모든 그룹 노드의 id 목록 */
function collectGroupIds(nodes: ComponentNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.isGroup) {
      out.push(n.id);
      collectGroupIds(n.children, out);
    }
  }
  return out;
}

function findById(nodes: ComponentNode[], id: string): ComponentNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.isGroup) {
      const r = findById(n.children, id);
      if (r) return r;
    }
  }
  return null;
}

/** parentId의 직속 자식 배열 ('__body__' = 최상위) */
function childrenOf(tree: ComponentNode[], parentId: string): ComponentNode[] {
  if (parentId === '__body__') return tree;
  return findById(tree, parentId)?.children ?? [];
}

interface Props {
  tree: ComponentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
}

export default function ComponentTree({
  tree, selectedId, onSelect, onMoveUp, onMoveDown, onReorder,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    buildParentMap(tree, '__body__', map);
    return map;
  }, [tree]);

  const allGroupIds = useMemo(() => collectGroupIds(tree), [tree]);

  // 펼침 상태를 트리 전체에서 관리 (여러 그룹 동시 펼침 가능)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const allExpanded = allGroupIds.length > 0 && allGroupIds.every(id => expanded.has(id));
  const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(allGroupIds));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId || overId.startsWith(INTO_PREFIX)) return;

    // 같은 그룹(부모)에 속한 형제끼리만 순서 변경
    const activeParent = parentOf.get(activeId);
    const overParent = parentOf.get(overId);
    if (activeParent == null || activeParent !== overParent) return;

    const siblings = childrenOf(tree, activeParent);
    const oldIndex = siblings.findIndex(n => n.id === activeId);
    const newIndex = siblings.findIndex(n => n.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(activeParent, oldIndex, newIndex);
  };

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        XML을 파싱하면 컴포넌트 트리가 표시됩니다.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="rounded-lg border border-dashed border-blue-300/70 dark:border-blue-800/70 p-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide">body</span>
          <span className="text-[11px] text-gray-400">({tree.length})</span>
          {allGroupIds.length > 0 && (
            <button
              onClick={toggleAll}
              className="ml-auto text-[11px] px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {allExpanded ? '모두 접기' : '모두 펼치기'}
            </button>
          )}
        </div>

        <GroupNode
          groupId="__body__"
          nodes={tree}
          selectedId={selectedId}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          onSelect={onSelect}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onReorder={onReorder}
        />
      </div>
    </DndContext>
  );
}
