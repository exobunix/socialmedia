import { useListSocialAccounts, useListWorkspaces, useDisconnectSocialAccount } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Accounts() {
  const queryClient = useQueryClient();
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: accounts, isLoading } = useListSocialAccounts(workspaceId!, {
    query: { enabled: !!workspaceId }
  });

  const disconnectMutation = useDisconnectSocialAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [`/api/workspaces/${workspaceId}/social-accounts`]
        });
      },
      onError: (err: any) => {
        alert(err.message || "Failed to disconnect social account");
      }
    }
  });

  const handleDisconnect = (accountId: number) => {
    if (confirm("Are you sure you want to disconnect this social account?")) {
      disconnectMutation.mutate({ workspaceId: workspaceId!, id: accountId });
    }
  };

  const platforms = [
    { id: 'facebook', name: 'Facebook Page' },
    { id: 'instagram', name: 'Instagram Business' },
    { id: 'linkedin', name: 'LinkedIn Company' },
    { id: 'x', name: 'X (Twitter)' },
    { id: 'youtube', name: 'YouTube Channel' },
    { id: 'tiktok', name: 'TikTok Business' },
    { id: 'pinterest', name: 'Pinterest' },
    { id: 'threads', name: 'Threads' }
  ];

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  const handleConnect = async (platformId: string) => {
    if (platformId === "youtube") {
      try {
        const res = await fetch(getApiUrl(`/api/oauth/connect/youtube?workspaceId=${workspaceId}`), {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
          }
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || "Failed to initiate YouTube connection");
        }
      } catch (err) {
        console.error(err);
        alert("Error initiating YouTube connection");
      }
    } else {
      alert(`OAuth flow for ${platformId} will be configured in the next phase.`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Accounts</h1>
        <p className="text-muted-foreground">Manage your connected social media profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const connected = accounts?.find(a => a.platform === platform.id);
          
          return (
            <Card key={platform.id} className={connected ? "border-primary/50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  {connected ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{platform.name}</h3>
                
                {connected ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">@{connected.username}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Followers / Subs</span>
                      <span className="font-medium">{connected.followersCount?.toLocaleString() || 0}</span>
                    </div>
                    <Button variant="destructive" onClick={() => handleDisconnect(connected.id)} disabled={disconnectMutation.isPending} className="w-full">Disconnect</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Connect to publish and analyze posts.</p>
                    <div className="pt-6">
                      <Button onClick={() => handleConnect(platform.id)} className="w-full">Connect {platform.name}</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
