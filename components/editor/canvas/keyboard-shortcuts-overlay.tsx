"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Canvas",
    shortcuts: [
      { keys: ["+"], description: "Zoom in" },
      { keys: ["-"], description: "Zoom out" },
      { keys: ["Shift", "1"], description: "Fit view" },
      { keys: ["Scroll"], description: "Zoom canvas" },
      { keys: ["Space", "drag"], description: "Pan canvas" },
    ],
  },
  {
    title: "Nodes",
    shortcuts: [
      { keys: ["Drag"], description: "Move node" },
      { keys: ["Double-click"], description: "Edit label" },
      { keys: ["Delete"], description: "Delete selected" },
      { keys: ["⌘", "C"], description: "Copy selected" },
      { keys: ["⌘", "V"], description: "Paste" },
      { keys: ["⌘", "D"], description: "Duplicate" },
    ],
  },
  {
    title: "History",
    shortcuts: [
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "Y"], description: "Redo (alt)" },
    ],
  },
  {
    title: "Edges",
    shortcuts: [
      { keys: ["Drag handle"], description: "Connect nodes" },
      { keys: ["Double-click edge"], description: "Edit label" },
    ],
  },
  {
    title: "AI",
    shortcuts: [
      { keys: ["Enter"], description: "Send AI prompt" },
      { keys: ["Shift", "Enter"], description: "Newline in prompt" },
    ],
  },
  {
    title: "App",
    shortcuts: [
      { keys: ["⌘", "S"], description: "Save canvas" },
      { keys: ["?"], description: "Toggle shortcuts" },
    ],
  },
]

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    )
      return

    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      e.preventDefault()
      setOpen((prev) => !prev)
    }

    if (e.key === "Escape" && open) {
      setOpen(false)
    }
  }, [open])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative w-[520px] max-h-[80vh] overflow-y-auto rounded-3xl border border-border-subtle bg-bg-surface/98 shadow-2xl backdrop-blur-xl",
          "animate-in fade-in-0 zoom-in-95 duration-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-border-default bg-bg-surface/98 px-6 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
            <p className="text-xs text-text-muted">Press <Kbd>?</Kbd> to toggle</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-px bg-border-subtle p-0">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="bg-bg-surface p-5">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.shortcuts.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{s.description}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <Kbd key={ki}>{k}</Kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="rounded-b-3xl border-t border-border-default px-6 py-3">
          <p className="text-center text-[10px] text-text-faint">
            Click anywhere outside or press <Kbd>Esc</Kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border-default bg-bg-elevated px-1.5 font-mono text-[10px] text-text-secondary shadow-sm">
      {children}
    </span>
  )
}
