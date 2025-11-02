"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import axios, { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ChatRole = "user" | "assistant";

export interface TokenUsage {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt?: string | Date;
  usage?: TokenUsage;
  durationMs?: number | null;
  sourceCount?: number | null;
  apiKeyType?: "default" | "custom";
}

export interface ChatSession {
  _id: string;
  title?: string;
  messages: ChatMessage[];
  updatedAt?: string;
  createdAt?: string;
}

const CHAT_SESSIONS_KEY = ["chat-sessions"] as const;
const API_KEY_STORAGE_KEY = "perplexity:api-key";

export const formatTimestamp = (value?: string | Date) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const safeJSONParse = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

interface SendPromptVariables {
  prompt: string;
  conversationId?: string | null;
  apiKey?: string | null;
}

interface ChatDashboardContextValue {
  sessions: ChatSession[];
  isSidebarLoading: boolean;
  activeSessionId: string | null;
  selectSession: (sessionId: string) => void;
  startNewChat: () => void;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  apiKey: string | null;
  saveApiKey: (value: string | null) => void;
  hasCustomApiKey: boolean;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleStop: () => void;
  isStreaming: boolean;
  isSending: boolean;
  isManagingSession: boolean;
}

const ChatDashboardContext = createContext<ChatDashboardContextValue | null>(null);

export function useChatDashboard() {
  const context = useContext(ChatDashboardContext);
  if (!context) {
    throw new Error("useChatDashboard must be used inside ChatDashboardProvider");
  }
  return context;
}

