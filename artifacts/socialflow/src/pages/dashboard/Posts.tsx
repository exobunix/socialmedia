import { useListPosts, useListWorkspaces } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";

export function Posts() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: postsData, isLoading } = useListPosts(workspaceId!, {
    query: { enabled: !!workspaceId }
  });

  const handlePublishNow = async (postId: number) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/posts/${postId}/publish`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (res.ok) {
        toast.success("Post published successfully!");
        window.location.reload();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to publish post");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish post");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Manage your published and scheduled content.</p>
        </div>
        <Link href="/create">
          <Button>Create Post</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Content</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : !postsData?.posts?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No posts found</TableCell></TableRow>
              ) : (
                postsData.posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <p className="line-clamp-2 text-sm">{post.content}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.platforms.map(p => (
                          <span key={p} className="text-xs bg-secondary px-1.5 py-0.5 rounded capitalize">{p}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'success' : post.status === 'failed' ? 'destructive' : post.status === 'scheduled' ? 'warning' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.scheduledAt || post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status !== "published" && (
                          <Button 
                            onClick={() => handlePublishNow(post.id)}
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10"
                          >
                            Publish Now
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8">Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
