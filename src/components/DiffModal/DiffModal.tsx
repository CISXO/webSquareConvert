'use client';

import { ComponentNode } from '@/lib/types';

interface Props {
  originalTree: ComponentNode[];
  currentTree: ComponentNode[];
  onClose: () => void;
}

function buildFlatOrder(nodes: ComponentNode[], prefix = ''): { key: string; label: string; depth: number }[] {
  const result: { key: string; label: string; depth: number }[] = [];
  nodes.forEach((node, idx) => {
    const pos = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
    const label = `${node.tagName} · id: ${node.xmlId || '없음'} · tagname: ${node.tagName || '없음'}`;
    result.push({ key: node.id, label, depth: prefix.split('.').filter(Boolean).length });
    if (node.isGroup && node.children.length > 0) {
      result.push(...buildFlatOrder(node.children, pos));
    }
  });
  return result;
}

function DiffList({
  items,
  otherItems,
  title,
  side,
}: {
  items: ReturnType<typeof buildFlatOrder>;
  otherItems: ReturnType<typeof buildFlatOrder>;
  title: string;
  side: 'left' | 'right';
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 ${
        side === 'left' ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-blue-50 dark:bg-blue-900/20'
      }`}>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {items.map((item, idx) => {
          const otherIdx = otherItems.findIndex(o => o.key === item.key);
          const moved = otherIdx !== -1 && otherIdx !== idx;
          const added = otherIdx === -1;

          return (
            <div
              key={`${item.key}-${idx}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                added
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : moved
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ paddingLeft: `${(item.depth * 16) + 12}px` }}
            >
              <span className="font-mono text-gray-300 dark:text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
              <span className="truncate flex-1">{item.label}</span>
              {moved && (
                <span className="shrink-0 text-[10px] text-yellow-600 dark:text-yellow-400">
                  {side === 'right' ? `← 원본 ${otherIdx + 1}번` : `→ 현재 ${otherIdx + 1}번`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DiffModal({ originalTree, currentTree, onClose }: Props) {
  const originalFlat = buildFlatOrder(originalTree);
  const currentFlat = buildFlatOrder(currentTree);

  const changedCount = currentFlat.filter((item, idx) => {
    const origIdx = originalFlat.findIndex(o => o.key === item.key);
    return origIdx !== idx;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 pt-16">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold">변경사항 비교</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {changedCount === 0
                ? '변경된 항목이 없습니다.'
                : <span className="text-yellow-600 dark:text-yellow-400">{changedCount}개 항목의 순서가 변경됨</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 inline-block" />
                순서 변경
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 text-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* 본문: 2컬럼 */}
        <div className="flex-1 flex overflow-hidden divide-x divide-gray-200 dark:divide-gray-700">
          <DiffList
            items={originalFlat}
            otherItems={currentFlat}
            title="원본 순서"
            side="left"
          />
          <DiffList
            items={currentFlat}
            otherItems={originalFlat}
            title="현재 순서"
            side="right"
          />
        </div>
      </div>
    </div>
  );
}
