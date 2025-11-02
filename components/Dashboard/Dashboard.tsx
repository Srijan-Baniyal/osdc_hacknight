"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatTimestamp,
  useChatDashboard,
  type ChatMessage,
} from "../../context/ChatContext";
import { Streamdown } from "streamdown";

interface ParsedAssistantContent {
  thinking: string;
  answer: string;
  sources: string;
}

const THINK_OPEN_REGEX = /<\s*(think|thinking)\s*>/i;
const THINK_CLOSE_REGEX = /<\s*\/\s*(think|thinking)\s*>/i;

function parseAssistantContent(content: string | undefined | null): ParsedAssistantContent {
  if (!content) {
    return { thinking: "", answer: "", sources: "" };
  }

  let remaining = content;
  let thinking = "";

  const thinkOpenMatch = remaining.match(THINK_OPEN_REGEX);
  if (thinkOpenMatch?.index !== undefined) {
    const openTag = thinkOpenMatch[0];
    const startIndex = thinkOpenMatch.index;
    const afterOpen = remaining.slice(startIndex + openTag.length);
    const thinkCloseMatch = afterOpen.match(THINK_CLOSE_REGEX);

    if (thinkCloseMatch?.index !== undefined) {
      const closeTag = thinkCloseMatch[0];
      thinking = afterOpen.slice(0, thinkCloseMatch.index).trim();
      const afterCloseIndex = thinkCloseMatch.index + closeTag.length;
      remaining = `${remaining.slice(0, startIndex)}${afterOpen.slice(afterCloseIndex)}`;
    } else {
      thinking = afterOpen.trim();
      remaining = remaining.slice(0, startIndex);
    }
  }

  const sourcesMarker = /Sources?\s*:/i;
  let sources = "";
  const sourcesIndex = remaining.search(sourcesMarker);
  if (sourcesIndex !== -1) {
    const sourcesContent = remaining.slice(sourcesIndex);
    sources = sourcesContent.replace(sourcesMarker, "").trim();
    remaining = remaining.slice(0, sourcesIndex);
  }

  const answer = remaining.trim();

  return {
    thinking: thinking.trim(),
    answer,
    sources: sources.trim(),
  };
}

interface AssistantSectionProps {
  title: string;
  children: ReactNode;
  tone?: "muted" | "default";
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function AssistantSection({
  title,
  children,
  tone,
  collapsible = false,
  defaultOpen = false,
}: AssistantSectionProps) {
  const [isOpen, setIsOpen] = useState(() => (collapsible ? defaultOpen : true));
  const resolvedOpen = collapsible ? isOpen : true;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        tone === "muted" ? "bg-muted/30 border-dashed" : "bg-background/70"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-auto px-2 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            {resolvedOpen ? "Hide" : "Show"}
          </Button>
        )}
      </div>
      {(!collapsible || resolvedOpen) && <div className={collapsible ? "mt-2 space-y-2" : "mt-2"}>{children}</div>}
    </div>
  );
}

function AssistantMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const { thinking, answer, sources } = parseAssistantContent(content);
  const hasContent = Boolean(thinking || answer || sources);

  if (!hasContent) {
    return <span className="text-muted-foreground">{isStreaming ? "Thinking…" : "Waiting for response."}</span>;
  }

  return (
    <div className="space-y-3">
      {thinking && (
        <AssistantSection
          title="Thinking"
          tone="muted"
          collapsible
        >
          <Streamdown className="text-sm leading-relaxed" isAnimating={isStreaming}>
            {thinking}
          </Streamdown>
        </AssistantSection>
      )}
      {answer && (
        <AssistantSection title="Answer">
          <Streamdown className="text-sm leading-relaxed" isAnimating={isStreaming}>
            {answer}
          </Streamdown>
        </AssistantSection>
      )}
      {sources && (
        <AssistantSection title="Sources" tone="muted">
          <Streamdown className="text-sm leading-relaxed" isAnimating={isStreaming}>
            {sources}
          </Streamdown>
        </AssistantSection>
      )}
    </div>
  );
}

