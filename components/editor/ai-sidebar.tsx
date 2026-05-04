"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Bot, X, Send, FileText, Download, Loader2, MessageSquare, Package, ShieldCheck, AlertTriangle, Info, ChevronDown, ChevronUp, ListChecks, Activity, Code } from "lucide-react"
import { toPng } from "html-to-image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useEventListener,
  useUpdateMyPresence,
  useFeedMessages,
  useCreateFeed,
  useCreateFeedMessage,
  useSelf,
  useStorage,
  useMutation,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { AiStatusFeedMessageSchema, ChatFeedMessageSchema } from "@/types/tasks"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { CanvasNode } from "@/types/canvas"

const FEED_ID = "ai-status-feed"
const CHAT_FEED_ID = "ai-chat"

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "TIMED_OUT",
  "INTERRUPTED",
  "SYSTEM_ERROR",
  "INVALID_PAYLOAD",
  "EXPIRED",
  "ABORTED",
] as const

interface SpecItem {
  id: string
  filePath: string
  snapshotUrl?: string | null
  createdAt: string
}

function getFilename(filePath: string): string {
  const clean = filePath.split("?")[0]
  return clean.split("/").at(-1) ?? "spec.md"
}

function formatSpecDate(date: string): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface RunTrackerProps {
  runId: string
  publicToken: string
  onTerminal: (status: string, output: unknown) => void
}

