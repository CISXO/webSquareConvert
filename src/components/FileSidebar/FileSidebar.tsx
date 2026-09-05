'use client';

import { useRef, useState, useCallback } from 'react';
import { XmlFileEntry } from '@/hooks/useXmlReorder';

interface Props {
  xmlFiles: XmlFileEntry[];
  activeFile: string | null;
  rawXml: string;
  error: string | null;
  onFileOpen: (file: File) => void;
  onFolderOpen: (files: FileList) => void;
  onSelectFile: (entry: XmlFileEntry) => void;
  onChange: (xml: string) => void;
  onParse: (xml: string) => void;
}

export default function FileSidebar({
  xmlFiles, activeFile, rawXml, error,
  onFileOpen, onFolderOpen, onSelectFile, onChange, onParse,
}: Props) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const isOpen = pinned || hovered;

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.trim()) setTimeout(() => onParse(text), 150);
  }, [onParse]);

  return (
    <aside
      className={`relative flex-shrink-0 h-full transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden ${
        isOpen ? 'w-64' : 'w-12'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => !pinned && setHovered(false)}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 dark:border-gray-800 min-h-[48px] shrink-0">
        {isOpen ? (
          <>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
              파일 탐색기
            </span>
            <button
              onClick={() => setPinned(v => !v)}
              className={`ml-2 text-xs px-1.5 py-0.5 rounded transition-colors shrink-0 ${
                pinned
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title={pinned ? '고정 해제' : '사이드바 고정'}
            >
              {pinned ? '고정됨' : '고정'}
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center text-gray-400 dark:text-gray-600 text-lg">≡</div>
        )}
      </div>

      {/* 버튼 액션 */}
      <div className="flex flex-col gap-0.5 p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <SidebarBtn
          icon="📁"
          label="폴더 선택"
          isOpen={isOpen}
          onClick={() => folderRef.current?.click()}
          title="폴더 안의 XML 파일을 모두 불러옴"
        />
        <SidebarBtn
          icon="📄"
          label="파일 열기"
          isOpen={isOpen}
          onClick={() => fileRef.current?.click()}
          title="단일 XML 파일 선택"
        />
        <SidebarBtn
          icon="📋"
          label={showPaste ? 'XML 입력 닫기' : 'XML 붙여넣기'}
          isOpen={isOpen}
          onClick={() => setShowPaste(v => !v)}
          title="XML 소스를 직접 붙여넣기"
          active={showPaste}
        />
      </div>

      {/* 붙여넣기 영역 */}
      {isOpen && showPaste && (
        <div className="p-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <textarea
            value={rawXml}
            onChange={e => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onParse(rawXml);
              }
            }}
            placeholder="XML 붙여넣기 (자동 파싱)&#10;또는 Ctrl+Enter"
            className="w-full h-36 font-mono text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck={false}
          />
          {error && (
            <p className="text-[11px] text-red-500 mt-1 leading-snug">{error}</p>
          )}
          <button
            onClick={() => onParse(rawXml)}
            disabled={!rawXml.trim()}
            className="mt-1.5 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-xs font-medium transition-colors disabled:cursor-not-allowed"
          >
            파싱하기
          </button>
        </div>
      )}

      {/* 파일 목록 */}
      {isOpen && xmlFiles.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-3 py-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            XML 파일 ({xmlFiles.length})
          </div>
          {xmlFiles.map(entry => {
            const isActive = activeFile === entry.path;
            return (
              <button
                key={entry.path}
                onClick={() => onSelectFile(entry)}
                className={`w-full text-left px-3 py-2.5 text-xs transition-colors border-l-2 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-medium truncate">{entry.name}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                  {entry.path}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 숨겨진 input */}
      <input ref={fileRef} type="file" accept=".xml" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileOpen(f); e.target.value = ''; }} />
      <input
        ref={folderRef}
        type="file"
        className="hidden"
        // @ts-expect-error webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        multiple
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) onFolderOpen(e.target.files);
          e.target.value = '';
        }}
      />
    </aside>
  );
}

function SidebarBtn({
  icon, label, isOpen, onClick, title, active,
}: {
  icon: string; label: string; isOpen: boolean;
  onClick: () => void; title?: string; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left w-full ${
        active
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <span className="text-base shrink-0 leading-none">{icon}</span>
      {isOpen && (
        <span className="text-xs truncate">{label}</span>
      )}
    </button>
  );
}