export default function Dashboard() {
  const {
    messages,
    messagesEndRef,
    input,
    setInput,
    handleSubmit,
    handleStop,
    isStreaming,
    isSending,
  } = useChatDashboard();
  const formRef = useRef<HTMLFormElement | null>(null);
  const renderMessageMeta = (message: ChatMessage) => {
    const timestamp = message.createdAt ? formatTimestamp(message.createdAt) : "";
    const isUserMessage = message.role === "user";

    const pills: Array<{ key: string; label: string; value: string }> = [];

    if (timestamp) {
      pills.push({ key: `timestamp-${timestamp}`, label: "Sent", value: timestamp });
    }

    if (!isUserMessage) {
      const coerceNumber = (value: number | null | undefined) =>
        typeof value === "number" && Number.isFinite(value) ? value : undefined;

      const usage = message.usage;
      const inputTokens = coerceNumber(usage?.inputTokens ?? undefined);
      const outputTokens = coerceNumber(usage?.outputTokens ?? undefined);
      const totalTokens = coerceNumber(usage?.totalTokens ?? undefined);

      const formatToken = (label: string, value: number | undefined) =>
        value !== undefined ? `${label} ${value}` : `${label} N/A`;

      pills.push({
        key: "tokens",
        label: "Tokens",
        value: [
          formatToken("Input", inputTokens),
          formatToken("Output", outputTokens),
          formatToken("Total", totalTokens),
        ].join(" · "),
      });

      const durationMs = coerceNumber(message.durationMs ?? undefined);
      const durationLabel = (() => {
        if (durationMs === undefined) {
          return "N/A";
        }
        const seconds = durationMs / 1000;
        const formattedSeconds = seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1);
        return `${formattedSeconds.replace(/\.0$/, "")}s`;
      })();
      pills.push({ key: "duration", label: "Latency", value: durationLabel });

      const sourceCount = coerceNumber(message.sourceCount ?? undefined);
      pills.push({
        key: "sources",
        label: "Sources",
        value: sourceCount !== undefined ? String(sourceCount) : "N/A",
      });

      if (message.apiKeyType) {
        pills.push({
          key: "api-key",
          label: "Key",
          value: message.apiKeyType === "custom" ? "Custom" : "Default",
        });
      }
    }

    if (pills.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          "mt-3 flex flex-wrap gap-2 text-[11px] font-medium",
          isUserMessage ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {pills.map((pill) => (
          <span
            key={pill.key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-1",
              isUserMessage
                ? "border-primary/40 bg-primary/70 text-primary-foreground"
                : "border-border bg-muted/60 text-foreground"
            )}
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-80">
              {pill.label}
            </span>
            <span className="text-[11px] font-semibold normal-case tracking-normal opacity-95">
              {pill.value}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-lg">
      <header className="border-b px-10 pb-6 pt-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Perplexity Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Chat with Perplexity via the Vercel AI SDK and keep every message
          synced with MongoDB. Stay in flow with realtime streaming responses
          tailored to your research.
        </p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden px-10 pb-6">
        <div className="flex-1 space-y-5 overflow-y-auto rounded-3xl border bg-muted/30 px-6 py-7">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Ask anything to get started.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.createdAt ?? index}`}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-2xl rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card text-card-foreground shadow-lg"
                  )}
                >
                  {message.role === "assistant" ? (
                    <AssistantMessage
                      content={message.content}
                      isStreaming={isStreaming && index === messages.length - 1}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  {renderMessageMeta(message)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-6 flex w-full items-end gap-4 rounded-2xl border bg-card px-4 py-4 shadow-sm"
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.altKey &&
                !event.metaKey &&
                !event.ctrlKey
              ) {
                event.preventDefault();
                if (!isSending && input.trim()) {
                  formRef.current?.requestSubmit();
                }
              }
            }}
            placeholder="Ask Perplexity anything..."
            rows={3}
            className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            disabled={isSending}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={!input.trim() || isSending}>
              {isSending ? "Sending" : "Send"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isStreaming}
              onClick={handleStop}
            >
              Stop
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
