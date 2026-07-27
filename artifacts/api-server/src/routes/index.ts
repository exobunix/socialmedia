import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import workspacesRouter from "./workspaces";
import socialAccountsRouter from "./social-accounts";
import postsRouter from "./posts";
import mediaRouter from "./media";
import analyticsRouter from "./analytics";
import plansRouter from "./plans";
import teamRouter from "./team";
import notificationsRouter from "./notifications";
import aiRouter from "./ai";
import adminRouter from "./admin";
import oauthRouter from "./oauth";
import bulkAutomationRouter from "./bulk-automation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(workspacesRouter);
router.use(socialAccountsRouter);
router.use(postsRouter);
router.use(mediaRouter);
router.use(analyticsRouter);
router.use(plansRouter);
router.use(teamRouter);
router.use(notificationsRouter);
router.use(aiRouter);
router.use(adminRouter);
router.use(oauthRouter);
router.use(bulkAutomationRouter);

export default router;
