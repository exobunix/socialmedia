import { useListMedia, useListWorkspaces } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, FileVideo, MoreVertical, Trash, Eye } from "lucide-react";

export function MediaLibrary() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: media, isLoading } = useListMedia(workspaceId!, {
    query: { enabled: !!workspaceId }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your images and videos.</p>
        </div>
        <Button className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          Upload Media
        </Button>
      </div>

      <div className="flex gap-2 pb-4 border-b border-border">
        <Button variant="secondary" size="sm" className="bg-primary/20 text-primary border-primary/20">All Files</Button>
        <Button variant="ghost" size="sm">Images</Button>
        <Button variant="ghost" size="sm">Videos</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !media?.length ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">No media files yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">Upload images and videos to use in your social media posts. Supported formats: JPG, PNG, MP4.</p>
          <Button variant="outline">Browse Files</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map(file => (
            <Card key={file.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {file.type === 'video' ? (
                  <FileVideo className="w-12 h-12 text-muted-foreground/50" />
                ) : (
                  <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="w-8 h-8"><Eye className="w-4 h-4" /></Button>
                  <Button size="icon" variant="destructive" className="w-8 h-8"><Trash className="w-4 h-4" /></Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium truncate">{file.filename}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{file.type} • {(file.sizeBytes || 0) / 1024 / 1024}MB</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
