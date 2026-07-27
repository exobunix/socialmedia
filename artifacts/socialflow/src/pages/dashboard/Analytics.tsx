import { useGetAnalyticsSummary, useListWorkspaces } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, TrendingUp, Heart, MousePointerClick } from "lucide-react";

export function Analytics() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: stats, isLoading } = useGetAnalyticsSummary(workspaceId!, {
    query: {
      queryKey: ["analytics", workspaceId],
      enabled: !!workspaceId
    }
  });

  if (isLoading) return <div>Loading analytics...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Measure your performance across all channels.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats.totalReach / 1000).toFixed(1)}k</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12.5% vs last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats.totalEngagement / 1000).toFixed(1)}k</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5.2% vs last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats.engagementRate * 100).toFixed(2)}%</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +1.1% vs last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follower Growth</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats.totalFollowers / 1000).toFixed(1)}k</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.4% vs last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Audience Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center text-muted-foreground">
            Chart coming soon
          </CardContent>
        </Card>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center text-muted-foreground">
            List coming soon
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
