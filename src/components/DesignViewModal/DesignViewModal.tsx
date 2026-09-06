'use client';

import { useState } from 'react';
import { ComponentNode } from '@/lib/types';
import VisualView from '@/components/VisualView/VisualView';

interface Props {
  tree: ComponentNode[];
  onClose: () => void;
  onMoveUp: (groupId: string, index: number) => void;
  onMoveDown: (groupId: string, index: number, total: number) => void;
  onReorder: (groupId: string, oldIndex: number, newIndex: number) => void;
  onMoveNode: (activeId: string, parentId: string, beforeId: string | null) => void;
}

export default function DesignViewModal({ tree, onClose, onMoveUp, onMoveDown, onReorder, onMoveNode }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-12">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold">디자인 뷰</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">드래그 · ▲▼ 버튼으로 직접 순서 변경 가능</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 text-lg transition-colors"
          >×</button>
        </div>
        <div
          className="flex-1 overflow-y-auto p-5"
          onClick={() => setSelectedId(null)}
        >
          <VisualView
            tree={tree}
            selectedId={selectedId}
            onSelect={id => setSelectedId(prev => prev === id ? null : id)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onReorder={onReorder}
            onMoveNode={onMoveNode}
          />
        </div>
      </div>
    </div>
  );
}
