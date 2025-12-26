"use client";

import { BookOpen, Clock, ExternalLink, Link2, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type ChatMessage,
  formatTimestamp,
  type Source,
  useChatDashboard,
} from "@/context/chatContext";
import { cn } from "@/lib/utils";

interface ParsedAssistantContent {
  thinking: string;
  answer: string;
  inlineSourcesText: string;
}

const THINK_OPEN_REGEX = /<\s*(think|thinking)\s*>/i;
const THINK_CLOSE_REGEX = /<\s*\/\s*(think|thinking)\s*>/i;
const SOURCES_MARKER_REGEX = /Sources?\s*:/i;
const TRAILING_ZERO_REGEX = /\.0$/;

function parseAssistantContent(
  content: string | undefined | null
): ParsedAssistantContent {
  if (!content) {
    return { thinking: "", answer: "", inlineSourcesText: "" };
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

  let inlineSourcesText = "";
  const sourcesIndex = remaining.search(SOURCES_MARKER_REGEX);
  if (sourcesIndex !== -1) {
    const sourcesContent = remaining.slice(sourcesIndex);
    inlineSourcesText = sourcesContent.replace(SOURCES_MARKER_REGEX, "").trim();
    remaining = remaining.slice(0, sourcesIndex);
  }

  const answer = remaining.trim();

  return {
    thinking: thinking.trim(),
    answer,
    inlineSourcesText: inlineSourcesText.trim(),
  };
}

interface SourceCardProps {
  source: Source;
  index: number;
}

function SourceCard({ source, index }: SourceCardProps) {
  const domain = (() => {
    try {
      return new URL(source.url).hostname.replace("www.", "");
    } catch {
      return source.url;
    }
  })();

  return (
    <a
      className="group block rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
      href={source.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary text-xs">
              {index + 1}
            </div>
            <span className="truncate font-medium text-muted-foreground text-xs">
              {domain}
            </span>
          </div>
          <h3 className="line-clamp-2 font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
            {source.title || source.url}
          </h3>
          <p className="mt-1 truncate text-muted-foreground text-xs">
            {source.url}
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
    </a>
  );
}

interface AssistantSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function AssistantSection({
  title,
  children,
  icon,
  collapsible = false,
  defaultOpen = false,
}: AssistantSectionProps) {
  const [isOpen, setIsOpen] = useState(() =>
    collapsible ? defaultOpen : true
  );
  const resolvedOpen = collapsible ? isOpen : true;

  return (
    <div className="rounded-xl border bg-linear-to-br from-card/50 to-card backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          <div className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {title}
          </div>
        </div>
        {collapsible && (
          <Button
            className="h-auto px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground"
            onClick={() => setIsOpen((prev) => !prev)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {resolvedOpen ? "Hide" : "Show"}
          </Button>
        )}
      </div>
      {(!collapsible || resolvedOpen) && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  );
}

interface AssistantMessageProps {
  content: string;
  isStreaming: boolean;
  sources?: Source[];
}

function AssistantMessage({
  content,
  isStreaming,
  sources,
}: AssistantMessageProps) {
  const { thinking, answer } = parseAssistantContent(content);
  const hasContent = Boolean(thinking || answer);
  const hasSources = sources && sources.length > 0;

  if (!hasContent) {
    return (
      <span className="text-muted-foreground">
        {isStreaming ? "Thinking…" : "Waiting for response."}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {thinking && (
        <AssistantSection
          collapsible
          defaultOpen={false}
          icon={<Zap className="h-4 w-4" />}
          title="Thinking Process"
        >
          <div className="rounded-lg bg-muted/30 p-3">
            <Streamdown
              className="text-muted-foreground text-sm leading-relaxed"
              isAnimating={isStreaming}
            >
              {thinking}
            </Streamdown>
          </div>
        </AssistantSection>
      )}
      {hasSources && (
        <AssistantSection
          collapsible
          defaultOpen={false}
          icon={<Link2 className="h-4 w-4" />}
          title={`Sources (${sources.length})`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {sources.map((source, idx) => (
              <SourceCard
                index={idx}
                key={`${source.url}-${idx}`}
                source={source}
              />
            ))}
          </div>
        </AssistantSection>
      )}
      {answer && (
        <AssistantSection
          icon={<BookOpen className="h-4 w-4" />}
          title="Answer"
        >
          <Streamdown
            className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
            isAnimating={isStreaming}
          >
            {answer}
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

  const coerceNumber = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

  const buildTimestampPill = (message: ChatMessage) => {
    const timestamp = message.createdAt
      ? formatTimestamp(message.createdAt)
      : "";
    return timestamp
      ? [{ key: `timestamp-${timestamp}`, label: "Sent", value: timestamp }]
      : [];
  };

  const buildAssistantPills = (message: ChatMessage) => {
    const pills: Array<{ key: string; label: string; value: string }> = [];

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
        formatToken("In", inputTokens),
        formatToken("Out", outputTokens),
        formatToken("Total", totalTokens),
      ].join(" · "),
    });

    const durationMs = coerceNumber(message.durationMs ?? undefined);
    pills.push({
      key: "duration",
      label: "Latency",
      value: formatDuration(durationMs),
    });

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

    return pills;
  };

  const renderMessageMeta = (message: ChatMessage) => {
    const isUserMessage = message.role === "user";
    const timestampPills = buildTimestampPill(message);
    const assistantPills = isUserMessage ? [] : buildAssistantPills(message);
    const pills = [...timestampPills, ...assistantPills];

    return pills.length === 0 ? null : renderPills(pills, isUserMessage);
  };

  const formatDuration = (durationMs: number | undefined): string => {
    if (durationMs === undefined) {
      return "N/A";
    }
    const seconds = durationMs / 1000;
    const formattedSeconds =
      seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1);
    return `${formattedSeconds.replace(TRAILING_ZERO_REGEX, "")}s`;
  };

  const renderPills = (
    pills: Array<{ key: string; label: string; value: string }>,
    isUserMessage: boolean
  ) => (
    <div
      className={cn(
        "mt-3 flex flex-wrap gap-2 font-medium text-[11px]",
        isUserMessage ? "text-primary-foreground" : "text-foreground"
      )}
    >
      {pills.map((pill) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
            isUserMessage
              ? "border-primary/40 bg-primary/70 text-primary-foreground"
              : "border-border bg-muted/60 text-foreground"
          )}
          key={pill.key}
        >
          <span className="font-semibold text-[9px] uppercase tracking-[0.14em] opacity-80">
            {pill.label}
          </span>
          <span className="font-semibold text-[11px] normal-case tracking-normal opacity-95">
            {pill.value}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border bg-linear-to-br from-card to-card/50 shadow-xl">
      <header className="border-b bg-linear-to-r from-background/80 to-background/60 px-10 pt-8 pb-6 backdrop-blur-sm">
        <h1 className="font-semibold text-2xl text-foreground">
          Perplexity Research Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
          Get AI-powered answers with cited sources. Every response includes
          citations and links to explore deeper.
        </p>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden px-10 pb-6">
        <div className="mt-6 flex-1 space-y-6 overflow-y-auto rounded-2xl border bg-linear-to-br from-muted/20 to-muted/40 px-6 py-7">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  Start a conversation
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Ask anything to get started with cited sources
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                key={`${message.role}-${index}-${message.createdAt ?? index}`}
              >
                <div
                  className={cn(
                    "max-w-3xl rounded-2xl px-6 py-5 text-sm leading-relaxed shadow-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground shadow-primary/20"
                      : "border bg-card text-card-foreground shadow-lg"
                  )}
                >
                  {message.role === "assistant" ? (
                    <AssistantMessage
                      content={message.content}
                      isStreaming={isStreaming && index === messages.length - 1}
                      sources={message.sources}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap font-medium">
                      {message.content}
                    </div>
                  )}
                  {renderMessageMeta(message)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="mt-6 flex w-full items-end gap-4 rounded-2xl border bg-card/80 px-5 py-4 shadow-lg backdrop-blur-sm"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <Textarea
            className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            disabled={isSending}
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
            value={input}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="gap-2"
              disabled={!input.trim() || isSending}
              type="submit"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send"
              )}
            </Button>
            <Button
              disabled={!isStreaming}
              onClick={handleStop}
              type="button"
              variant="outline"
            >
              Stop
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
