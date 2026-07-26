import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select-native";
import { Settings, Shield, Cpu, RefreshCw, CheckCircle, Database } from "lucide-react";

export function AdminPlatforms() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"social" | "ai" | "saas">("social");

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  // Fetch social platform configs
  const { data: platforms, isLoading: isSocialsLoading } = useQuery({
    queryKey: ["adminSocialsConfigs"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/admin/platform-configs"), {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch platform configs");
      return res.json();
    }
  });

  // Fetch integration configs
  const { data: integrations, isLoading: isIntegrationsLoading } = useQuery({
    queryKey: ["adminIntegrationsConfigs"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/admin/integrations"), {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    }
  });

  // Save Social Platform Mutation
  const saveSocialMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(getApiUrl("/api/admin/platform-configs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save social configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSocialsConfigs"] });
      alert("Social platform configuration updated successfully!");
    }
  });

  // Save AI/SaaS Integration Mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: async ({ provider, category, isEnabled, config }: any) => {
      const res = await fetch(getApiUrl(`/api/admin/integrations/${provider}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({ category, isEnabled, config })
      });
      if (!res.ok) throw new Error("Failed to save integration settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminIntegrationsConfigs"] });
      alert("Integration configuration updated successfully!");
    }
  });

  const socialNetworks = [
    { id: 'facebook', name: 'Facebook', defaultScopes: "public_profile,pages_manage_posts,pages_read_engagement" },
    { id: 'instagram', name: 'Instagram', defaultScopes: "instagram_basic,instagram_content_publish" },
    { id: 'linkedin', name: 'LinkedIn', defaultScopes: "w_member_social,r_liteprofile" },
    { id: 'x', name: 'X (Twitter)', defaultScopes: "tweet.read,tweet.write,users.read" },
    { id: 'youtube', name: 'YouTube', defaultScopes: "https://www.googleapis.com/auth/youtube.upload" },
    { id: 'tiktok', name: 'TikTok', defaultScopes: "video.upload,user.info.basic" },
  ];

  const aiProviders = [
    { id: "openai", name: "OpenAI GPT-4", category: "ai_text", fields: ["apiKey", "organizationId"] },
    { id: "gemini", name: "Google Gemini 1.5", category: "ai_text", fields: ["apiKey"] },
    { id: "claude", name: "Anthropic Claude 3.5", category: "ai_text", fields: ["apiKey"] },
    { id: "deepseek", name: "DeepSeek-V3", category: "ai_text", fields: ["apiKey"] },
    { id: "dalle", name: "OpenAI DALL-E 3", category: "ai_image", fields: ["apiKey"] },
    { id: "stable-diffusion", name: "Stable Diffusion 3", category: "ai_image", fields: ["apiKey"] },
  ];

  const saasProviders = [
    { id: "smtp", name: "SMTP Email Gateway", category: "email", fields: ["host", "port", "username", "password"] },
    { id: "s3", name: "AWS S3 Cloud Storage", category: "storage", fields: ["bucket", "region", "accessKeyId", "secretAccessKey"] },
    { id: "stripe", name: "Stripe Payment Gateway", category: "payments", fields: ["publicKey", "secretKey", "webhookSecret"] },
  ];

  const handleSocialSubmit = (e: React.FormEvent<HTMLFormElement>, platform: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      platform,
      clientId: formData.get("clientId") as string,
      clientSecret: formData.get("clientSecret") as string,
      redirectUri: formData.get("redirectUri") as string,
      scopes: formData.get("scopes") as string,
      environment: formData.get("environment") as "production" | "sandbox",
      isEnabled: formData.get("isEnabled") === "true",
    };
    saveSocialMutation.mutate(payload);
  };

  const handleIntegrationSubmit = (e: React.FormEvent<HTMLFormElement>, provider: string, category: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const config: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "isEnabled") {
        config[key] = value as string;
      }
    });
    saveIntegrationMutation.mutate({
      provider,
      category,
      isEnabled: formData.get("isEnabled") === "true",
      config
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Manage OAuth client credentials, webhooks, and third-party AI keys securely.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-[2px] ${
            activeTab === "social" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" /> Social OAuth Credentials
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-[2px] ${
            activeTab === "ai" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4" /> AI Model Integrations
        </button>
        <button
          onClick={() => setActiveTab("saas")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-all -mb-[2px] ${
            activeTab === "saas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="w-4 h-4" /> SMTP / Storage / Stripe
        </button>
      </div>

      {/* SOCIAL OAUTH TABS */}
      {activeTab === "social" && (
        <div className="grid md:grid-cols-2 gap-6">
          {socialNetworks.map(network => {
            const config = platforms?.find((p: any) => p.platform === network.id);
            return (
              <Card key={network.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{network.name}</CardTitle>
                    <CardDescription>Configure API scopes and Client ID</CardDescription>
                  </div>
                  <Badge variant={config?.isEnabled ? "success" : "secondary"}>
                    {config?.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSocialSubmit(e, network.id)} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Enabled Status</Label>
                      <Select name="isEnabled" defaultValue={config?.isEnabled ? "true" : "false"}>
                        <option value="false">Disabled</option>
                        <option value="true">Active / Live</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Client ID / App ID</Label>
                      <Input name="clientId" defaultValue={config?.clientId || ""} placeholder="App client ID" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Client Secret</Label>
                      <Input name="clientSecret" type="password" placeholder="••••••••••••••••" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Redirect URI</Label>
                      <Input name="redirectUri" defaultValue={config?.redirectUri || `http://localhost:3000/oauth/callback/${network.id}`} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Default Scopes</Label>
                      <Input name="scopes" defaultValue={config?.scopes || network.defaultScopes} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Environment</Label>
                      <Select name="environment" defaultValue={config?.environment || "sandbox"}>
                        <option value="sandbox">Sandbox / Testing</option>
                        <option value="production">Production</option>
                      </Select>
                    </div>
                    <Button type="submit" disabled={saveSocialMutation.isPending} className="w-full mt-2">
                      Save Credentials
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI INTEGRATIONS */}
      {activeTab === "ai" && (
        <div className="grid md:grid-cols-2 gap-6">
          {aiProviders.map(provider => {
            const config = integrations?.find((i: any) => i.provider === provider.id);
            return (
              <Card key={provider.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>Toggle and configure model API Keys</CardDescription>
                  </div>
                  <Badge variant={config?.isEnabled ? "success" : "secondary"}>
                    {config?.isEnabled ? "Active" : "Offline"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleIntegrationSubmit(e, provider.id, provider.category)} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select name="isEnabled" defaultValue={config?.isEnabled ? "true" : "false"}>
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                      </Select>
                    </div>
                    {provider.fields.map(field => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                        <Input 
                          name={field} 
                          type={field.toLowerCase().includes("key") ? "password" : "text"} 
                          placeholder={config?.config?.[field] || `Enter ${field}`} 
                        />
                      </div>
                    ))}
                    <Button type="submit" disabled={saveIntegrationMutation.isPending} className="w-full mt-2">
                      Save Settings
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* SAAS SETTINGS */}
      {activeTab === "saas" && (
        <div className="grid md:grid-cols-2 gap-6">
          {saasProviders.map(provider => {
            const config = integrations?.find((i: any) => i.provider === provider.id);
            return (
              <Card key={provider.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>Manage keys, region or SMTP endpoints</CardDescription>
                  </div>
                  <Badge variant={config?.isEnabled ? "success" : "secondary"}>
                    {config?.isEnabled ? "Active" : "Offline"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleIntegrationSubmit(e, provider.id, provider.category)} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select name="isEnabled" defaultValue={config?.isEnabled ? "true" : "false"}>
                        <option value="false">Disabled</option>
                        <option value="true">Enabled</option>
                      </Select>
                    </div>
                    {provider.fields.map(field => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                        <Input 
                          name={field} 
                          type={field.toLowerCase().includes("key") || field.toLowerCase().includes("secret") || field.toLowerCase().includes("password") ? "password" : "text"} 
                          placeholder={config?.config?.[field] || `Enter ${field}`} 
                        />
                      </div>
                    ))}
                    <Button type="submit" disabled={saveIntegrationMutation.isPending} className="w-full mt-2">
                      Save Settings
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
