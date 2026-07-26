import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterUser } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";
import { toast } from "sonner";

export function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegisterUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password } },
      {
        onSuccess: (data) => {
          setAuthToken(data.token);
          toast.success("Account created successfully!");
          setLocation("/dashboard");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to register");
        }
      }
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
        
        <div className="bg-card border border-border shadow-sm rounded-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? "Creating account..." : "Start Free Trial"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
