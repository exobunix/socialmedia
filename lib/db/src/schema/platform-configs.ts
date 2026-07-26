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
