import { Router, type IRouter } from "express";
import { mediaFilesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { ListMediaParams, UploadMediaParams, UploadMediaBody, DeleteMediaParams } from "@workspace/api-zod";
import fs from "fs";
import path from "path";

// Native .env file loader helper
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const router: IRouter = Router();

router.get("/workspaces/:workspaceId/media", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = ListMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const files = await mediaFilesTable.find({ workspaceId: params.data.workspaceId }).sort({ createdAt: 1 });
  res.json(files);
});

router.post("/workspaces/:workspaceId/media", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = UploadMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UploadMediaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const base64Data = parsed.data.url;
    const type = parsed.data.type || (base64Data.startsWith("data:video/") ? "video" : "image");
    
    // ImageKit upload setup
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "private_q34ikaQJf2j1Frf6WPMDoDJ+5cU=";
    const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");

    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("fileName", parsed.data.filename || "upload");
    formData.append("folder", "/Social Media Automation");
    formData.append("useUniqueFileName", "true");

    console.log("Uploading file to ImageKit...");
    const ikRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        "Authorization": authHeader
      },
      body: formData
    });

    const ikData = await ikRes.json() as any;
    if (ikData.error || !ikRes.ok) {
      throw new Error(ikData.message || "ImageKit upload endpoint failed");
    }

    // Apply auto-compression transformation rules
    // tr=q-60 compresses images to 60% quality, tr=q-50 compresses video content
    const compressionQuery = type === "video" ? "?tr=q-50" : "?tr=q-60";
    const compressedUrl = ikData.url + compressionQuery;

    const file = await mediaFilesTable.create({
      workspaceId: params.data.workspaceId,
      url: compressedUrl,
      type: type as any,
      filename: parsed.data.filename,
      sizeBytes: ikData.size || parsed.data.sizeBytes,
      mimeType: parsed.data.mimeType,
    });

    res.status(201).json(file);
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    res.status(500).json({ error: error.message || "Failed to process media file upload" });
  }
});
router.delete("/workspaces/:workspaceId/media/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const params = DeleteMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await mediaFilesTable.deleteOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  });
  res.sendStatus(204);
});

export default router;
