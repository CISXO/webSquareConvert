'use client';

import { useState, useCallback } from 'react';
import { ComponentNode, ParsedXml } from '@/lib/types';
import { parseWebSquareXml } from '@/lib/xmlParser';
import { serializeToXml } from '@/lib/xmlSerializer';

export interface XmlFileEntry {
  name: string;
  path: string;
  content: string;
}

function cloneTree(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.map(n => ({ ...n, children: cloneTree(n.children) }));
}

function updateGroupChildren(
  tree: ComponentNode[],
  groupId: string,
  updater: (children: ComponentNode[]) => ComponentNode[]
): ComponentNode[] {
  return tree.map(node => {
    if (node.id === groupId) return { ...node, children: updater(node.children) };
    if (node.isGroup) return { ...node, children: updateGroupChildren(node.children, groupId, updater) };
    return node;
  });
}

export function useXmlReorder() {
  const [rawXml, setRawXml] = useState('');
  const [parsed, setParsed] = useState<ParsedXml | null>(null);
  const [tree, setTree] = useState<ComponentNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputXml, setOutputXml] = useState('');
  const [copied, setCopied] = useState(false);
  const [xmlFiles, setXmlFiles] = useState<XmlFileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const rebuild = useCallback((p: ParsedXml, t: ComponentNode[]) => {
    try {
      setOutputXml(serializeToXml(p, t));
    } catch {
      setOutputXml('');
    }
  }, []);

  const handleParse = useCallback((xml: string) => {
    setError(null);
    try {
      const result = parseWebSquareXml(xml);
      setParsed(result);
      const t = cloneTree(result.tree);
      setTree(t);
      rebuild(result, t);
    } catch (e) {
      setError((e as Error).message);
      setParsed(null);
      setTree([]);
      setOutputXml('');
    }
  }, [rebuild]);

  const handleFileOpen = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      setRawXml(content);
      handleParse(content);
    };
    reader.readAsText(file, 'UTF-8');
  }, [handleParse]);

  const handleFolderOpen = useCallback((files: FileList) => {
    const xmlList: XmlFileEntry[] = [];
    const readers: Promise<XmlFileEntry>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) continue;

      const promise = new Promise<XmlFileEntry>((resolve) => {
        const reader = new FileReader();
        reader.onload = e => {
          resolve({
            name: file.name,
            path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
            content: e.target?.result as string,
          });
        };
        reader.readAsText(file, 'UTF-8');
      });
      readers.push(promise);
    }

    Promise.all(readers).then(entries => {
      const sorted = entries.sort((a, b) => a.path.localeCompare(b.path));
      setXmlFiles(sorted);
      xmlList.push(...sorted);

      // 첫 번째 파일 자동 로드
      if (sorted.length > 0) {
        setRawXml(sorted[0].content);
        setActiveFile(sorted[0].path);
        handleParse(sorted[0].content);
      }
    });
  }, [handleParse]);

  const handleSelectFile = useCallback((entry: XmlFileEntry) => {
    setActiveFile(entry.path);
    setRawXml(entry.content);
    handleParse(entry.content);
  }, [handleParse]);

  const handleReorder = useCallback((groupId: string, oldIndex: number, newIndex: number) => {
    if (!parsed) return;
    setTree(prev => {
      let next: ComponentNode[];
      if (groupId === '__body__') {
        next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
      } else {
        next = updateGroupChildren(prev, groupId, children => {
          const updated = [...children];
          const [moved] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, moved);
          return updated;
        });
      }
      rebuild(parsed, next);
      return next;
    });
  }, [parsed, rebuild]);

  const handleMoveUp = useCallback((groupId: string, index: number) => {
    if (index <= 0) return;
    handleReorder(groupId, index, index - 1);
  }, [handleReorder]);

  const handleMoveDown = useCallback((groupId: string, index: number, total: number) => {
    if (index >= total - 1) return;
    handleReorder(groupId, index, index + 1);
  }, [handleReorder]);

  const handleCopy = useCallback(async () => {
    if (!outputXml) return;
    await navigator.clipboard.writeText(outputXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [outputXml]);

  const handleSave = useCallback(() => {
    if (!outputXml) return;
    const fileName = activeFile ? activeFile.split('/').pop() || 'output.xml' : 'output.xml';
    const blob = new Blob([outputXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputXml, activeFile]);

  return {
    rawXml, setRawXml,
    parsed, tree,
    error, outputXml, copied,
    xmlFiles, activeFile,
    handleParse, handleFileOpen, handleFolderOpen, handleSelectFile,
    handleReorder, handleMoveUp, handleMoveDown,
    handleCopy, handleSave,
  };
}
