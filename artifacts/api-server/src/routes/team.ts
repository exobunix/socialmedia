import { Router, type IRouter } from "express";
import { teamMembersTable, usersTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import {
  ListTeamMembersParams,
  InviteTeamMemberParams,
  InviteTeamMemberBody,
  UpdateTeamMemberParams,
  UpdateTeamMemberBody,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workspaces/:workspaceId/team", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ListTeamMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const members = await teamMembersTable.find({ workspaceId: params.data.workspaceId }).lean() as any[];
  
  // Enrich with user data
  const enriched = await Promise.all(members.map(async (m) => {
    let user = null;
    if (m.userId) {
      const u = await usersTable.findOne({ id: m.userId }).lean() as any;
      if (u) {
        user = { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl, role: u.role, isVerified: u.isVerified, createdAt: u.createdAt };
      }
    }
    return { ...m, user };
  }));
  res.json(enriched);
});

router.post("/workspaces/:workspaceId/team", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = InviteTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Check if user already exists
  const existingUser = await usersTable.findOne({ email: parsed.data.email }).lean() as any;
  const memberDoc = await teamMembersTable.create({
    workspaceId: params.data.workspaceId,
    inviteEmail: parsed.data.email,
    userId: existingUser?.id ?? null,
    role: parsed.data.role as any,
    status: existingUser ? "active" : "pending",
  });
  const member = memberDoc.toJSON() as any;
  res.status(201).json({ ...member, user: existingUser ?? null });
});

router.patch("/workspaces/:workspaceId/team/:memberId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdateTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const member = await teamMembersTable.findOneAndUpdate(
    { id: params.data.memberId, workspaceId: params.data.workspaceId },
    { $set: { role: parsed.data.role as any } },
    { new: true }
  ).lean() as any;
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.json({ ...member, user: null });
});

router.delete("/workspaces/:workspaceId/team/:memberId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = RemoveTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await teamMembersTable.deleteOne({
    id: params.data.memberId,
    workspaceId: params.data.workspaceId
  });
  res.sendStatus(204);
});

export default router;
