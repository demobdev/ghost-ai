"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Sparkles,
  FileCode2,
  Type,
  Upload,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import { applyDagreLayout } from "@/lib/layout"
import { cn } from "@/lib/utils"

interface IngestResult {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface IngestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (result: IngestResult) => void
}

type IngestMode = "choose" | "text" | "mermaid"

const EXAMPLE_TEXT = `We have a React web app that talks to a GraphQL API gateway. 
Behind the gateway are three microservices: an Auth Service, a User Service, 
and an Orders Service. The Orders Service reads from a PostgreSQL database 
and publishes events to a Redis queue. A background Worker processes the 
queue and writes results to S3 storage.`

const EXAMPLE_MERMAID = `graph TD
    Client[React App] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Users[User Service]
    Gateway --> Orders[Orders Service]
    Orders --> DB[(PostgreSQL)]
    Orders --> Queue[(Redis Queue)]
    Queue --> Worker[Background Worker]
    Worker --> Storage[(S3 Storage)]`

const MERMAID_HINTS = [
  "graph TD / graph LR",
  "flowchart",
  "sequenceDiagram",
  "PlantUML @startuml",
]

export function IngestModal({ open, onOpenChange, onImport }: IngestModalProps) {
  const [mode, setMode] = useState<IngestMode>("choose")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const reset = useCallback(() => {
    setMode("choose")
    setInput("")
    setError(null)
    setLoading(false)
  }, [])

  const handleClose = useCallback(
    (val: boolean) => {
      if (!val) reset()
      onOpenChange(val)
    },
    [onOpenChange, reset]
  )

  const handleModeSelect = useCallback((m: IngestMode) => {
    setMode(m)
    setError(null)
    setInput(m === "mermaid" ? EXAMPLE_MERMAID : "")
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleImport = useCallback(async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Ingest failed")
      }

      const { nodes, edges } = (await res.json()) as IngestResult

      // Apply dagre layout so nodes are arranged neatly
      const laidOut = applyDagreLayout(nodes, edges, { direction: "TB", rankSep: 130, nodeSep: 90 })

      onImport({ nodes: laidOut, edges })
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [input, loading, onImport, handleClose])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton
        className="max-w-lg border-border-default bg-bg-surface p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            {mode !== "choose" && (
              <button
                onClick={() => { setMode("choose"); setError(null) }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <DialogTitle className="text-sm font-semibold text-text-primary">
                Import Architecture
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted mt-0.5">
                {mode === "choose"
                  ? "Bring your existing architecture into the canvas"
                  : mode === "text"
                  ? "Describe your system in plain English"
                  : "Paste Mermaid, PlantUML, or diagram code"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Choose mode */}
        {mode === "choose" && (
          <div className="p-4 flex flex-col gap-3">
            <ModeCard
              icon={<Type className="h-5 w-5" />}
              title="Describe in plain text"
              description="Tell us about your system in natural language — services, databases, APIs, and how they connect."
              badge="Most flexible"
              badgeColor="green"
              onClick={() => handleModeSelect("text")}
            />
            <ModeCard
              icon={<FileCode2 className="h-5 w-5" />}
              title="Paste diagram code"
              description="Import from Mermaid, PlantUML, or any text-based diagram format."
              badge="Precise"
              badgeColor="blue"
              tags={MERMAID_HINTS}
              onClick={() => handleModeSelect("mermaid")}
            />
            <ModeCard
              icon={<Upload className="h-5 w-5" />}
              title="Upload a file"
              description="Coming soon — paste JSON, YAML service mesh configs, or OpenAPI specs."
              disabled
              badge="Coming soon"
              badgeColor="gray"
              onClick={() => {}}
            />
          </div>
        )}

        {/* Text / Mermaid input */}
        {(mode === "text" || mode === "mermaid") && (
          <div className="flex flex-col gap-0">
            <div className="px-4 pt-4 pb-3">
              {mode === "text" && (
                <p className="mb-2 text-[11px] text-text-muted leading-relaxed">
                  Example:{" "}
                  <button
                    className="text-accent-ai-text underline underline-offset-2 hover:no-underline"
                    onClick={() => setInput(EXAMPLE_TEXT)}
                  >
                    fill with sample
                  </button>
                </p>
              )}
              <div className="relative rounded-xl border border-border-subtle bg-bg-elevated overflow-hidden focus-within:border-accent-ai/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "text"
                      ? "We have a React frontend that connects to a Node.js API. The API reads from PostgreSQL and caches results in Redis…"
                      : "graph TD\n    A[Client] --> B[API Gateway]\n    B --> C[Auth Service]\n    B --> D[User Service]\n    D --> E[(Database)]"
                  }
                  rows={10}
                  className="w-full resize-none bg-transparent p-4 text-xs font-mono text-text-primary placeholder:text-text-faint focus:outline-none"
                  style={{ fontFamily: mode === "mermaid" ? "var(--font-mono, monospace)" : "inherit" }}
                />
                <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
                  <span className="text-[10px] text-text-faint">
                    {input.length.toLocaleString()} chars
                    {input.length > 10000 && (
                      <span className="ml-1 text-amber-400">· approaching limit</span>
                    )}
                  </span>
                  {mode === "text" && (
                    <span className="text-[10px] text-text-faint">
                      AI will extract components automatically
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] text-text-faint">
                <Sparkles className="h-3 w-3 text-accent-ai-text" />
                <span>AI extracts nodes · dagre auto-arranges layout</span>
              </div>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={loading || !input.trim() || input.length > 12000}
                className="h-8 gap-1.5 rounded-xl bg-accent-ai px-4 text-xs text-white hover:bg-accent-ai/80 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Import to Canvas
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ModeCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  badgeColor?: "green" | "blue" | "gray"
  tags?: string[]
  disabled?: boolean
  onClick: () => void
}

function ModeCard({
  icon,
  title,
  description,
  badge,
  badgeColor = "gray",
  tags,
  disabled,
  onClick,
}: ModeCardProps) {
  const badgeClasses: Record<string, string> = {
    green: "bg-[#0F2E18] text-[#62C073]",
    blue: "bg-[#10233D] text-[#52A8FF]",
    gray: "bg-bg-subtle text-text-muted",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-start gap-4 rounded-2xl border border-border-subtle bg-bg-elevated p-4 text-left transition-all",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-border-default hover:bg-bg-elevated/80"
      )}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-text-secondary group-hover:text-text-primary transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{title}</span>
          {badge && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badgeClasses[badgeColor])}>
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
        {tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] text-text-faint">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      {!disabled && (
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-faint group-hover:text-text-muted transition-colors" />
      )}
    </button>
  )
}
