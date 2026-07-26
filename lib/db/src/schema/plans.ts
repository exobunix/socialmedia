import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  currency: string;
  maxSocialAccounts?: number | null;
  maxScheduledPosts?: number | null;
  maxAiImages?: number | null;
  maxTeamMembers?: number | null;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<Plan>({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  priceMonthly: { type: Number, required: true },
  priceYearly: { type: Number, default: null },
  currency: { type: String, default: "INR" },
  maxSocialAccounts: { type: Number, default: null },
  maxScheduledPosts: { type: Number, default: null },
  maxAiImages: { type: Number, default: null },
  maxTeamMembers: { type: Number, default: null },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
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

PlanSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("plans");
  }
  next();
});

export const plansModel = mongoose.models.Plan || mongoose.model<Plan>("Plan", PlanSchema);
export const plansTable = plansModel;

export type InsertPlan = Omit<Plan, "id" | "createdAt" | "updatedAt">;
