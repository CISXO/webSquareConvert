'use client';

import { ComponentNode } from '@/lib/types';
import GroupNode from './GroupNode';

interface Props {
  tree: ComponentNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
}

export default function ComponentTree({ tree, selectedId, onSelect, onMoveUp, onMoveDown, onReorder }: Props) {
  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        XML을 파싱하면 컴포넌트 트리가 표시됩니다.
      </div>
    );
  }

  if (tree.length > 1) {
    return (
      <div className="rounded-xl border border-dashed border-blue-300 dark:border-blue-700 p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide">body</span>
          <span className="text-[11px] text-gray-400">({tree.length}개)</span>
        </div>
        <GroupNode
          groupId="__body__"
          children={tree}
          selectedId={selectedId}
          onSelect={onSelect}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onReorder={onReorder}
        />
      </div>
    );
  }

  return (
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
            <GroupNode
              groupId={node.id}
              children={node.children}
              selectedId={selectedId}
              onSelect={onSelect}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onReorder={onReorder}
            />
          ) : (
            <div className="text-xs text-gray-400 italic px-1">
              {node.tagName} {node.xmlId ? `#${node.xmlId}` : ''} — 단일 컴포넌트
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
