import { Router, type IRouter } from "express";
import { workspacesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { CreateWorkspaceBody, UpdateWorkspaceBody, GetWorkspaceParams, UpdateWorkspaceParams, DeleteWorkspaceParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workspaces", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  let workspaces = await workspacesTable.find({ ownerId: req.userId! });
  if (workspaces.length === 0) {
    await workspacesTable.create({ name: "Personal Workspace", ownerId: req.userId! });
    workspaces = await workspacesTable.find({ ownerId: req.userId! });
  }
  res.json(workspaces);
});

router.post("/workspaces", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const workspace = await workspacesTable.create({ ...parsed.data, ownerId: req.userId! });
  res.status(201).json(workspace);
});

router.get("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const workspace = await workspacesTable.findOne({
    id: params.data.id,
    ownerId: req.userId!
  });
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json(workspace);
});

router.patch("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdateWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const workspace = await workspacesTable.findOneAndUpdate(
    { id: params.data.id, ownerId: req.userId! },
    { $set: parsed.data },
    { new: true }
  );
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  res.json(workspace);
});

router.delete("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteWorkspaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await workspacesTable.deleteOne({
    id: params.data.id,
    ownerId: req.userId!
  });
  res.sendStatus(204);
});

export default router;
