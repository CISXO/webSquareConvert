'use client';

import { useState, useCallback, useRef } from 'react';
import { useXmlReorder } from '@/hooks/useXmlReorder';
import FileSidebar from '@/components/FileSidebar/FileSidebar';
import ComponentTree from '@/components/ComponentTree/ComponentTree';
import XmlOutputPanel from '@/components/XmlOutputPanel/XmlOutputPanel';
import DesignViewModal from '@/components/DesignViewModal/DesignViewModal';
import DiffModal from '@/components/DiffModal/DiffModal';

export default function Home() {
  const {
    rawXml, setRawXml,
    tree, originalTree,
    error, outputXml, copied,
    xmlFiles, activeFile,
    handleParse, handleFileOpen, handleFolderOpen, handleSelectFile,
    handleReorder, handleMoveNode, handleMoveUp, handleMoveDown,
    handleReset,
    handleCopy, handleSave,
  } = useXmlReorder();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDesignView, setShowDesignView] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasTree = tree.length > 0;

  const handleSelect = (id: string | null) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const doReset = useCallback(() => {
    handleReset();
    showToast('전체 초기화됨 — 원본 순서로 되돌렸습니다');
  }, [handleReset, showToast]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">

      {/* ── 헤더 ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 z-30">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">W</div>
          <span className="text-sm font-bold">WebSquare 컴포넌트 재정렬</span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">같은 그룹 안에서만 순서 변경 가능</span>

          <div className="flex-1" />

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

          {/* 트리 뷰 */}
          <div
            className="flex-1 overflow-y-auto p-2 min-h-0"
            onClick={() => setSelectedId(null)}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">트리 뷰</span>
                {hasTree && (
                  <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    ⠿ 드래그 &nbsp;|&nbsp; ▲▼ 이동
                  </span>
                )}
                {hasTree && (
                  <button
                    onClick={doReset}
                    className="ml-auto text-[11px] px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors font-medium"
                    title="전체를 기존 소스 순서로 되돌리기"
                  >
                    ⟲ 전체 초기화
                  </button>
                )}
              </div>

              <div className="flex-1 p-2" onClick={e => e.stopPropagation()}>
                <ComponentTree
                  tree={tree}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onReorder={handleReorder}
                />
              </div>
            </div>
          </div>

          {/* 결과 XML — 기본 접힘 (트리 영역을 더 넓게) */}
          <div className="shrink-0 px-2 pb-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              {showOutput ? (
                <div className="p-3">
                  <XmlOutputPanel
                    outputXml={outputXml}
                    copied={copied}
                    onCopy={handleCopy}
                    onSave={handleSave}
                    onCollapse={() => setShowOutput(false)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">결과 XML</span>
                  <span className="text-[11px] text-gray-400">
                    {outputXml ? `${outputXml.length.toLocaleString()}자` : '아직 없음'}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!outputXml}
                      className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors disabled:cursor-not-allowed"
                    >
                      {copied ? '복사됨 ✓' : '복사하기'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!outputXml}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors disabled:cursor-not-allowed"
                    >
                      파일로 저장
                    </button>
                    <button
                      onClick={() => setShowOutput(true)}
                      disabled={!outputXml}
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      미리보기 ▲
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 모달 ──────────────────────────────────────────────────────── */}
      {showDesignView && hasTree && (
        <DesignViewModal
          tree={tree}
          onClose={() => setShowDesignView(false)}
          onReset={doReset}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onReorder={handleReorder}
          onMoveNode={handleMoveNode}
        />
      )}
      {showDiff && hasTree && (
        <DiffModal
          originalTree={originalTree}
          currentTree={tree}
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* ── 토스트 ────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg"
        >
          <span className="text-green-400 dark:text-green-600">✓</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
