/** Exact source-text pieces for a node, so reordering never re-serializes untouched bytes. */
export interface RawParts {
  /** Full element source, from '<' to its final '>'. Used for leaves and un-descended groups. */
  raw: string;
  /** Group only: the open tag, e.g. `<xf:group id="g1">`. */
  rawOpen?: string;
  /** Group only: the close tag, e.g. `</xf:group>`. */
  rawClose?: string;
  /** Group only: text between the open tag and the first child element. */
  leading?: string;
  /** Group only: text between consecutive child elements. */
  separators?: string[];
  /** Group only: text between the last child element and the close tag. */
  trailing?: string;
}

export interface ComponentNode {
  id: string;
  tagName: string;
  xmlId: string;
  element: Element;
  children: ComponentNode[];
  isGroup: boolean;
  raw?: RawParts;
}

export interface ParsedXml {
  /** The full source string (BOM stripped), into which the reordered <body> is spliced. */
  raw: string;
  bodyInnerStart: number;
  bodyInnerEnd: number;
  bodyLeading: string;
  bodySeparators: string[];
  bodyTrailing: string;
  bodyNode: Element;
  tree: ComponentNode[];
}
