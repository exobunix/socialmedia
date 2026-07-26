import { Router, type IRouter } from "express";
import { socialAccountsTable, workspacesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import {
  ListSocialAccountsParams,
  ConnectSocialAccountParams,
  ConnectSocialAccountBody,
  GetSocialAccountParams,
  DisconnectSocialAccountParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function verifyWorkspaceOwner(workspaceId: number, userId: number): Promise<boolean> {
  const ws = await workspacesTable.findOne({ id: workspaceId, ownerId: userId });
  return !!ws;
}

router.get("/workspaces/:workspaceId/social-accounts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ListSocialAccountsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const ok = await verifyWorkspaceOwner(params.data.workspaceId, req.userId!);
  if (!ok) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const accounts = await socialAccountsTable.find({ workspaceId: params.data.workspaceId });
  res.json(accounts);
});

router.post("/workspaces/:workspaceId/social-accounts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ConnectSocialAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ConnectSocialAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ok = await verifyWorkspaceOwner(params.data.workspaceId, req.userId!);
  if (!ok) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const account = await socialAccountsTable.create({
    workspaceId: params.data.workspaceId,
    platform: parsed.data.platform as any,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    profileImageUrl: parsed.data.profileImageUrl,
    accessToken: parsed.data.accessToken,
    refreshToken: parsed.data.refreshToken,
    platformUserId: parsed.data.platformUserId,
    followersCount: parsed.data.followersCount,
  });
  res.status(201).json(account);
});

router.get("/workspaces/:workspaceId/social-accounts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetSocialAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const account = await socialAccountsTable.findOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  });
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(account);
});

router.delete("/workspaces/:workspaceId/social-accounts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DisconnectSocialAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await socialAccountsTable.deleteOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  });
  res.sendStatus(204);
});

export default router;
