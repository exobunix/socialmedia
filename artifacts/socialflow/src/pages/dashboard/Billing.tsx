import { useGetCurrentSubscription, useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Billing() {
  const { data: subscription, isLoading: subLoading } = useGetCurrentSubscription();
  const { data: plans, isLoading: plansLoading } = useListPlans();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl mb-1">Current Plan: {subscription?.plan?.name || "Free"}</CardTitle>
              <p className="text-sm text-muted-foreground">Your next billing date is Oct 1, 2024</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
            <div>
              <p className="text-sm font-medium mb-1">Social Accounts</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">3</span>
                <span className="text-sm text-muted-foreground mb-1">/ 5 used</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Scheduled Posts</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">42</span>
                <span className="text-sm text-muted-foreground mb-1">/ 100 used</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">AI Credits</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">18</span>
                <span className="text-sm text-muted-foreground mb-1">/ 50 used</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-background/50 border-t border-border/50 p-4">
          <Button variant="outline" className="mr-2 border-primary/30 hover:bg-primary/10 text-primary">Manage Billing</Button>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-bold mt-12 mb-6">Available Plans</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {plansLoading ? <div>Loading plans...</div> : plans?.filter(p => p.isActive).map(plan => (
          <Card key={plan.id} className={plan.id === subscription?.planId ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold mt-2">
                ₹{plan.priceMonthly}<span className="text-base font-normal text-muted-foreground">/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center text-sm text-muted-foreground">
                    <span className="text-primary mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={plan.id === subscription?.planId ? "outline" : "default"} 
                className="w-full"
                disabled={plan.id === subscription?.planId}
              >
                {plan.id === subscription?.planId ? "Current Plan" : "Upgrade"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
