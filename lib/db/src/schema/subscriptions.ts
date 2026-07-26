import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: "active" | "cancelled" | "expired" | "trialing";
  startedAt: Date;
  expiresAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<Subscription>({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  planId: { type: Number, required: true },
  status: { type: String, enum: ["active", "cancelled", "expired", "trialing"], default: "active" },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
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

SubscriptionSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("subscriptions");
  }
  next();
});

export const subscriptionsModel = mongoose.models.Subscription || mongoose.model<Subscription>("Subscription", SubscriptionSchema);
export const subscriptionsTable = subscriptionsModel;

export type InsertSubscription = Omit<Subscription, "id" | "createdAt" | "updatedAt">;
