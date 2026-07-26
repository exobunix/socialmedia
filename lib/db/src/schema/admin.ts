import mongoose, { Schema } from "mongoose";
import { getNextSequenceValue } from "./counter";
import crypto from "crypto";

// AES-256 encryption helper
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "d3f4b5a6c7e8f9a0b1c2d3e4f5a6b7c8"; // 32 bytes default
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error:", err);
    return text;
  }
}

// 1. Integrations Config Schema
export interface IntegrationConfig {
  id: number;
  category: "social" | "ai_text" | "ai_image" | "ai_video" | "email" | "whatsapp" | "sms" | "storage" | "payments";
  provider: string;
  isEnabled: boolean;
  config: string; // Encrypted JSON string
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationConfigSchema = new Schema<IntegrationConfig>({
  id: { type: Number, unique: true },
  category: { type: String, required: true },
  provider: { type: String, required: true, unique: true },
  isEnabled: { type: Boolean, default: false },
  config: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
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

IntegrationConfigSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("integrations_config");
  }
  next();
});

export const integrationsConfigTable = mongoose.models.IntegrationConfig || mongoose.model<IntegrationConfig>("IntegrationConfig", IntegrationConfigSchema);

// 2. Audit Logs Schema
export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLog>({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, default: null },
  oldValue: { type: Schema.Types.Mixed, default: null },
  newValue: { type: Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (doc, ret) => {
      const r = ret as any;
      delete r._id;
      delete r.__v;
      return r;
    }
  }
});

AuditLogSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("audit_logs");
  }
  next();
});

export const auditLogsTable = mongoose.models.AuditLog || mongoose.model<AuditLog>("AuditLog", AuditLogSchema);

// 3. Support Tickets Schema
export interface SupportTicket {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: number | null;
  messages: Array<{ senderId: number; text: string; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<SupportTicket>({
  id: { type: Number, unique: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  assignedTo: { type: Number, default: null },
  messages: [{
    senderId: { type: Number, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
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

SupportTicketSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("support_tickets");
  }
  next();
});

export const supportTicketsTable = mongoose.models.SupportTicket || mongoose.model<SupportTicket>("SupportTicket", SupportTicketSchema);

// 4. Feature Flags Schema
export interface FeatureFlag {
  id: number;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  environment: "production" | "sandbox" | "all";
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<FeatureFlag>({
  id: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  isEnabled: { type: Boolean, default: false },
  environment: { type: String, enum: ["production", "sandbox", "all"], default: "all" },
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

FeatureFlagSchema.pre("save", async function(next) {
  if (this.isNew && typeof this.id !== "number") {
    this.id = await getNextSequenceValue("feature_flags");
  }
  next();
});

export const featureFlagsTable = mongoose.models.FeatureFlag || mongoose.model<FeatureFlag>("FeatureFlag", FeatureFlagSchema);
