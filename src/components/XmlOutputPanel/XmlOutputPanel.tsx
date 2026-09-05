'use client';

interface Props {
  outputXml: string;
  copied: boolean;
  onCopy: () => void;
  onSave: () => void;
}

export default function XmlOutputPanel({ outputXml, copied, onCopy, onSave }: Props) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">결과 XML</h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            disabled={!outputXml}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors disabled:cursor-not-allowed"
          >
            {copied ? '복사됨 ✓' : '복사하기'}
          </button>
          <button
            onClick={onSave}
            disabled={!outputXml}
            className="text-xs px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors disabled:cursor-not-allowed"
          >
            파일로 저장
          </button>
        </div>
      </div>

      <textarea
        value={outputXml}
        readOnly
        placeholder="순서를 변경하면 결과 XML이 여기에 표시됩니다..."
        className="flex-1 min-h-[200px] w-full font-mono text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
