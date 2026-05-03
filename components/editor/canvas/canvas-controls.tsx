"use client"

import { useState } from "react"
import { Minus, Maximize, Plus, Undo2, Redo2, Camera, Check, LayoutDashboard } from "lucide-react"
import { toPng } from "html-to-image"
import { useReactFlow } from "@xyflow/react"

interface CanvasControlsProps {
  onZoomOut: () => void
  onFitView: () => void
  onZoomIn: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onAutoLayout?: () => void
}

export function CanvasControls({
  onZoomOut,
  onFitView,
  onZoomIn,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAutoLayout,
}: CanvasControlsProps) {
  const [exported, setExported] = useState(false)
  const { fitView } = useReactFlow()

  const handleExport = async () => {
    // Fit all nodes into view before capturing
    fitView({ padding: 0.12, duration: 0 })

    // Brief paint delay so fitView has settled
    await new Promise((r) => setTimeout(r, 60))

    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport")
    const container = document.querySelector<HTMLElement>(".react-flow")
    if (!viewport || !container) return

    const rect = container.getBoundingClientRect()

    const dataUrl = await toPng(container, {
      backgroundColor: "#080809",
      width: rect.width,
      height: rect.height,
      pixelRatio: 2,
      filter: (node) => {
        // Exclude controls, minimap, attribution, and shape panel overlay
        if (node instanceof HTMLElement) {
          if (
            node.classList.contains("react-flow__controls") ||
            node.classList.contains("react-flow__minimap") ||
            node.classList.contains("react-flow__attribution") ||
            node.dataset?.exportExclude === "true"
          ) {
            return false
          }
        }
        return true
      },
    })

    const link = document.createElement("a")
    link.href = dataUrl
    link.download = "architecture.png"
    link.click()

    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-full border border-border-default bg-bg-surface/95 px-2 py-1.5 shadow-xl backdrop-blur-xl">
      <ControlButton onClick={onZoomOut} title="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onFitView} title="Fit view">
        <Maximize className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onZoomIn} title="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </ControlButton>

      <div className="mx-1 h-4 w-px bg-border-default" />

      <ControlButton onClick={onUndo} title="Undo" disabled={!canUndo}>
        <Undo2 className="h-3.5 w-3.5" />
      </ControlButton>
      <ControlButton onClick={onRedo} title="Redo" disabled={!canRedo}>
        <Redo2 className="h-3.5 w-3.5" />
      </ControlButton>

      <div className="mx-1 h-4 w-px bg-border-default" />

      <ControlButton
        onClick={handleExport}
        title={exported ? "Saved!" : "Export canvas as PNG"}
        active={exported}
      >
        {exported ? (
          <Check className="h-3.5 w-3.5 text-state-success" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </ControlButton>

      {onAutoLayout && (
        <>
          <div className="mx-1 h-4 w-px bg-border-default" />
          <ControlButton onClick={onAutoLayout} title="Auto-arrange layout (dagre)">
            <LayoutDashboard className="h-3.5 w-3.5" />
          </ControlButton>
        </>
      )}
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  title: string
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}

function ControlButton({ onClick, title, disabled, active, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 ${active ? "bg-bg-elevated" : ""}`}
    >
      {children}
    </button>
  )
}
