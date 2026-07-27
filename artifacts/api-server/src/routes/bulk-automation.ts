import { Router, type IRouter } from "express";
import { 
  bulkUploadBatchesTable, 
  bulkMediaFilesTable, 
  postsTable, 
  platformConfigsTable,
  socialAccountsTable,
  decrypt 
} from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { publishPostToYouTube } from "../lib/social-publishers";
import { callAiTextProvider } from "../lib/ai-helpers";

const router: IRouter = Router();

// Helper to determine aspect ratio and orientation
function getMediaProperties(resolution: string | undefined, type: "image" | "video") {
  let width = 1920;
  let height = 1080;
  let aspect = "16:9";
  let orientation: "portrait" | "landscape" = "landscape";

  if (resolution && resolution.includes("x")) {
    const parts = resolution.split("x");
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    if (!isNaN(w) && !isNaN(h)) {
      width = w;
      height = h;
    }
  }

  if (width < height) {
    orientation = "portrait";
    aspect = "9:16";
  } else if (width === height) {
    orientation = "landscape";
    aspect = "1:1";
  } else {
    orientation = "landscape";
    aspect = "16:9";
  }

  return { resolution: `${width}x${height}`, aspectRatio: aspect, orientation };
}

// 1. POST /api/workspaces/:workspaceId/bulk-batches
router.post("/workspaces/:workspaceId/bulk-batches", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = Number(req.params.workspaceId);
  const { selectedPlatforms, strategy, settings } = req.body;

  try {
    const batch = await bulkUploadBatchesTable.create({
      workspaceId,
      selectedPlatforms: selectedPlatforms || [],
      strategy: strategy || "immediate",
      settings: settings || {},
      status: "uploading"
    });
    res.status(201).json(batch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/workspaces/:workspaceId/bulk-batches/:batchId/files
router.get("/workspaces/:workspaceId/bulk-batches/:batchId/files", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const batchId = Number(req.params.batchId);
  const workspaceId = Number(req.params.workspaceId);

  try {
    const files = await bulkMediaFilesTable.find({ batchId, workspaceId }).sort({ createdAt: 1 });
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/workspaces/:workspaceId/bulk-batches/:batchId/media
router.post("/workspaces/:workspaceId/bulk-batches/:batchId/media", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const batchId = Number(req.params.batchId);
  const workspaceId = Number(req.params.workspaceId);
  const { url, fileId, filename, sizeBytes, type, duration, resolution } = req.body;

  try {
    const props = getMediaProperties(resolution, type);

    const file = await bulkMediaFilesTable.create({
      workspaceId,
      batchId,
      url,
      fileId,
      type,
      filename,
      sizeBytes: Number(sizeBytes || 0),
      duration: duration ? Number(duration) : null,
      resolution: props.resolution,
      aspectRatio: props.aspectRatio,
      orientation: props.orientation,
      status: "pending",
      thumbnailStatus: "none"
    });

    res.status(201).json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/workspaces/:workspaceId/bulk-batches/:batchId/media/:id
router.put("/workspaces/:workspaceId/bulk-batches/:batchId/media/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const mediaId = Number(req.params.id);
  const batchId = Number(req.params.batchId);
  const workspaceId = Number(req.params.workspaceId);
  const { type, resolution, aspectRatio, orientation, aiData } = req.body;

  try {
    const updated = await bulkMediaFilesTable.findOneAndUpdate(
      { id: mediaId, batchId, workspaceId },
      { 
        $set: { 
          type, 
          resolution, 
          aspectRatio, 
          orientation,
          ...(aiData ? { aiData } : {})
        } 
      },
      { new: true }
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/workspaces/:workspaceId/bulk-batches/:batchId/process-ai
router.post("/workspaces/:workspaceId/bulk-batches/:batchId/process-ai", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const batchId = Number(req.params.batchId);
  const workspaceId = Number(req.params.workspaceId);

  try {
    const files = await bulkMediaFilesTable.find({ batchId, workspaceId });
    
    for (const file of files) {
      await bulkMediaFilesTable.updateOne({ id: file.id }, { $set: { status: "processing" } });

      // Build a smart, clean fallback title from the filename
      const cleanTitle = file.filename
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/[_-]+/g, " ") // replace underscores/hyphens with spaces
        .replace(/\b(1080p|720p|4k|video|mvp|mp4|avi|mov|hd|clip|2026\d+)\b/gi, "") // strip tags/timestamps
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase()); // capitalize words

      let caption = file.type === "video" 
        ? `🎥 Check out our new video: "${cleanTitle}"! Discover the key highlights and share your thoughts in the comments below! 🚀`
        : `📸 New Post: "${cleanTitle}"! Taking a closer look at this today. What do you think? ✨`;
        
      let hashtags = [cleanTitle.split(" ")[0].toLowerCase(), "socialflow", "automation", "viral", file.type];
      let keywords = cleanTitle.split(" ").filter(w => w.length > 2);
      let cta = file.type === "video" ? "Watch the full video now!" : "Click link to learn more!";
      let category = "General";
      let audience = "All Audiences";

      try {
        const prompt = `Analyze this file named "${file.filename}". Generate a highly engaging social media caption, 5 relevant hashtags, 5 keywords, an optimized Call to Action (CTA), content category, and target audience type. Return the result strictly in JSON format matching this schema:
        {
          "caption": "your caption text",
          "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
          "keywords": ["word1", "word2"],
          "cta": "your call to action",
          "category": "category name",
          "audience": "audience descriptor"
        }
        Respond with raw JSON only (do not wrap in markdown code blocks like \`\`\`json).`;

        const jsonTextResponse = await callAiTextProvider(prompt, true);
        if (jsonTextResponse) {
          const cleanJson = jsonTextResponse.replace(/```json|```/g, "").trim();
          const aiParsed = JSON.parse(cleanJson);
          caption = aiParsed.caption || caption;
          hashtags = aiParsed.hashtags || hashtags;
          keywords = aiParsed.keywords || keywords;
          cta = aiParsed.cta || cta;
          category = aiParsed.category || category;
          audience = aiParsed.audience || audience;
        }
      } catch (aiErr) {
        console.error("AI Generation Error for file:", file.filename, aiErr);
      }

      // Populate platform-specific variations
      const platformCaptions = {
        youtube: `${caption}\n\n${cta}\n\nTags: ${hashtags.map(h => `#${h}`).join(' ')}`,
        linkedin: `💼 ${caption}\n\n${cta}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
        x: `${caption.substring(0, 200)} ${hashtags.slice(0, 2).map(h => `#${h}`).join(' ')}`
      };

      await bulkMediaFilesTable.updateOne(
        { id: file.id },
        { 
          $set: { 
            status: "completed",
            aiData: {
              caption,
              platformCaptions,
              hashtags,
              keywords,
              seoTags: hashtags,
              cta,
              emojis: ["🚀", "🔥", "✨"],
              category,
              audience
            }
          } 
        }
      );
    }

    await bulkUploadBatchesTable.updateOne({ id: batchId }, { $set: { status: "processing" } });
    res.json({ success: true, message: "AI Content Analysis completed successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/workspaces/:workspaceId/bulk-batches/:batchId/generate-thumbnail
router.post("/workspaces/:workspaceId/bulk-batches/:batchId/generate-thumbnail", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const batchId = Number(req.params.batchId);
  const { fileId: targetFileId } = req.body;

  try {
    const file = await bulkMediaFilesTable.findOne({ id: targetFileId, batchId });
    if (!file) {
      res.status(404).json({ error: "Media file not found" });
      return;
    }

    await bulkMediaFilesTable.updateOne({ id: file.id }, { $set: { thumbnailStatus: "generating" } });

    // Generate visual thumbnail using ImageKit's native video frame extractor or the original image
    let mockCoverUrl = file.url;
    if (file.type === "video") {
      const cleanUrl = file.url.split("?")[0];
      mockCoverUrl = `${cleanUrl}/ik-thumbnail.jpg`;
    }

    await bulkMediaFilesTable.updateOne(
      { id: file.id },
      { 
        $set: { 
          thumbnailUrl: mockCoverUrl,
          thumbnailFileId: `mock-cover-${file.id}`,
          thumbnailStatus: "completed"
        } 
      }
    );

    res.json({ success: true, thumbnailUrl: mockCoverUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to distribute postings into sequential dates
function calculateScheduledTimes(
  strategy: string,
  settings: any,
  filesCount: number
): Date[] {
  const times: Date[] = [];
  const start = settings.startDate ? new Date(`${settings.startDate}T${settings.startTime || "09:00:00"}`) : new Date();

  if (strategy === "fixed") {
    // All scheduled at the exact same start date/time
    for (let i = 0; i < filesCount; i++) {
      times.push(new Date(start));
    }
  } else if (strategy === "interval") {
    const intervalMinutes = Number(settings.intervalMinutes || 60);
    for (let i = 0; i < filesCount; i++) {
      const d = new Date(start);
      d.setMinutes(d.getMinutes() + i * intervalMinutes);
      times.push(d);
    }
  } else if (strategy === "slots") {
    const slots = settings.slots || ["09:00", "12:00", "19:00", "02:00"];
    const parsedSlots = slots.map((s: string) => {
      const parts = s.split(":");
      return { hour: parseInt(parts[0], 10), minute: parseInt(parts[1] || "0", 10) };
    });

    let currentDay = new Date(start);
    let slotIndex = 0;

    for (let i = 0; i < filesCount; i++) {
      const slot = parsedSlots[slotIndex];
      const d = new Date(currentDay);
      d.setHours(slot.hour, slot.minute, 0, 0);

      times.push(d);

      slotIndex++;
      if (slotIndex >= parsedSlots.length) {
        slotIndex = 0;
        currentDay.setDate(currentDay.getDate() + 1); // Move to next day
      }
    }
  } else {
    // Default fallback: 1 hour intervals
    for (let i = 0; i < filesCount; i++) {
      const d = new Date(start);
      d.setHours(d.getHours() + i);
      times.push(d);
    }
  }

  return times;
}

// 6. POST /api/workspaces/:workspaceId/bulk-batches/:batchId/schedule
router.post("/workspaces/:workspaceId/bulk-batches/:batchId/schedule", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const batchId = Number(req.params.batchId);
  const workspaceId = Number(req.params.workspaceId);

  try {
    const batch = await bulkUploadBatchesTable.findOne({ id: batchId, workspaceId });
    if (!batch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }

    const files = await bulkMediaFilesTable.find({ batchId, workspaceId, status: "completed" });
    if (files.length === 0) {
      res.status(400).json({ error: "No completed AI analyzed files found in this batch." });
      return;
    }

    const scheduledTimes = calculateScheduledTimes(batch.strategy, batch.settings, files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const scheduledTime = scheduledTimes[i];
      const caption = file.aiData?.caption || `Automated post of ${file.filename}`;

      const postStatus = batch.strategy === "immediate" ? "published" : "scheduled";

      // Create scheduled post inside main posts table
      const post = await postsTable.create({
        workspaceId,
        content: caption,
        platforms: batch.selectedPlatforms,
        mediaUrls: [file.url],
        status: postStatus,
        scheduledAt: batch.strategy === "immediate" ? null : scheduledTime,
        publishedAt: batch.strategy === "immediate" ? new Date() : null,
        tone: "professional",
        hashtags: file.aiData?.hashtags || []
      });

      // If immediate, trigger publishing workers instantly
      if (batch.strategy === "immediate") {
        try {
          if (batch.selectedPlatforms.includes("youtube") && file.type === "video") {
            await publishPostToYouTube(post.id, workspaceId);
          }
        } catch (pubErr) {
          console.error(`Bulk immediate publishing error for post ${post.id}:`, pubErr);
        }
      }
    }

    await bulkUploadBatchesTable.updateOne({ id: batchId }, { $set: { status: "scheduled" } });
    res.json({ success: true, message: `Successfully scheduled ${files.length} posts.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
