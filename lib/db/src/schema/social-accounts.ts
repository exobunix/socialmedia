import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface SocialAccount {
  id: number;
  workspaceId: number;
  platform: "facebook" | "instagram" | "linkedin" | "pinterest" | "x" | "youtube" | "threads" | "tiktok" | "google_business" | "wordpress" | "medium";
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  platformUserId?: string | null;
  tokenExpiresAt?: Date | null;
  followersCount?: number | null;
  status: "active" | "expired" | "disconnected";
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<SocialAccount>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  platform: {
    type: String,
    enum: [
      "facebook", "instagram", "linkedin", "pinterest", "x",
      "youtube", "threads", "tiktok", "google_business", "wordpress", "medium"
    ],
    required: true
  },
  username: { type: String, required: true },
  displayName: { type: String, default: null },
  profileImageUrl: { type: String, default: null },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, default: null },
  platformUserId: { type: String, default: null },
  tokenExpiresAt: { type: Date, default: null },
  followersCount: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "expired", "disconnected"], default: "active" },
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

SocialAccountSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("social_accounts");
  }
  next();
});

export const socialAccountsModel = mongoose.models.SocialAccount || mongoose.model<SocialAccount>("SocialAccount", SocialAccountSchema);
export const socialAccountsTable = socialAccountsModel;

export type InsertSocialAccount = Omit<SocialAccount, "id" | "createdAt" | "updatedAt">;
