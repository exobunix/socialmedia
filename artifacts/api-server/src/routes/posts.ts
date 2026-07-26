import { Router, type IRouter } from "express";
import { postsTable, workspacesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { publishPostToYouTube } from "../lib/social-publishers";
import {
  ListPostsParams,
  CreatePostParams,
  CreatePostBody,
  GetPostParams,
  UpdatePostParams,
  UpdatePostBody,
  DeletePostParams,
  PublishPostParams,
  DuplicatePostParams,
  GetCalendarPostsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function verifyWorkspaceOwner(workspaceId: number, userId: number): Promise<boolean> {
  const ws = await workspacesTable.findOne({ id: workspaceId, ownerId: userId }) as any;
  return !!ws;
}

router.get("/workspaces/:workspaceId/posts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ListPostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const ok = await verifyWorkspaceOwner(params.data.workspaceId, req.userId!);
  if (!ok) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const posts = await postsTable.find({ workspaceId: params.data.workspaceId }).sort({ createdAt: 1 });
  res.json({ posts, total: posts.length, page: 1, limit: posts.length });
});

router.post("/workspaces/:workspaceId/posts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = CreatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ok = await verifyWorkspaceOwner(params.data.workspaceId, req.userId!);
  if (!ok) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const post = await postsTable.create({
    workspaceId: params.data.workspaceId,
    content: parsed.data.content,
    platforms: parsed.data.platforms ?? [],
    mediaUrls: parsed.data.mediaUrls ?? [],
    hashtags: parsed.data.hashtags ?? [],
    tone: parsed.data.tone as any,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    status: (parsed.data.status ?? "draft") as any,
  });

  if (post.status === "published") {
    try {
      if (post.platforms.includes("youtube")) {
        await publishPostToYouTube(post.id, params.data.workspaceId);
      }
    } catch (err) {
      console.error("Auto publish error:", err);
    }
  }

  const finalPost = await postsTable.findOne({ id: post.id });
  res.status(201).json(finalPost);
});

router.get("/workspaces/:workspaceId/posts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const post = await postsTable.findOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  }) as any;
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(post);
});

router.patch("/workspaces/:workspaceId/posts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
  if (parsed.data.platforms !== undefined) updateData.platforms = parsed.data.platforms;
  if (parsed.data.mediaUrls !== undefined) updateData.mediaUrls = parsed.data.mediaUrls;
  if (parsed.data.hashtags !== undefined) updateData.hashtags = parsed.data.hashtags;
  if (parsed.data.tone !== undefined) updateData.tone = parsed.data.tone;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.scheduledAt !== undefined) updateData.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;

  const post = await postsTable.findOneAndUpdate(
    { id: params.data.id, workspaceId: params.data.workspaceId },
    { $set: updateData },
    { new: true }
  ) as any;
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(post);
});

router.delete("/workspaces/:workspaceId/posts/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await postsTable.deleteOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  });
  res.sendStatus(204);
});

router.post("/workspaces/:workspaceId/posts/:id/publish", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = PublishPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const ok = await verifyWorkspaceOwner(params.data.workspaceId, req.userId!);
  if (!ok) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  
  const post = await postsTable.findOne({ id: params.data.id, workspaceId: params.data.workspaceId }) as any;
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  try {
    if (post.platforms.includes("youtube")) {
      await publishPostToYouTube(post.id, params.data.workspaceId);
    } else {
      await postsTable.updateOne({ id: post.id }, { $set: { status: "published", publishedAt: new Date() } });
    }
    const updated = await postsTable.findOne({ id: post.id });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to publish post" });
  }
});

router.post("/workspaces/:workspaceId/posts/:id/duplicate", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DuplicatePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const orig = await postsTable.findOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  }).lean() as any;
  if (!orig) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const dup = await postsTable.create({
    workspaceId: orig.workspaceId,
    content: orig.content,
    status: "draft" as const,
    platforms: orig.platforms,
    mediaUrls: orig.mediaUrls,
    hashtags: orig.hashtags,
    tone: orig.tone,
  });
  res.status(201).json(dup);
});

router.get("/workspaces/:workspaceId/calendar", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetCalendarPostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const posts = await postsTable.find({ workspaceId: params.data.workspaceId }).lean();
  
  const byDate = new Map<string, any[]>();
  for (const post of posts) {
    const d = (post as any).scheduledAt ?? (post as any).createdAt;
    const dateStr = d.toISOString().split("T")[0];
    if (!byDate.has(dateStr)) byDate.set(dateStr, []);
    byDate.get(dateStr)!.push(post);
  }
  
  const result = Array.from(byDate.entries()).map(([date, postsOnDay]) => ({ date, posts: postsOnDay }));
  res.json(result);
});

export default router;
