// Source-range scanner for WebSquare XML.
//
// The DOM (via DOMParser) gives us structure but no source offsets, so re-serializing
// through XMLSerializer silently reformats / drops content. This scanner walks the raw
// string and records the exact character span of every element, letting us reorder by
// moving raw substrings around — nothing gets re-serialized, so unmoved bytes stay byte
// for byte identical.
//
// Precondition: the document already parsed cleanly as XML, so every `<` inside script
// text lives in a CDATA section (raw `<` would fail XML parsing). We rely on that to skip
// script bodies correctly.

export interface ElementSpan {
  type: 'element';
  name: string;
  start: number;       // index of the opening '<'
  end: number;         // index just past the element's final '>'  ('/>' or '</tag>')
  innerStart: number;  // index just past the open tag's '>'
  innerEnd: number;    // index of the closing tag's '<'  (=== end for self-closing / empty)
  selfClosing: boolean;
}

export interface TextSpan {
  type: 'text';
  start: number;
  end: number;
}

export type Span = ElementSpan | TextSpan;

const NAME_END = /[\s/>]/;

/** From the index of a tag's '<', return the index just past the '>' that ends that tag. */
function findTagEnd(src: string, lt: number): number {
  let i = lt + 1;
  let quote = '';
  while (i < src.length) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i + 1;
    }
    i++;
  }
  throw new Error('태그가 닫히지 않았습니다.');
}

/** Read a tag name (with namespace prefix) starting from the tag's '<' (open or close). */
function readTagName(src: string, lt: number): string {
  let i = lt + 1;
  if (src[i] === '/') i++;
  let name = '';
  while (i < src.length && !NAME_END.test(src[i])) {
    name += src[i];
    i++;
  }
  return name;
}

/** Skip a comment / CDATA / PI / declaration starting at `lt`; returns index past it, or -1. */
function skipSpecial(src: string, lt: number, hardEnd: number): number {
  if (src.startsWith('<!--', lt)) {
    const j = src.indexOf('-->', lt + 4);
    return j === -1 ? hardEnd : Math.min(j + 3, hardEnd);
  }
  if (src.startsWith('<![CDATA[', lt)) {
    const j = src.indexOf(']]>', lt + 9);
    return j === -1 ? hardEnd : Math.min(j + 3, hardEnd);
  }
  if (src.startsWith('<?', lt)) {
    const j = src.indexOf('?>', lt + 2);
    return j === -1 ? hardEnd : Math.min(j + 2, hardEnd);
  }
  if (src[lt + 1] === '!') {
    // <!DOCTYPE ...> and friends (comment / CDATA already handled above)
    const j = src.indexOf('>', lt + 2);
    return j === -1 ? hardEnd : Math.min(j + 1, hardEnd);
  }
  return -1;
}

/**
 * From `innerStart` (just past an open tag), find that element's matching close tag,
 * accounting for nested same-name elements and skipping comments / CDATA / PIs.
 */
function findMatchingClose(src: string, innerStart: number, tagName: string): { closeStart: number; end: number } {
  let depth = 1;
  let i = innerStart;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) break;

    const skipped = skipSpecial(src, lt, src.length);
    if (skipped !== -1) { i = skipped; continue; }

    const isClose = src[lt + 1] === '/';
    const name = readTagName(src, lt);
    const tagEnd = findTagEnd(src, lt);

    if (isClose) {
      if (name === tagName && --depth === 0) return { closeStart: lt, end: tagEnd };
      i = tagEnd;
      continue;
    }

    if (name === tagName && src[tagEnd - 2] !== '/') depth++;
    i = tagEnd;
  }
  throw new Error(`<${tagName}> 닫는 태그를 찾지 못했습니다.`);
}

/** Scan the direct children of a container whose inner content is src[from, to). */
export function scanChildren(src: string, from: number, to: number): Span[] {
  const spans: Span[] = [];
  let i = from;
  let textStart = from;

  const flushText = (upto: number) => {
    if (upto > textStart) spans.push({ type: 'text', start: textStart, end: upto });
  };

  while (i < to) {
    if (src[i] !== '<') { i++; continue; }

    const skipped = skipSpecial(src, i, to);
    if (skipped !== -1) { i = skipped; continue; }

    if (src[i + 1] === '/') break; // container's own closing tag

    flushText(i);

    const start = i;
    const name = readTagName(src, start);
    const openEnd = findTagEnd(src, start);
    const selfClosing = src[openEnd - 2] === '/';

    if (selfClosing) {
      spans.push({ type: 'element', name, start, end: openEnd, innerStart: openEnd, innerEnd: openEnd, selfClosing: true });
      i = openEnd;
    } else {
      const { closeStart, end } = findMatchingClose(src, openEnd, name);
      spans.push({ type: 'element', name, start, end, innerStart: openEnd, innerEnd: closeStart, selfClosing: false });
      i = end;
    }
    textStart = i;
  }

  flushText(Math.min(i, to));
  return spans;
}

/** Locate an element by tag name (first real occurrence at/after `from`, skipping comments/CDATA). */
export function locateElement(src: string, tagName: string, from = 0): ElementSpan {
  let i = from;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) break;

    const skipped = skipSpecial(src, lt, src.length);
    if (skipped !== -1) { i = skipped; continue; }

    const isClose = src[lt + 1] === '/';
    const name = readTagName(src, lt);
    const openEnd = findTagEnd(src, lt);

    if (isClose) { i = openEnd; continue; }

    if (name === tagName) {
      const selfClosing = src[openEnd - 2] === '/';
      if (selfClosing) {
        return { type: 'element', name, start: lt, end: openEnd, innerStart: openEnd, innerEnd: openEnd, selfClosing: true };
      }
      const { closeStart, end } = findMatchingClose(src, openEnd, tagName);
      return { type: 'element', name, start: lt, end, innerStart: openEnd, innerEnd: closeStart, selfClosing: false };
    }

    // Not our tag: skip past its whole subtree so we don't descend into it.
    if (src[openEnd - 2] === '/') { i = openEnd; continue; }
    try {
      i = findMatchingClose(src, openEnd, name).end;
    } catch {
      i = openEnd;
    }
  }
  throw new Error(`<${tagName}> 태그를 찾을 수 없습니다.`);
}
