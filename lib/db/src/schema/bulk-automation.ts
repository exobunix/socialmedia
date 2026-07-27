import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface BulkUploadBatch {
  id: number;
  workspaceId: number;
  selectedPlatforms: string[];
  strategy: "immediate" | "fixed" | "slots" | "interval" | "weekly" | "monthly" | "random";
  settings: Record<string, any>;
  status: "uploading" | "processing" | "scheduled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const BulkUploadBatchSchema = new Schema<BulkUploadBatch>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  selectedPlatforms: [{ type: String }],
  strategy: { 
    type: String, 
    enum: ["immediate", "fixed", "slots", "interval", "weekly", "monthly", "random"],
    required: true 
  },
  settings: { type: Schema.Types.Mixed, default: {} },
  status: { 
    type: String, 
    enum: ["uploading", "processing", "scheduled", "completed"],
    default: "uploading" 
  },
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

BulkUploadBatchSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("bulk_upload_batches");
  }
  next();
});

export const bulkUploadBatchesModel = mongoose.models.BulkUploadBatch || mongoose.model<BulkUploadBatch>("BulkUploadBatch", BulkUploadBatchSchema);
export const bulkUploadBatchesTable = bulkUploadBatchesModel;

export interface BulkMediaFile {
  id: number;
  workspaceId: number;
  batchId: number;
  url: string;
  fileId: string;
  type: "image" | "video";
  filename: string;
  sizeBytes: number;
  resolution?: string | null;
  aspectRatio?: string | null;
  duration?: number | null;
  orientation: "portrait" | "landscape";
  status: "pending" | "processing" | "completed" | "failed";
  aiData?: {
    caption?: string;
    platformCaptions?: Record<string, string>;
    hashtags?: string[];
    keywords?: string[];
    seoTags?: string[];
    cta?: string;
    emojis?: string[];
    category?: string;
    audience?: string;
  } | null;
  thumbnailUrl?: string | null;
  thumbnailFileId?: string | null;
  thumbnailStatus: "none" | "generating" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const BulkMediaFileSchema = new Schema<BulkMediaFile>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  batchId: { type: Number, required: true },
  url: { type: String, required: true },
  fileId: { type: String, required: true },
  type: { type: String, enum: ["image", "video"], required: true },
  filename: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  resolution: { type: String, default: null },
  aspectRatio: { type: String, default: null },
  duration: { type: Number, default: null },
  orientation: { type: String, enum: ["portrait", "landscape"], required: true },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  aiData: {
    type: {
      caption: { type: String },
      platformCaptions: { type: Schema.Types.Mixed, default: {} },
      hashtags: [{ type: String }],
      keywords: [{ type: String }],
      seoTags: [{ type: String }],
      cta: { type: String },
      emojis: [{ type: String }],
      category: { type: String },
      audience: { type: String },
    },
    default: null
  },
  thumbnailUrl: { type: String, default: null },
  thumbnailFileId: { type: String, default: null },
  thumbnailStatus: { type: String, enum: ["none", "generating", "completed", "failed"], default: "none" },
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

BulkMediaFileSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("bulk_media_files");
  }
  next();
});

export const bulkMediaFilesModel = mongoose.models.BulkMediaFile || mongoose.model<BulkMediaFile>("BulkMediaFile", BulkMediaFileSchema);
export const bulkMediaFilesTable = bulkMediaFilesModel;
