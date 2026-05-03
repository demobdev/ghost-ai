import dagre from "dagre"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type LayoutDirection = "TB" | "LR"

interface LayoutOptions {
  direction?: LayoutDirection
  nodeSep?: number
  rankSep?: number
  marginX?: number
  marginY?: number
}

/**
 * Applies a dagre directed-graph layout to a set of canvas nodes and edges.
 * Returns new nodes with updated positions; edges are returned unchanged.
 * Safe to call with any node/edge array — returns originals if dagre fails.
 */
export function applyDagreLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: LayoutOptions = {}
): CanvasNode[] {
  if (nodes.length === 0) return nodes

  const {
    direction = "TB",
    nodeSep = 80,
    rankSep = 120,
    marginX = 40,
    marginY = 40,
  } = options

  try {
    const g = new dagre.graphlib.Graph()
    g.setGraph({
      rankdir: direction,
      nodesep: nodeSep,
      ranksep: rankSep,
      marginx: marginX,
      marginy: marginY,
    })
    g.setDefaultEdgeLabel(() => ({}))

    nodes.forEach((node) => {
      g.setNode(node.id, {
        width: node.width ?? 140,
        height: node.height ?? 60,
      })
    })

    edges.forEach((edge) => {
      // Only add edge if both source and target nodes exist
      if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
        g.setEdge(edge.source, edge.target)
      }
    })

    dagre.layout(g)

    return nodes.map((node) => {
      const pos = g.node(node.id)
      if (!pos) return node
      return {
        ...node,
        position: {
          x: pos.x - (node.width ?? 140) / 2,
          y: pos.y - (node.height ?? 60) / 2,
        },
      }
    })
  } catch {
    return nodes
  }
}
