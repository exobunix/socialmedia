import { useGetDashboard, useListWorkspaces } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Eye, TrendingUp, Heart, MousePointerClick } from "lucide-react";

export function Dashboard() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: dashboard, isLoading } = useGetDashboard(workspaceId!, { 
    query: {
      queryKey: ["dashboard", workspaceId],
      enabled: !!workspaceId
    } 
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (!dashboard) return null;

  const { stats, recentPosts, upcomingPosts, aiUsage } = dashboard;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening with your social accounts today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ai/studio" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Generate with AI
          </Link>
          <Link href="/accounts" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Connect Account
          </Link>
          <Link href="/create" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-9 px-4 py-2">
            Create Post
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.publishedPosts} published, {stats.scheduledPosts} scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalReach / 1000).toFixed(1)}k</div>
            <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngagement}</div>
            <p className="text-xs text-muted-foreground mt-1">{(stats.engagementRate * 100).toFixed(1)}% eng. rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Followers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalFollowers / 1000).toFixed(1)}k</div>
            <p className="text-xs text-muted-foreground mt-1">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No recent posts</div>
              ) : (
                recentPosts.slice(0, 5).map(post => (
                  <div key={post.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{post.content}</p>
                      <div className="flex gap-2 mt-1">
                        {post.platforms.map(p => (
                          <span key={p} className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded capitalize">{p}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full capitalize">{post.status}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No scheduled posts</div>
              ) : (
                upcomingPosts.slice(0, 5).map(post => (
                  <div key={post.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.scheduledAt || "").toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full capitalize">{post.status}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
