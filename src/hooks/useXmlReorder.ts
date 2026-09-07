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

/** id의 부모 그룹 id를 찾는다 ('__body__' = 최상위). 없으면 null. */
function parentIdOf(tree: ComponentNode[], id: string, parent = '__body__'): string | null {
  for (const node of tree) {
    if (node.id === id) return parent;
    if (node.isGroup) {
      const found = parentIdOf(node.children, id, node.id);
      if (found) return found;
    }
  }
  return null;
}

/** Remove a node from anywhere in the tree; returns the pruned tree and the removed node. */
function removeNode(tree: ComponentNode[], id: string): { tree: ComponentNode[]; removed: ComponentNode | null } {
  let removed: ComponentNode | null = null;
  const walk = (nodes: ComponentNode[]): ComponentNode[] => {
    const out: ComponentNode[] = [];
    for (const node of nodes) {
      if (node.id === id) { removed = node; continue; }
      if (node.isGroup) out.push({ ...node, children: walk(node.children) });
      else out.push(node);
    }
    return out;
  };
  return { tree: walk(tree), removed };
}

/** Insert a node into `parentId`'s children, before `beforeId` (or at the end when null). */
function insertNode(
  tree: ComponentNode[],
  parentId: string,
  beforeId: string | null,
  node: ComponentNode
): ComponentNode[] {
  const place = (children: ComponentNode[]): ComponentNode[] => {
    const next = [...children];
    const idx = beforeId ? next.findIndex(c => c.id === beforeId) : -1;
    if (idx === -1) next.push(node);
    else next.splice(idx, 0, node);
    return next;
  };
  if (parentId === '__body__') return place(tree);
  return tree.map(n => {
    if (n.id === parentId) return { ...n, children: place(n.children) };
    if (n.isGroup) return { ...n, children: insertNode(n.children, parentId, beforeId, node) };
    return n;
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
  const [originalTree, setOriginalTree] = useState<ComponentNode[]>([]);

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
      setOriginalTree(cloneTree(result.tree));
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

  /**
   * 노드를 같은 부모 그룹 안에서만 재배치한다.
   * 그룹 경계를 넘는 이동(그룹 → 다른 그룹, 그룹 → 최상위 등)은 무시한다.
   * @param activeId  이동할 노드
   * @param parentId  대상 부모 그룹 id ('__body__' = 최상위) — activeId의 현재 부모와 같아야 함
   * @param beforeId  이 노드 앞에 삽입, null이면 부모의 맨 끝
   */
  const handleMoveNode = useCallback((activeId: string, parentId: string, beforeId: string | null) => {
    if (!parsed) return;
    if (activeId === parentId || activeId === beforeId) return;
    setTree(prev => {
      // 같은 그룹 위치에서만 순서 변경 허용
      if (parentIdOf(prev, activeId) !== parentId) return prev;

      const { tree: pruned, removed } = removeNode(prev, activeId);
      if (!removed) return prev;
      const next = insertNode(pruned, parentId, beforeId, removed);
      rebuild(parsed, next);
      return next;
    });
  }, [parsed, rebuild]);

  /** 전체 트리를 파싱 직후 원본 순서로 되돌린다. */
  const handleReset = useCallback(() => {
    if (!parsed) return;
    const t = cloneTree(originalTree);
    setTree(t);
    rebuild(parsed, t);
  }, [parsed, originalTree, rebuild]);

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
    parsed, tree, originalTree,
    error, outputXml, copied,
    xmlFiles, activeFile,
    handleParse, handleFileOpen, handleFolderOpen, handleSelectFile,
    handleReorder, handleMoveNode, handleMoveUp, handleMoveDown,
    handleReset,
    handleCopy, handleSave,
  };
}