export function ChatDashboardProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(API_KEY_STORAGE_KEY);
  });
  const apiKeyRef = useRef<string | null>(apiKey);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      // Defer state update so we do not trigger the React lint warning about synchronous effects.
      queueMicrotask(() => {
        setApiKeyState(storedKey);
        apiKeyRef.current = storedKey;
      });
    }
  }, []);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  const assistantMessageIndexRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wasStreamingRef = useRef(false);

  const { data: sessionsData, isLoading: isHistoryLoading, isFetching: isHistoryFetching } = useQuery({
    queryKey: CHAT_SESSIONS_KEY,
    queryFn: async () => {
      const response = await axios.get<{ sessions: ChatSession[] }>("/api/chat/history");
      return response.data.sessions;
    },
    staleTime: 1000 * 30,
  });

  const sessions = useMemo(() => sessionsData ?? [], [sessionsData]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isStreaming;

    if (!wasStreaming || isStreaming) {
      return;
    }

    if (!activeSessionId) {
      return;
    }

    const session = sessions.find((item) => item._id === activeSessionId);
    if (!session || session.messages.length === 0) {
      return;
    }

    queueMicrotask(() => {
      setMessages(session.messages.map((message) => ({ ...message })));
    });
  }, [isStreaming, activeSessionId, sessions]);

  const sendPromptMutation = useMutation({
    mutationFn: async ({ prompt, conversationId, apiKey: providedKey }: SendPromptVariables) => {
      await new Promise<void>((resolve, reject) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        let processedLength = 0;
        let buffer = "";
        let done = false;
        let settled = false;

        const parseEvent = (rawEvent: string) => {
          if (!rawEvent.trim()) return;

          const lines = rawEvent.split("\n");
          let eventName = "message";
          let dataPayload = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.replace("event:", "").trim();
            }
            if (line.startsWith("data:")) {
              const value = line.replace("data:", "").trim();
              dataPayload = dataPayload ? `${dataPayload}\n${value}` : value;
            }
          }

          if (!dataPayload) return;

          if (eventName === "conversation") {
            conversationIdRef.current = dataPayload;
            setActiveSessionId(dataPayload);
          }

          if (eventName === "delta") {
            const parsed = safeJSONParse<{ text?: string }>(dataPayload);
            if (parsed?.text) {
              setMessages((prev) => {
                const index = assistantMessageIndexRef.current;
                if (index === null || index >= prev.length) {
                  return prev;
                }

                const updated = [...prev];
                const existing = updated[index];
                updated[index] = {
                  ...existing,
                  content: `${existing.content ?? ""}${parsed.text}`,
                };

                return updated;
              });
            }
          }

          if (eventName === "metadata") {
            const parsed = safeJSONParse<{
              usage?: TokenUsage | null;
              durationMs?: number | null;
              sourceCount?: number | null;
              apiKeyType?: "default" | "custom";
            }>(dataPayload);

            if (parsed) {
              setMessages((prev) => {
                const index = assistantMessageIndexRef.current;
                if (index === null || index >= prev.length) {
                  return prev;
                }

                const updated = [...prev];
                const existing = updated[index];
                const nextUsage = parsed.usage === null ? undefined : parsed.usage;
                const hasDuration = typeof parsed.durationMs === "number";
                const hasSourceCount = typeof parsed.sourceCount === "number";
                updated[index] = {
                  ...existing,
                  usage: nextUsage ?? existing.usage,
                  durationMs:
                    hasDuration || parsed.durationMs === null
                      ? parsed.durationMs ?? undefined
                      : existing.durationMs,
                  sourceCount:
                    hasSourceCount || parsed.sourceCount === null
                      ? parsed.sourceCount ?? undefined
                      : existing.sourceCount,
                  apiKeyType: parsed.apiKeyType ?? existing.apiKeyType,
                };

                return updated;
              });
            }
          }

          if (eventName === "error") {
            const parsed = safeJSONParse<{ message?: string }>(dataPayload);
            if (!settled) {
              settled = true;
              controller.abort();
              reject(new Error(parsed?.message ?? "Stream failed"));
            }
          }

          if (eventName === "done") {
            done = true;
          }
        };

        axios
          .post(
            "/api/chat/stream",
            {
              prompt,
              conversationId: conversationId ?? undefined,
              apiKey: providedKey ?? undefined,
            },
            {
              responseType: "text",
              signal: controller.signal,
              onDownloadProgress: (progressEvent) => {
                const nativeEvent = progressEvent.event;
                const target = nativeEvent?.target as XMLHttpRequest | null;
                if (!target) return;

                const responseText = target.responseText ?? "";
                if (!responseText) return;

                const chunk = responseText.slice(processedLength);
                processedLength = responseText.length;

                if (!chunk) return;

                buffer += chunk;

                while (true) {
                  const separatorIndex = buffer.indexOf("\n\n");
                  if (separatorIndex === -1) {
                    break;
                  }

                  const rawEvent = buffer.slice(0, separatorIndex);
                  buffer = buffer.slice(separatorIndex + 2);
                  parseEvent(rawEvent);
                }
              },
            }
          )
          .then(() => {
            if (!settled) {
              settled = true;
              if (buffer.trim().length > 0) {
                parseEvent(buffer);
                buffer = "";
              }
              if (!done) {
                parseEvent(`event: done\ndata: ok`);
              }
              resolve();
            }
          })
          .catch((error) => {
            if (settled) {
              return;
            }
            settled = true;
            if (axios.isCancel(error)) {
              reject(new Error("Request cancelled"));
            } else if (error instanceof AxiosError && error.response?.data?.error) {
              reject(new Error(error.response.data.error));
            } else {
              reject(error);
            }
          })
          .finally(() => {
            abortControllerRef.current = null;
          });
      });
    },
    onMutate: () => {
      setIsStreaming(true);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to send message";
      if (message === "Request cancelled") {
        toast.info("Response cancelled");
      } else {
        setMessages((prev) => {
          const index = assistantMessageIndexRef.current;
          if (index === null || index >= prev.length) return prev;
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            content: message,
          };
          return updated;
        });
        toast.error(message);
      }
    },
    onSettled: async () => {
      setIsStreaming(false);
      assistantMessageIndexRef.current = null;
      await queryClient.invalidateQueries({ queryKey: CHAT_SESSIONS_KEY });
    },
  });

  const renameSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const response = await axios.patch<{ session: ChatSession }>(
        `/api/chat/session/${sessionId}`,
        { title }
      );
      return response.data.session;
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData<ChatSession[] | undefined>(CHAT_SESSIONS_KEY, (prev) => {
        if (!prev) return prev;
        return prev.map((session) =>
          session._id === updatedSession._id
            ? { ...session, title: updatedSession.title }
            : session
        );
      });
      toast.success("Chat renamed");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to rename chat";
      toast.error(message);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await axios.delete(`/api/chat/session/${sessionId}`);
      return sessionId;
    },
    onSuccess: (removedSessionId) => {
      queryClient.setQueryData<ChatSession[] | undefined>(CHAT_SESSIONS_KEY, (prev) => {
        if (!prev) return prev;
        return prev.filter((session) => session._id !== removedSessionId);
      });

      if (activeSessionId === removedSessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setInput("");
        conversationIdRef.current = null;
        assistantMessageIndexRef.current = null;
      }

      toast.success("Chat deleted");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to delete chat";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const prompt = input.trim();
      if (!prompt || sendPromptMutation.isPending) {
        return;
      }

      const targetConversationId = conversationIdRef.current ?? activeSessionId;
      if (targetConversationId) {
        conversationIdRef.current = targetConversationId;
      }

      const activeApiKey = apiKeyRef.current;

      const userMessage: ChatMessage = {
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      };

      const assistantPlaceholder: ChatMessage = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        apiKeyType: activeApiKey ? "custom" : "default",
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage, assistantPlaceholder];
        assistantMessageIndexRef.current = updated.length - 1;
        return updated;
      });

      sendPromptMutation.mutate({ prompt, conversationId: targetConversationId, apiKey: activeApiKey });
      setInput("");
    },
    [input, sendPromptMutation, activeSessionId]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (isStreaming) {
      toast.info("Please wait for the current response to finish.");
      return;
    }
    setActiveSessionId(null);
    setMessages([]);
    conversationIdRef.current = null;
    assistantMessageIndexRef.current = null;
  }, [isStreaming]);

  const selectSession = useCallback(
    (sessionId: string) => {
      if (isStreaming) {
        toast.info("Wait for the response to finish before switching chats.");
        return;
      }
      const session = sessions.find((item) => item._id === sessionId);
      setMessages(session ? session.messages.map((message) => ({ ...message })) : []);
      setActiveSessionId(sessionId);
      conversationIdRef.current = sessionId;
      assistantMessageIndexRef.current = null;
    },
    [isStreaming, sessions]
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      await renameSessionMutation.mutateAsync({ sessionId, title });
    },
    [renameSessionMutation]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSessionMutation.mutateAsync(sessionId);
    },
    [deleteSessionMutation]
  );

  const saveApiKey = useCallback((value: string | null) => {
    apiKeyRef.current = value;
    setApiKeyState(value);
    if (typeof window !== "undefined") {
      if (value) {
        window.localStorage.setItem(API_KEY_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    }
    toast.success(value ? "Custom API key saved" : "Custom API key cleared");
  }, []);

  const contextValue = useMemo<ChatDashboardContextValue>(
    () => ({
      sessions,
      isSidebarLoading: isHistoryLoading || isHistoryFetching,
      activeSessionId,
      selectSession,
      startNewChat,
      renameSession,
      deleteSession,
      apiKey,
      saveApiKey,
      hasCustomApiKey: Boolean(apiKey),
      messages,
      messagesEndRef,
      input,
      setInput,
      handleSubmit,
      handleStop,
      isStreaming,
      isSending: sendPromptMutation.isPending,
      isManagingSession: renameSessionMutation.isPending || deleteSessionMutation.isPending,
    }),
    [
      sessions,
      isHistoryLoading,
      isHistoryFetching,
      activeSessionId,
      selectSession,
      startNewChat,
      renameSession,
      deleteSession,
      apiKey,
      saveApiKey,
      messages,
      input,
      handleSubmit,
      handleStop,
      isStreaming,
      sendPromptMutation.isPending,
      renameSessionMutation.isPending,
      deleteSessionMutation.isPending,
    ]
  );

  return <ChatDashboardContext.Provider value={contextValue}>{children}</ChatDashboardContext.Provider>;
}
