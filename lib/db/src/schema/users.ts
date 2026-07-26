import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  isVerified: boolean;
  resetToken?: string | null;
  resetTokenExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<User>({
  id: { type: Number, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  isVerified: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
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

UserSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("users");
  }
  next();
});

export const usersModel = mongoose.models.User || mongoose.model<User>("User", UserSchema);
export const usersTable = usersModel;

export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt">;
