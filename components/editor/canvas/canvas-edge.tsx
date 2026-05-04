"use client"

import { useState, useCallback } from "react"
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react"
import type { EdgeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import type { CanvasEdge } from "@/types/canvas"

type LiveEdgeData = LiveObject<{
  data: LiveObject<{ label?: string }>
}>

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")

  const updateEdgeLabel = useMutation(
    ({ storage }, newLabel: string) => {
      const edge = storage.get("flow").get("edges").get(id)
      if (!edge) return
      ;(edge as unknown as LiveEdgeData).get("data").set("label", newLabel)
    },
    [id]
  )

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""
  const isActive = selected || isHovered || isEditing
  const stroke = isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.28)"
  const showHint = (isHovered || selected) && !label && !isEditing

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setDraftLabel(label)
      setIsEditing(true)
    },
    [label]
  )

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    updateEdgeLabel(draftLabel.trim())
  }, [draftLabel, updateEdgeLabel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <>
      {/* Wide invisible stroke makes the edge easy to hover and click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isActive ? 2 : 1.5,
          strokeLinecap: "round",
          transition: "stroke 0.15s, stroke-width 0.15s",
          filter: isActive ? "drop-shadow(0 0 4px rgba(255,255,255,0.15))" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: `${Math.max((draftLabel.length + 2) * 8, 64)}px`,
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                outline: "none",
                textAlign: "center",
              }}
            />
          ) : label ? (
            <div
              onDoubleClick={startEditing}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-bg-surface)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                userSelect: "none",
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </div>
          ) : showHint ? (
            <div
              onDoubleClick={startEditing}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 10,
                cursor: "pointer",
                padding: "2px 8px",
                userSelect: "none",
                background: "var(--color-bg-surface)",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 9999,
                transition: "opacity 0.15s",
              }}
            >
              + label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
