import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Shield, Eye, ShieldAlert, CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);

  const getApiUrl = (urlPath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl.replace(/\/+$/, "")}${urlPath}`;
  };

  // Fetch users list
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["adminUsersList"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/admin/users?limit=100"), {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Fetch user activity details
  const { data: userActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ["adminUserActivity", selectedUser?.id],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/admin/users/${selectedUser.id}/activity`), {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    enabled: !!selectedUser
  });

  // Mutation to toggle suspension or update user details
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, status, role }: { id: number; status?: string; role?: string }) => {
      const res = await fetch(getApiUrl(`/api/admin/users/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        },
        body: JSON.stringify({ status, role })
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsersList"] });
      alert("User updated successfully!");
    }
  });

  // Impersonate mutation
  const impersonateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(getApiUrl(`/api/admin/users/${id}/impersonate`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("socialflow_auth_token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to impersonate");
      return res.json();
    },
    onSuccess: (data) => {
      // Store token and redirect
      localStorage.setItem("socialflow_auth_token", data.token);
      alert(`Logging in as ${data.user.name}...`);
      window.location.href = "/dashboard";
    }
  });

  const filteredUsers = usersData?.users?.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedUser(null)} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Users List
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{selectedUser.name}</h1>
            <p className="text-muted-foreground">{selectedUser.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => impersonateMutation.mutate(selectedUser.id)}
              disabled={impersonateMutation.isPending}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Impersonate User
            </Button>
            <Button
              variant={selectedUser.status === "active" ? "destructive" : "default"}
              onClick={() => {
                const nextStatus = selectedUser.status === "active" ? "suspended" : "active";
                updateUserMutation.mutate(
                  { id: selectedUser.id, status: nextStatus },
                  { onSuccess: (updatedUser) => setSelectedUser(updatedUser) }
                );
              }}
            >
              {selectedUser.status === "active" ? "Suspend Account" : "Activate Account"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const nextRole = selectedUser.role === "admin" ? "user" : "admin";
                updateUserMutation.mutate(
                  { id: selectedUser.id, role: nextRole },
                  { onSuccess: (updatedUser) => setSelectedUser(updatedUser) }
                );
              }}
            >
              Toggle Admin Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Social Channels</CardTitle>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="text-sm py-4">Loading accounts...</div>
              ) : !userActivity?.accounts?.length ? (
                <div className="text-sm text-muted-foreground py-4">No social profiles connected.</div>
              ) : (
                <div className="space-y-3">
                  {userActivity.accounts.map((acc: any) => (
                    <div key={acc.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize text-sm">{acc.platform}</span>
                        <span className="text-xs text-muted-foreground">({acc.username})</span>
                      </div>
                      <Badge variant="outline">Connected</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity & System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="text-sm py-4">Loading audit logs...</div>
              ) : !userActivity?.auditLogs?.length ? (
                <div className="text-sm text-muted-foreground py-4">No logged audit actions found.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {userActivity.auditLogs.map((log: any) => (
                    <div key={log.id} className="text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between font-semibold">
                        <span className="text-primary">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">IP: {log.ipAddress || "local"} | Agent: {log.userAgent || "system"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage roles, review activity, and perform admin actions.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh list">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No matching users found.</TableCell></TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-secondary-foreground">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'} className="flex items-center gap-1 w-fit">
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'success' : 'destructive'} className="flex items-center gap-1 w-fit">
                        {user.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)} className="flex items-center gap-1 ml-auto">
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Button>
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
