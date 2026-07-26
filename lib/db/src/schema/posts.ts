import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface Post {
  id: number;
  workspaceId: number;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  platforms: string[];
  mediaUrls: string[];
  hashtags: string[];
  tone?: "professional" | "funny" | "marketing" | "corporate" | "friendly" | null;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  likesCount?: number | null;
  sharesCount?: number | null;
  commentsCount?: number | null;
  impressionsCount?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<Post>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ["draft", "scheduled", "published", "failed", "cancelled"], default: "draft" },
  platforms: { type: [String], default: [] },
  mediaUrls: { type: [String], default: [] },
  hashtags: { type: [String], default: [] },
  tone: { type: String, enum: ["professional", "funny", "marketing", "corporate", "friendly"], default: null },
  scheduledAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  likesCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  impressionsCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      const r = ret as any;
      delete r._id;
      delete r.__v;
      return r;
    }
  }
});

PostSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("posts");
  }
  next();
});

export const postsModel = mongoose.models.Post || mongoose.model<Post>("Post", PostSchema);
export const postsTable = postsModel;

export type InsertPost = Omit<Post, "id" | "createdAt" | "updatedAt">;
