import { ComponentNode, ParsedXml } from './types';

// Strip xmlns declarations added by XMLSerializer when serializing individual elements.
// Only reached by the fallback path below (a node we couldn't map to raw source).
function stripXmlns(xml: string): string {
  return xml.replace(/ xmlns(?::[a-zA-Z0-9._-]+)?="[^"]*"/g, '');
}

function joinChildren(children: ComponentNode[], separators: string[]): string {
  const defaultSep = separators[0] ?? '\n';
  return children
    .map((child, idx) =>
      idx < children.length - 1
        ? serializeNode(child) + (separators[idx] ?? defaultSep)
        : serializeNode(child)
    )
    .join('');
}

function serializeNode(node: ComponentNode): string {
  const rp = node.raw;

  // Fallback: node was never mapped to raw source. Should not happen for parsed input.
  if (!rp) return stripXmlns(new XMLSerializer().serializeToString(node.element));

  // Leaf, or a group we didn't descend into — emit the original bytes verbatim.
  if (!node.isGroup || rp.rawOpen === undefined) return rp.raw;

  const inner = (rp.leading ?? '') + joinChildren(node.children, rp.separators ?? []) + (rp.trailing ?? '');
  return `${rp.rawOpen}${inner}${rp.rawClose ?? `</${node.tagName}>`}`;
}

/**
 * Rebuild the document by splicing the (possibly reordered) <body> content back into the
 * original source. Everything outside <body> — the XML declaration, <html> attributes, and
 * the entire <head> including its <script>/JS — is carried through untouched. With no
 * reordering, the output is byte-for-byte identical to the input.
 */
export function serializeToXml(parsed: ParsedXml, tree: ComponentNode[]): string {
  const inner =
    parsed.bodyLeading +
    joinChildren(tree, parsed.bodySeparators) +
    parsed.bodyTrailing;

  return parsed.raw.slice(0, parsed.bodyInnerStart) + inner + parsed.raw.slice(parsed.bodyInnerEnd);
}
