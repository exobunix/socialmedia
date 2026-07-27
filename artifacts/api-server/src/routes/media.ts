import { Router, type IRouter } from "express";
import { mediaFilesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { ListMediaParams, UploadMediaParams, UploadMediaBody, DeleteMediaParams } from "@workspace/api-zod";
import "../lib/env-loader";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Custom resolver to find ffmpeg in a pnpm monorepo structure
function getFFmpegPath(): string {
  const platform = os.platform();
  const arch = os.arch();
  
  let folderName = "";
  let binaryName = "ffmpeg";
  
  if (platform === "win32") {
    folderName = "win32-x64";
    binaryName = "ffmpeg.exe";
  } else if (platform === "linux") {
    folderName = arch === "arm64" ? "linux-arm64" : "linux-x64";
  } else if (platform === "darwin") {
    folderName = "darwin-x64";
  }
  
  // Monorepos place dependencies at the root level, so we look up multiple parent directories
  const possiblePaths = [
    path.resolve(process.cwd(), "node_modules", `@ffmpeg-installer/${folderName}`, binaryName),
    path.resolve(process.cwd(), "../node_modules", `@ffmpeg-installer/${folderName}`, binaryName),
    path.resolve(process.cwd(), "../../node_modules", `@ffmpeg-installer/${folderName}`, binaryName),
    path.resolve(process.cwd(), "../../../node_modules", `@ffmpeg-installer/${folderName}`, binaryName),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log("Resolved static ffmpeg path:", p);
      return p;
    }
  }
  
  return "ffmpeg"; // Fallback to system-level ffmpeg path if not found in node_modules
}

const ffmpegPath = getFFmpegPath();
const router: IRouter = Router();

async function compressVideo(base64Data: string): Promise<string> {
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  let mimeType = "video/mp4";
  let base64Body = base64Data;
  
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Body = matches[2];
  }
  
  const buffer = Buffer.from(base64Body, "base64");
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
  const outputPath = path.join(tempDir, `output_${Date.now()}.mp4`);
  
  await fs.promises.writeFile(inputPath, buffer);
  
  return new Promise((resolve, reject) => {
    // Compress video using low presets and 480p scaling for maximum speed & memory savings on free tier
    execFile(
      ffmpegPath,
      [
        "-y",
        "-i", inputPath,
        "-vcodec", "libx264",
        "-crf", "30",
        "-preset", "ultrafast",
        "-acodec", "aac",
        "-vf", "scale=-2:480",
        outputPath
      ],
      async (error, stdout, stderr) => {
        try { await fs.promises.unlink(inputPath); } catch {}
        
        if (error) {
          console.error("FFmpeg Compression Error Stderr:", stderr);
          try { await fs.promises.unlink(outputPath); } catch {}
          reject(new Error("FFmpeg video compression failed: " + error.message));
          return;
        }
        
        try {
          const compressedBuffer = await fs.promises.readFile(outputPath);
          const compressedBase64 = `data:${mimeType};base64,${compressedBuffer.toString("base64")}`;
          try { await fs.promises.unlink(outputPath); } catch {}
          resolve(compressedBase64);
        } catch (err: any) {
          reject(new Error("Failed to read compressed video output: " + err.message));
        }
      }
    );
  });
}

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
    let base64Data = parsed.data.url;
    const type = parsed.data.type || (base64Data.startsWith("data:video/") ? "video" : "image");

    if (type === "video") {
      try {
        console.log("Compressing video using FFmpeg...");
        base64Data = await compressVideo(base64Data);
        console.log("Video compression complete!");
      } catch (err: any) {
        console.error("Video compression failed, uploading original:", err);
      }
    }
    
    // ImageKit upload setup
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "private_q34ikaQJf2j1Frf6WPMDoDJ+5cU=";
    const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");

    const formData = new FormData();
    formData.append("file", base64Data);
    formData.append("fileName", parsed.data.filename || "upload");
    formData.append("folder", process.env.IMAGEKIT_FOLDER || "Social Media Automation");
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
      fileId: ikData.fileId,
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

  // Find the file first to get its ImageKit fileId
  const file = await mediaFilesTable.findOne({
    id: params.data.id,
    workspaceId: params.data.workspaceId
  });

  if (file) {
    if (file.fileId) {
      try {
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "private_q34ikaQJf2j1Frf6WPMDoDJ+5cU=";
        const authHeader = "Basic " + Buffer.from(privateKey + ":").toString("base64");
        
        await fetch(`https://api.imagekit.io/v1/files/${file.fileId}`, {
          method: "DELETE",
          headers: {
            "Authorization": authHeader
          }
        });
      } catch (err) {
        console.error("Failed to delete file from ImageKit:", err);
      }
    }
    
    await mediaFilesTable.deleteOne({ _id: file._id });
  }

  res.sendStatus(204);
});

export default router;
