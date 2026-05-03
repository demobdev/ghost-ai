"use client"

import { useStoreApi } from "@xyflow/react"
import type { HelperLine } from "@/hooks/use-helper-lines"

interface HelperLinesOverlayProps {
  lines: HelperLine[]
}

/**
 * Renders Figma-style alignment guide lines over the React Flow canvas.
 * Must be placed inside a ReactFlowProvider so useStoreApi works.
 * Lines are drawn in canvas coordinates, converted to screen via the viewport transform.
 */
export function HelperLinesOverlay({ lines }: HelperLinesOverlayProps) {
  const store = useStoreApi()

  if (lines.length === 0) return null

  const { transform, width, height } = store.getState()
  const [tx, ty, zoom] = transform

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-50"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      {lines.map((line, i) => {
        if (line.type === "vertical") {
          // Canvas x → screen x
          const sx = line.position * zoom + tx
          return (
            <line
              key={`v-${i}`}
              x1={sx}
              y1={0}
              x2={sx}
              y2={height}
              stroke="rgba(99, 192, 115, 0.85)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        } else {
          // Canvas y → screen y
          const sy = line.position * zoom + ty
          return (
            <line
              key={`h-${i}`}
              x1={0}
              y1={sy}
              x2={width}
              y2={sy}
              stroke="rgba(99, 192, 115, 0.85)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        }
      })}
    </svg>
  )
}
