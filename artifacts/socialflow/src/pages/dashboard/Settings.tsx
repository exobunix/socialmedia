import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function Settings() {
  const { data: user } = useGetMe();
  const updateMe = useUpdateMe();
  
  const [name, setName] = useState("");
  
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleSave = () => {
    updateMe.mutate({
      data: { name }
    }, {
      onSuccess: () => toast.success("Profile updated successfully")
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your personal profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <Button variant="outline" size="sm">Change Avatar</Button>
          </div>
          
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
            </div>
          </div>
          
          <Button onClick={handleSave} disabled={updateMe.isPending}>
            {updateMe.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" />
          </div>
          <Button variant="secondary">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
