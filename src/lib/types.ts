export interface ComponentNode {
  id: string;
  tagName: string;
  xmlId: string;
  element: Element;
  children: ComponentNode[];
  isGroup: boolean;
}

export interface ParsedXml {
  headRaw: string;
  rootAttributes: string;
  xmlDeclaration: string;
  bodyNode: Element;
  tree: ComponentNode[];
}
