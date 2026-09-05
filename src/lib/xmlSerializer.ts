import { ComponentNode, ParsedXml } from './types';

// Strip xmlns declarations added by XMLSerializer when serializing individual elements.
// Safe for WebSquare XML because all namespaces are declared on the root <html> element.
function stripXmlns(xml: string): string {
  return xml.replace(/ xmlns(?::[a-zA-Z0-9._-]+)?="[^"]*"/g, '');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function buildOpenTag(el: Element): string {
  let tag = `<${el.tagName}`;
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    tag += ` ${attr.name}="${escapeAttr(attr.value)}"`;
  }
  return tag;
}

function getElementSeparators(childNodes: ChildNode[]): { leading: string; separators: string[]; trailing: string } {
  const firstElIdx = childNodes.findIndex(n => n.nodeType === 1);
  const lastElIdx = childNodes.map(n => n.nodeType).lastIndexOf(1);

  const leading = firstElIdx === -1 ? '' : childNodes.slice(0, firstElIdx).map(n => n.textContent || '').join('');
  const trailing = lastElIdx === -1 ? '' : childNodes.slice(lastElIdx + 1).map(n => n.textContent || '').join('');

  const elementChildren = childNodes.filter(n => n.nodeType === 1);
  const separators: string[] = [];
  for (let i = 0; i < elementChildren.length - 1; i++) {
    const from = childNodes.indexOf(elementChildren[i]) + 1;
    const to = childNodes.indexOf(elementChildren[i + 1]);
    separators.push(childNodes.slice(from, to).map(n => n.textContent || '').join(''));
  }

  return { leading, separators, trailing };
}

function serializeNode(node: ComponentNode): string {
  if (!node.isGroup || node.children.length === 0) {
    return stripXmlns(new XMLSerializer().serializeToString(node.element));
  }

  const el = node.element;
  const childNodes = Array.from(el.childNodes);
  const { leading, separators, trailing } = getElementSeparators(childNodes);
  const defaultSep = separators[0] || '\n';

  const innerContent = node.children
    .map((child, idx) => {
      const xml = serializeNode(child);
      return idx < node.children.length - 1 ? xml + (separators[idx] ?? defaultSep) : xml;
    })
    .join('');

  return `${buildOpenTag(el)}>${leading}${innerContent}${trailing}</${el.tagName}>`;
}

export function serializeToXml(parsed: ParsedXml, tree: ComponentNode[]): string {
  const bodyEl = parsed.bodyNode;
  const childNodes = Array.from(bodyEl.childNodes);
  const { leading, separators, trailing } = getElementSeparators(childNodes);
  const defaultSep = separators[0] || '\n';

  const bodyContent = tree
    .map((node, idx) => {
      const xml = serializeNode(node);
      return idx < tree.length - 1 ? xml + (separators[idx] ?? defaultSep) : xml;
    })
    .join('');

  const bodyXml = `${buildOpenTag(bodyEl)}>${leading}${bodyContent}${trailing}</body>`;

  const headPart = parsed.headRaw ? `\n    ${parsed.headRaw}` : '';
  return `${parsed.xmlDeclaration}\n${parsed.rootAttributes}${headPart}\n    ${bodyXml}\n</html>`;
}
