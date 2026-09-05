'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ComponentNode } from '@/lib/types';
import GroupNode from './GroupNode';

interface Props {
  node: ComponentNode;
  index: number;
  total: number;
  parentId: string;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
}

export default function ComponentCard({ node, index, total, parentId, onMoveUp, onMoveDown, onReorder }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const tagColor: Record<string, string> = {
    'xf:group': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'xf:trigger': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'w2:gridView': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  };
  const tagClass = tagColor[node.tagName] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none text-lg leading-none"
          title="드래그하여 이동"
        >
          ⠿
        </span>

        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-medium shrink-0 ${tagClass}`}>
          {node.tagName}
        </span>

        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate flex-1">
          {node.xmlId || <span className="italic text-gray-400">id없음</span>}
        </span>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onMoveUp(parentId, index)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            title="위로"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(parentId, index, total)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            title="아래로"
          >
            ▼
          </button>
        </div>
      </div>

      {node.isGroup && node.children.length > 0 && (
        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 px-3 py-2">
          <GroupNode
            groupId={node.id}
            children={node.children}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
            depth={1}
          />
        </div>
      )}
    </div>
  );
}
