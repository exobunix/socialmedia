import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { toast } from "sonner";
import { 
  useGenerateCaption, 
  useGenerateHashtags, 
  useGenerateAiImage 
} from "@workspace/api-client-react";
import { 
  Sparkles, 
  Copy, 
  ImageIcon, 
  Hash, 
  Layers, 
  Loader2, 
  CheckSquare, 
  Square 
} from "lucide-react";

export function AiStudio() {
  // Caption Generator State
  const [captionTopic, setCaptionTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "x"]);
  const [tone, setTone] = useState("professional");
  const [captionResults, setCaptionResults] = useState<Record<string, string>>({});
  const [captionLoading, setCaptionLoading] = useState(false);

  const generateCaption = useGenerateCaption();

  // Hashtags Generator State
  const [hashtagTopic, setHashtagTopic] = useState("");
  const [hashtagPlatform, setHashtagPlatform] = useState("linkedin");
  const [hashtagResult, setHashtagResult] = useState("");
  const [hashtagLoading, setHashtagLoading] = useState(false);

  const generateHashtags = useGenerateHashtags();

  // Image Generator State
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imageStyle, setImageStyle] = useState("realistic");
  const [imageLoading, setImageLoading] = useState(false);

  const generateAiImage = useGenerateAiImage();

  const platformsList = [
    { id: "linkedin", label: "LinkedIn" },
    { id: "x", label: "X (Twitter)" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" }
  ];

  // 1. Caption generation handler
  const handleGenerateCaptions = async () => {
    if (!captionTopic) return toast.error("Please enter what the post should be about");
    if (selectedPlatforms.length === 0) return toast.error("Please select at least one platform");
    
    setCaptionLoading(true);
    setCaptionResults({});

    try {
      const results: Record<string, string> = {};
      // Generate for all selected platforms
      for (const platform of selectedPlatforms) {
        const res = await generateCaption.mutateAsync({
          data: { topic: captionTopic, platform, tone: tone as any }
        });
        results[platform] = res.text;
      }
      setCaptionResults(results);
      toast.success("AI captions generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate captions");
    } finally {
      setCaptionLoading(false);
    }
  };

  // 2. Hashtags generation handler
  const handleGenerateHashtags = () => {
    if (!hashtagTopic) return toast.error("Please enter a topic to extract hashtags");
    
    setHashtagLoading(true);
    setHashtagResult("");

    generateHashtags.mutate({
      data: { topic: hashtagTopic, platform: hashtagPlatform, count: 15 }
    }, {
      onSuccess: (data) => {
        setHashtagResult(data.hashtags.join(" "));
        toast.success("Hashtags generated successfully!");
      },
      onError: () => {
        toast.error("Failed to generate hashtags");
      },
      onSettled: () => setHashtagLoading(false)
    });
  };

  // 3. Image generation handler
  const handleGenerateImage = () => {
    if (!imagePrompt) return toast.error("Please describe the image you want to generate");
    
    setImageLoading(true);
    setGeneratedImageUrl("");

    generateAiImage.mutate({
      data: { prompt: imagePrompt, style: imageStyle as any }
    }, {
      onSuccess: (data) => {
        setGeneratedImageUrl(data.imageUrl);
        toast.success("Image generated successfully!");
      },
      onError: () => {
        toast.error("Failed to generate AI image");
      },
      onSettled: () => setImageLoading(false)
    });
  };

  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === platformsList.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(platformsList.map(p => p.id));
    }
  };

  const handleTogglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 text-left flex flex-col min-h-[calc(100vh-12rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Studio</h1>
        <p className="text-muted-foreground">Generate high-converting copy, hashtags, and visual assets using state-of-the-art AI.</p>
      </div>

      <Tabs defaultValue="caption" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger value="caption" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Caption Generator
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" /> Hashtags
          </TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-500" /> Image Generator
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 mt-6">
          {/* TAB 1: CAPTIONS */}
          <TabsContent value="caption" className="h-full mt-0">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              <Card className="h-full bg-card/50 border-border/40">
                <CardContent className="p-6 space-y-6 flex flex-col h-full">
                  <div>
                    <Label className="mb-2 block font-semibold text-sm">What should the post be about?</Label>
                    <Textarea 
                      value={captionTopic}
                      onChange={(e) => setCaptionTopic(e.target.value)}
                      placeholder="E.g., Announcing our new AI content generation tool that automates writing descriptions for LinkedIn and YouTube..."
                      className="min-h-[150px] bg-background/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-xs">Select Platforms</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={handleSelectAllPlatforms}
                      >
                        {selectedPlatforms.length === platformsList.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {platformsList.map(p => {
                        const isSelected = selectedPlatforms.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleTogglePlatform(p.id)}
                            className={`px-3 py-1.5 border rounded-md text-xs cursor-pointer select-none transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary/10 text-primary border-primary/20 font-bold"
                                : "bg-secondary/40 text-secondary-foreground border-border hover:bg-secondary/80"
                            }`}
                          >
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {p.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block font-semibold text-xs">Tone of Voice</Label>
                    <Select value={tone} onChange={e => setTone(e.target.value)}>
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly / Conversational</option>
                      <option value="funny">Humorous / Funny</option>
                      <option value="marketing">Marketing Copy (with CTA)</option>
                      <option value="corporate">Corporate / Formal</option>
                    </Select>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={handleGenerateCaptions} disabled={captionLoading}>
                      {captionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating for {selectedPlatforms.length} platforms...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" /> Generate Platforms Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full bg-secondary/20 border-border/30">
                <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" /> Generated Results
                  </h3>
                  <div className="flex-1 border border-border/40 rounded-md bg-background/55 p-4 overflow-y-auto space-y-4 max-h-[400px]">
                    {Object.keys(captionResults).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-12">
                        {captionLoading ? "AI is crafting your platform copies..." : "Configure platforms and topic to view generated AI results."}
                      </p>
                    ) : (
                      Object.keys(captionResults).map((plat) => (
                        <div key={plat} className="border-b border-border/20 pb-4 mb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-primary tracking-wider">{plat} Edition</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] flex items-center gap-1"
                              onClick={() => copyToClipboard(captionResults[plat])}
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </Button>
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 border border-border/30 p-3 rounded-md whitespace-pre-wrap">
                            {captionResults[plat]}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: HASHTAGS */}
          <TabsContent value="hashtags" className="h-full mt-0">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-6 space-y-6 flex flex-col h-full">
                  <div>
                    <Label className="mb-2 block font-semibold text-sm">What topic or keywords do you want hashtags for?</Label>
                    <Textarea 
                      value={hashtagTopic}
                      onChange={(e) => setTopic(hashtagTopic)} // Keep local sync
                      onInput={(e: any) => setHashtagTopic(e.target.value)}
                      placeholder="E.g., React Hooks, SaaS Product Launch, Web Development..."
                      className="min-h-[150px] bg-background/50"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block font-semibold text-xs">Target Platform</Label>
                    <Select value={hashtagPlatform} onChange={e => setHashtagPlatform(e.target.value)}>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="x">X (Twitter)</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                    </Select>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={handleGenerateHashtags} disabled={hashtagLoading}>
                      {hashtagLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Mining hashtags...
                        </>
                      ) : (
                        <>
                          <Hash className="w-4 h-4 text-primary" /> Extract Trending Hashtags
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-border/30">
                <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-primary" /> Trending Hashtags
                  </h3>
                  <div className="flex-1 border border-border/40 rounded-md bg-background/55 p-4 overflow-y-auto min-h-[150px] flex items-center justify-center">
                    {hashtagResult ? (
                      <div className="text-center space-y-4">
                        <p className="text-sm font-semibold tracking-wide text-primary whitespace-pre-wrap break-words px-4">
                          {hashtagResult}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mx-auto flex items-center gap-1"
                          onClick={() => copyToClipboard(hashtagResult)}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Hashtags
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">
                        {hashtagLoading ? "Generating hashtags..." : "Generated tags will appear here."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: IMAGE GENERATOR */}
          <TabsContent value="image" className="h-full mt-0">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-6 space-y-6 flex flex-col h-full">
                  <div>
                    <Label className="mb-2 block font-semibold text-sm">Describe the image you want to generate</Label>
                    <Textarea 
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="E.g., A modern high-tech office desk with neon lights, 3D style illustration, professional lighting, social media friendly..."
                      className="min-h-[150px] bg-background/50"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block font-semibold text-xs text-muted-foreground">Visual Style</Label>
                    <Select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
                      <option value="realistic">Realistic</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="artistic">Artistic</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="branded">Branded</option>
                    </Select>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={handleGenerateImage} disabled={imageLoading}>
                      {imageLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Painting canvas...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 text-emerald-500" /> Generate AI Image Asset
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/20 border-border/30">
                <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" /> Visual Preview
                  </h3>
                  <div className="flex-1 border border-border/40 rounded-md bg-background/55 p-4 overflow-hidden flex items-center justify-center min-h-[300px]">
                    {generatedImageUrl ? (
                      <div className="text-center space-y-4 w-full h-full flex flex-col items-center justify-between">
                        <img 
                          src={generatedImageUrl} 
                          className="max-h-[250px] object-contain rounded-md border" 
                          alt="AI Output" 
                        />
                        <div className="flex gap-2">
                          <a href={generatedImageUrl} target="_blank" rel="noreferrer" download>
                            <Button size="sm" variant="outline">Open Image</Button>
                          </a>
                          <Button size="sm" onClick={() => copyToClipboard(generatedImageUrl)}>Copy URL</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
                        {imageLoading ? (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs">Generating image with AI model...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                            <span className="text-xs">AI Image will render here.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
