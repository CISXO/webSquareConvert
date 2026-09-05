import type { CSSProperties } from 'react';

export function parseCssString(style: string | null): CSSProperties {
  if (!style) return {};
  const result: Record<string, string> = {};
  style.split(';').forEach(rule => {
    const idx = rule.indexOf(':');
    if (idx === -1) return;
    const prop = rule.slice(0, idx).trim();
    const val = rule.slice(idx + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = val;
  });
  return result as CSSProperties;
}

export function getElementLabel(el: Element): string {
  // xf:label child
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i];
    if (child.nodeType === 1 && (child as Element).tagName.toLowerCase().includes('label')) {
      return child.textContent?.trim() || '';
    }
  }
  return el.getAttribute('value') || el.getAttribute('id') || '';
}

export function getGridColumns(el: Element): { id: string; label: string; width: string }[] {
  const cols: { id: string; label: string; width: string }[] = [];
  // Try w2:header > w2:row > w2:column
  const headerRows = el.querySelectorAll('*');
  headerRows.forEach(node => {
    const tag = node.tagName.toLowerCase();
    if (tag.includes('column') && node.parentElement?.tagName.toLowerCase().includes('row')) {
      const val = node.getAttribute('value');
      const id = node.getAttribute('id') || '';
      const w = node.getAttribute('width') || '80';
      if (val !== null) cols.push({ id, label: val, width: w });
    }
  });
  return cols;
}
