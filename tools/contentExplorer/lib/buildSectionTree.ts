import type {SectionFlat, SectionNode} from './types'

export function buildSectionTree(sections: SectionFlat[]): SectionNode[] {
  const nodes = new Map<string, SectionNode>()

  for (const section of sections) {
    nodes.set(section._id, {...section, children: []})
  }

  const roots: SectionNode[] = []

  for (const section of sections) {
    const node = nodes.get(section._id)
    if (!node) continue

    if (section.parentId && nodes.has(section.parentId)) {
      nodes.get(section.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (list: SectionNode[]) => {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    for (const child of list) sortNodes(child.children)
  }

  sortNodes(roots)
  return roots
}
