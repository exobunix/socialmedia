import { useListAdminPlans } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AdminPlans() {
  const { data: plans, isLoading } = useListAdminPlans();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Configure pricing tiers and feature limits.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : !plans?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No plans found</TableCell></TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{plan.description}</div>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{plan.priceMonthly}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>{plan.maxSocialAccounts} accounts</li>
                        <li>{plan.maxScheduledPosts} posts</li>
                      </ul>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
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
