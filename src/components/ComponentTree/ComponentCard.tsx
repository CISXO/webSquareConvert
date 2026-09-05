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
  isSelected: boolean;
  isExpanded: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
}

const TAG_COLORS: Record<string, string> = {
  'xf:group':    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'xf:trigger':  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'w2:gridView': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function ComponentCard({
  node, index, total, parentId,
  isSelected, isExpanded, selectedId,
  onSelect, onToggleExpand,
  onMoveUp, onMoveDown, onReorder,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const tagClass = TAG_COLORS[node.tagName] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  const hasChildren = node.isGroup && node.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border overflow-hidden transition-colors ${
        isSelected
          ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500'
          : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-800`}
    >
      {/* 카드 헤더 */}
      <div
        className={`flex items-center gap-1.5 px-2 py-2 cursor-pointer ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'
        }`}
        onClick={() => onSelect(isSelected ? null : node.id)}
      >
        {/* 접기/펼치기 — 왼쪽, 그룹만 */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); onToggleExpand(node.id); }}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded shrink-0 transition-colors"
            title={isExpanded ? '접기' : '펼치기'}
          >
            <span
              className="text-[10px] font-bold inline-block transition-transform duration-150"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ❯
            </span>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* 드래그 핸들 — ❯와 명확히 분리된 위치 */}
        <span
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 select-none text-base leading-none shrink-0"
          title="드래그하여 이동"
        >
          ⠿
        </span>

        {/* 태그 배지 */}
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-medium shrink-0 ${tagClass}`}>
          {node.tagName}
        </span>

        {/* ID */}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate flex-1 min-w-0">
          {node.xmlId || <span className="italic text-gray-300 dark:text-gray-600">id없음</span>}
        </span>

        {/* ▲▼ 이동 — 오른쪽 고정 */}
        <div className="flex gap-0.5 shrink-0 ml-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onMoveUp(parentId, index)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed text-[11px] transition-colors"
            title="위로 이동"
          >▲</button>
          <button
            onClick={() => onMoveDown(parentId, index, total)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed text-[11px] transition-colors"
            title="아래로 이동"
          >▼</button>
        </div>
      </div>

      {/* 중첩 그룹 (아코디언으로 제어) */}
      {hasChildren && isExpanded && (
        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 px-2 py-2 bg-gray-50 dark:bg-gray-800/50">
          <GroupNode
            groupId={node.id}
            children={node.children}
            selectedId={selectedId}
            onSelect={onSelect}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
            depth={1}
          />
        </div>
      )}

      {/* 접힌 요약 */}
      {hasChildren && !isExpanded && (
        <div
          className="border-t border-dashed border-gray-200 dark:border-gray-700 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => onToggleExpand(node.id)}
        >
          <span className="text-[11px] text-gray-400 italic">
            {node.children.length}개 자식 — 클릭하여 펼치기
          </span>
        </div>
      )}
    </div>
  );
}
