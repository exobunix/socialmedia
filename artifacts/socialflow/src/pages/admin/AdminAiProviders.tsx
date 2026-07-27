import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Cpu, Image as ImageIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AiConfigData {
  platform: string;
  isEnabled: boolean;
  aiConfig?: {
    apiKey?: string;
    model?: string;
    promptTemplate?: string;
    resolution?: string;
    aspectRatio?: string;
    quality?: string;
    fallbackProvider?: string;
    maxImages?: number;
    testConnectionStatus?: "untested" | "connected" | "failed";
  };
}

interface ProviderCardProps {
  platform: string;
  data: AiConfigData;
  testingPlatform: string | null;
  handleTestConnection: (platform: string, config: any) => Promise<void>;
  handleSave: (platform: string, updatedConfig: any) => Promise<void>;
}

// 1. Text provider sub-component to resolve Rules of Hooks violation
function TextProviderCard({ platform, data, testingPlatform, handleTestConnection, handleSave }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState(data.aiConfig?.apiKey || "");
  const [model, setModel] = useState(data.aiConfig?.model || "");
  const [promptTemplate, setPromptTemplate] = useState(data.aiConfig?.promptTemplate || "");
  const [isEnabled, setIsEnabled] = useState(data.isEnabled);

  // Sync state if backend data updates
  useEffect(() => {
    setApiKey(data.aiConfig?.apiKey || "");
    setModel(data.aiConfig?.model || "");
    setPromptTemplate(data.aiConfig?.promptTemplate || "");
    setIsEnabled(data.isEnabled);
  }, [data]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/40 text-left">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="capitalize text-sm font-bold">{platform}</CardTitle>
          <CardDescription className="text-[11px]">AI text generator</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {data.aiConfig?.testConnectionStatus === "connected" && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
          {data.aiConfig?.testConnectionStatus === "failed" && (
            <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          )}
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="rounded border-input bg-background w-4 h-4 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">API Key</Label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Model Name</Label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={platform === "gemini" ? "gemini-1.5-flash" : platform === "openai" ? "gpt-4o-mini" : "default-model"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Custom Prompt Template (Optional)</Label>
          <textarea
            value={promptTemplate}
            onChange={e => setPromptTemplate(e.target.value)}
            placeholder="Translate this caption into a viral social media post..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs"
            disabled={testingPlatform === platform}
            onClick={() => handleTestConnection(platform, { apiKey, model })}
          >
            {testingPlatform === platform ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Testing
              </>
            ) : "Test Connection"}
          </Button>
          <Button 
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleSave(platform, { apiKey, model, promptTemplate, isEnabled })}
          >
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Image provider sub-component to resolve Rules of Hooks violation
function ImageProviderCard({ platform, data, testingPlatform, handleTestConnection, handleSave }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState(data.aiConfig?.apiKey || "");
  const [model, setModel] = useState(data.aiConfig?.model || "");
  const [resolution, setResolution] = useState(data.aiConfig?.resolution || "1280x720");
  const [isEnabled, setIsEnabled] = useState(data.isEnabled);

  // Sync state if backend data updates
  useEffect(() => {
    setApiKey(data.aiConfig?.apiKey || "");
    setModel(data.aiConfig?.model || "");
    setResolution(data.aiConfig?.resolution || "1280x720");
    setIsEnabled(data.isEnabled);
  }, [data]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/40 text-left">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="capitalize text-sm font-bold">{platform}</CardTitle>
          <CardDescription className="text-[11px]">AI Cover/Image generator</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {data.aiConfig?.testConnectionStatus === "connected" && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
          {data.aiConfig?.testConnectionStatus === "failed" && (
            <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Failed
            </span>
          )}
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="rounded border-input bg-background w-4 h-4 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">API Key</Label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Model Name</Label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={platform === "imagen" ? "imagen-3.0" : "flux-schnell"}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Resolution</Label>
          <select
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="1280x720">Landscape (1280x720)</option>
            <option value="720x1280">Portrait (720x1280)</option>
            <option value="1024x1024">Square (1024x1024)</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs"
            disabled={testingPlatform === platform}
            onClick={() => handleTestConnection(platform, { apiKey, model })}
          >
            {testingPlatform === platform ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Testing
              </>
            ) : "Test Connection"}
          </Button>
          <Button 
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleSave(platform, { apiKey, model, resolution, isEnabled })}
          >
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminAiProviders() {
  const [configs, setConfigs] = useState<AiConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/ai-configs"), {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      } else {
        toast.error("Failed to load AI configs");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (platform: string, updatedConfig: any) => {
    try {
      const res = await fetch(getApiUrl("/api/admin/ai-configs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({
          platform,
          ...updatedConfig
        })
      });

      if (res.ok) {
        toast.success(`${platform.toUpperCase()} configuration saved successfully!`);
        fetchConfigs();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving configuration");
    }
  };

  const handleTestConnection = async (platform: string, config: any) => {
    setTestingPlatform(platform);
    try {
      const res = await fetch(getApiUrl("/api/admin/ai-configs/test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({
          platform,
          apiKey: config.apiKey,
          model: config.model
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Connection to ${platform.toUpperCase()} succeeded!`);
      } else {
        toast.error(data.error || `Connection to ${platform.toUpperCase()} failed.`);
      }
      fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error("Connection test timed out");
    } finally {
      setTestingPlatform(null);
    }
  };

  const getOrInitConfig = (platform: string) => {
    const found = configs.find(c => c.platform === platform);
    return found || {
      platform,
      isEnabled: false,
      aiConfig: {
        apiKey: "",
        model: "",
        promptTemplate: "",
        resolution: "1280x720",
        aspectRatio: "16:9",
        quality: "standard",
        maxImages: 1
      }
    };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const textProviders = ["gemini", "openai", "claude", "deepseek", "groq", "openrouter"];
  const imageProviders = ["imagen", "flux", "stable_diffusion", "ideogram", "recraft"];

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Settings & Integrations</h1>
        <p className="text-muted-foreground">Configure global AI providers for automatic captioning and video cover/thumbnail generation.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          Text & Caption Generation Providers
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {textProviders.map(p => (
            <TextProviderCard 
              key={p}
              platform={p}
              data={getOrInitConfig(p)}
              testingPlatform={testingPlatform}
              handleTestConnection={handleTestConnection}
              handleSave={handleSave}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Image & Video Thumbnail Generation Providers
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {imageProviders.map(p => (
            <ImageProviderCard
              key={p}
              platform={p}
              data={getOrInitConfig(p)}
              testingPlatform={testingPlatform}
              handleTestConnection={handleTestConnection}
              handleSave={handleSave}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
