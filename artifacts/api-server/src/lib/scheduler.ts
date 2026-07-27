import { postsTable } from "@workspace/db";
import { publishPostToYouTube } from "./social-publishers";

export function startScheduler() {
  console.log("⏰ Background Publishing Scheduler started (polling every 30s)...");
  
  setInterval(async () => {
    try {
      const now = new Date();
      // Fetch posts scheduled for now or in the past
      const postsToPublish = await postsTable.find({
        status: "scheduled",
        scheduledAt: { $lte: now }
      });

      if (postsToPublish.length > 0) {
        console.log(`[Scheduler] Found ${postsToPublish.length} posts ready to publish.`);
      }

      for (const post of postsToPublish) {
        try {
          console.log(`[Scheduler] Attempting to publish post ${post.id} to platforms: ${post.platforms.join(", ")}`);
          
          if (post.platforms.includes("youtube")) {
            await publishPostToYouTube(post.id, post.workspaceId);
          }

          // If no errors, update post status to published
          await postsTable.updateOne(
            { id: post.id },
            { 
              $set: { 
                status: "published",
                publishedAt: new Date()
              } 
            }
          );
          console.log(`[Scheduler] Successfully published post ${post.id}`);
        } catch (pubErr: any) {
          console.error(`[Scheduler] Failed to publish post ${post.id}:`, pubErr.message);

          const retries = (post as any).retryCount || 0;
          if (retries >= 3) {
            await postsTable.updateOne(
              { id: post.id },
              { 
                $set: { 
                  status: "failed",
                  errorLog: pubErr.message || "Failed after 3 retries"
                } 
              }
            );
          } else {
            // Re-schedule for 5 minutes later and increment retry count
            const retryTime = new Date();
            retryTime.setMinutes(retryTime.getMinutes() + 5);

            await postsTable.updateOne(
              { id: post.id },
              { 
                $set: { 
                  scheduledAt: retryTime,
                  retryCount: retries + 1,
                  errorLog: pubErr.message
                } 
              }
            );
            console.log(`[Scheduler] Scheduled retry #${retries + 1} for post ${post.id} at ${retryTime}`);
          }
        }
      }
    } catch (err: any) {
      console.error("[Scheduler] Error running tick:", err.message);
    }
  }, 30000); // 30 seconds
}
