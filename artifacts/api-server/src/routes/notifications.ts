import { Router, type IRouter } from "express";
import { notificationsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const notifications = await notificationsTable.find({ userId: req.userId! }).sort({ createdAt: 1 });
  res.json(notifications);
});

router.patch("/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const notification = await notificationsTable.findOneAndUpdate(
    { id: params.data.id, userId: req.userId! },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(notification);
});

router.patch("/notifications/read-all", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  await notificationsTable.updateMany(
    { userId: req.userId! },
    { $set: { isRead: true } }
  );
  res.json({ message: "All notifications marked as read" });
});

export default router;
