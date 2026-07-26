import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface TeamMember {
  id: number;
  workspaceId: number;
  userId?: number | null;
  inviteEmail: string;
  role: "admin" | "editor" | "viewer" | "client";
  status: "active" | "pending" | "removed";
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<TeamMember>({
  id: { type: Number, unique: true },
  workspaceId: { type: Number, required: true },
  userId: { type: Number, default: null },
  inviteEmail: { type: String, required: true },
  role: { type: String, enum: ["admin", "editor", "viewer", "client"], default: "editor" },
  status: { type: String, enum: ["active", "pending", "removed"], default: "pending" },
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

TeamMemberSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("team_members");
  }
  next();
});

export const teamMembersModel = mongoose.models.TeamMember || mongoose.model<TeamMember>("TeamMember", TeamMemberSchema);
export const teamMembersTable = teamMembersModel;

export type InsertTeamMember = Omit<TeamMember, "id" | "createdAt" | "updatedAt">;
