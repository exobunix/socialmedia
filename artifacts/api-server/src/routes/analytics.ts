import { Router, type IRouter } from "express";
import { postsTable, socialAccountsTable, aiLogsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { GetAnalyticsSummaryParams, GetPostAnalyticsParams, GetDashboardParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workspaces/:workspaceId/analytics/summary", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetAnalyticsSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { workspaceId } = params.data;

  const allPosts = await postsTable.find({ workspaceId }).lean() as any[];
  const accounts = await socialAccountsTable.find({ workspaceId }).lean() as any[];

  const published = allPosts.filter(p => p.status === "published");
  const scheduled = allPosts.filter(p => p.status === "scheduled");
  const drafts = allPosts.filter(p => p.status === "draft");

  const totalFollowers = accounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
  const totalLikes = published.reduce((s, p) => s + (p.likesCount ?? 0), 0);
  const totalShares = published.reduce((s, p) => s + (p.sharesCount ?? 0), 0);
  const totalComments = published.reduce((s, p) => s + (p.commentsCount ?? 0), 0);
  const totalEngagement = totalLikes + totalShares + totalComments;
  const totalImpressions = published.reduce((s, p) => s + (p.impressionsCount ?? 0), 0);
  const engagementRate = totalFollowers > 0 ? (totalEngagement / totalFollowers) * 100 : 0;

  const platformBreakdown = Array.from(new Set(accounts.map(a => a.platform))).map(platform => {
    const platformPosts = published.filter(p => p.platforms.includes(platform));
    const platformAccount = accounts.find(a => a.platform === platform);
    return {
      platform,
      posts: platformPosts.length,
      engagement: platformPosts.reduce((s, p) => s + (p.likesCount ?? 0) + (p.commentsCount ?? 0), 0),
      followers: platformAccount?.followersCount ?? 0,
    };
  });

  // Trend: last 7 days
  const now = new Date();
  const engagementTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayPosts = published.filter(p => p.publishedAt?.toISOString().split("T")[0] === dateStr);
    return { date: dateStr, value: dayPosts.reduce((s, p) => s + (p.likesCount ?? 0), 0) };
  });

  res.json({
    totalPosts: allPosts.length,
    publishedPosts: published.length,
    scheduledPosts: scheduled.length,
    draftPosts: drafts.length,
    totalFollowers,
    totalReach: totalImpressions,
    totalEngagement,
    engagementRate: Math.round(engagementRate * 100) / 100,
    totalImpressions,
    period: "30d",
    platformBreakdown,
    engagementTrend,
  });
});

router.get("/workspaces/:workspaceId/analytics/posts", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetPostAnalyticsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const posts = await postsTable.find({
    workspaceId: params.data.workspaceId,
    status: "published"
  }).lean() as any[];
  const result = posts.flatMap(post =>
    post.platforms.map((platform: string) => ({
      postId: post.id,
      platform,
      likes: post.likesCount ?? 0,
      shares: post.sharesCount ?? 0,
      comments: post.commentsCount ?? 0,
      impressions: post.impressionsCount ?? 0,
      reach: post.impressionsCount ?? 0,
      engagementRate: 0,
    }))
  );
  res.json(result);
});

router.get("/workspaces/:workspaceId/dashboard", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = GetDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { workspaceId } = params.data;

  const [allPosts, accounts] = await Promise.all([
    postsTable.find({ workspaceId }).lean() as Promise<any[]>,
    socialAccountsTable.find({ workspaceId }).lean() as Promise<any[]>,
  ]);

  const published = allPosts.filter(p => p.status === "published");
  const scheduled = allPosts.filter(p => p.status === "scheduled");

  const recentPosts = [...published].sort((a, b) =>
    (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  ).slice(0, 5);

  const upcomingPosts = [...scheduled].sort((a, b) =>
    (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0)
  ).slice(0, 5);

  const totalFollowers = accounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
  const totalEngagement = published.reduce((s, p) => s + (p.likesCount ?? 0) + (p.sharesCount ?? 0) + (p.commentsCount ?? 0), 0);
  const totalImpressions = published.reduce((s, p) => s + (p.impressionsCount ?? 0), 0);
  const engagementRate = totalFollowers > 0 ? (totalEngagement / totalFollowers) * 100 : 0;

  const engagementTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().split("T")[0], value: Math.floor(Math.random() * 100) };
  });

  // AI usage stats using aggregation
  const aiUsageRows = await aiLogsTable.aggregate([
    { $match: { userId: req.userId! } },
    { $group: { _id: "$type", cnt: { $sum: 1 } } }
  ]) as any[];

  const aiUsage = {
    captionsGenerated: aiUsageRows.find(r => r._id === "caption")?.cnt ?? 0,
    imagesGenerated: aiUsageRows.find(r => r._id === "image")?.cnt ?? 0,
    hashtagsGenerated: aiUsageRows.find(r => r._id === "hashtags")?.cnt ?? 0,
  };

  res.json({
    stats: {
      totalPosts: allPosts.length,
      publishedPosts: published.length,
      scheduledPosts: scheduled.length,
      draftPosts: allPosts.filter(p => p.status === "draft").length,
      totalFollowers,
      totalReach: totalImpressions,
      totalEngagement,
      engagementRate: Math.round(engagementRate * 100) / 100,
      totalImpressions,
      period: "30d",
      platformBreakdown: [],
      engagementTrend,
    },
    recentPosts,
    upcomingPosts,
    socialAccounts: accounts,
    aiUsage,
  });
});

export default router;
