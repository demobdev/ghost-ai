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
  Globe,
  ChevronRight,
  ArrowLeft,
  Search,
  Lock,
} from "lucide-react"
import { useEffect } from "react"
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
  onImport: (result: IngestResult, githubUrl?: string) => void
}

type IngestMode = "choose" | "text" | "mermaid" | "upload" | "github"

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
  
  // GitHub Repos State
  const [repos, setRepos] = useState<any[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoSearch, setRepoSearch] = useState("")
  
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
      const laidOut = applyDagreLayout(nodes, edges)

      onImport({ nodes: laidOut, edges })
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [input, loading, onImport, handleClose])

  // Fetch GitHub repos when mode changes to github
  useEffect(() => {
    if (mode === "github") {
      const fetchRepos = async () => {
        setLoadingRepos(true)
        try {
          const res = await fetch("/api/ai/ingest/github/repos")
          if (res.ok) {
            const data = await res.json()
            setRepos(data.repos || [])
          }
        } catch (err) {
          console.error("Failed to fetch repos", err)
        } finally {
          setLoadingRepos(false)
        }
      }
      fetchRepos()
    }
  }, [mode])

  const filteredRepos = repos.filter(r => 
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      let parsedNodes: any[] = []
      let parsedEdges: any[] = []

      // Handle standard Graphify / Network JSON structures
      if (data.nodes && Array.isArray(data.nodes)) {
        parsedNodes = data.nodes
      }
      if (data.edges && Array.isArray(data.edges)) {
        parsedEdges = data.edges
      } else if (data.links && Array.isArray(data.links)) {
        parsedEdges = data.links
      }

      if (parsedNodes.length === 0) {
        throw new Error("No nodes found in JSON file.")
      }

      const canvasNodes: CanvasNode[] = parsedNodes.map((n, i) => ({
        id: String(n.id || `node-${i}`),
        type: "canvasNode" as const,
        position: { x: 0, y: 0 },
        data: {
          label: n.name || n.label || n.id || "Unknown Node",
          description: n.description || "",
        }
      }))

      const canvasEdges: CanvasEdge[] = parsedEdges.map((e, i) => ({
        id: String(e.id || `edge-${i}`),
        source: String(e.source),
        target: String(e.target),
      }))

      const laidOut = applyDagreLayout(canvasNodes, canvasEdges)

      onImport({ nodes: laidOut, edges: canvasEdges })
      handleClose(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON file")
    } finally {
      setLoading(false)
    }
  }, [onImport, handleClose])

  const handleGithubImport = useCallback(async () => {
    if (!input.trim() || loading || !input.includes("github.com/")) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/ingest/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.trim() }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to ingest GitHub repository")
      }

      const { nodes, edges } = (await res.json()) as IngestResult

      const laidOut = applyDagreLayout(nodes, edges)
      onImport({ nodes: laidOut, edges }, input.trim())
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
        className="max-w-[95vw] md:max-w-lg w-full border-border-default bg-bg-surface p-0 gap-0 overflow-hidden"
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

        <div className="max-h-[min(85vh,640px)] overflow-y-auto custom-scrollbar">


        {/* Choose mode */}
        {mode === "choose" && (
          <div className="p-4 flex flex-col gap-3">
            <ModeCard
              icon={<Globe className="h-5 w-5" />}
              title="Import from GitHub"
              description="Paste a public repository URL to instantly map its architecture."
              badge="Magic"
              badgeColor="blue"
              onClick={() => handleModeSelect("github")}
            />
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
              title="Upload Graph JSON"
              description="Upload a graph.json file generated by AST extraction tools like Graphify."
              badge="New"
              badgeColor="green"
              onClick={() => handleModeSelect("upload")}
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

        {/* Upload input */}
        {mode === "upload" && (
          <div className="flex flex-col gap-0 px-4 pt-4 pb-4">
            <div className="relative rounded-xl border-2 border-dashed border-border-subtle bg-bg-elevated p-8 text-center flex flex-col items-center justify-center hover:border-accent-ai/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleFileUpload}
                disabled={loading}
              />
              <Upload className="h-8 w-8 text-text-muted mb-3" />
              <p className="text-sm text-text-primary font-medium">Click or drag graph.json to upload</p>
              <p className="text-xs text-text-faint mt-1">Automatically maps nodes and edges to the canvas</p>
            </div>
            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}
            {loading && (
              <div className="mt-4 flex items-center justify-center text-xs text-text-muted gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing graph...
              </div>
            )}
          </div>
        )}

        {/* GitHub input */}
        {mode === "github" && (
          <div className="flex flex-col gap-0 px-6 pt-4 pb-6">
            <div className="flex flex-col gap-4">
              {/* Repo Selector / Search */}
              <div className="relative flex flex-col gap-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-3.5 w-3.5 text-text-faint" />
                  <input
                    type="text"
                    placeholder="Search your repositories..."
                    className="w-full rounded-xl border border-border-subtle bg-bg-elevated py-2.5 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-faint focus:border-accent-ai/50 focus:outline-none transition-colors shadow-sm"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[240px] overflow-y-auto rounded-xl border border-border-subtle bg-bg-elevated custom-scrollbar divide-y divide-border-subtle/50 shadow-inner">
                  {loadingRepos ? (
                    <div className="flex flex-col items-center justify-center p-12 text-xs text-text-faint gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-ai" />
                      <span>Fetching your projects...</span>
                    </div>
                  ) : filteredRepos.length > 0 ? (
                    filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => setInput(repo.html_url)}
                        className={cn(
                          "flex w-full items-center justify-between px-4 py-3 text-left text-xs transition-all hover:bg-bg-subtle group",
                          input === repo.html_url && "bg-accent-ai/5 text-accent-ai-text"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Globe className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            input === repo.html_url ? "text-accent-ai" : "text-text-muted group-hover:text-text-primary"
                          )} />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold tracking-tight">{repo.full_name}</span>
                              {repo.private && (
                                <span className="flex items-center gap-1 rounded-full bg-bg-subtle px-1.5 py-0.5 text-[9px] font-medium text-text-faint">
                                  <Lock className="h-2 w-2" />
                                  Private
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-faint">
                              Last updated {new Date(repo.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
                          input === repo.html_url ? "text-accent-ai opacity-100" : "text-text-faint"
                        )} />
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center text-xs text-text-faint">
                      {repoSearch ? "No matching repositories found." : "No repositories found or GitHub not connected."}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex flex-col gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-faint px-1">
                  Or manual URL
                </label>
                <div className="flex items-center gap-3 bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 focus-within:border-accent-ai/50 transition-colors shadow-sm">
                  <Globe className="h-4 w-4 text-text-muted" />
                  <input
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 w-full bg-transparent text-sm text-text-primary placeholder:text-text-faint focus:outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <p className="text-[10px] text-text-faint mt-1 px-1">
                  Paste any public GitHub URL or select a private one from the list above.
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                <p className="font-medium">Import failed</p>
                <p className="opacity-80 mt-0.5">{error}</p>
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-border-default pt-4">
              <div className="flex items-center gap-2 text-[11px] text-text-faint">
                <Sparkles className="h-3 w-3 text-accent-ai-text" />
                <span>AI auto-detects architecture from tree</span>
              </div>
              <Button
                size="sm"
                onClick={handleGithubImport}
                disabled={loading || !input.trim() || !input.includes("github.com/")}
                className="h-9 gap-2 rounded-xl bg-accent-ai px-5 text-xs font-semibold text-white hover:bg-accent-ai/90 disabled:opacity-50 transition-all shadow-lg shadow-accent-ai/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Repo…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Map
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
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
