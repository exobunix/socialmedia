import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface MediaFile {
  id: number;
  workspaceId: number;
  url: string;
  type: "image" | "video" | "document";
  filename: string;
  sizeBytes?: number | null;
  mimeType?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema = new Schema<MediaFile>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "document"], default: "image" },
  filename: { type: String, required: true },
  sizeBytes: { type: Number, default: null },
  mimeType: { type: String, default: null },
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

MediaFileSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("media_files");
  }
  next();
});

export const mediaFilesModel = mongoose.models.MediaFile || mongoose.model<MediaFile>("MediaFile", MediaFileSchema);
export const mediaFilesTable = mediaFilesModel;

export type InsertMediaFile = Omit<MediaFile, "id" | "createdAt" | "updatedAt">;
