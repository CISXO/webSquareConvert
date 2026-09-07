import { ComponentNode, ParsedXml } from './types';
import { scanChildren, locateElement } from './xmlScanner';
import type { ElementSpan, Span } from './xmlScanner';

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

interface SeparatorParts {
  leading: string;
  separators: string[];
  trailing: string;
}

/** Split a scanned child list into the text that sits before / between / after its elements. */
function splitSeparators(src: string, spans: Span[]): SeparatorParts & { elements: ElementSpan[] } {
  const elements = spans.filter((s): s is ElementSpan => s.type === 'element');
  const firstEl = spans.findIndex(s => s.type === 'element');
  const lastEl = spans.map(s => s.type).lastIndexOf('element');

  const textBetween = (a: number, b: number) =>
    spans.slice(a, b)
      .filter(s => s.type === 'text')
      .map(s => src.slice(s.start, s.end))
      .join('');

  const leading = firstEl === -1 ? '' : textBetween(0, firstEl);
  const trailing = lastEl === -1 ? '' : textBetween(lastEl + 1, spans.length);

  const separators: string[] = [];
  for (let k = 0; k < elements.length - 1; k++) {
    const from = spans.indexOf(elements[k]) + 1;
    const to = spans.indexOf(elements[k + 1]);
    separators.push(textBetween(from, to));
  }

  return { leading, separators, trailing, elements };
}

/**
 * Walk the raw source in lock-step with the DOM tree, recording each node's exact
 * source span (and, for groups, its open/close tags and inner separators).
 * Throws if the raw scan and the DOM disagree on child count — we would rather fail
 * loudly than emit a document that silently lost or duplicated content.
 */
function attachRaw(src: string, from: number, to: number, nodes: ComponentNode[]): SeparatorParts {
  const spans = scanChildren(src, from, to);
  const { leading, separators, trailing, elements } = splitSeparators(src, spans);

  if (elements.length !== nodes.length) {
    throw new Error(
      `원본 XML 구조를 정확히 추적하지 못했습니다 (요소 ${nodes.length}개 예상, ${elements.length}개 인식). ` +
      `재정렬 시 원본이 손상될 수 있어 중단합니다.`
    );
  }

  nodes.forEach((node, idx) => {
    const seg = elements[idx];
    if (node.isGroup && !seg.selfClosing && node.children.length > 0) {
      const inner = attachRaw(src, seg.innerStart, seg.innerEnd, node.children);
      node.raw = {
        raw: src.slice(seg.start, seg.end),
        rawOpen: src.slice(seg.start, seg.innerStart),
        rawClose: src.slice(seg.innerEnd, seg.end),
        leading: inner.leading,
        separators: inner.separators,
        trailing: inner.trailing,
      };
    } else {
      node.raw = { raw: src.slice(seg.start, seg.end) };
    }
  });

  return { leading, separators, trailing };
}

export function parseWebSquareXml(xmlString: string): ParsedXml {
  if (!xmlString.trim()) throw new Error('XML을 입력하세요.');

  // Strip a BOM if present, but keep surrounding whitespace so output stays byte-faithful.
  const clean = xmlString.charCodeAt(0) === 0xfeff ? xmlString.slice(1) : xmlString;

  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, 'application/xml');

  const parseError = doc.querySelector('parsererror') || doc.documentElement?.tagName === 'parsererror'
    ? doc.documentElement
    : null;
  if (parseError) {
    const msg = parseError.textContent?.split('\n')[0] ?? 'XML 파싱 실패';
    throw new Error(`XML 파싱 오류: ${msg}`);
  }

  const bodyNode = doc.querySelector('body');
  if (!bodyNode) throw new Error('WebSquare AI XML 형식이 아닙니다. (<body> 태그를 찾을 수 없음)');

  const tree = buildTree(bodyNode);
  if (tree.length === 0) throw new Error('<body> 안에 인식 가능한 컴포넌트가 없습니다.');

  // Locate <body> in the raw source: prefer scanning <html>'s children (so a script in
  // <head> containing the text "<body>" can't fool us); fall back to a direct search.
  let bodySpan: ElementSpan;
  try {
    const htmlSpan = locateElement(clean, 'html');
    const bodyChild = scanChildren(clean, htmlSpan.innerStart, htmlSpan.innerEnd)
      .find((s): s is ElementSpan => s.type === 'element' && s.name === 'body');
    bodySpan = bodyChild ?? locateElement(clean, 'body', htmlSpan.innerStart);
  } catch {
    bodySpan = locateElement(clean, 'body');
  }

  const body = attachRaw(clean, bodySpan.innerStart, bodySpan.innerEnd, tree);

  return {
    raw: clean,
    bodyInnerStart: bodySpan.innerStart,
    bodyInnerEnd: bodySpan.innerEnd,
    bodyLeading: body.leading,
    bodySeparators: body.separators,
    bodyTrailing: body.trailing,
    bodyNode,
    tree,
  };
}
