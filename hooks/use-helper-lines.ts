"use client"

import { useCallback, useRef, useState } from "react"
import type { CanvasNode } from "@/types/canvas"

export interface HelperLine {
  type: "horizontal" | "vertical"
  position: number // canvas-space coordinate
}

const SNAP_THRESHOLD = 6 // pixels in canvas space

type NodeDragCb = (event: React.MouseEvent, node: CanvasNode) => void

/**
 * Returns helper lines to show + a patched node position that snaps to them.
 * Call onNodeDrag from ReactFlow's onNodeDrag to get updated lines,
 * call onNodeDragStop to clear them.
 */
export function useHelperLines(nodes: CanvasNode[]) {
  const [helperLines, setHelperLines] = useState<HelperLine[]>([])
  const linesRef = useRef<HelperLine[]>([])

  const computeLines = useCallback(
    (draggedId: string, x: number, y: number, w: number, h: number): HelperLine[] => {
      const lines: HelperLine[] = []

      const draggedLeft = x
      const draggedCenterX = x + w / 2
      const draggedRight = x + w
      const draggedTop = y
      const draggedCenterY = y + h / 2
      const draggedBottom = y + h

      for (const node of nodes) {
        if (node.id === draggedId) continue

        const nw = node.width ?? 140
        const nh = node.height ?? 60
        const nx = node.position.x
        const ny = node.position.y
        const nLeft = nx
        const nCenterX = nx + nw / 2
        const nRight = nx + nw
        const nTop = ny
        const nCenterY = ny + nh / 2
        const nBottom = ny + nh

        // Vertical lines (x-axis alignment)
        for (const [a, b] of [
          [draggedLeft, nLeft],
          [draggedLeft, nCenterX],
          [draggedLeft, nRight],
          [draggedCenterX, nLeft],
          [draggedCenterX, nCenterX],
          [draggedCenterX, nRight],
          [draggedRight, nLeft],
          [draggedRight, nCenterX],
          [draggedRight, nRight],
        ] as [number, number][]) {
          if (Math.abs(a - b) < SNAP_THRESHOLD) {
            lines.push({ type: "vertical", position: b })
          }
        }

        // Horizontal lines (y-axis alignment)
        for (const [a, b] of [
          [draggedTop, nTop],
          [draggedTop, nCenterY],
          [draggedTop, nBottom],
          [draggedCenterY, nTop],
          [draggedCenterY, nCenterY],
          [draggedCenterY, nBottom],
          [draggedBottom, nTop],
          [draggedBottom, nCenterY],
          [draggedBottom, nBottom],
        ] as [number, number][]) {
          if (Math.abs(a - b) < SNAP_THRESHOLD) {
            lines.push({ type: "horizontal", position: b })
          }
        }
      }

      // Deduplicate
      return lines.filter(
        (l, i, arr) =>
          arr.findIndex((m) => m.type === l.type && m.position === l.position) === i
      )
    },
    [nodes]
  )

  const onNodeDrag: NodeDragCb = useCallback(
    (_event, node) => {
      const w = node.width ?? 140
      const h = node.height ?? 60
      const lines = computeLines(node.id, node.position.x, node.position.y, w, h)
      linesRef.current = lines
      setHelperLines(lines)
    },
    [computeLines]
  )

  const onNodeDragStop = useCallback(() => {
    linesRef.current = []
    setHelperLines([])
  }, [])

  return { helperLines, onNodeDrag, onNodeDragStop }
}
