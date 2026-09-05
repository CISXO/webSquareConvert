'use client';

import { ComponentNode } from '@/lib/types';

interface Props {
  tree: ComponentNode[];
  onClose: () => void;
}

const DEPTH_COLORS = [
  { wrap: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20', label: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { wrap: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20', label: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { wrap: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20', label: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { wrap: 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20', label: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
];

function DesignNode({ node, depth, index }: { node: ComponentNode; depth: number; index: number }) {
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  if (!node.isGroup || node.children.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <span className="text-[11px] font-mono text-gray-300 dark:text-gray-600 w-5 text-right shrink-0">{index + 1}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${color.badge}`}>
          {node.tagName}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
          {node.xmlId || <span className="italic text-gray-300 dark:text-gray-600">id없음</span>}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${color.wrap} p-3`}>
      <div className={`flex items-center gap-2 mb-2.5 ${color.label}`}>
        <span className="text-[11px] font-mono text-gray-300 dark:text-gray-600 w-5 text-right shrink-0">{index + 1}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide">{node.tagName}</span>
        {node.xmlId && (
          <span className="text-[11px] font-mono opacity-60">#{node.xmlId}</span>
        )}
        <span className="ml-auto text-[11px] opacity-50">{node.children.length}개</span>
      </div>
      <div className="flex flex-col gap-2 pl-3">
        {node.children.map((child, idx) => (
          <DesignNode key={child.id} node={child} depth={depth + 1} index={idx} />
        ))}
      </div>
    </div>
  );
}

export default function DesignViewModal({ tree, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-8 pt-16">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold">디자인 뷰</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">현재 컴포넌트 구조 미리보기</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-3">
            {tree.map((node, idx) => (
              <DesignNode key={node.id} node={node} depth={0} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
