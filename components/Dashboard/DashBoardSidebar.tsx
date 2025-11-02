"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatTimestamp, useChatDashboard } from "@/context/ChatContext"
import { MoreVertical } from "lucide-react"

export function AppSidebar() {
  const {
    sessions,
    isSidebarLoading,
    activeSessionId,
    selectSession,
    startNewChat,
    isStreaming,
    isSending,
    renameSession,
    deleteSession,
    isManagingSession,
    apiKey,
    saveApiKey,
    hasCustomApiKey,
  } = useChatDashboard()

  const disableSessionActions = isStreaming || isSending || isManagingSession

  const handleSetApiKey = () => {
    const existing = apiKey ?? ""
    const next = window.prompt("Enter your Perplexity API key", existing)
    if (next === null) {
      return
    }
    const trimmed = next.trim()
    if (!trimmed) {
      if (!hasCustomApiKey) {
        return
      }
      const confirmed = window.confirm("Remove the stored API key?")
      if (!confirmed) {
        return
      }
      saveApiKey(null)
      return
    }
    saveApiKey(trimmed)
  }

  const handleClearApiKey = () => {
    if (!hasCustomApiKey) {
      return
    }
    const confirmed = window.confirm("Switch back to the default provider key?")
    if (!confirmed) {
      return
    }
    saveApiKey(null)
  }

  return (
    <Sidebar collapsible="icon" className="bg-transparent hover:bg-transparent">
      <SidebarHeader className="">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-0 flex flex-col">
        <div className="flex flex-col gap-3 px-3 sm:px-5 pb-3 pt-5 shrink-0">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Chats</p>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Conversations</h2>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full bg-card shadow-lg text-black dark:text-white w-full sm:w-auto"
              onClick={startNewChat}
              disabled={isStreaming || isSending}
            >
              New chat
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                size="sm"
                variant={hasCustomApiKey ? "default" : "secondary"}
                className={cn(
                  "rounded-full shadow-lg flex-1",
                  hasCustomApiKey
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card text-foreground hover:bg-card/90",
                )}
                onClick={handleSetApiKey}
                disabled={isStreaming}
              >
                {hasCustomApiKey ? "Update key" : "Add key"}
              </Button>
              {hasCustomApiKey && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full shadow flex-1"
                  onClick={handleClearApiKey}
                  disabled={isStreaming}
                >
                  Use default key
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="mx-3 sm:mx-5 mb-3 h-px bg-border shrink-0" />
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-4 min-h-0">
          {isSidebarLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Start your first conversation to see it here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {sessions.map((session) => (
                <li key={session._id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-xl border px-2 py-1 transition-all duration-200",
                      activeSessionId === session._id
                        ? "border-accent/20 bg-accent shadow-lg text-accent-foreground"
                        : "border-transparent bg-secondary hover:bg-secondary/80",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectSession(session._id)}
                      className="flex flex-1 flex-col gap-1 rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring min-w-0"
                      disabled={disableSessionActions}
                    >
                      <span className="truncate text-sm font-medium leading-snug break-words min-w-0">
                        {session.title ?? "Conversation"}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {formatTimestamp(session.updatedAt ?? session.createdAt)}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={disableSessionActions}
                          className={cn(
                            "h-8 w-8 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
                            activeSessionId === session._id
                              ? "text-accent-foreground/80 hover:text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem
                          onSelect={async () => {
                            const currentTitle = session.title?.trim() || "Conversation"
                            const nextTitle = window.prompt("Rename chat", currentTitle)
                            if (typeof nextTitle !== "string") {
                              return
                            }
                            const trimmedTitle = nextTitle.trim()
                            if (!trimmedTitle || trimmedTitle === currentTitle) {
                              return
                            }
                            try {
                              await renameSession(session._id, trimmedTitle)
                            } catch {
                              // errors handled via toast in context
                            }
                          }}
                          disabled={disableSessionActions}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={async () => {
                            const confirmed = window.confirm("Delete this chat? This cannot be undone.")
                            if (!confirmed) {
                              return
                            }
                            try {
                              await deleteSession(session._id)
                            } catch {
                              // errors handled via toast in context
                            }
                          }}
                          disabled={disableSessionActions}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
