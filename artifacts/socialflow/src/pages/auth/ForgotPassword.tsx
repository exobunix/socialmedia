import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@workspace/api-client-react";
import { toast } from "sonner";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success("Reset link sent to your email.");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to send reset link");
        }
      }
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Back to login
            </Link>
          </p>
        </div>
        
        <div className="bg-card border border-border shadow-sm rounded-xl p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold">Check your email</h3>
              <p className="text-muted-foreground text-sm">We've sent a password reset link to {email}.</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending ? "Sending link..." : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
