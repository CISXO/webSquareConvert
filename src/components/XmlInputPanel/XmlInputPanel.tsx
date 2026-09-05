'use client';

import { useRef } from 'react';

interface Props {
  rawXml: string;
  error: string | null;
  onChange: (xml: string) => void;
  onParse: (xml: string) => void;
  onFileOpen: (file: File) => void;
}

export default function XmlInputPanel({ rawXml, error, onChange, onParse, onFileOpen }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">XML 입력</h2>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        >
          파일 열기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onFileOpen(file);
            e.target.value = '';
          }}
        />
      </div>

      <textarea
        value={rawXml}
        onChange={e => onChange(e.target.value)}
        placeholder="WebSquare AI XML 소스코드를 붙여넣으세요..."
        className="flex-1 min-h-[320px] w-full font-mono text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        spellCheck={false}
      />

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={() => onParse(rawXml)}
        disabled={!rawXml.trim()}
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
      >
        파싱하기
      </button>
    </div>
  );
}
