'use client';

import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
  useDroppable,
  DraggableAttributes,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ComponentNode } from '@/lib/types';
import { parseCssString, getElementLabel, getGridColumns } from '@/lib/styleParser';
import { CSSProperties, useMemo } from 'react';

const INTO_PREFIX = 'into:';

/** id -> 부모 그룹 id ('__body__' = 최상위) */
function buildParentMap(nodes: ComponentNode[], parentId: string, map: Map<string, string>) {
  for (const n of nodes) {
    map.set(n.id, parentId);
    if (n.isGroup) buildParentMap(n.children, n.id, map);
  }
}

interface CommonProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  onMoveNode: (activeId: string, parentId: string, beforeId: string | null) => void;
}

// ─── Grid 미리보기 ────────────────────────────────────────────────────────────
function GridPreview({ el, style }: { el: Element; style: CSSProperties }) {
  const cols = getGridColumns(el);
  const visibleCols = cols.filter(c => c.label);
  return (
    <div style={{ ...style, overflow: 'auto', minHeight: 60 }}
      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded text-xs">
      {visibleCols.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {visibleCols.map((c, i) => (
                <th key={i} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300"
                  style={{ minWidth: `${c.width}px` }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {visibleCols.map((_, i) => (
                <td key={i} className="border border-gray-100 dark:border-gray-800 px-2 py-3 text-gray-300 dark:text-gray-600 text-center">
                  —
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="flex items-center justify-center h-12 text-gray-300 dark:text-gray-600 italic">
          Grid View
        </div>
      )}
    </div>
  );
}

// ─── 개별 노드 렌더링 ──────────────────────────────────────────────────────────
function VisualNodeInner({ node, parentId, index, total, props }: {
  node: ComponentNode; parentId: string; index: number; total: number; props: CommonProps;
}) {
  const { selectedId, onSelect, onMoveUp, onMoveDown } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });
  // 그룹 본문에 대한 드롭 존 (자식으로 편입 / 빈 그룹 대응). 비그룹 노드에서는 사용하지 않음.
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({ id: INTO_PREFIX + node.id });

  const sortStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  const isSelected = selectedId === node.id;
  const elStyle = parseCssString(node.element.getAttribute('style'));
  const tag = node.tagName.toLowerCase();

  // ── xf:trigger / button ────────────────────────────────────────────
  if (tag === 'xf:trigger' || tag.includes('trigger')) {
    const label = getElementLabel(node.element);
    return (
      <div ref={setNodeRef} style={sortStyle}
        className={`inline-flex items-center group relative rounded ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(node.id)}>
        <DragHandle attrs={attributes} listeners={listeners} />
        <button
          style={{ ...elStyle, position: 'relative', cursor: 'default' }}
          className="border border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded"
          tabIndex={-1}
        >
          {label || node.xmlId || node.tagName}
        </button>
        <MoveButtons index={index} total={total} parentId={parentId}
          onUp={onMoveUp} onDown={onMoveDown} />
      </div>
    );
  }

  // ── w2:gridView ────────────────────────────────────────────────────
  if (tag.includes('gridview') || tag.includes('grid')) {
    return (
      <div ref={setNodeRef} style={sortStyle}
        className={`relative group rounded ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onSelect(node.id)}>
        <DragHandle attrs={attributes} listeners={listeners} floating />
        <MoveButtons index={index} total={total} parentId={parentId}
          onUp={onMoveUp} onDown={onMoveDown} floating />
        <div className="text-[10px] mb-0.5 font-mono flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            {node.tagName}
          </span>
          <span className="px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">id: {node.xmlId || '없음'}</span>
          <span className="px-1.5 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">tagname: {node.tagName || '없음'}</span>
        </div>
        <GridPreview el={node.element} style={{ height: elStyle.height || '120px' }} />
      </div>
    );
  }

  // ── xf:group (컨테이너) ────────────────────────────────────────────
  if (node.isGroup) {
    const isFlexRow = (elStyle.display === 'flex') ||
      (['height'].some(k => (elStyle as Record<string, string>)[k]?.includes('40px') ||
        (elStyle as Record<string, string>)[k]?.includes('30px')));

    return (
      <div ref={setNodeRef} style={sortStyle}>
        <div
          className={`relative group border-2 rounded-xl transition-colors ${
            isSelected
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
              : 'border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
          }`}
          onClick={e => { e.stopPropagation(); onSelect(node.id); }}
        >
          {/* 그룹 헤더 */}
          <div className="flex items-center gap-1.5 px-2 py-1 border-b border-dashed border-gray-200 dark:border-gray-700">
            <span {...attributes} {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 text-base select-none">⠿</span>
            {/* 1. xf:group 형식 */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {node.tagName}
            </span>
            {/* 2. id */}
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              id: {node.xmlId || '없음'}
            </span>
            {/* 3. tagname */}
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              tagname: {node.tagName || '없음'}
            </span>
            <div className="ml-auto flex gap-0.5">
              <MoveButtons index={index} total={total} parentId={parentId}
                onUp={onMoveUp} onDown={onMoveDown} />
            </div>
          </div>

          {/* 자식 렌더링 */}
          <div
            ref={setDropRef}
            style={{ padding: elStyle.padding || '8px' }}
            className={`flex gap-2 min-h-[32px] rounded-lg transition-colors ${
              isFlexRow ? 'flex-row flex-wrap items-start' : 'flex-col'
            } ${isDropOver ? 'bg-blue-100/60 dark:bg-blue-900/20 outline outline-2 outline-dashed outline-blue-400' : ''}`}
          >
            <SortableContext items={node.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {node.children.length === 0 && (
                <span className="text-[11px] text-gray-300 dark:text-gray-600 italic px-1 py-1">
                  여기로 드래그하여 그룹에 추가
                </span>
              )}
              {node.children.map((child, idx) => (
                <VisualNodeInner
                  key={child.id}
                  node={child}
                  parentId={node.id}
                  index={idx}
                  total={node.children.length}
                  props={props}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </div>
    );
  }

  // ── 기타 ────────────────────────────────────────────────────────────
  return (
    <div ref={setNodeRef} style={sortStyle}
      className={`relative group border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[10px] font-mono text-gray-500 flex items-center gap-1.5 flex-wrap ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect(node.id)}>
      <DragHandle attrs={attributes} listeners={listeners} />
      <span className="px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {node.tagName}
      </span>
      <span className="px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">id: {node.xmlId || '없음'}</span>
      <span className="px-1.5 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">tagname: {node.tagName || '없음'}</span>
      <MoveButtons index={index} total={total} parentId={parentId} onUp={onMoveUp} onDown={onMoveDown} />
    </div>
  );
}

// ─── 드래그 핸들 ──────────────────────────────────────────────────────────────
function DragHandle({ attrs, listeners, floating }: {
  attrs: DraggableAttributes; listeners: SyntheticListenerMap | undefined; floating?: boolean;
}) {
  return (
    <span
      {...attrs}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing text-gray-300 hover:text-blue-400 text-sm select-none transition-colors ${
        floating ? 'absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100' : ''
      }`}
    >
      ⠿
    </span>
  );
}

// ─── 이동 버튼 ────────────────────────────────────────────────────────────────
function MoveButtons({ index, total, parentId, onUp, onDown, floating }: {
  index: number; total: number; parentId: string;
  onUp: (g: string, i: number) => void;
  onDown: (g: string, i: number, t: number) => void;
  floating?: boolean;
}) {
  return (
    <span className={`flex gap-0.5 ${floating ? 'absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100' : ''}`}>
      <button onClick={e => { e.stopPropagation(); onUp(parentId, index); }}
        disabled={index === 0}
        className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 text-[10px] transition-colors">▲</button>
      <button onClick={e => { e.stopPropagation(); onDown(parentId, index, total); }}
        disabled={index === total - 1}
        className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 text-[10px] transition-colors">▼</button>
    </span>
  );
}

// ─── 최상위 VisualView ────────────────────────────────────────────────────────
interface VisualViewProps extends CommonProps {
  tree: ComponentNode[];
}

export default function VisualView({ tree, ...rest }: VisualViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    buildParentMap(tree, '__body__', map);
    return map;
  }, [tree]);

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        XML을 파싱하면 시각적 뷰가 표시됩니다.
      </div>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // 그룹 본문 드롭 존 → 해당 그룹의 맨 끝에 편입
    if (overId.startsWith(INTO_PREFIX)) {
      rest.onMoveNode(activeId, overId.slice(INTO_PREFIX.length), null);
      return;
    }
    // 다른 노드 위 → 그 노드가 속한 부모에서 그 노드 앞에 삽입 (그룹간 이동 포함)
    const targetParent = parentOf.get(overId) ?? '__body__';
    rest.onMoveNode(activeId, targetParent, overId);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tree.map(n => n.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 p-1">
          {tree.map((node, idx) => (
            <VisualNodeInner
              key={node.id}
              node={node}
              parentId="__body__"
              index={idx}
              total={tree.length}
              props={rest}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
