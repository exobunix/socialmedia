import { useState, useRef, useEffect } from "react";
import { useListWorkspaces, useCreatePost, useListSocialAccounts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { X, Image as ImageIcon, Video, Film, Users } from "lucide-react";

interface UploadedMedia {
  id: number;
  url: string;
  filename: string;
  type: "image" | "video";
}

export function CreatePost() {
  const [, setLocation] = useLocation();
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  const createPost = useCreatePost();

  const { data: accounts } = useListSocialAccounts(workspaceId!, {
    query: { enabled: !!workspaceId }
  });

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("professional");
  const [status, setStatus] = useState("draft");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const connectedPlatforms = accounts ? accounts.map(a => a.platform) : [];

  useEffect(() => {
    if (connectedPlatforms.length > 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms([connectedPlatforms[0]]);
    }
  }, [accounts]);

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      } else {
        toast.error("At least one platform must be selected");
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFileWithProgress = (
    url: string,
    payload: any,
    onProgress: (percent: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("socialflow_auth_token")}`);
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || "Upload failed"));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new Error("Network error"));
      });
      
      xhr.send(JSON.stringify(payload));
    });
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        let base64Data = reader.result as string;
        const type = file.type.startsWith("video/") ? "video" : "image";

        if (type === "image") {
          base64Data = await compressImage(base64Data);
        }

        // Register upload metadata and data URL on backend
        const mediaFile = await uploadFileWithProgress(
          getApiUrl(`/api/workspaces/${workspaceId}/media`),
          {
            url: base64Data,
            type,
            filename: file.name,
            sizeBytes: file.size,
            mimeType: file.type
          },
          (percent) => {
            setUploadProgress(percent);
          }
        );

        setMediaList(prev => [...prev, {
          id: mediaFile.id,
          url: mediaFile.url,
          filename: mediaFile.filename,
          type: mediaFile.type
        }]);

        toast.success(`${file.name} uploaded successfully!`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const removeMedia = async (mediaId: number) => {
    try {
      setMediaList(prev => prev.filter(m => m.id !== mediaId));
      await fetch(getApiUrl(`/api/workspaces/${workspaceId}/media/${mediaId}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      toast.success("File deleted successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = () => {
    if (!content) return toast.error("Content is required");
    
    createPost.mutate({
      workspaceId: workspaceId!,
      data: {
        content,
        platforms: selectedPlatforms,
        status: status as any,
        tone: tone as any,
        mediaUrls: mediaList.map(m => m.url),
        hashtags: []
      }
    }, {
      onSuccess: () => {
        toast.success("Post created successfully!");
        setLocation("/posts");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
        <p className="text-muted-foreground">Draft or schedule a new post.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Post Content</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs">AI Rewrite</Button>
                </div>
                <Textarea 
                  className="min-h-[200px] text-base resize-none" 
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Media Attachments</Label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,video/*"
                />
                
                <div 
                  onClick={handleUploadClick}
                  className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <div className="w-full max-w-xs space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center text-sm font-semibold text-primary">
                        <span>Uploading file...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Click to upload images or videos</span>
                    </>
                  )}
                </div>

                {mediaList.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {mediaList.map(media => (
                      <div key={media.id} className="relative aspect-video rounded-lg border border-border overflow-hidden bg-card group">
                        {media.type === "image" ? (
                          <img src={media.url} alt={media.filename} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950">
                            <Film className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <button 
                          onClick={() => removeMedia(media.id)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black p-1 rounded-full text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-0.5 text-[9px] truncate text-white">
                          {media.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="mb-2 block">Platforms</Label>
                {connectedPlatforms.length === 0 ? (
                  <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md">
                    No connected accounts found. Please connect your YouTube Channel or other accounts first in the <strong>Social Accounts</strong> tab.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts?.map(acc => {
                      const platformNames: Record<string, string> = {
                        x: "X (Twitter)",
                        facebook: "Facebook Page",
                        instagram: "Instagram Business",
                        linkedin: "LinkedIn Company",
                        youtube: "YouTube Channel",
                        tiktok: "TikTok Business"
                      };
                      const name = platformNames[acc.platform] || acc.platform;
                      const isSelected = selectedPlatforms.includes(acc.platform);
                      
                      return (
                        <div 
                          key={acc.id}
                          onClick={() => togglePlatform(acc.platform)}
                          className={`px-3 py-1.5 border rounded-md text-xs cursor-pointer select-none transition-all ${
                            isSelected 
                              ? "bg-primary/10 text-primary border-primary/20 font-bold" 
                              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                          }`}
                        >
                          {name}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Real-time YouTube upload preview */}
                {selectedPlatforms.includes("youtube") && (
                  <div className="mt-4 border border-border rounded-lg bg-card overflow-hidden text-left">
                    <div className="px-3 py-1.5 border-b border-border bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      YouTube Upload Preview
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="aspect-video w-full rounded bg-slate-900 flex items-center justify-center relative overflow-hidden">
                        {mediaList.length > 0 ? (
                          mediaList[0].type === "video" ? (
                            <video src={mediaList[0].url} className="w-full h-full object-cover" controls />
                          ) : (
                            <img src={mediaList[0].url} className="w-full h-full object-cover" alt="Preview" />
                          )
                        ) : (
                          <div className="text-center text-muted-foreground flex flex-col items-center gap-1.5">
                            <Video className="w-8 h-8 text-primary animate-pulse" />
                            <span className="text-[10px]">No video attached yet</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {accounts?.find(a => a.platform === "youtube")?.profileImageUrl ? (
                            <img 
                              src={accounts.find(a => a.platform === "youtube")!.profileImageUrl!} 
                              alt="Avatar" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          <h4 className="font-semibold text-xs line-clamp-2 text-foreground">
                            {content.substring(0, 100) || "Video Title (first 100 characters of post content...)"}
                          </h4>
                          <div className="text-[10px] text-muted-foreground flex flex-col">
                            <span className="font-medium text-foreground/80">
                              {accounts?.find(a => a.platform === "youtube") ? `@${accounts.find(a => a.platform === "youtube")!.username}` : "@Channel"}
                            </span>
                            <span className="line-clamp-2 mt-1 leading-normal text-muted-foreground/90">
                              {content || "Description goes here..."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Tone</Label>
                <Select value={tone} onChange={e => setTone(e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                  <option value="marketing">Marketing</option>
                  <option value="corporate">Corporate</option>
                  <option value="friendly">Friendly</option>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Status</Label>
                <Select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="published">Publish Now</option>
                  <option value="draft">Save as Draft</option>
                  <option value="scheduled">Schedule for later</option>
                </Select>
              </div>

              {status === "scheduled" && (
                <div>
                  <Label className="mb-2 block">Schedule Time</Label>
                  <input type="datetime-local" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              )}

              <Button className="w-full mt-4" onClick={handleSubmit} disabled={createPost.isPending}>
                {createPost.isPending ? "Saving..." : status === 'published' ? "Publish Now" : status === 'draft' ? "Save Draft" : "Schedule Post"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
