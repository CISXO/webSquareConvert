'use client';

import { useState } from 'react';
import { useXmlReorder } from '@/hooks/useXmlReorder';
import FileSidebar from '@/components/FileSidebar/FileSidebar';
import VisualView from '@/components/VisualView/VisualView';
import ComponentTree from '@/components/ComponentTree/ComponentTree';
import XmlOutputPanel from '@/components/XmlOutputPanel/XmlOutputPanel';
import DesignViewModal from '@/components/DesignViewModal/DesignViewModal';
import DiffModal from '@/components/DiffModal/DiffModal';

type ViewMode = 'visual' | 'tree';

export default function Home() {
  const {
    rawXml, setRawXml,
    tree, originalTree,
    error, outputXml, copied,
    xmlFiles, activeFile,
    handleParse, handleFileOpen, handleFolderOpen, handleSelectFile,
    handleReorder, handleMoveUp, handleMoveDown,
    handleCopy, handleSave,
  } = useXmlReorder();

  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDesignView, setShowDesignView] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const hasTree = tree.length > 0;

  const handleSelect = (id: string | null) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">

      {/* ── 헤더 ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">W</div>
          <span className="text-sm font-bold">WebSquare 컴포넌트 재정렬</span>

          {/* 뷰 모드 탭 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setViewMode('visual')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'visual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              시각적 뷰
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              트리 뷰
            </button>
          </div>

          <div className="flex-1" />

          {/* 우측 액션 */}
          {hasTree && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDesignView(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
              >
                디자인 뷰 팝업
              </button>
              <button
                onClick={() => setShowDiff(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 transition-colors font-medium"
              >
                변경 비교
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 바디 ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* 좌측 사이드바 */}
        <FileSidebar
          xmlFiles={xmlFiles}
          activeFile={activeFile}
          rawXml={rawXml}
          error={error}
          onFileOpen={handleFileOpen}
          onFolderOpen={handleFolderOpen}
          onSelectFile={handleSelectFile}
          onChange={setRawXml}
          onParse={handleParse}
        />

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* 뷰 영역 */}
          <div
            className="flex-1 overflow-y-auto p-4 min-h-0"
            onClick={() => setSelectedId(null)}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {viewMode === 'visual' ? '시각적 뷰' : '트리 뷰'}
                </span>
                {hasTree && viewMode === 'visual' && (
                  <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    ⠿ 드래그 &nbsp;|&nbsp; ▲▼ 이동 &nbsp;|&nbsp; 클릭으로 선택
                  </span>
                )}
                {hasTree && viewMode === 'tree' && (
                  <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    ❯ 접기 &nbsp;|&nbsp; ⠿ 드래그 &nbsp;|&nbsp; ▲▼ 이동
                  </span>
                )}
              </div>

              <div className="flex-1 p-4" onClick={e => e.stopPropagation()}>
                {viewMode === 'visual' ? (
                  <VisualView
                    tree={tree}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onReorder={handleReorder}
                  />
                ) : (
                  <ComponentTree
                    tree={tree}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onReorder={handleReorder}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 결과 XML */}
          <div className="shrink-0 px-4 pb-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
              <XmlOutputPanel
                outputXml={outputXml}
                copied={copied}
                onCopy={handleCopy}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 모달 ──────────────────────────────────────────────────────── */}
      {showDesignView && hasTree && (
        <DesignViewModal
          tree={tree}
          onClose={() => setShowDesignView(false)}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onReorder={handleReorder}
        />
      )}
      {showDiff && hasTree && (
        <DiffModal
          originalTree={originalTree}
          currentTree={tree}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
}
