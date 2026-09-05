'use client';

import { useXmlReorder } from '@/hooks/useXmlReorder';
import XmlInputPanel from '@/components/XmlInputPanel/XmlInputPanel';
import ComponentTree from '@/components/ComponentTree/ComponentTree';
import XmlOutputPanel from '@/components/XmlOutputPanel/XmlOutputPanel';

export default function Home() {
  const {
    rawXml, setRawXml,
    tree, error, outputXml, copied,
    xmlFiles, activeFile,
    handleParse, handleFileOpen, handleFolderOpen, handleSelectFile,
    handleReorder, handleMoveUp, handleMoveDown,
    handleCopy, handleSave,
  } = useXmlReorder();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">W</div>
          <div>
            <h1 className="text-base font-bold leading-tight">WebSquare 컴포넌트 재정렬</h1>
            <p className="text-xs text-gray-500">XML 소스코드에서 컴포넌트 순서를 손쉽게 변경하세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 입력 패널 */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <XmlInputPanel
              rawXml={rawXml}
              error={error}
              xmlFiles={xmlFiles}
              activeFile={activeFile}
              onChange={setRawXml}
              onParse={handleParse}
              onFileOpen={handleFileOpen}
              onFolderOpen={handleFolderOpen}
              onSelectFile={handleSelectFile}
            />
          </div>

          {/* 컴포넌트 트리 */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">컴포넌트 트리</h2>
              {tree.length > 0 && (
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  드래그 또는 ▲▼ 버튼으로 순서 변경
                </span>
              )}
            </div>
            <div className="overflow-y-auto max-h-[500px] pr-1">
              <ComponentTree
                tree={tree}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onReorder={handleReorder}
              />
            </div>
          </div>
        </div>

        {/* 결과 출력 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
          <XmlOutputPanel
            outputXml={outputXml}
            copied={copied}
            onCopy={handleCopy}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  );
}
