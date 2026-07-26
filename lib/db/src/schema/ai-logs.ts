import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface AiLog {
  id: number;
  userId: number;
  type: "caption" | "hashtags" | "rewrite" | "image";
  prompt?: string | null;
  result?: string | null;
  createdAt: Date;
}

const AiLogSchema = new Schema<AiLog>({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  type: { type: String, enum: ["caption", "hashtags", "rewrite", "image"], required: true },
  prompt: { type: String, default: null },
  result: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (doc, ret) => {
      const r = ret as any;
      delete r._id;
      delete r.__v;
      return r;
    }
  }
});

AiLogSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("ai_logs");
  }
  next();
});

export const aiLogsModel = mongoose.models.AiLog || mongoose.model<AiLog>("AiLog", AiLogSchema);
export const aiLogsTable = aiLogsModel;

export type InsertAiLog = Omit<AiLog, "id" | "createdAt">;
