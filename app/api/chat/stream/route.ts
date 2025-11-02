import { NextResponse } from "next/server";
import { createPerplexity, perplexity } from "@ai-sdk/perplexity";
import { streamText, type LanguageModelUsage } from "ai";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import {
  ChatSessionDocument,
  getChatSessionModel,
} from "@/schemas/ChatSession";

interface ChatStreamRequestBody {
  prompt?: string;
  conversationId?: string;
  apiKey?: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

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
      model: perplexityProvider("sonar-reasoning"),
      messages: [...history, { role: "user", content: prompt }],
      system:
        "You are a source-restricted research assistant: only read the exact URLs the user provides, never search the internet, never hallucinate beyond those pages, any answer must be strictly derived from those sources and cite which URL/section it came from; if user asks anything outside those sources say “I cannot answer that — not in the provided sources.”; always keep output structured, high signal, concise, no fluff.",
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
        controller.enqueue(
          encoder.encode(`event: conversation\ndata: ${sessionId}\n\n`)
        );

        let finalText = "";

        try {
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

          const durationMs = Date.now() - startedAt;

          const resolveUsage = async () => {
            const maybeTotal = result.totalUsage as Promise<LanguageModelUsage | undefined> | null;
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

            const maybeUsage = result.usage as Promise<LanguageModelUsage | undefined> | null;
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
          };

          const resolveSourceCount = async () => {
            const maybeSources = result.sources as Promise<unknown> | null | undefined;
            if (maybeSources && typeof maybeSources.then === "function") {
              try {
                const resolvedSources = await maybeSources;
                if (Array.isArray(resolvedSources)) {
                  return resolvedSources.length;
                }
              } catch {
                return 0;
              }
            }
            return 0;
          };

          const [usageData, sourceCount] = await Promise.all([
            resolveUsage(),
            resolveSourceCount(),
          ]);

          const usagePayload = usageData
            ? {
                inputTokens: usageData.inputTokens ?? null,
                outputTokens: usageData.outputTokens ?? null,
                totalTokens: usageData.totalTokens ?? null,
              }
            : undefined;

          session.messages.push(
            { role: "user", content: prompt, createdAt: new Date() },
            {
              role: "assistant",
              content: finalText,
              createdAt: new Date(),
              usage: usagePayload,
              durationMs,
              sourceCount,
              apiKeyType,
            }
          );

          if (!session.title || session.title === "Conversation") {
            session.title = prompt.slice(0, 80) || "Conversation";
          }

          controller.enqueue(
            encoder.encode(
              `event: metadata\ndata: ${JSON.stringify({
                usage: usagePayload ?? null,
                durationMs,
                sourceCount,
                apiKeyType,
              })}\n\n`
            )
          );

          await session.save();

          controller.enqueue(encoder.encode(`event: done\ndata: ok\n\n`));
        } catch (streamError) {
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

          throw streamError;
        } finally {
          controller.close();
        }
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
