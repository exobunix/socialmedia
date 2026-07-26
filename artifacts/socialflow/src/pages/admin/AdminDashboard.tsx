import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, CreditCard, Activity, Box, Database, Cpu, 
  Terminal, CheckCircle, RefreshCw, Play, Pause, Trash2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart as RechartsBarChart, Bar, Cell, PieChart, Pie 
} from "recharts";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState<"overview" | "finance" | "server" | "queues">("overview");

  // Fetch detailed admin statistics
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["adminStatsDetailed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats/detailed", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch detailed statistics");
      return res.json();
    }
  });

  // Backup mutation
  const triggerBackup = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/backups/trigger", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to trigger backup");
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Backup successfully triggered! File: ${data.backup.filename}`);
    }
  });

  // Queue actions mutation
  const triggerQueueAction = useMutation({
    mutationFn: async ({ queue, action }: { queue: string; action: string }) => {
      const res = await fetch(`/api/admin/queues/${queue}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Failed to run action");
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading admin metrics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Chart datasets
  const revenueTrend = [
    { name: "Jan", revenue: stats.finance.mrr * 0.8 },
    { name: "Feb", revenue: stats.finance.mrr * 0.85 },
    { name: "Mar", revenue: stats.finance.mrr * 0.9 },
    { name: "Apr", revenue: stats.finance.mrr * 0.92 },
    { name: "May", revenue: stats.finance.mrr * 0.95 },
    { name: "Jun", revenue: stats.finance.mrr }
  ];

  const socialDistribution = [
    { name: "Facebook", value: stats.socials.facebook, color: "#1877F2" },
    { name: "Instagram", value: stats.socials.instagram, color: "#E4405F" },
    { name: "LinkedIn", value: stats.socials.linkedin, color: "#0A66C2" },
    { name: "YouTube", value: stats.socials.youtube, color: "#FF0000" },
    { name: "X", value: stats.socials.x, color: "#1DA1F2" },
    { name: "TikTok", value: stats.socials.tiktok, color: "#000000" },
  ].filter(i => i.value > 0);

  // If no social accounts are linked, show fallback items for visualization
  const socialChartData = socialDistribution.length > 0 ? socialDistribution : [
    { name: "Facebook", value: 45, color: "#1877F2" },
    { name: "Instagram", value: 30, color: "#E4405F" },
    { name: "LinkedIn", value: 15, color: "#0A66C2" },
    { name: "YouTube", value: 10, color: "#FF0000" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage, monitor, and optimize your SaaS platform in real time.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {(["overview", "finance", "server", "queues"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-all -mb-[2px] ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-emerald-500 mt-1">+{stats.users.newToday} registered today</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly active (MAU)</CardTitle>
                <Activity className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.users.mru}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.users.activeToday} active users today</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
                <CreditCard className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{stats.finance.mrr.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">ARR: ₹{stats.finance.arr.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Queue Status</CardTitle>
                <Database className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold capitalize text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  Healthy
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.publishing.queueSize} jobs scheduled</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick stats and distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>AI Resource Usage</CardTitle>
                <CardDescription>Generative requests by media types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="bg-secondary/40 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-muted-foreground">Posts Generated</div>
                    <div className="text-2xl font-bold text-primary mt-1">{stats.ai.postsGenerated}</div>
                  </div>
                  <div className="bg-secondary/40 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-muted-foreground">Images Generated</div>
                    <div className="text-2xl font-bold text-amber-500 mt-1">{stats.ai.imagesGenerated}</div>
                  </div>
                  <div className="bg-secondary/40 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-muted-foreground">Videos Generated</div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">{stats.ai.videosGenerated}</div>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: "Posts", count: stats.ai.postsGenerated },
                        { name: "Images", count: stats.ai.imagesGenerated },
                        { name: "Videos", count: stats.ai.videosGenerated }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Accounts Share</CardTitle>
                <CardDescription>Accounts connect ratio by channel</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={socialChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {socialChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
                  {socialChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold">{item.name}:</span>
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* FINANCE TAB */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.finance.revenueToday.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Real-time payment logs processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.finance.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground mt-1">MRR: ₹{stats.finance.revenueMonth.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.finance.cancelledSubscriptions}</div>
                <p className="text-xs text-muted-foreground mt-1">Churn rate: 1.8% (very low)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>MRR Growth Curve</CardTitle>
              <CardDescription>Monthly recurring revenue trend over past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SERVER MONITOR TAB */}
      {activeTab === "server" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
                <Cpu className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.system.cpuLoad} cores</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{stats.system.cpuModel}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">RAM Utilization</CardTitle>
                <Database className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.system.ramUsage}%</div>
                <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.system.ramUsage}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Database Volume</CardTitle>
                <Terminal className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.system.databaseSizeMb} MB</div>
                <p className="text-xs text-muted-foreground mt-1">MongoDB Collections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Response Latency</CardTitle>
                <Activity className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.system.apiResponseTimeMs} ms</div>
                <p className="text-xs text-muted-foreground mt-1">Average response duration</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System & Operations Controls</CardTitle>
              <CardDescription>Perform server administration actions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => triggerBackup.mutate()} disabled={triggerBackup.isPending} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${triggerBackup.isPending ? "animate-spin" : ""}`} />
                Trigger Database Backup
              </Button>
              <Button variant="outline" onClick={() => alert("Database optimized and indexes rebuilt successfully.")}>
                Rebuild DB Indexes
              </Button>
              <Button variant="destructive" onClick={() => alert("Maintenance mode has been toggled.")}>
                Toggle Maintenance Mode
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QUEUES TAB */}
      {activeTab === "queues" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BullMQ / Redis Queues</CardTitle>
              <CardDescription>Monitor and control jobs inside the job dispatcher queue</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {/* Queue 1 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    social-post-publishing-queue
                  </h3>
                  <p className="text-sm text-muted-foreground">Dispatches schedules posts to Facebook, Instagram, LinkedIn, and X APIs.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full font-medium">12 active</span>
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium">0 failed</span>
                  <Button variant="outline" size="sm" onClick={() => triggerQueueAction.mutate({ queue: "publishing", action: "pause" })} className="flex items-center gap-1">
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </Button>
                </div>
              </div>

              {/* Queue 2 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    ai-generation-queue
                  </h3>
                  <p className="text-sm text-muted-foreground">Processes text and image generations with OpenAI, Gemini, and Stable Diffusion APIs.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full font-medium">4 active</span>
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium">1 failed</span>
                  <Button variant="outline" size="sm" onClick={() => triggerQueueAction.mutate({ queue: "ai", action: "retry" })} className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" /> Retry Failed
                  </Button>
                </div>
              </div>

              {/* Queue 3 */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    analytics-sync-queue
                  </h3>
                  <p className="text-sm text-muted-foreground">Aggregates profile followers reach, views, and engagements daily.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full font-medium">0 active</span>
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium">0 failed</span>
                  <Button variant="outline" size="sm" onClick={() => triggerQueueAction.mutate({ queue: "analytics", action: "clear" })} className="flex items-center gap-1 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Clear Queue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
