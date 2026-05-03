"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, XCircle, Info } from "lucide-react"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates"

// Internal viewBox coordinate space — nodes are scaled/offset to fit here.
const VB_W = 500
const VB_H = 280
const VB_PAD = 20

interface TemplatePreviewProps {
  template: CanvasTemplate
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  if (template.nodes.length === 0) return null

  const minX = Math.min(...template.nodes.map((nd) => nd.position.x))
  const minY = Math.min(...template.nodes.map((nd) => nd.position.y))
  const maxX = Math.max(...template.nodes.map((nd) => nd.position.x + (nd.width ?? 140)))
  const maxY = Math.max(...template.nodes.map((nd) => nd.position.y + (nd.height ?? 60)))

  const bw = maxX - minX || 1
  const bh = maxY - minY || 1
  const scale = Math.min(
    (VB_W - VB_PAD * 2) / bw,
    (VB_H - VB_PAD * 2) / bh
  )

  const offsetX = (VB_W - bw * scale) / 2 - minX * scale
  const offsetY = (VB_H - bh * scale) / 2 - minY * scale

  const nodeMap = new Map(template.nodes.map((nd) => [nd.id, nd]))
  const markerId = `arr-${template.id}`

  return (
    <div className="w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>

        {template.edges.map((edge) => {
          const src = nodeMap.get(edge.source)
          const tgt = nodeMap.get(edge.target)
          if (!src || !tgt) return null
          const sx = (src.position.x + (src.width ?? 140) / 2) * scale + offsetX
          const sy = (src.position.y + (src.height ?? 60) / 2) * scale + offsetY
          const tx = (tgt.position.x + (tgt.width ?? 140) / 2) * scale + offsetX
          const ty = (tgt.position.y + (tgt.height ?? 60) / 2) * scale + offsetY
          return (
            <line
              key={edge.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
              markerEnd={`url(#${markerId})`}
            />
          )
        })}

        {template.nodes.map((nd) => {
          const x = nd.position.x * scale + offsetX
          const y = nd.position.y * scale + offsetY
          const nw = (nd.width ?? 140) * scale
          const nh = (nd.height ?? 60) * scale
          const fill = nd.data.color ?? "#1F1F1F"
          const stroke = "rgba(255,255,255,0.2)"
          const sw = 1
          const shape = nd.data.shape ?? "rectangle"

          if (shape === "circle") {
            return (
              <ellipse
                key={nd.id}
                cx={x + nw / 2}
                cy={y + nh / 2}
                rx={nw / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "diamond") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw / 2},${y} ${x + nw},${y + nh / 2} ${x + nw / 2},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "hexagon") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw * 0.25},${y} ${x + nw * 0.75},${y} ${x + nw},${y + nh / 2} ${x + nw * 0.75},${y + nh} ${x + nw * 0.25},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "pill") {
            return (
              <rect
                key={nd.id}
                x={x}
                y={y}
                width={nw}
                height={nh}
                rx={nh / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          return (
            <rect
              key={nd.id}
              x={x}
              y={y}
              width={nw}
              height={nh}
              rx={shape === "cylinder" ? Math.min(nw * 0.12, 6) : 4}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface InsightPanelProps {
  template: CanvasTemplate
}

function InsightPanel({ template }: InsightPanelProps) {
  const { insight } = template
  return (
    <div className="absolute inset-0 flex flex-col gap-3 overflow-y-auto rounded-t-2xl bg-bg-base/95 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 text-accent-primary" />
        <p className="text-xs font-semibold text-accent-primary uppercase tracking-wider">When to use</p>
      </div>
      <p className="text-xs leading-relaxed text-text-secondary">{insight.whenToUse}</p>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Use cases</p>
        <ul className="space-y-1">
          {insight.useCases.map((uc) => (
            <li key={uc} className="flex items-start gap-1.5 text-xs text-text-secondary">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" />
              {uc}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-state-success uppercase tracking-wider">Strengths</p>
          <ul className="space-y-1">
            {insight.pros.map((p) => (
              <li key={p} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-state-success" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-state-error uppercase tracking-wider">Trade-offs</p>
          <ul className="space-y-1">
            {insight.cons.map((c) => (
              <li key={c} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-state-error" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1520px,95vw)]! gap-0 p-0">
        <DialogHeader className="border-b border-border-default px-10 py-7">
          <DialogTitle className="text-xl">Import Template</DialogTitle>
          <DialogDescription>
            Choose a starter template to pre-populate your canvas. Any existing nodes will be
            replaced — use <kbd className="rounded border border-border-default bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-muted">⌘Z</kbd> to undo.
            Hover any card to learn when and why you&apos;d use that architecture.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-10 py-8 max-h-[72vh]">
          <div className="grid grid-cols-3 gap-6">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-elevated transition-colors hover:border-border-subtle"
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Preview area with insight overlay */}
                <div className="relative bg-bg-base px-5 pt-5 pb-4">
                  <TemplatePreview template={template} />
                  {hoveredId === template.id && (
                    <InsightPanel template={template} />
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-4 border-t border-border-default p-5">
                  <div>
                    <p className="text-base font-semibold text-text-primary">{template.name}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                      {template.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-auto w-full gap-2"
                    onClick={() => handleImport(template)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
