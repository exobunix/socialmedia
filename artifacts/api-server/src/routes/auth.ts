import { Router, type IRouter } from "express";
import { usersTable, workspacesTable } from "@workspace/db";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import {
  RegisterUserBody,
  LoginUserBody,
  UpdateMeBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password } = parsed.data;
  const existing = await usersTable.findOne({ email });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await usersTable.create({ name, email, passwordHash, isVerified: true });
  
  // Automatically create a default workspace for the new user
  await workspacesTable.create({ name: "Personal Workspace", ownerId: user.id });
  
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await usersTable.findOne({ email });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.status === "suspended") {
    res.status(403).json({ error: "Account suspended" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  await usersTable.updateOne({ id: user.id }, { $set: { lastLoginAt: new Date() } });
  
  // Ensure the user has at least one workspace
  const existingWorkspace = await workspacesTable.findOne({ ownerId: user.id });
  if (!existingWorkspace) {
    await workspacesTable.create({ name: "Personal Workspace", ownerId: user.id });
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const user = await usersTable.findOne({ id: req.userId! });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt });
});

router.patch("/auth/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await usersTable.findOneAndUpdate({ id: req.userId! }, { $set: parsed.data }, { new: true });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json({ message: "Password reset successfully" });
});

export default router;
