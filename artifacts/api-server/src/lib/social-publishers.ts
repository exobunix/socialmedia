import { postsTable, socialAccountsTable, platformConfigsTable } from "@workspace/db";

// Helper to refresh Google/YouTube OAuth tokens
async function refreshYouTubeToken(socialAccount: any): Promise<string> {
  const config = await platformConfigsTable.findOne({ platform: "youtube" });
  if (!config || !config.clientId || !config.clientSecret) {
    throw new Error("YouTube integration Client ID/Secret not configured by admin.");
  }

  console.log("Refreshing YouTube OAuth Access Token...");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: socialAccount.refreshToken,
      grant_type: "refresh_token"
    })
  });

  const data = await res.json() as any;
  if (data.error) {
    throw new Error(`Google Token Refresh Error: ${data.error_description || data.error}`);
  }

  // Update in DB
  await socialAccountsTable.updateOne(
    { id: socialAccount.id },
    { $set: { accessToken: data.access_token } }
  );

  return data.access_token;
}

// Main function to publish a post to YouTube
export async function publishPostToYouTube(postId: number, workspaceId: number): Promise<void> {
  const post = await postsTable.findOne({ id: postId, workspaceId }) as any;
  if (!post) throw new Error("Post not found");

  // Find connected YouTube account
  const youtubeAccount = await socialAccountsTable.findOne({ platform: "youtube", workspaceId });
  if (!youtubeAccount) {
    await postsTable.updateOne({ id: postId }, { $set: { status: "failed" } });
    throw new Error("No connected YouTube account found for this workspace.");
  }

  let accessToken = youtubeAccount.accessToken;

  // Verify and parse video attachment
  if (!post.mediaUrls || post.mediaUrls.length === 0) {
    await postsTable.updateOne({ id: postId }, { $set: { status: "failed" } });
    throw new Error("YouTube requires a video attachment to publish a post.");
  }

  const mediaUrl = post.mediaUrls[0];
  if (!mediaUrl.startsWith("data:video/")) {
    await postsTable.updateOne({ id: postId }, { $set: { status: "failed" } });
    throw new Error("YouTube only supports video file uploads. Please attach a video.");
  }

  try {
    // Extract base64 and mime type
    const matches = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid video data format.");
    const mimeType = matches[1];
    const base64Data = matches[2];
    const videoBuffer = Buffer.from(base64Data, "base64");

    const uploadVideo = async (token: string): Promise<any> => {
      const boundary = "314159265358979323846";
      const metadata = {
        snippet: {
          title: post.content.substring(0, 100) || "Video from SocialFlow",
          description: post.content || "Uploaded via SocialFlow Auto Poster"
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false
        }
      };

      const helperString = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: ${mimeType}\r\n` +
        `Content-Transfer-Encoding: binary\r\n\r\n`;

      const endString = `\r\n--${boundary}--`;
      
      const payload = Buffer.concat([
        Buffer.from(helperString, "utf8"),
        videoBuffer,
        Buffer.from(endString, "utf8")
      ]);

      const res = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": payload.length.toString()
        },
        body: payload
      });

      if (res.status === 401) {
        return { error: "unauthorized" };
      }

      const resData = await res.json() as any;
      if (resData.error) {
        throw new Error(resData.error.message || "Failed to upload video to YouTube");
      }

      return resData;
    };

    let result = await uploadVideo(accessToken);

    // If unauthorized, refresh token and try once more
    if (result.error === "unauthorized") {
      accessToken = await refreshYouTubeToken(youtubeAccount);
      result = await uploadVideo(accessToken);
    }

    if (result.id) {
      console.log(`YouTube Video published successfully: https://youtu.be/${result.id}`);
      await postsTable.updateOne(
        { id: postId },
        { 
          $set: { 
            status: "published", 
            publishedAt: new Date(),
            likesCount: 0,
            sharesCount: 0
          } 
        }
      );
    } else {
      throw new Error("Google API did not return video ID.");
    }
  } catch (error: any) {
    console.error("YouTube Upload Failed:", error);
    await postsTable.updateOne(
      { id: postId },
      { $set: { status: "failed" } }
    );
    throw error;
  }
}
