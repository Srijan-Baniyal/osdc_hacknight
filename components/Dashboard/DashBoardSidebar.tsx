"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp, useChatDashboard } from "@/context/chatContext";
import { cn } from "@/lib/utils";

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
  } = useChatDashboard();

  const disableSessionActions = isStreaming || isSending || isManagingSession;

  const handleSetApiKey = () => {
    const existing = apiKey ?? "";
    // biome-ignore lint/suspicious/noAlert: Simple API key input, proper modal would be overengineering
    const next = window.prompt("Enter your Perplexity API key", existing);
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed) {
      if (!hasCustomApiKey) {
        return;
      }
      // biome-ignore lint/suspicious/noAlert: Simple confirmation for API key removal
      const confirmed = window.confirm("Remove the stored API key?");
      if (!confirmed) {
        return;
      }
      saveApiKey(null);
      return;
    }
    saveApiKey(trimmed);
  };

  const handleClearApiKey = () => {
    if (!hasCustomApiKey) {
      return;
    }
    // biome-ignore lint/suspicious/noAlert: Simple confirmation for switching API keys
    const confirmed = window.confirm(
      "Switch back to the default provider key?"
    );
    if (!confirmed) {
      return;
    }
    saveApiKey(null);
  };

  return (
    <Sidebar className="bg-transparent hover:bg-transparent">
      <SidebarHeader className="">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              {" "}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col p-0">
        <div className="flex shrink-0 flex-col gap-3 px-3 pt-5 pb-3 sm:px-5">
          <div>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Chats
            </p>
            <h2 className="font-semibold text-foreground text-lg sm:text-xl">
              Conversations
            </h2>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button
              className="w-full rounded-full bg-card text-black shadow-lg sm:w-auto dark:text-white"
              disabled={isStreaming || isSending}
              onClick={startNewChat}
              size="sm"
              variant="secondary"
            >
              New chat
            </Button>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                className={cn(
                  "flex-1 rounded-full shadow-lg",
                  hasCustomApiKey
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card text-foreground hover:bg-card/90"
                )}
                disabled={isStreaming}
                onClick={handleSetApiKey}
                size="sm"
                variant={hasCustomApiKey ? "default" : "secondary"}
              >
                {hasCustomApiKey ? "Update key" : "Add key"}
              </Button>
              {hasCustomApiKey && (
                <Button
                  className="flex-1 rounded-full shadow"
                  disabled={isStreaming}
                  onClick={handleClearApiKey}
                  size="sm"
                  variant="secondary"
                >
                  Use default key
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="mx-3 mb-3 h-px shrink-0 bg-border sm:mx-5" />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-3">
          {isSidebarLoading && (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          )}
          {!isSidebarLoading && sessions.length === 0 && (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-4 text-center sm:p-6">
              <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                Start your first conversation to see it here.
              </p>
            </div>
          )}
          {!isSidebarLoading && sessions.length > 0 && (
            <ul className="space-y-1.5">
              {sessions.map((session) => (
                <li key={session._id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-xl border px-2 py-1 transition-all duration-200",
                      activeSessionId === session._id
                        ? "border-accent/20 bg-accent text-accent-foreground shadow-lg"
                        : "border-transparent bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <Button
                      className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      disabled={disableSessionActions}
                      onClick={() => selectSession(session._id)}
                      type="button"
                    >
                      <span className="wrap-break-word min-w-0 truncate font-medium text-sm leading-snug">
                        {session.title ?? "Conversation"}
                      </span>
                      <span className="text-muted-foreground text-xs leading-snug">
                        {formatTimestamp(
                          session.updatedAt ?? session.createdAt
                        )}
                      </span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className={cn(
                            "h-8 w-8 shrink-0 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100",
                            activeSessionId === session._id
                              ? "text-accent-foreground/80 hover:text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          disabled={disableSessionActions}
                          onClick={(event) => event.stopPropagation()}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={4}>
                        <DropdownMenuItem
                          disabled={disableSessionActions}
                          onSelect={async () => {
                            const currentTitle =
                              session.title?.trim() || "Conversation";
                            // biome-ignore lint/suspicious/noAlert: Quick chat rename, modal would slow down UX
                            const nextTitle = window.prompt(
                              "Rename chat",
                              currentTitle
                            );
                            if (typeof nextTitle !== "string") {
                              return;
                            }
                            const trimmedTitle = nextTitle.trim();
                            if (
                              !trimmedTitle ||
                              trimmedTitle === currentTitle
                            ) {
                              return;
                            }
                            try {
                              await renameSession(session._id, trimmedTitle);
                            } catch {
                              // errors handled via toast in context
                            }
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={disableSessionActions}
                          onSelect={async () => {
                            // biome-ignore lint/suspicious/noAlert: Critical destructive action confirmation
                            const confirmed = window.confirm(
                              "Delete this chat? This cannot be undone."
                            );
                            if (!confirmed) {
                              return;
                            }
                            try {
                              await deleteSession(session._id);
                            } catch {
                              // errors handled via toast in context
                            }
                          }}
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
  );
}
