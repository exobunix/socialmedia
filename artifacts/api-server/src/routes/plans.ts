import { Router, type IRouter } from "express";
import { plansTable, subscriptionsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { CreateSubscriptionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/plans", async (_req, res): Promise<void> => {
  const plans = await plansTable.find({ isActive: true });
  res.json(plans);
});

router.get("/subscriptions/current", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const subscription = await subscriptionsTable.findOne({ userId: req.userId! }).lean() as any;
  if (!subscription) {
    res.status(404).json({ error: "No active subscription" });
    return;
  }
  const plan = await plansTable.findOne({ id: subscription.planId }).lean() as any;
  res.json({ ...subscription, plan });
});

router.post("/subscriptions", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Cancel existing subscriptions
  await subscriptionsTable.updateMany(
    { userId: req.userId! },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );
  const subDoc = await subscriptionsTable.create({
    userId: req.userId!,
    planId: parsed.data.planId,
    status: "active",
  });
  const sub = subDoc.toJSON() as any;
  const plan = await plansTable.findOne({ id: sub.planId }).lean() as any;
  res.status(201).json({ ...sub, plan });
});

router.post("/subscriptions/cancel", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  await subscriptionsTable.updateMany(
    { userId: req.userId! },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );
  res.json({ message: "Subscription cancelled" });
});

export default router;
