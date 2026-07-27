import { useState, useRef, useEffect } from "react";
import { useListWorkspaces, useListSocialAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  UploadCloud, 
  Video, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Clock, 
  Play, 
  Check, 
  AlertTriangle,
  Loader2
} from "lucide-react";

interface UploadedMedia {
  id: number;
  url: string;
  fileId: string;
  filename: string;
  type: "image" | "video";
  sizeBytes: number;
  resolution?: string;
  aspectRatio?: string;
  orientation?: "portrait" | "landscape";
  status: "pending" | "processing" | "completed" | "failed";
  aiData?: {
    caption?: string;
    platformCaptions?: Record<string, string>;
    hashtags?: string[];
    cta?: string;
    category?: string;
    audience?: string;
  };
  thumbnailUrl?: string;
  thumbnailStatus: "none" | "generating" | "completed" | "failed";
  progress?: number;
}

export function BulkUpload() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: accounts } = useListSocialAccounts(workspaceId!, {
    query: { enabled: !!workspaceId }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<"immediate" | "fixed" | "slots" | "interval" | "weekly" | "random">("slots");
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);

  // Strategy settings
  const [fixedDate, setFixedDate] = useState("");
  const [fixedTime, setFixedTime] = useState("09:00");
  const [intervalMinutes, setIntervalMinutes] = useState(120); // 2 hours
  const [timeSlots, setTimeSlots] = useState<string[]>(["09:00", "13:00", "19:00"]);
  const [newSlotTime, setNewSlotTime] = useState("12:00");

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  useEffect(() => {
    if (accounts && accounts.length > 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms([accounts[0].platform]);
    }
  }, [accounts]);

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Directory recursive scanner
  const traverseDirectory = async (entry: any, fileList: File[]) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => entry.file(resolve));
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ["jpg", "jpeg", "png", "webp", "mp4", "mov", "avi", "mkv", "webm"].includes(ext)) {
        fileList.push(file);
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await new Promise<any[]>((resolve) => dirReader.readEntries(resolve));
      for (const child of entries) {
        await traverseDirectory(child, fileList);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseDirectory(entry, filesToUpload);
        }
      }
    }

    if (filesToUpload.length > 0) {
      uploadFiles(filesToUpload);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!workspaceId) return;

    try {
      let batchId = activeBatchId;

      if (!batchId) {
        // Create new batch on-demand
        const batchRes = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
          },
          body: JSON.stringify({
            selectedPlatforms,
            strategy,
            settings: getStrategySettings()
          })
        });

        if (!batchRes.ok) throw new Error("Failed to create bulk upload batch");
        const batchData = await batchRes.json();
        batchId = batchData.id;
        setActiveBatchId(batchId);
      }

      toast.info(`Uploading ${files.length} files...`);

      for (const file of files) {
        const type = file.type.startsWith("video/") ? "video" : "image";
        
        // Add to loading state queue
        const tempId = Math.random();
        setMediaList(prev => [...prev, {
          id: tempId,
          url: "",
          fileId: "",
          filename: file.name,
          type,
          sizeBytes: file.size,
          status: "pending",
          thumbnailStatus: "none",
          progress: 10
        }]);

        // Upload media to ImageKit
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "bulk_uploads");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", getApiUrl("/api/media/upload"), true);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("socialflow_auth_token")}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setMediaList(prev => prev.map(m => m.id === tempId ? { ...m, progress: pct } : m));
          }
        };

        const uploadPromise = new Promise<any>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.responseText || "Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Network Error"));
          xhr.send(formData);
        });

        try {
          const uploadedRes = await uploadPromise;
          
          // Connect to batch
          const mediaRes = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches/${batchId}/media`), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
            },
            body: JSON.stringify({
              url: uploadedRes.url,
              fileId: uploadedRes.fileId,
              filename: file.name,
              sizeBytes: file.size,
              type,
              resolution: type === "video" ? "1280x720" : "1920x1080",
              duration: type === "video" ? 10 : null
            })
          });

          if (mediaRes.ok) {
            const savedMedia = await mediaRes.json();
            setMediaList(prev => prev.map(m => m.id === tempId ? savedMedia : m));
          }
        } catch (err) {
          console.error(err);
          setMediaList(prev => prev.map(m => m.id === tempId ? { ...m, status: "failed" } : m));
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      toast.success("All uploads completed!");
    } catch (err: any) {
      toast.error(err.message || "Failed during uploads batch creation");
    }
  };

  const getStrategySettings = () => {
    switch (strategy) {
      case "fixed":
        return { startDate: fixedDate, startTime: fixedTime };
      case "slots":
        return { slots: timeSlots };
      case "interval":
        return { intervalMinutes };
      default:
        return {};
    }
  };

  const runAiAnalysis = async () => {
    if (!activeBatchId || !workspaceId) return;
    setIsProcessing(true);
    toast.info("Running AI content models & vision analyzers on batch...");

    try {
      const res = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches/${activeBatchId}/process-ai`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });

      if (res.ok) {
        toast.success("AI Content generation complete!");
        // Refresh batch files list
        const filesRes = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches/${activeBatchId}/files`), {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
          }
        });
        if (filesRes.ok) {
          const files = await filesRes.json();
          setMediaList(files);
        }
      } else {
        toast.error("AI Analysis failed to process files");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error calling AI analysis APIs");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateThumbnail = async (fileId: number) => {
    if (!activeBatchId || !workspaceId) return;
    
    // Set status to generating
    setMediaList(prev => prev.map(m => m.id === fileId ? { ...m, thumbnailStatus: "generating" } : m));

    try {
      const res = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches/${activeBatchId}/generate-thumbnail`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({ fileId })
      });

      if (res.ok) {
        const data = await res.json();
        setMediaList(prev => prev.map(m => m.id === fileId ? { 
          ...m, 
          thumbnailUrl: data.thumbnailUrl,
          thumbnailStatus: "completed" 
        } : m));
        toast.success("Custom AI thumbnail cover generated!");
      } else {
        toast.error("Failed to generate AI thumbnail");
        setMediaList(prev => prev.map(m => m.id === fileId ? { ...m, thumbnailStatus: "failed" } : m));
      }
    } catch (err) {
      console.error(err);
      setMediaList(prev => prev.map(m => m.id === fileId ? { ...m, thumbnailStatus: "failed" } : m));
    }
  };

  const handleStartAutomation = async () => {
    if (!activeBatchId || !workspaceId) return toast.error("Please upload files first");
    if (selectedPlatforms.length === 0) return toast.error("Please select at least one social account");

    try {
      const res = await fetch(getApiUrl(`/api/workspaces/${workspaceId}/bulk-batches/${activeBatchId}/schedule`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({
          selectedPlatforms,
          strategy,
          settings: getStrategySettings()
        })
      });

      if (res.ok) {
        toast.success("Bulk scheduler running! Posts successfully sequenced in your Calendar.");
        setMediaList([]);
        setActiveBatchId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to schedule posts");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error setting scheduling strategy");
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload & AI Automation</h1>
        <p className="text-muted-foreground">Upload entire media folders, let AI write post descriptions and design covers, and queue them to your calendar instantly.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Control Panel */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>1. Select Platforms</CardTitle>
              <CardDescription>Accounts where content will publish</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts && accounts.length === 0 ? (
                <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md">
                  Please connect accounts under Social Accounts first.
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts?.map(acc => (
                    <div key={acc.id} className="flex items-center space-x-3 p-2 rounded hover:bg-secondary/40">
                      <input 
                        type="checkbox"
                        checked={selectedPlatforms.includes(acc.platform)}
                        onChange={() => togglePlatform(acc.platform)}
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm capitalize font-medium">{acc.platform} Channel ({acc.username})</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>2. Posting Strategy</CardTitle>
              <CardDescription>Determine your automation timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Scheduling Mode</Label>
                <select 
                  value={strategy}
                  onChange={e => setStrategy(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="immediate">Publish Immediately</option>
                  <option value="fixed">Fixed Date/Time Schedule</option>
                  <option value="slots">Time Slot Scheduling Pool</option>
                  <option value="interval">Custom Interval Posting</option>
                </select>
              </div>

              {strategy === "fixed" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Start Date</Label>
                    <input 
                      type="date" 
                      value={fixedDate} 
                      onChange={e => setFixedDate(e.target.value)}
                      className="flex h-9 w-full rounded border bg-transparent px-2 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Time</Label>
                    <input 
                      type="time" 
                      value={fixedTime} 
                      onChange={e => setFixedTime(e.target.value)}
                      className="flex h-9 w-full rounded border bg-transparent px-2 text-xs" 
                    />
                  </div>
                </div>
              )}

              {strategy === "interval" && (
                <div>
                  <Label className="text-[10px]">Interval Duration</Label>
                  <select 
                    value={intervalMinutes}
                    onChange={e => setIntervalMinutes(Number(e.target.value))}
                    className="flex h-9 w-full rounded border bg-transparent px-2 text-xs"
                  >
                    <option value="30">Every 30 Minutes</option>
                    <option value="60">Every 1 Hour</option>
                    <option value="120">Every 2 Hours</option>
                    <option value="360">Every 6 Hours</option>
                    <option value="720">Every 12 Hours</option>
                    <option value="1440">Every 24 Hours</option>
                  </select>
                </div>
              )}

              {strategy === "slots" && (
                <div className="space-y-2">
                  <Label className="text-[10px]">Configured Time Slots Pool</Label>
                  <div className="flex flex-wrap gap-1">
                    {timeSlots.map((s, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[11px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">
                        {s}
                        <Trash2 
                          className="w-3 h-3 cursor-pointer text-destructive/80 hover:text-destructive" 
                          onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== idx))}
                        />
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="time" 
                      value={newSlotTime} 
                      onChange={e => setNewSlotTime(e.target.value)}
                      className="flex h-8 rounded border bg-transparent px-2 text-xs" 
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (!timeSlots.includes(newSlotTime)) {
                          setTimeSlots([...timeSlots, newSlotTime].sort());
                        }
                      }}
                    >
                      Add Slot
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-4 flex items-center gap-2"
                onClick={handleStartAutomation}
                disabled={mediaList.length === 0 || isProcessing}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Automation Queue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Upload Workspace */}
        <div className="space-y-6 lg:col-span-2">
          {/* Upload Area */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border/60 hover:border-primary/50 bg-card/25 hover:bg-card/45 rounded-lg p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-primary/80 animate-bounce" />
            <div>
              <p className="font-semibold text-sm">Drag & Drop Images, Videos, or complete folders here</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, MP4, WEBP, MKV up to 50MB</p>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}>
                Browse Files
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}>
                Browse Folder
              </Button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))}
            />
            <input 
              type="file" 
              ref={folderInputRef} 
              // @ts-ignore
              webkitdirectory="" 
              directory="" 
              multiple 
              className="hidden" 
              onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))}
            />
          </div>

          {/* Files List / Workspace Controls */}
          {mediaList.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-card/40 p-4 border border-border/40 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm">Batch Queue: {mediaList.length} Files Uploaded</h3>
                  <p className="text-xs text-muted-foreground">Select AI content processor to automatically generate captions</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={runAiAnalysis}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {isProcessing ? "AI Modeling..." : "Generate AI Details"}
                </Button>
              </div>

              {/* Media Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {mediaList.map(m => (
                  <Card key={m.id} className="overflow-hidden bg-card/40 border-border/30 text-left flex flex-col">
                    {/* Media Preview Header */}
                    <div className="aspect-video bg-zinc-900 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {m.url ? (
                        m.type === "video" ? (
                          <video src={m.url} className="w-full h-full object-cover" controls />
                        ) : (
                          <img src={m.url} className="w-full h-full object-cover" alt="Uploaded Preview" />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-[10px] text-muted-foreground">Uploading: {m.progress || 0}%</span>
                        </div>
                      )}
                      
                      {/* Detected properties pill tags */}
                      {m.url && (
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <span className="text-[9px] bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full capitalize">
                            {m.type}
                          </span>
                          <span className="text-[9px] bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full uppercase">
                            {m.orientation}
                          </span>
                          {m.aspectRatio && (
                            <span className="text-[9px] bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full">
                              {m.aspectRatio}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-semibold text-xs truncate mb-1">{m.filename}</h4>
                        
                        {/* Status bar */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-border/30 pb-2 mb-2">
                          <span>Size: {(m.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          <span className={`capitalize font-semibold ${
                            m.status === "completed" ? "text-emerald-500" : m.status === "processing" ? "text-amber-500 animate-pulse" : "text-muted-foreground"
                          }`}>
                            AI Status: {m.status}
                          </span>
                        </div>

                        {/* Generated AI Content Textarea */}
                        {m.aiData && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-[9px] font-bold text-muted-foreground uppercase">AI Caption & Hashtags</Label>
                              <textarea
                                value={m.aiData.caption}
                                onChange={e => {
                                  const val = e.target.value;
                                  setMediaList(prev => prev.map(item => item.id === m.id ? {
                                    ...item,
                                    aiData: { ...item.aiData, caption: val }
                                  } : item));
                                }}
                                rows={3}
                                className="w-full text-xs bg-background/60 border border-input rounded p-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Video Thumbnail Section */}
                      {m.type === "video" && m.url && (
                        <div className="border-t border-border/30 pt-2 space-y-2">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Cover Thumbnail</Label>
                          {m.thumbnailUrl ? (
                            <div className="flex gap-2 items-center bg-zinc-900/50 p-1.5 rounded border border-border/30">
                              <img src={m.thumbnailUrl} className="w-12 h-8 object-cover rounded" alt="Thumbnail" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[9px] text-muted-foreground truncate">Approved AI Thumbnail</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-amber-500 hover:text-amber-600"
                                onClick={() => handleGenerateThumbnail(m.id)}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-[10px] h-7 flex items-center justify-center gap-1.5"
                              disabled={m.thumbnailStatus === "generating"}
                              onClick={() => handleGenerateThumbnail(m.id)}
                            >
                              {m.thumbnailStatus === "generating" ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin mr-1 text-primary" /> Designing Cover...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto Generate Cover
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
