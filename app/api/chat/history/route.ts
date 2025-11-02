import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChatSessionModel } from "@/schemas/ChatSession";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ChatSession = await getChatSessionModel();

    const sessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Chat history error", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
