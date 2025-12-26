import mongoose, { type Model, Schema } from "mongoose";
import { MongoDBClientConnection } from "@/schemas/mongoDbClientConnection";

export interface TokenUsage {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
}

export interface Source {
  url: string;
  title?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  usage?: TokenUsage;
  durationMs?: number;
  sourceCount?: number;
  sources?: Source[];
  apiKeyType?: "default" | "custom";
}

export interface ChatSessionDocument extends mongoose.Document {
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    usage: {
      inputTokens: { type: Number, default: null },
      outputTokens: { type: Number, default: null },
      totalTokens: { type: Number, default: null },
    },
    durationMs: {
      type: Number,
      default: null,
    },
    sourceCount: {
      type: Number,
      default: null,
    },
    sources: {
      type: [
        {
          url: { type: String, required: true },
          title: { type: String, default: null },
        },
      ],
      default: [],
    },
    apiKeyType: {
      type: String,
      enum: ["default", "custom"],
      default: "default",
    },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<ChatSessionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "New Conversation",
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export async function getChatSessionModel(): Promise<
  Model<ChatSessionDocument>
> {
  await MongoDBClientConnection();
  return (
    mongoose.models.ChatSession ||
    mongoose.model<ChatSessionDocument>("ChatSession", ChatSessionSchema)
  );
}
