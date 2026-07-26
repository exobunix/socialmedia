import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "post_published" | "post_failed" | "invite" | "system" | "analytics";
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<Notification>({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["post_published", "post_failed", "invite", "system", "analytics"], default: "system" },
  isRead: { type: Boolean, default: false },
  linkUrl: { type: String, default: null },
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

NotificationSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("notifications");
  }
  next();
});

export const notificationsModel = mongoose.models.Notification || mongoose.model<Notification>("Notification", NotificationSchema);
export const notificationsTable = notificationsModel;

export type InsertNotification = Omit<Notification, "id" | "createdAt" | "updatedAt">;
