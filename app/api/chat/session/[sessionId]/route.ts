import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { getChatSessionModel } from "@/schemas/chatSession";

const MAX_TITLE_LENGTH = 120;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await auth().catch(() => null);
    const userId = authResult?.userId;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await context.params;
    if (!(sessionId && Types.ObjectId.isValid(sessionId))) {
      return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const ChatSession = await getChatSessionModel();

    const updatedSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: { title } },
      { new: true }
    ).lean();

    if (!updatedSession) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Rename chat error", error);
    return NextResponse.json(
      { error: "Failed to rename chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authResult = await auth().catch(() => null);
    const userId = authResult?.userId;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sessionId } = await context.params;
    if (!(sessionId && Types.ObjectId.isValid(sessionId))) {
      return NextResponse.json({ error: "Invalid chat id" }, { status: 400 });
    }

    const ChatSession = await getChatSessionModel();

    const deletedSession = await ChatSession.findOneAndDelete({
      _id: sessionId,
      userId,
    }).lean();

    if (!deletedSession) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete chat error", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
