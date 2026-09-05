import { ComponentNode, ParsedXml } from './types';

function buildTree(parent: Element): ComponentNode[] {
  const nodes: ComponentNode[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const tagName = el.tagName;
    const isGroup = tagName === 'xf:group';
    nodes.push({
      id: el.getAttribute('id') || `__node_${Math.random().toString(36).slice(2)}`,
      tagName,
      xmlId: el.getAttribute('id') || '',
      element: el,
      children: isGroup ? buildTree(el) : [],
      isGroup,
    });
  }
  return nodes;
}

export function parseWebSquareXml(xmlString: string): ParsedXml {
  const trimmed = xmlString.trim();
  if (!trimmed) throw new Error('XML을 입력하세요.');

  // Strip BOM if present
  const clean = trimmed.startsWith('﻿') ? trimmed.slice(1) : trimmed;

  const declMatch = clean.match(/^<\?xml[^?]*\?>/);
  const xmlDeclaration = declMatch ? declMatch[0] : '';

  // Match <html ...> including multiline attributes
  const htmlMatch = clean.match(/<html([\s\S]*?)>/);
  const rootAttributes = htmlMatch ? `<html${htmlMatch[1]}>` : '<html>';

  const headStart = clean.indexOf('<head>');
  const headEndIdx = clean.indexOf('</head>');
  if (headStart === -1 || headEndIdx === -1) throw new Error('WebSquare AI XML 형식이 아닙니다. (<head> 태그를 찾을 수 없음)');
  const headRaw = clean.slice(headStart, headEndIdx + '</head>'.length);

  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, 'application/xml');

  // parsererror detection (namespace-agnostic)
  const parseError = doc.querySelector('parsererror') || doc.documentElement?.tagName === 'parsererror' ? doc.documentElement : null;
  if (parseError) {
    const msg = parseError.textContent?.split('\n')[0] ?? 'XML 파싱 실패';
    throw new Error(`XML 파싱 오류: ${msg}`);
  }

  const bodyNode = doc.querySelector('body');
  if (!bodyNode) throw new Error('WebSquare AI XML 형식이 아닙니다. (<body> 태그를 찾을 수 없음)');

  const tree = buildTree(bodyNode);
  if (tree.length === 0) throw new Error('<body> 안에 인식 가능한 컴포넌트가 없습니다.');

  return { headRaw, rootAttributes, xmlDeclaration, bodyNode, tree };
}
