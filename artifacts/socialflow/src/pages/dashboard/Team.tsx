import { useState } from "react";
import { useListTeamMembers, useListWorkspaces, useInviteTeamMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select-native";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function Team() {
  const { data: workspaces } = useListWorkspaces();
  const workspaceId = workspaces?.[0]?.id;
  
  const { data: teamMembers, isLoading, refetch } = useListTeamMembers(workspaceId!, {
    query: {
      queryKey: ["team-members", workspaceId],
      enabled: !!workspaceId
    }
  });

  const inviteMember = useInviteTeamMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    inviteMember.mutate({
      workspaceId: workspaceId!,
      data: { email, role: role as any }
    }, {
      onSuccess: () => {
        toast.success("Invite sent successfully");
        setEmail("");
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to send invite");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">Manage your team members and their roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end" onSubmit={handleInvite}>
            <div className="flex-1 space-y-2">
              <Label>Email Address</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" type="email" required />
            </div>
            <div className="w-48 space-y-2">
              <Label>Role</Label>
              <Select value={role} onChange={e => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : !teamMembers?.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">No team members found</TableCell></TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs">
                          {member.user?.name?.charAt(0) || member.inviteEmail?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.user?.name || 'Pending User'}</p>
                          <p className="text-xs text-muted-foreground">{member.user?.email || member.inviteEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm font-medium">{member.role}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Remove</Button>
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
