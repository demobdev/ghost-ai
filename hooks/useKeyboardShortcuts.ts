"use client"

import { useEffect, useRef, useCallback } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import { MarkerType } from "@xyflow/react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface Options {
  reactFlow: ReactFlowInstance | null
  undo: () => void
  redo: () => void
  onNodesChange?: (changes: { type: "add"; item: CanvasNode }[]) => void
  onEdgesChange?: (changes: { type: "add"; item: CanvasEdge }[]) => void
}

function isEditable(el: Element | null): boolean {
  if (!el) return false
  const tag = (el as HTMLElement).tagName
  if (tag === "INPUT" || tag === "TEXTAREA") return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

let idSeq = 0
function uid() {
  return `paste-${Date.now()}-${++idSeq}`
}

export function useKeyboardShortcuts({ reactFlow, undo, redo, onNodesChange, onEdgesChange }: Options) {
  // Clipboard: stores copied nodes + their connecting edges
  const clipboardRef = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>({
    nodes: [],
    edges: [],
  })

  const handleCopy = useCallback(() => {
    if (!reactFlow) return
    const selected = reactFlow.getNodes().filter((n) => n.selected) as CanvasNode[]
    if (selected.length === 0) return

    const selectedIds = new Set(selected.map((n) => n.id))
    const internalEdges = (reactFlow.getEdges() as CanvasEdge[]).filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target)
    )
    clipboardRef.current = { nodes: selected, edges: internalEdges }
  }, [reactFlow])

  const handlePaste = useCallback(() => {
    if (!reactFlow || !onNodesChange) return
    const { nodes, edges } = clipboardRef.current
    if (nodes.length === 0) return

    const OFFSET = 24
    // Build a map from old id → new id
    const idMap = new Map<string, string>()
    nodes.forEach((n) => idMap.set(n.id, uid()))

    const newNodes: CanvasNode[] = nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET },
      selected: true,
    }))

    const newEdges: CanvasEdge[] = edges.map((e) => ({
      ...e,
      id: uid(),
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "rgba(255,255,255,0.4)",
        width: 16,
        height: 16,
      },
    }))

    // Deselect existing nodes first
    const deselect = reactFlow
      .getNodes()
      .filter((n) => n.selected)
      .map((n) => ({ type: "select" as const, id: n.id, selected: false }))
    if (deselect.length) reactFlow.setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))

    onNodesChange(newNodes.map((n) => ({ type: "add" as const, item: n })))
    if (onEdgesChange && newEdges.length > 0) {
      onEdgesChange(newEdges.map((e) => ({ type: "add" as const, item: e })))
    }

    // Update clipboard so repeated pastes offset further
    clipboardRef.current = {
      nodes: nodes.map((n) => ({ ...n, position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET } })),
      edges,
    }
  }, [reactFlow, onNodesChange, onEdgesChange])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditable(document.activeElement)) return

      const meta = event.metaKey || event.ctrlKey

      if (!meta && (event.key === "+" || event.key === "=")) {
        event.preventDefault()
        reactFlow?.zoomIn({ duration: 200 })
        return
      }

      if (!meta && event.key === "-") {
        event.preventDefault()
        reactFlow?.zoomOut({ duration: 200 })
        return
      }

      if (meta && event.shiftKey && event.key === "z") {
        event.preventDefault()
        redo()
        return
      }

      if (meta && !event.shiftKey && event.key === "z") {
        event.preventDefault()
        undo()
        return
      }

      if (meta && event.key === "y") {
        event.preventDefault()
        redo()
        return
      }

      if (meta && event.key === "c") {
        event.preventDefault()
        handleCopy()
        return
      }

      if (meta && event.key === "v") {
        event.preventDefault()
        handlePaste()
        return
      }

      if (meta && event.key === "d") {
        // Duplicate = copy + paste in one keystroke
        event.preventDefault()
        handleCopy()
        handlePaste()
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [reactFlow, undo, redo, handleCopy, handlePaste])
}
