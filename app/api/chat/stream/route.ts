import { createPerplexity, perplexity } from "@ai-sdk/perplexity";
import { auth } from "@clerk/nextjs/server";
import { type LanguageModelUsage, streamText } from "ai";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import {
  type ChatSessionDocument,
  getChatSessionModel,
  type TokenUsage,
} from "@/schemas/chatSession";

interface ChatStreamRequestBody {
  prompt?: string;
  conversationId?: string;
  apiKey?: string;
}

const normalizeUsage = (
  usage?: LanguageModelUsage | null
): TokenUsage | undefined => {
  if (!usage) {
    return undefined;
  }

  const asAny = usage as Record<string, unknown>;
  const getNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  const inputTokens = getNumber(
    asAny.inputTokens ?? asAny.promptTokens ?? null
  );
  const outputTokens = getNumber(
    asAny.outputTokens ?? asAny.completionTokens ?? null
  );
  const directTotal = getNumber(asAny.totalTokens ?? null);

  const derivedTotal =
    directTotal ??
    (inputTokens !== null || outputTokens !== null
      ? (inputTokens ?? 0) + (outputTokens ?? 0)
      : null);

  if (inputTokens === null && outputTokens === null && derivedTotal === null) {
    return undefined;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: derivedTotal,
  };
};

async function resolveUsage(result: {
  totalUsage?: PromiseLike<LanguageModelUsage | undefined> | null;
  usage?: PromiseLike<LanguageModelUsage | undefined> | null;
}): Promise<LanguageModelUsage | null> {
  const maybeTotal = result.totalUsage as PromiseLike<
    LanguageModelUsage | undefined
  > | null;

  if (maybeTotal && typeof maybeTotal.then === "function") {
    try {
      const usageData = await maybeTotal;
      if (usageData) {
        return usageData;
      }
    } catch {
      /* noop */
    }
  }

  const maybeUsage = result.usage as PromiseLike<
    LanguageModelUsage | undefined
  > | null;

  if (maybeUsage && typeof maybeUsage.then === "function") {
    try {
      const usageData = await maybeUsage;
      if (usageData) {
        return usageData;
      }
    } catch {
      /* noop */
    }
  }

  return null;
}

function extractSourceFromObject(
  source: unknown
): { url: string; title?: string } | null {
  if (typeof source !== "object" || source === null) {
    return null;
  }

  const sourceObj = source as Record<string, unknown>;
  const url = typeof sourceObj.url === "string" ? sourceObj.url : "";

  if (!url) {
    return null;
  }

  const title =
    typeof sourceObj.title === "string" ? sourceObj.title : undefined;
  return { url, title };
}

async function resolveSources(result: {
  sources?: PromiseLike<unknown> | null;
}): Promise<Array<{ url: string; title?: string }>> {
  const maybeSources = result.sources as
    | PromiseLike<unknown>
    | null
    | undefined;

  if (!maybeSources || typeof maybeSources.then !== "function") {
    return [];
  }

  try {
    const resolvedSources = await maybeSources;
    if (!Array.isArray(resolvedSources)) {
      return [];
    }

    const sources: Array<{ url: string; title?: string }> = [];
    for (const source of resolvedSources) {
      const extracted = extractSourceFromObject(source);
      if (extracted) {
        sources.push(extracted);
      }
    }
    return sources;
  } catch {
    return [];
  }
}

async function readStreamChunks(
  reader: ReadableStreamDefaultReader<string>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): Promise<string> {
  let finalText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      finalText += value;
      controller.enqueue(
        encoder.encode(
          `event: delta\ndata: ${JSON.stringify({ text: value })}\n\n`
        )
      );
    }
  }

  return finalText;
}

async function saveSessionMessages(
  session: ChatSessionDocument,
  prompt: string,
  finalText: string,
  usagePayload: TokenUsage | undefined,
  durationMs: number,
  sourceCount: number,
  sources: Array<{ url: string; title?: string }>,
  apiKeyType: "default" | "custom"
): Promise<void> {
  session.messages.push(
    { role: "user", content: prompt, createdAt: new Date() },
    {
      role: "assistant",
      content: finalText,
      createdAt: new Date(),
      usage: usagePayload,
      durationMs,
      sourceCount,
      sources,
      apiKeyType,
    }
  );

  if (!session.title || session.title === "Conversation") {
    session.title = prompt.slice(0, 80) || "Conversation";
  }

  await session.save();
}

