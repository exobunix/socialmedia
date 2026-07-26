import { useState, useRef } from "react";
import { useListWorkspaces, useCreatePost } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { X, Image as ImageIcon, Video, Film } from "lucide-react";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("professional");
  const [status, setStatus] = useState("draft");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["x"]);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const type = file.type.startsWith("video/") ? "video" : "image";

        // Register upload metadata and data URL on backend
        const res = await fetch(`/api/workspaces/${workspaceId}/media`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
          },
          body: JSON.stringify({
            url: base64Data,
            type,
            filename: file.name,
            sizeBytes: file.size,
            mimeType: file.type
          })
        });

        if (!res.ok) throw new Error("Failed to register media file");
        const mediaFile = await res.json();

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

  const removeMedia = (mediaId: number) => {
    setMediaList(prev => prev.filter(m => m.id !== mediaId));
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
                    <span className="text-sm font-semibold animate-pulse text-primary">Uploading your file...</span>
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
                <div className="flex flex-wrap gap-2">
                  <div 
                    onClick={() => togglePlatform("x")}
                    className={`px-3 py-1.5 border rounded-md text-sm cursor-pointer select-none transition-all ${
                      selectedPlatforms.includes("x") 
                        ? "bg-primary/10 text-primary border-primary/20 font-bold" 
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    X (Twitter)
                  </div>
                  <div 
                    onClick={() => togglePlatform("linkedin")}
                    className={`px-3 py-1.5 border rounded-md text-sm cursor-pointer select-none transition-all ${
                      selectedPlatforms.includes("linkedin") 
                        ? "bg-primary/10 text-primary border-primary/20 font-bold" 
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    LinkedIn
                  </div>
                  <div 
                    onClick={() => togglePlatform("youtube")}
                    className={`px-3 py-1.5 border rounded-md text-sm cursor-pointer select-none transition-all ${
                      selectedPlatforms.includes("youtube") 
                        ? "bg-primary/10 text-primary border-primary/20 font-bold" 
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    YouTube
                  </div>
                </div>
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
