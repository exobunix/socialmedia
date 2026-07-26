import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";

export interface Workspace {
  id: number;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<Workspace>({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  logoUrl: { type: String, default: null },
  ownerId: { type: Number, required: true },
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

WorkspaceSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("workspaces");
  }
  next();
});

export const workspacesModel = mongoose.models.Workspace || mongoose.model<Workspace>("Workspace", WorkspaceSchema);
export const workspacesTable = workspacesModel;

export type InsertWorkspace = Omit<Workspace, "id" | "createdAt" | "updatedAt">;