async function handleStreamError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  session: ChatSessionDocument,
  initialMessageCount: number,
  createdSession: boolean,
  ChatSession: Awaited<ReturnType<typeof getChatSessionModel>>,
  sessionId: string,
  error: unknown
): Promise<void> {
  controller.enqueue(
    encoder.encode(
      `event: error\ndata: ${JSON.stringify({
        message: "Stream interrupted",
      })}\n\n`
    )
  );

  session.messages.splice(initialMessageCount);

  if (createdSession) {
    await ChatSession.deleteOne({ _id: sessionId });
  }

  throw error;
}

async function handleStreamStart(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  sessionId: string,
  reader: ReadableStreamDefaultReader<string>,
  result: ReturnType<typeof streamText>,
  session: ChatSessionDocument,
  prompt: string,
  startedAt: number,
  apiKeyType: "default" | "custom",
  normalizeUsageFn: typeof normalizeUsage,
  initialMessageCount: number,
  createdSession: boolean,
  ChatSession: Awaited<ReturnType<typeof getChatSessionModel>>
): Promise<void> {
  controller.enqueue(
    encoder.encode(`event: conversation\ndata: ${sessionId}\n\n`)
  );

  try {
    const finalText = await readStreamChunks(reader, controller, encoder);
    const durationMs = Date.now() - startedAt;

    const [usageData, sources] = await Promise.all([
      resolveUsage(result),
      resolveSources(result),
    ]);

    const sourceCount = sources.length;
    const usagePayload = normalizeUsageFn(usageData);

    await saveSessionMessages(
      session,
      prompt,
      finalText,
      usagePayload,
      durationMs,
      sourceCount,
      sources,
      apiKeyType
    );

    controller.enqueue(
      encoder.encode(
        `event: metadata\ndata: ${JSON.stringify({
          usage: usagePayload ?? null,
          durationMs,
          sourceCount,
          sources,
          apiKeyType,
        })}\n\n`
      )
    );

    controller.enqueue(encoder.encode("event: done\ndata: ok\n\n"));
  } catch (streamError) {
    await handleStreamError(
      controller,
      encoder,
      session,
      initialMessageCount,
      createdSession,
      ChatSession,
      sessionId,
      streamError
    );
  } finally {
    controller.close();
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await auth().catch(() => null);
    const userId = authResult?.userId;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: ChatStreamRequestBody = await request.json();
    const prompt = body.prompt?.trim();
    const apiKey = body.apiKey?.trim();

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const ChatSession = await getChatSessionModel();

    let session: ChatSessionDocument | null = null;
    let createdSession = false;

    if (body.conversationId && Types.ObjectId.isValid(body.conversationId)) {
      session = await ChatSession.findOne({
        _id: body.conversationId,
        userId,
      });
    }

    if (!session) {
      session = await ChatSession.create({
        userId,
        title: prompt.slice(0, 60) || "Conversation",
        messages: [],
      });
      createdSession = true;
    }

    const sessionId = String(session._id);

    const history = session.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const perplexityProvider = apiKey
      ? createPerplexity({ apiKey })
      : perplexity;

    const result = streamText({
      model: perplexityProvider("sonar-deep-research"),
      messages: [...history, { role: "user", content: prompt }],
      system: `You are an advanced research assistant with internet search capabilities. Follow these rules:

1. Search the internet for the most current and accurate information
2. Prioritize recent sources and up-to-date knowledge
3. Always cite your sources with URLs when providing information
4. If information is outdated or uncertain, explicitly state this
5. Keep responses structured, high signal, and concise with no fluff
6. Use markdown formatting for readability
7. When citing, use format: [Source: URL]
8. Cross-reference multiple sources when possible for accuracy`,
      headers: {
        "x-llm-conversation-id": sessionId,
      },
    });

    const encoder = new TextEncoder();
    const reader = result.textStream.getReader();
    const startedAt = Date.now();
    const apiKeyType = apiKey ? "custom" : "default";

    const initialMessageCount = session.messages.length;

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        await handleStreamStart(
          controller,
          encoder,
          sessionId,
          reader,
          result,
          session,
          prompt,
          startedAt,
          apiKeyType,
          normalizeUsage,
          initialMessageCount,
          createdSession,
          ChatSession
        );
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream error", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
