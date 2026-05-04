"use client"

import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, Save, Share2, Sparkles, Upload, LayoutDashboard, GitGraph, ExternalLink } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle: () => void
  projectName?: string
  githubRepoUrl?: string | null
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  onOpenShareDialog?: () => void
  onOpenTemplates?: () => void
  onOpenIngest?: () => void
  onAutoLayout?: () => void
  saveStatus?: SaveStatus
  onSave?: () => void
}

export function EditorNavbar({
  isOpen,
  onToggle,
  projectName,
  githubRepoUrl,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onOpenShareDialog,
  onOpenTemplates,
  onOpenIngest,
  onAutoLayout,
  saveStatus,
  onSave,
}: EditorNavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {projectName ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{projectName}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-faint">Workspace</p>
                {githubRepoUrl && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-500 border border-green-500/20">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    CONNECTED
                  </div>
                )}
              </div>
            </div>
            {githubRepoUrl && (
              <a
                href={githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-[10px] font-medium text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-all group"
              >
                <GitGraph className="h-3 w-3" />
                <span className="hidden sm:inline">Repository</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
        ) : (
          <Logo size={24} />
        )}
      </div>

      <div className="flex items-center gap-2">
        {onToggleAiSidebar ? (
          <>
            {onSave ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onSave}
                disabled={saveStatus === "saving"}
              >
                <Save className="h-4 w-4" />
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved"
                  : saveStatus === "error"
                  ? "Error"
                  : "Save"}
              </Button>
            ) : null}

            {onAutoLayout ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onAutoLayout}
                title="Auto-arrange nodes using dagre layout"
              >
                <LayoutDashboard className="h-4 w-4" />
                Auto-layout
              </Button>
            ) : null}

            {onOpenIngest ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenIngest}
                title="Import an existing architecture"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            ) : null}

            {onOpenTemplates ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </Button>
            ) : null}

            {onOpenShareDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onOpenShareDialog}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            ) : null}

            <Button
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={onToggleAiSidebar}
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
          </>
        ) : null}

        {!onToggleAiSidebar ? <UserButton /> : null}
      </div>
    </header>
  )
}