function RunTracker({ runId, publicToken, onTerminal }: RunTrackerProps) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken })
  const firedRef = useRef(false)

  useEffect(() => {
    if (!run || firedRef.current) return
    if (!(TERMINAL_STATUSES as readonly string[]).includes(run.status)) return
    firedRef.current = true
    onTerminal(run.status, run.output)
  }, [run?.status, run?.id, onTerminal])

  return null
}

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  projectId: string
  onImportArchitecture?: (payload: { nodes: any[]; edges: any[] }, githubUrl?: string) => void
  selectedNode?: CanvasNode | null
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function AiSidebar({ isOpen, onClose, roomId, projectId, onImportArchitecture, selectedNode }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect")
  
  // Tab scrolling logic
  const tabsListRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftValue = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsListRef.current) return
    isDragging.current = true
    startX.current = e.pageX - tabsListRef.current.offsetLeft
    scrollLeftValue.current = tabsListRef.current.scrollLeft
    tabsListRef.current.style.cursor = "grabbing"
  }

  const handleMouseLeave = () => {
    isDragging.current = false
    if (tabsListRef.current) tabsListRef.current.style.cursor = "grab"
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (tabsListRef.current) tabsListRef.current.style.cursor = "grab"
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !tabsListRef.current) return
    e.preventDefault()
    const x = e.pageX - tabsListRef.current.offsetLeft
    const walk = (x - startX.current) * 2
    tabsListRef.current.scrollLeft = scrollLeftValue.current - walk
  }

  const [input, setInput] = useState("")

  // Switch to inspector when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setActiveTab("inspector")
    }
  }, [selectedNode])
  const [isLoading, setIsLoading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>("")
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Spec state
  const [specs, setSpecs] = useState<SpecItem[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)
  
  const [fixModalOpen, setFixModalOpen] = useState(false)
  const [selectedFix, setSelectedFix] = useState<ReviewFinding | null>(null)
  const [selectedFixOption, setSelectedFixOption] = useState<ReviewFindingOption | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<SpecItem | null>(null)
  const [specContent, setSpecContent] = useState<string | null>(null)
  const [specContentLoading, setSpecContentLoading] = useState(false)
  const [specModalOpen, setSpecModalOpen] = useState(false)
  const [isSpecGenerating, setIsSpecGenerating] = useState(false)
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null)

  // Canvas storage for spec generation context
  // useStorage immutably serializes LiveMap as a plain readonly object, so use Object.values
  const nodesArray = useStorage((root) => {
    const m = root.flow?.nodes
    return m ? Object.values(m) : []
  })
  const edgesArray = useStorage((root) => {
    const m = root.flow?.edges
    return m ? Object.values(m) : []
  })

  // Review state
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: feedMessages } = useFeedMessages(FEED_ID)
  const { messages: chatFeedMessages } = useFeedMessages(CHAT_FEED_ID)

  const markNodesAsFixing = useMutation(({ storage }, nodeIds: string[]) => {
    const nodes = storage.get("flow").get("nodes")
    nodeIds.forEach(id => {
      const node = nodes.get(id)
      if (node) {
        ;(node as any).get("data").set("isFixing", true)
      }
    })
  }, [])

  const clearFixingNodes = useMutation(({ storage }) => {
    const nodes = storage.get("flow").get("nodes")
    for (const node of nodes.values()) {
      ;(node as any).get("data").set("isFixing", false)
    }
  }, [])

  // Feeds are created lazily right before they are used to ensure the room is connected

  const fetchSpecs = useCallback(() => {
    setSpecsLoading(true)
    fetch(`/api/projects/${projectId}/specs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => setSpecs(Array.isArray(data) ? (data as SpecItem[]) : []))
      .catch(() => setSpecs([]))
      .finally(() => setSpecsLoading(false))
  }, [projectId])

  const fetchLatestReview = useCallback(() => {
    fetch(`/api/projects/${projectId}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (data) {
          setReviewResult(data as ReviewResult)
        }
      })
      .catch((e) => console.error("Failed to fetch latest review", e))
  }, [projectId])

  // Fetch specs and reviews when sidebar opens
  useEffect(() => {
    if (!isOpen) return
    fetchSpecs()
    fetchLatestReview()
  }, [isOpen, fetchSpecs, fetchLatestReview])

  const handleReview = useCallback(async () => {
    if (reviewLoading) return
    setReviewLoading(true)
    setReviewError(null)
    setReviewResult(null)
    setExpandedFindings(new Set())
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: nodesArray ?? [], edges: edgesArray ?? [] }),
      })
      if (!res.ok) throw new Error("Review failed")
      const data = await res.json() as ReviewResult
      setReviewResult(data)

      // Save the review to the database
      fetch(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch((e) => console.error("Failed to save review result", e))
      
    } catch {
      setReviewError("Failed to run review. Please try again.")
    } finally {
      setReviewLoading(false)
    }
  }, [reviewLoading, nodesArray, edgesArray, projectId])

  const handleApplyFix = useCallback(async () => {
    if (!selectedFix || isLoading) return
    setIsLoading(true)
    setFixModalOpen(false) // Close the modal
    setActiveTab("chat") // Switch to chat to see progress

    // Mark affected nodes as fixing for visual feedback
    if (selectedFix.affectedNodes?.length > 0) {
      markNodesAsFixing(selectedFix.affectedNodes)
    }
    
    // Create the system prompt
    const prompt = selectedFixOption 
      ? `Implement this fix on the canvas: ${selectedFix.title}. The user has chosen this specific implementation: ${selectedFixOption.name} - ${selectedFixOption.description}`
      : `Implement this fix on the canvas: ${selectedFix.title} - ${selectedFix.recommendation}`
    
    // Add optimistic user message to feed
    try { await createFeed(CHAT_FEED_ID) } catch {}
    await createFeedMessage(CHAT_FEED_ID, {
      sender: "User",
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    })
    
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, roomId, projectId }),
      })
      if (!res.ok) throw new Error("Failed to trigger task")
      const data = await res.json()
      
      if (data.runId) {
        setRunId(data.runId)
        setPublicToken(data.publicToken)
        setStatusText("Applying fix to canvas...")
      }
    } catch (e) {
      console.error("Task trigger failed:", e)
      setChatError("Failed to apply fix. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedFix, isLoading, createFeed, createFeedMessage, roomId])

  const toggleFinding = useCallback((id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set<string>()
      // If it wasn't already expanded, expand it (and implicitly collapse others since we start with an empty set)
      if (!prev.has(id)) {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSpecRunTerminal = useCallback(
    (status: string) => {
      setIsSpecGenerating(false)
      setSpecRunId(null)
      setSpecPublicToken(null)
      if (status === "COMPLETED") fetchSpecs()
    },
    [fetchSpecs]
  )

  const handleRunTerminal = useCallback(
    (status: string, output: unknown) => {
      const isSuccess = status === "COMPLETED"
      const typedOutput = output as { summary?: string } | undefined
      const content = isSuccess
        ? (typedOutput?.summary ?? "Design applied to canvas.")
        : "TrueGraph AI encountered an error. Please try again."

      createFeedMessage(CHAT_FEED_ID, {
        sender: "TrueGraph AI",
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      }).catch(() => {})

      createFeedMessage(FEED_ID, {
        text: content,
        status: isSuccess ? "complete" : "error",
      }).catch(() => {})

      setIsLoading(false)
      setStatusText("")
      setRunId(null)
      setPublicToken(null)
      updateMyPresence({ thinking: false })
      clearFixingNodes()
    },
    [createFeedMessage, updateMyPresence, clearFixingNodes]
  )

  // Latest validated feed message for the status strip fallback
  const latestFeedMessage = (() => {
    if (!feedMessages?.length) return null
    const sorted = [...feedMessages].sort((a, b) => b.createdAt - a.createdAt)
    const parsed = AiStatusFeedMessageSchema.safeParse(sorted[0].data)
    return parsed.success ? parsed.data : null
  })()

  // Validated chat messages from the ai-chat feed, in chronological order
  const validatedChatMessages = (chatFeedMessages ?? [])
    .map((msg) => {
      const parsed = ChatFeedMessageSchema.safeParse(msg.data)
      if (!parsed.success) return null
      return { id: msg.id, createdAt: msg.createdAt, ...parsed.data }
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt)

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector("[data-slot='scroll-area-viewport']")
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [validatedChatMessages])

  const handleGenerateSpec = useCallback(async () => {
    if (isSpecGenerating) return
    setIsSpecGenerating(true)

    const nodes = nodesArray ?? []
    const edges = edgesArray ?? []
    const chatHistory = validatedChatMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Capture canvas snapshot before triggering the task
    let snapshotUrl: string | undefined
    try {
      const container = document.querySelector<HTMLElement>(".react-flow")
      if (container) {
        const dataUrl = await toPng(container, {
          backgroundColor: "#080809",
          pixelRatio: 2,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains("react-flow__controls") ||
                node.classList.contains("react-flow__minimap") ||
                node.classList.contains("react-flow__attribution") ||
                node.dataset?.exportExclude === "true"
              )
                return false
            }
            return true
          },
        })
        // Convert data URL to Blob and upload
        const res = await fetch(dataUrl)
        const imgBlob = await res.blob()
        const uploadRes = await fetch(
          `/api/projects/${encodeURIComponent(projectId ?? "")}/canvas/snapshot`,
          {
            method: "POST",
            headers: { "Content-Type": "image/png" },
            body: imgBlob,
          }
        )
        if (uploadRes.ok) {
          const data = (await uploadRes.json()) as { url: string }
          snapshotUrl = data.url
        }
      }
    } catch {
      // Non-fatal — spec still generates without snapshot
    }

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory, nodes, edges, snapshotUrl }),
      })
      if (!res.ok) throw new Error("Spec generation failed")
      const { runId: newSpecRunId } = (await res.json()) as { runId: string }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newSpecRunId }),
      })
      if (!tokenRes.ok) throw new Error("Token request failed")
      const { token } = (await tokenRes.json()) as { token: string }

      setSpecRunId(newSpecRunId)
      setSpecPublicToken(token)
    } catch {
      setIsSpecGenerating(false)
    }
  }, [isSpecGenerating, roomId, projectId, nodesArray, edgesArray, validatedChatMessages])

  // Receive broadcast status events for real-time strip text
  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return
    setStatusText(event.message)
  })

  // Scroll both tabs to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [validatedChatMessages.length])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    setIsLoading(true)
    updateMyPresence({ thinking: true })

    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
    }

    // Ensure feeds exist before pushing messages
    try { await createFeed(CHAT_FEED_ID) } catch {}
    try { await createFeed(FEED_ID) } catch {}

    // Push user message to shared ai-chat feed
    createFeedMessage(CHAT_FEED_ID, {
      sender: self?.info?.name ?? "Unknown",
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }).catch(() => {})

    // Write initial status to ai-status-feed
    createFeedMessage(FEED_ID, {
      text: "TrueGraph AI is analyzing your request…",
      status: "start",
    }).catch(() => {})

    setStatusText("TrueGraph AI is analyzing your request…")

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      })

      if (!designRes.ok) throw new Error("Design request failed")

      const { runId: newRunId } = (await designRes.json()) as { runId: string }

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      })

      if (!tokenRes.ok) throw new Error("Token request failed")

      const { token } = (await tokenRes.json()) as { token: string }

      setRunId(newRunId)
      setPublicToken(token)
    } catch {
      createFeedMessage(CHAT_FEED_ID, {
        sender: "TrueGraph AI",
        role: "assistant",
        content: "Failed to reach TrueGraph AI. Please try again.",
        timestamp: new Date().toISOString(),
      }).catch(() => {})

      createFeedMessage(FEED_ID, {
        text: "TrueGraph AI encountered an error.",
        status: "error",
      }).catch(() => {})

      setIsLoading(false)
      setStatusText("")
      updateMyPresence({ thinking: false })
    }
  }, [input, isLoading, roomId, projectId, updateMyPresence, createFeedMessage, self])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChip = useCallback((chip: string) => {
    setInput(chip)
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
      textareaRef.current.focus()
    }
  }, [])

  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleChatSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || chatInput).trim()
    if (!text || chatLoading) return

    setChatInput("")
    setChatLoading(true)
    setChatError(null)

    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "72px"
    }

    try {
      try { await createFeed(CHAT_FEED_ID) } catch {}
      
      // Push user message to the feed
      await createFeedMessage(CHAT_FEED_ID, {
        sender: self?.info?.name ?? "Unknown",
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      })

      // Prepare context for the AI
      const nodes = nodesArray ?? []
      const edges = edgesArray ?? []
      const chatHistory = validatedChatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Ask the AI
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, chatHistory, nodes, edges }),
      })

      if (!res.ok) throw new Error("AI Chat request failed")

      const { response, architectureUpdate } = (await res.json()) as {
        response: string
        architectureUpdate?: { nodes: any[]; edges: any[] }
      }

      // Push AI response to the feed
      await createFeedMessage(CHAT_FEED_ID, {
        sender: "TrueGraph AI",
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      })

      if (architectureUpdate && onImportArchitecture) {
        onImportArchitecture(architectureUpdate)
      }
    } catch (err: any) {
      setChatError(`Failed to send message: ${err.message ?? String(err)}`)
      console.error("Chat send error:", err)
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, chatLoading, createFeedMessage, self, nodesArray, edgesArray, validatedChatMessages, onImportArchitecture, createFeed])

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleChatSend()
      }
    },
    [handleChatSend]
  )

  const handleSpecClick = useCallback(
    async (spec: SpecItem) => {
      setSelectedSpec(spec)
      setSpecContent(null)
      setSpecContentLoading(true)
      setSpecModalOpen(true)

      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}`)
        if (!res.ok) throw new Error("Failed to fetch spec")
        const text = await res.text()
        setSpecContent(text)
      } catch {
        setSpecContent(null)
      } finally {
        setSpecContentLoading(false)
      }
    },
    [projectId]
  )

  const handleSpecDownload = useCallback(
    (specId: string) => {
      const a = document.createElement("a")
      a.href = `/api/projects/${projectId}/specs/${specId}/download`
      a.download = `spec-${specId}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    [projectId]
  )

  const handleBundleDownload = useCallback(
    (specId: string) => {
      const a = document.createElement("a")
      a.href = `/api/projects/${projectId}/specs/${specId}/bundle`
      a.download = `truegraph-bundle-${specId}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    [projectId]
  )

  const handleModalClose = useCallback(() => {
    setSpecModalOpen(false)
    setSelectedSpec(null)
    setSpecContent(null)
  }, [])

  const activeStatusText = statusText || (isLoading ? latestFeedMessage?.text ?? "" : "")

  return (
    <>
      {runId && publicToken && (
        <RunTracker
          runId={runId}
          publicToken={publicToken}
          onTerminal={handleRunTerminal}
        />
      )}
      {specRunId && specPublicToken && (
        <RunTracker
          runId={specRunId}
          publicToken={specPublicToken}
          onTerminal={handleSpecRunTerminal}
        />
      )}

      {/* Spec preview modal */}
      <Dialog open={specModalOpen} onOpenChange={(open) => { if (!open) handleModalClose() }}>
        <DialogContent
          showCloseButton
          className="max-w-2xl border-border-default bg-bg-surface"
        >
          <DialogHeader>
            <DialogTitle className="pr-6 text-sm font-medium text-text-primary">
              {selectedSpec ? getFilename(selectedSpec.filePath) : "Spec Preview"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] rounded-xl border border-border-subtle bg-bg-elevated">
            <div className="p-4">
              {specContentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : specContent ? (
                <div
                  className={cn(
                    "text-sm text-text-secondary leading-relaxed",
                    "[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-3 [&_h1]:mt-0",
                    "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h2]:mt-4",
                    "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-text-secondary [&_h3]:mb-1.5 [&_h3]:mt-3",
                    "[&_p]:mb-2 [&_p]:leading-relaxed",
                    "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2",
                    "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2",
                    "[&_li]:mb-1",
                    "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent-ai-text",
                    "[&_pre]:bg-bg-subtle [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:mb-2 [&_pre]:overflow-x-auto",
                    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                    "[&_strong]:font-semibold [&_strong]:text-text-primary",
                    "[&_blockquote]:border-l-2 [&_blockquote]:border-border-subtle [&_blockquote]:pl-3 [&_blockquote]:text-text-muted [&_blockquote]:italic"
                  )}
                >
                  <ReactMarkdown>{specContent}</ReactMarkdown>
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-text-muted">
                  Failed to load spec content.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end border-t border-border-default pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedSpec && handleSpecDownload(selectedSpec.id)}
              className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    <aside
      className={cn(
        "fixed inset-y-3 right-3 top-15 z-40 hidden w-84 flex-col rounded-3xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-transform duration-200 md:flex",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15">
          <Bot className="h-4 w-4 text-accent-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">AI Workspace</p>
          <p className="text-xs text-text-muted">Collaborate with TrueGraph AI</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 rounded-full bg-accent-ai/15 px-2 py-0.5 text-[10px] text-accent-ai-text">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Working</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TabsList 
          ref={tabsListRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="mt-2 flex h-9 shrink-0 flex-nowrap justify-start overflow-x-auto rounded-none border-b border-border-default bg-transparent p-0 no-scrollbar cursor-grab active:cursor-grabbing select-none"
        >
          <TabsTrigger
            value="architect"
            className="group relative h-full shrink-0 items-center justify-center gap-1.5 rounded-none border-none bg-transparent px-3 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary data-active:text-accent-ai"
          >
            <Bot className="h-3.5 w-3.5" />
            Architect
            <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-accent-ai transition-transform duration-200 group-data-active:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger
            value="inspector"
            className="group relative h-full shrink-0 items-center justify-center gap-1.5 rounded-none border-none bg-transparent px-3 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary data-active:text-accent-ai"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Inspector
            <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-accent-ai transition-transform duration-200 group-data-active:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="group relative h-full shrink-0 items-center justify-center gap-1.5 rounded-none border-none bg-transparent px-3 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary data-active:text-accent-ai"
          >
            <Activity className="h-3.5 w-3.5" />
            Review
            <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-accent-ai transition-transform duration-200 group-data-active:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="group relative h-full shrink-0 items-center justify-center gap-1.5 rounded-none border-none bg-transparent px-3 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary data-active:text-accent-ai"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
            <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-accent-ai transition-transform duration-200 group-data-active:scale-x-100" />
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="group relative h-full shrink-0 items-center justify-center gap-1.5 rounded-none border-none bg-transparent px-3 text-[11px] font-medium text-text-muted transition-colors hover:text-text-primary data-active:text-accent-ai"
          >
            <FileText className="h-3.5 w-3.5" />
            Notes
            <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-accent-ai transition-transform duration-200 group-data-active:scale-x-100" />
          </TabsTrigger>
        </TabsList>

        {/* Inspector Tab */}
        <TabsContent value="inspector" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="px-4 py-4">
                {!selectedNode ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle text-text-faint">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">No Node Selected</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Select a component on the canvas to inspect its deep architectural context.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: selectedNode.data.color + "20" }}
                      >
                        <Bot className="h-5 w-5" style={{ color: selectedNode.data.textColor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-text-primary">
                          {selectedNode.data.label}
                        </h3>
                        <p className="text-[10px] uppercase tracking-wider text-text-faint">
                          Architectural Component
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                      <div className="mb-2 flex items-center gap-2 text-text-primary">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Implementation Summary</span>
                      </div>
                      <p className="text-xs leading-relaxed text-text-secondary">
                        {selectedNode.data.summary || selectedNode.data.decisionTrace || "No summary available for this component."}
                      </p>
                    </div>

                    {/* Endpoints */}
                    {selectedNode.data.endpoints && selectedNode.data.endpoints.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-text-primary">
                          <Activity className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Active Endpoints</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {selectedNode.data.endpoints.map((ep: string) => (
                            <div key={ep} className="rounded-lg border border-border-subtle bg-bg-subtle px-3 py-1.5 font-mono text-[10px] text-accent-ai-text">
                              {ep}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File Links */}
                    {selectedNode.data.fileLinks && selectedNode.data.fileLinks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-text-primary">
                          <Code className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Core Files</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {selectedNode.data.fileLinks.map((file: string) => (
                            <div key={file} className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 transition-colors hover:border-border-default">
                              <span className="truncate text-[11px] text-text-secondary">{file}</span>
                              <FileText className="h-3 w-3 shrink-0 text-text-faint" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hygiene Checklist */}
                    {selectedNode.data.hygieneChecklist && selectedNode.data.hygieneChecklist.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-text-primary">
                          <ListChecks className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Hygiene Checklist</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {selectedNode.data.hygieneChecklist.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5">
                              <div className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                item.completed ? "border-green-500 bg-green-500/10 text-green-500" : "border-border-default text-text-faint"
                              )}>
                                {item.completed && <ShieldCheck className="h-2.5 w-2.5" />}
                              </div>
                              <span className={cn(
                                "text-xs",
                                item.completed ? "text-text-secondary" : "text-text-muted"
                              )}>
                                {item.task}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call to Action */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2 rounded-xl border-border-subtle bg-bg-elevated text-xs text-text-secondary hover:border-border-default hover:text-text-primary"
                        onClick={() => {
                          if (!selectedNode) return
                          const node = selectedNode.data
                          const prompt = `I want to know more about the component "${node.label}". 

Context: ${node.description || "No description provided."}
AI Analysis: ${node.summary || "No summary available."}
API Endpoints: ${node.endpoints?.join(", ") || "None identified."}
Files: ${node.fileLinks?.join(", ") || "None identified."}

Please explain how this component fits into the overall architecture and identify any potential risks or improvements.`
                          
                          // Switch to chat tab
                          setActiveTab("chat")
                          
                          // Populate input and send after a tiny delay to ensure tab has switched
                          setChatInput(prompt)
                          setTimeout(() => {
                            handleChatSend(prompt)
                          }, 100)
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Ask AI about this component
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1" ref={scrollRef as React.Ref<HTMLDivElement>}>
              <div className="px-4 pt-3 pb-2">
                {validatedChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-5 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
                      <Bot className="h-6 w-6 text-accent-ai-text" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        TrueGraph Architect
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Describe your system and I&apos;ll design the architecture on the canvas.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      {STARTER_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChip(chip)}
                          className="w-full rounded-full bg-bg-subtle px-4 py-2 text-left text-xs text-accent-ai-text transition-colors hover:bg-border-default"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    {validatedChatMessages.map((msg) =>
                      msg.role === "assistant" ? (
                        <div key={msg.id} className="flex justify-start gap-2">
                          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-ai/15">
                            <Bot className="h-3 w-3 text-accent-ai-text" />
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-accent-ai-text">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="flex justify-end">
                          <div
                            className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium text-white"
                            style={{ backgroundColor: "#62C073" }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Status strip — only visible while a run is active */}
            {isLoading && activeStatusText && (
              <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-accent-ai/20 bg-accent-ai/10 px-3 py-2 text-xs text-accent-ai-text">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                <span className="truncate">{activeStatusText}</span>
              </div>
            )}

            {/* Input area */}
            <div className="shrink-0 border-t border-border-default p-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your system…"
                  disabled={isLoading}
                  style={{ height: "72px", maxHeight: "160px" }}
                  className="resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none placeholder:text-text-faint focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-faint">Shift+Enter for newline</span>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="h-7 gap-1.5 rounded-lg px-3 text-xs text-white hover:opacity-90 disabled:opacity-40"
                    style={
                      !isLoading && input.trim()
                        ? { backgroundColor: "#62C073" }
                        : undefined
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    {isLoading ? "Thinking…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="min-h-0 flex-1 overflow-hidden">
          <ArchitectureReviewTab
            loading={reviewLoading}
            result={reviewResult}
            error={reviewError}
            expandedFindings={expandedFindings}
            onReview={handleReview}
            onToggleFinding={toggleFinding}
            onApplyFix={(finding) => {
              setSelectedFix(finding)
              setSelectedFixOption(finding.options?.find(o => o.isDefault) || finding.options?.[0] || null)
              setFixModalOpen(true)
            }}
            isApplyingFix={isLoading}
            applyingFixId={selectedFix?.id ?? null}
          />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden flex flex-col">
          <div className="flex h-full flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0" ref={chatScrollRef as React.Ref<HTMLDivElement>}>
              <div className="px-4 pt-3 pb-2">
                {validatedChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-subtle">
                      <MessageSquare className="h-5 w-5 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Room Chat</p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    {validatedChatMessages.map((msg) => {
                      const isMe =
                        msg.role === "user" && msg.sender === self?.info?.name
                      const isAI = msg.role === "assistant"
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col gap-0.5",
                            isMe ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-[10px] text-text-faint",
                              isMe && "flex-row-reverse"
                            )}
                          >
                            <span className="font-medium text-text-muted">
                              {isAI ? "TrueGraph AI" : msg.sender}
                            </span>
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
                              isMe
                                ? "rounded-br-sm font-medium text-white"
                                : isAI
                                  ? "rounded-bl-sm border border-border-subtle bg-bg-elevated text-text-primary"
                                  : "rounded-bl-sm border border-border-subtle bg-bg-elevated"
                            )}
                            style={isMe ? { backgroundColor: "#62C073" } : undefined}
                          >
                            {isAI ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ node, ...props }) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
                                  strong: ({ node, ...props }) => <strong className="font-semibold text-accent-ai-text" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 flex flex-col gap-1" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 flex flex-col gap-1" {...props} />,
                                  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                  code: ({ node, className, children, ...props }) => (
                                    <code className="bg-bg-subtle text-accent-ai-text px-1 py-0.5 rounded-[4px] font-mono text-[11px]" {...props}>
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            ) : (
                              msg.content
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 border-t border-border-default p-3">
              {chatError && (
                <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                  {chatError}
                </div>
              )}
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
                <Textarea
                  ref={chatTextareaRef}
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Ask a question about the architecture…"
                  disabled={chatLoading}
                  style={{ height: "72px", maxHeight: "160px" }}
                  className="resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none placeholder:text-text-faint focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-faint">Shift+Enter for newline</span>
                  <Button
                    size="sm"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="h-7 gap-1.5 rounded-lg px-3 text-xs text-white hover:opacity-90 disabled:opacity-40"
                    style={
                      !chatLoading && chatInput.trim()
                        ? { backgroundColor: "#62C073" }
                        : undefined
                    }
                  >
                    {chatLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    {chatLoading ? "Thinking…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specs (Notebook) Tab */}
        <TabsContent value="specs" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-3 p-4">
            <Button
              onClick={handleGenerateSpec}
              disabled={isSpecGenerating}
              className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80 disabled:opacity-60"
            >
              {isSpecGenerating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Writing Guide…
                </>
              ) : (
                "Generate Architectural Guide"
              )}
            </Button>

            {specsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <FileText className="h-8 w-8 text-text-faint" />
                <p className="text-xs text-text-muted">No guides yet. Generate a deep-dive notebook of your repo.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 pr-1">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="group flex cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 transition-colors hover:border-border-default"
                      onClick={() => handleSpecClick(spec)}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-subtle">
                        <FileText className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text-primary">
                          {getFilename(spec.filePath)}
                        </p>
                        <p className="text-[10px] text-text-faint">
                          {formatSpecDate(spec.createdAt)}
                        </p>
                      </div>
                      {/* MD download */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSpecDownload(spec.id)
                        }}
                        title="Download spec (.md)"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-faint opacity-0 transition-opacity hover:bg-bg-subtle hover:text-text-primary group-hover:opacity-100"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      {/* Bundle download — only if snapshot available */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBundleDownload(spec.id)
                        }}
                        title={spec.snapshotUrl ? "Download bundle (.zip)" : "Re-generate to include canvas image"}
                        disabled={!spec.snapshotUrl}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-faint opacity-0 transition-opacity hover:bg-bg-subtle hover:text-text-primary group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Package className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={fixModalOpen} onOpenChange={setFixModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0D192B] border-border-default">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-ai" />
              Apply Architectural Fix
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Are you sure you want Ghost AI to apply this fix to the canvas?
            </DialogDescription>
          </DialogHeader>
          
          {selectedFix && (
            <div className="flex flex-col gap-3 py-4">
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
                <p className="text-sm font-semibold text-text-primary mb-1">{selectedFix.title}</p>
                <p className="text-xs text-text-muted">{selectedFix.recommendation}</p>
              </div>

              {selectedFix.options && selectedFix.options.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-text-faint px-1">Choose Implementation</p>
                  <div className="grid gap-2">
                    {selectedFix.options.map((option) => {
                      const isSelected = selectedFixOption?.name === option.name
                      return (
                        <div
                          key={option.name}
                          onClick={() => setSelectedFixOption(option)}
                          className={cn(
                            "group cursor-pointer rounded-xl border p-3 transition-all",
                            isSelected 
                              ? "border-accent-ai bg-accent-ai/10 ring-1 ring-accent-ai" 
                              : "border-border-subtle bg-bg-subtle hover:border-border-default"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-lg",
                                isSelected ? "bg-accent-ai text-accent-ai-text" : "bg-bg-elevated text-text-muted"
                              )}>
                                {option.name.toLowerCase().includes("sentry") ? <Activity className="h-3.5 w-3.5" /> :
                                 option.name.toLowerCase().includes("posthog") ? <Activity className="h-3.5 w-3.5" /> : // TODO: specific icons later
                                 <Code className="h-3.5 w-3.5" />}
                              </div>
                              <span className="text-xs font-semibold text-text-primary">{option.name}</span>
                            </div>
                            {option.isDefault && (
                              <span className="rounded-full bg-accent-ai/20 px-2 py-0.5 text-[10px] font-bold text-accent-ai">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                            {option.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setFixModalOpen(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFix}
              disabled={isLoading}
              className="bg-accent-ai text-accent-ai-text hover:bg-accent-ai/90"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying...</>
              ) : (
                "Confirm & Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
    </>
  )
}

// ─── Review types & component ──────────────────────────────────────────────

type Severity = "critical" | "warning" | "info"

interface ReviewFindingOption {
  name: string
  description: string
  isDefault: boolean
}

interface ReviewFinding {
  id: string
  severity: Severity
  category: string
  title: string
  description: string
  recommendation: string
  affectedNodes: string[]
  options?: ReviewFindingOption[]
}

interface ReviewResult {
  score: number
  summary: string
  findings: ReviewFinding[]
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; icon: React.ReactNode; border: string; bg: string; text: string }
> = {
  critical: {
    label: "Critical",
    icon: <AlertTriangle className="h-3 w-3" />,
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  warning: {
    label: "Warning",
    icon: <AlertTriangle className="h-3 w-3" />,
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
  info: {
    label: "Info",
    icon: <Info className="h-3 w-3" />,
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
}

function scoreColor(score: number): string {
  if (score >= 80) return "#62C073"  // green
  if (score >= 60) return "#FF990A"  // amber
  if (score >= 40) return "#FF6166"  // red-orange
  return "#F75F8F"                   // pink/critical
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 75) return "Good"
  if (score >= 55) return "Fair"
  if (score >= 35) return "Needs Work"
  return "Critical Issues"
}

interface ArchitectureReviewTabProps {
  loading: boolean
  result: ReviewResult | null
  error: string | null
  expandedFindings: Set<string>
  onReview: () => void
  onToggleFinding: (id: string) => void
  onApplyFix: (finding: ReviewFinding) => void
  isApplyingFix: boolean
  applyingFixId: string | null
}

function ArchitectureReviewTab({
  loading,
  result,
  error,
  expandedFindings,
  onReview,
  onToggleFinding,
  onApplyFix,
  isApplyingFix,
  applyingFixId,
}: ArchitectureReviewTabProps) {
  const criticals = result?.findings.filter((f) => f.severity === "critical").length ?? 0
  const warnings = result?.findings.filter((f) => f.severity === "warning").length ?? 0

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10233D]">
                <ShieldCheck className="h-6 w-6 text-[#52A8FF]" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Architecture Review</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  AI analyzes your canvas for reliability, security, scalability, and performance issues.
                </p>
              </div>
              <div className="w-full rounded-2xl border border-border-subtle bg-bg-elevated p-3 text-left">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Reviews for</p>
                <ul className="space-y-1">
                  {["Single points of failure", "Missing auth layers", "Unscaled bottlenecks", "No caching strategy", "Observability gaps", "Security risks"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="h-1 w-1 rounded-full bg-accent-ai-text" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent-ai-text" />
              <p className="text-xs text-text-muted">Analyzing architecture…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              {/* Score ring */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke={scoreColor(result.score)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - result.score / 100)}`}
                      transform="rotate(-90 40 40)"
                      style={{ transition: "stroke-dashoffset 0.8s ease" }}
                    />
                  </svg>
                  <span className="text-xl font-bold text-text-primary">{result.score}</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: scoreColor(result.score) }}>
                    {scoreLabel(result.score)}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">{result.summary}</p>
                </div>
                <div className="flex gap-3 text-[11px]">
                  {criticals > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {criticals} critical
                    </span>
                  )}
                  {warnings > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {warnings} warning{warnings !== 1 ? "s" : ""}
                    </span>
                  )}
                  {criticals === 0 && warnings === 0 && (
                    <span className="flex items-center gap-1 text-[#62C073]">
                      <ShieldCheck className="h-3 w-3" />
                      No critical issues
                    </span>
                  )}
                </div>
              </div>

              {/* Findings */}
              {result.findings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">
                    {result.findings.length} Finding{result.findings.length !== 1 ? "s" : ""}
                  </p>
                  {result.findings.map((finding) => {
                    const cfg = SEVERITY_CONFIG[finding.severity]
                    const expanded = expandedFindings.has(finding.id)
                    return (
                      <div
                        key={finding.id}
                        className={cn(
                          "rounded-xl border p-3 transition-colors",
                          cfg.border, cfg.bg
                        )}
                      >
                        <button
                          className="flex w-full items-start gap-2 text-left"
                          onClick={() => onToggleFinding(finding.id)}
                        >
                          <span className={cn("mt-0.5 shrink-0", cfg.text)}>{cfg.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-text-primary">{finding.title}</p>
                              <div className="flex shrink-0 items-center gap-1">
                                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", cfg.text, cfg.bg)}>
                                  {finding.category}
                                </span>
                                {expanded
                                  ? <ChevronUp className="h-3 w-3 text-text-faint" />
                                  : <ChevronDown className="h-3 w-3 text-text-faint" />}
                              </div>
                            </div>
                          </div>
                        </button>
                        {expanded && (
                          <div className="mt-2 space-y-2 pl-5">
                            <p className="text-[11px] leading-relaxed text-text-muted">
                              {finding.description}
                            </p>
                            <div className="rounded-lg border border-border-subtle bg-bg-surface/50 p-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">Recommendation</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 gap-1 rounded-md px-2 text-[10px] font-semibold text-accent-ai-text hover:bg-accent-ai/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onApplyFix(finding)
                                  }}
                                  disabled={isApplyingFix}
                                >
                                  {isApplyingFix && applyingFixId === finding.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  ) : (
                                    <Activity className="h-2.5 w-2.5" />
                                  )}
                                  Apply Fix
                                </Button>
                              </div>
                              <p className="text-[11px] leading-relaxed text-text-secondary">
                                {finding.recommendation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* CTA */}
      <div className="shrink-0 border-t border-border-default p-3">
        <Button
          onClick={onReview}
          disabled={loading}
          className="w-full gap-2 rounded-xl bg-[#10233D] text-[#52A8FF] hover:bg-[#10233D]/80 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing…</>
          ) : (
            <><ShieldCheck className="h-3.5 w-3.5" />{result ? "Re-run Review" : "Review Architecture"}</>
          )}
        </Button>
      </div>

    </div>
  )
}
