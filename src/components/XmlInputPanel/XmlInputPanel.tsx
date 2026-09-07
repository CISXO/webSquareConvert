'use client';

import { useRef, useCallback, useState } from 'react';
import { XmlFileEntry } from '@/hooks/useXmlReorder';

interface Props {
  rawXml: string;
  error: string | null;
  xmlFiles: XmlFileEntry[];
  activeFile: string | null;
  onChange: (xml: string) => void;
  onParse: (xml: string) => void;
  onFileOpen: (file: File) => void;
  onFolderOpen: (files: FileList) => void;
  onSelectFile: (entry: XmlFileEntry) => void;
}

export default function XmlInputPanel({
  rawXml, error, xmlFiles, activeFile,
  onChange, onParse, onFileOpen, onFolderOpen, onSelectFile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const pasteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFileList, setShowFileList] = useState(false);

  // 입력/붙여넣기 시 textarea의 "전체 값"을 디바운스해서 파싱한다.
  // (클립보드 조각만 파싱하면 부분 붙여넣기에서 깨진 XML이 넘어간다.)
  const scheduleParse = useCallback((xml: string) => {
    if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
    pasteTimerRef.current = setTimeout(() => {
      if (xml.trim()) onParse(xml);
    }, 250);
  }, [onParse]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    scheduleParse(v);
  }, [onChange, scheduleParse]);

  // Ctrl+Enter로도 파싱 가능
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current);
      onParse(rawXml);
    }
  }, [onParse, rawXml]);

  const hasFiles = xmlFiles.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">XML 입력</h2>

        {/* 파일 열기 */}
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          title="단일 XML 파일 선택"
        >
          파일 열기
        </button>
        <input ref={fileRef} type="file" accept=".xml" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileOpen(f); e.target.value = ''; }} />

        {/* 폴더 선택 */}
        <button
          onClick={() => folderRef.current?.click()}
          className="text-xs px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors"
          title="폴더 선택 — 내부 XML 파일 목록 표시"
        >
          폴더 선택
        </button>
        <input
          ref={folderRef}
          type="file"
          className="hidden"
          // @ts-expect-error webkitdirectory is non-standard
          webkitdirectory=""
          multiple
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              onFolderOpen(e.target.files);
              setShowFileList(true);
            }
            e.target.value = '';
          }}
        />
      </div>

      {/* 폴더 내 파일 목록 */}
      {hasFiles && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            onClick={() => setShowFileList(v => !v)}
          >
            <span>XML 파일 {xmlFiles.length}개 발견</span>
            <span>{showFileList ? '▲' : '▼'}</span>
          </button>

          {showFileList && (
            <ul className="max-h-48 overflow-y-auto border-t border-blue-200 dark:border-blue-800 divide-y divide-blue-100 dark:divide-blue-800/50">
              {xmlFiles.map(entry => (
                <li key={entry.path}>
                  <button
                    onClick={() => onSelectFile(entry)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      activeFile === entry.path
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    }`}
                  >
                    <div className="font-medium truncate">{entry.name}</div>
                    <div className={`truncate mt-0.5 ${activeFile === entry.path ? 'text-blue-200' : 'text-gray-400'}`}>
                      {entry.path}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* XML textarea */}
      <textarea
        value={rawXml}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="WebSquare AI XML을 붙여넣으면 자동으로 파싱됩니다.&#10;(또는 Ctrl+Enter로 수동 파싱)"
        className="flex-1 min-h-[260px] w-full font-mono text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        spellCheck={false}
      />

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* 파싱 버튼 */}
      <button
        onClick={() => onParse(rawXml)}
        disabled={!rawXml.trim()}
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
      >
        파싱하기 <span className="text-blue-200 text-[11px] ml-1">Ctrl+Enter</span>
      </button>
    </div>
  );
}
