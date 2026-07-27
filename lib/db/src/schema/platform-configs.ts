import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface PlatformConfig {
  id: number;
  platform: string;
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
  scopes?: string | null;
  webhookSecret?: string | null;
  environment: "production" | "sandbox";
  isEnabled: boolean;
  aiConfig?: {
    apiKey?: string | null;
    model?: string | null;
    promptTemplate?: string | null;
    resolution?: string | null;
    aspectRatio?: string | null;
    quality?: string | null;
    fallbackProvider?: string | null;
    maxImages?: number | null;
    testConnectionStatus?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformConfigSchema = new Schema<PlatformConfig>({
  id: { type: Number, unique: true },
  platform: { type: String, required: true, unique: true },
  clientId: { type: String, default: null },
  clientSecret: { type: String, default: null },
  redirectUri: { type: String, default: null },
  scopes: { type: String, default: null },
  webhookSecret: { type: String, default: null },
  environment: { type: String, enum: ["production", "sandbox"], default: "sandbox" },
  isEnabled: { type: Boolean, default: false },
  aiConfig: {
    type: {
      apiKey: { type: String, default: null },
      model: { type: String, default: null },
      promptTemplate: { type: String, default: null },
      resolution: { type: String, default: null },
      aspectRatio: { type: String, default: null },
      quality: { type: String, default: null },
      fallbackProvider: { type: String, default: null },
      maxImages: { type: Number, default: null },
      testConnectionStatus: { type: String, default: null },
    },
    default: null
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

PlatformConfigSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("platform_configs");
  }
  next();
});

export const platformConfigsModel = mongoose.models.PlatformConfig || mongoose.model<PlatformConfig>("PlatformConfig", PlatformConfigSchema);
export const platformConfigsTable = platformConfigsModel;

export type InsertPlatformConfig = Omit<PlatformConfig, "id" | "createdAt" | "updatedAt">;
