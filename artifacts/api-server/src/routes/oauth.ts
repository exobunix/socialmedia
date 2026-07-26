import { Router, type IRouter } from "express";
import { platformConfigsTable, socialAccountsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { signToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

// 1. GET /api/oauth/connect/youtube - Generates Google OAuth redirect URL
router.get("/oauth/connect/youtube", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = Number(req.query.workspaceId);
  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required as a query parameter." });
    return;
  }

  // Retrieve dynamic YouTube OAuth config from database
  const config = await platformConfigsTable.findOne({ platform: "youtube", isEnabled: true });
  if (!config || !config.clientId || !config.redirectUri) {
    res.status(400).json({ error: "YouTube integration is not configured or enabled by the admin." });
    return;
  }

  // Create secure state token to pass workspaceId and userId through the redirect flow
  const state = signToken({ userId: req.userId!, role: "youtube-connect" });
  
  // Scopes for YouTube Upload and profile fetch
  const scopes = config.scopes || "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";
  
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.append("client_id", config.clientId);
  googleAuthUrl.searchParams.append("redirect_uri", config.redirectUri);
  googleAuthUrl.searchParams.append("response_type", "code");
  googleAuthUrl.searchParams.append("scope", scopes);
  googleAuthUrl.searchParams.append("access_type", "offline"); // Crucial to receive a refresh token for scheduling
  googleAuthUrl.searchParams.append("prompt", "select_account consent");
  googleAuthUrl.searchParams.append("state", JSON.stringify({ stateToken: state, workspaceId }));

  res.json({ url: googleAuthUrl.toString() });
});

// 2. GET /auth/google/callback - Google Callback URL
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const { code, state: stateStr } = req.query;

  if (!code || !stateStr) {
    res.status(400).send("Authorization code or state is missing.");
    return;
  }

  try {
    const { stateToken, workspaceId } = JSON.parse(stateStr as string);
    const decoded = verifyToken(stateToken);
    
    if (decoded.role !== "youtube-connect") {
      res.status(400).send("Invalid OAuth state token.");
      return;
    }

    // Retrieve YouTube config
    const config = await platformConfigsTable.findOne({ platform: "youtube", isEnabled: true });
    if (!config || !config.clientId || !config.clientSecret || !config.redirectUri) {
      res.status(400).send("YouTube integration settings not found in database.");
      return;
    }

    // Exchange authorization code for access and refresh tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) {
      res.status(400).send(`Google Token Exchange Error: ${tokenData.error_description || tokenData.error}`);
      return;
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // Received on first consent

    // Fetch YouTube channel details
    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const channelData = await channelRes.json() as any;

    if (!channelData.items || channelData.items.length === 0) {
      res.status(400).send("No YouTube Channel found for this Google account.");
      return;
    }

    const channel = channelData.items[0];
    const platformUserId = channel.id;
    const displayName = channel.snippet.title;
    const username = channel.snippet.customUrl || displayName;
    const profileImageUrl = channel.snippet.thumbnails?.default?.url || "";
    const subscribers = Number(channel.statistics?.subscriberCount ?? 0);

    // Save account to MongoDB
    await socialAccountsTable.findOneAndUpdate(
      { platform: "youtube", platformUserId, workspaceId },
      {
        $set: {
          username,
          displayName,
          profileImageUrl,
          accessToken,
          ...(refreshToken ? { refreshToken } : {}), // Keep existing if not returned by Google
          followersCount: subscribers
        }
      },
      { upsert: true, new: true }
    );

    // Redirect user back to frontend accounts page
    res.redirect("http://localhost:3000/accounts?success=youtube");
  } catch (error: any) {
    console.error("YouTube OAuth Error:", error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

export default router;
