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
  if (!xmlString.trim()) throw new Error('XML을 입력하세요.');

  const declMatch = xmlString.match(/^<\?xml[^?]*\?>/);
  const xmlDeclaration = declMatch ? declMatch[0] : '';

  const htmlMatch = xmlString.match(/<html([^>]*)>/);
  const rootAttributes = htmlMatch ? `<html${htmlMatch[1]}>` : '<html>';

  const headStart = xmlString.indexOf('<head>');
  const headEnd = xmlString.indexOf('</head>') + '</head>'.length;
  if (headStart === -1 || headEnd === -1) throw new Error('WebSquare AI XML 형식이 아닙니다.');
  const headRaw = xmlString.slice(headStart, headEnd);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML 파싱 오류: ' + parseError.textContent);

  const bodyNode = doc.querySelector('body');
  if (!bodyNode) throw new Error('WebSquare AI XML 형식이 아닙니다.');

  const tree = buildTree(bodyNode);

  return { headRaw, rootAttributes, xmlDeclaration, bodyNode, tree };
}
