import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { useGenerateCaption, useGenerateHashtags, useGenerateAiImage } from "@workspace/api-client-react";

export function AiStudio() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  
  const generateCaption = useGenerateCaption();

  const handleGenerate = () => {
    if (!topic) return;
    setResult("Generating...");
    generateCaption.mutate({
      data: { topic, platform: "linkedin", tone: "professional" }
    }, {
      onSuccess: (data) => setResult(data.text),
      onError: () => setResult("Error generating content")
    });
  };

  return (
    <div className="space-y-8 h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Studio</h1>
        <p className="text-muted-foreground">Generate high-converting content using AI.</p>
      </div>

      <Tabs defaultValue="caption" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger value="caption" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Caption Generator</TabsTrigger>
          <TabsTrigger value="hashtags" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Hashtags</TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Image Generator</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 mt-6">
          <TabsContent value="caption" className="h-full mt-0">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              <Card className="h-full">
                <CardContent className="p-6 space-y-6 flex flex-col h-full">
                  <div>
                    <Label className="mb-2 block">What should the post be about?</Label>
                    <Textarea 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="E.g., We just launched our new social media analytics feature..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Platform</Label>
                      <Select>
                        <option>LinkedIn</option>
                        <option>Twitter</option>
                        <option>Instagram</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block">Tone</Label>
                      <Select>
                        <option>Professional</option>
                        <option>Engaging</option>
                        <option>Funny</option>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <Button className="w-full" onClick={handleGenerate} disabled={generateCaption.isPending}>
                      {generateCaption.isPending ? "Generating..." : "Generate Options"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full bg-secondary/30">
                <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="font-semibold mb-4">Results</h3>
                  <div className="flex-1 border border-border rounded-md bg-background p-4 whitespace-pre-wrap overflow-auto text-sm">
                    {result || "Your generated content will appear here..."}
                  </div>
                  {result && result !== "Generating..." && result !== "Error generating content" && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm">Copy to Clipboard</Button>
                      <Button size="sm">Use in Post</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="hashtags" className="mt-0">
            <div className="text-center text-muted-foreground py-12">Select a topic to generate relevant trending hashtags.</div>
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <div className="text-center text-muted-foreground py-12">Describe the image you want to generate.</div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
