import { Router, type IRouter } from "express";
import { aiLogsTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { GenerateCaptionBody, GenerateHashtagsBody, RewriteContentBody, GenerateAiImageBody } from "@workspace/api-zod";
import { callAiTextProvider, callAiImageProvider } from "../lib/ai-helpers";

const router: IRouter = Router();

const TONES: Record<string, string> = {
  professional: "Write in a professional and authoritative tone.",
  funny: "Write in a funny and humorous tone.",
  marketing: "Write in a compelling marketing tone with a strong CTA.",
  corporate: "Write in a formal corporate tone.",
  friendly: "Write in a warm and friendly conversational tone.",
};

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  threads: "Threads",
};

async function logAiUsage(userId: number, type: "caption" | "hashtags" | "rewrite" | "image", prompt: string, result: string) {
  await aiLogsTable.create({ userId, type, prompt, result });
}

router.post("/ai/generate-caption", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = GenerateCaptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { topic, platform, tone } = parsed.data;
  const platformName = PLATFORM_PROMPTS[platform] ?? platform;
  const toneInstruction = TONES[tone ?? "professional"] ?? TONES.professional;

  try {
    const prompt = `Write a highly engaging caption for ${platformName} about: "${topic}".
    ${toneInstruction}
    Optimize it with clean line breaks and emojis suitable for ${platformName}.
    Provide the response as a single caption block.`;

    const text = await callAiTextProvider(prompt, false);
    
    await logAiUsage(req.userId!, "caption", `${topic} for ${platform}`, text);
    res.json({ text, alternatives: [] });
  } catch (err: any) {
    console.error("AI caption generation error, falling back:", err);
    // Dynamic fallback
    const fallback = generateContextualCaption(topic, platformName, tone ?? "professional")[0];
    res.json({ text: fallback, alternatives: [] });
  }
});

router.post("/ai/generate-hashtags", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = GenerateHashtagsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { topic, platform, count = 15 } = parsed.data;

  try {
    const prompt = `Generate exactly ${count} highly trending hashtags for a post on ${platform} about: "${topic}". Return only the hashtag list separated by spaces, no commentary.`;
    const response = await callAiTextProvider(prompt, false);
    const hashtags = response.match(/#\w+/g) || response.split(/\s+/).map(t => t.startsWith("#") ? t : `#${t}`);
    
    await logAiUsage(req.userId!, "hashtags", `${topic} on ${platform}`, hashtags.join(" "));
    res.json({ hashtags });
  } catch (err: any) {
    console.error("AI hashtag generation error, falling back:", err);
    const fallback = generateHashtags(topic, platform, count);
    res.json({ hashtags: fallback });
  }
});

router.post("/ai/rewrite", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = RewriteContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { content, tone } = parsed.data;
  const toneInstruction = TONES[tone ?? "professional"] ?? TONES.professional;

  try {
    const prompt = `Rewrite the following social media post content: "${content}".
    Apply the following style change: ${toneInstruction}.
    Keep it close in length but make it more impactful.`;
    const rewritten = await callAiTextProvider(prompt, false);

    await logAiUsage(req.userId!, "rewrite", content.slice(0, 100), rewritten);
    res.json({ text: rewritten, alternatives: [] });
  } catch (err: any) {
    console.error("AI rewrite error, falling back:", err);
    const fallback = rewriteContent(content, tone);
    res.json({ text: fallback, alternatives: [] });
  }
});

router.post("/ai/generate-image", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = GenerateAiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { prompt } = parsed.data;
  const style = req.body.style;
  const finalPrompt = style ? `${prompt} (Visual Style: ${style})` : prompt;

  try {
    const imageUrl = await callAiImageProvider(finalPrompt);
    await logAiUsage(req.userId!, "image", finalPrompt, imageUrl);
    res.json({ imageUrl, prompt: finalPrompt });
  } catch (err: any) {
    console.error("AI Image generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI image" });
  }
});

router.get("/ai/history", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const logs = await aiLogsTable.find({ userId: req.userId! }).sort({ createdAt: 1 });
  res.json(logs);
});

// Helper functions for AI content generation
function generateContextualCaption(topic: string, platform: string, tone: string): string[] {
  const toneAdjectives: Record<string, string[]> = {
    professional: ["Elevate your", "Transform your", "Optimize your"],
    funny: ["Warning:", "Plot twist:", "Hot take:"],
    marketing: ["Unlock", "Discover", "Get ready for"],
    corporate: ["We are proud to announce", "Our commitment to", "Introducing"],
    friendly: ["Hey! Just wanted to share", "Can we talk about", "Loving this"],
  };

  const adj = toneAdjectives[tone] ?? toneAdjectives.professional;
  return [
    `${adj[0]} ${topic} strategy for maximum ${platform} impact. Every post counts. Every interaction matters. Start today. #Growth #${platform.replace(/\s+/g, "")}`,
    `${adj[1]} your ${topic} game with proven ${platform} techniques that actually work. The results speak for themselves. #Success #Digital`,
    `${adj[2]} the power of ${topic} on ${platform}. Your audience is waiting. Your story deserves to be told. #ContentCreation #Marketing`,
  ];
}

function generateHashtags(topic: string, platform: string, count: number): string[] {
  const base = topic.toLowerCase().replace(/\s+/g, "");
  const generic = ["contentcreator", "socialmedia", "digitalmarketing", "marketing", "growth", "business", "entrepreneur", "success", "branding", "content"];
  const platformTags: Record<string, string[]> = {
    instagram: ["instadaily", "instapost", "instagrammarketing", "reels", "igdaily"],
    linkedin: ["linkedinmarketing", "b2b", "professional", "networking", "leadership"],
    tiktok: ["tiktokmarketing", "tiktoktips", "fyp", "viral", "trending"],
    twitter: ["twittermarketing", "tweet", "trending", "viral"],
    x: ["xmarketing", "trending", "viral"],
    youtube: ["youtubemarketing", "youtube", "youtubechannel", "subscribers"],
    facebook: ["facebookmarketing", "facebook", "facebookads"],
  };

  const specific = [base, `${base}marketing`, `${base}tips`, `${base}strategy`, `${base}growth`];
  const platformSpecific = platformTags[platform.toLowerCase()] ?? [];
  const all = [...specific, ...platformSpecific, ...generic];
  return all.slice(0, count).map(t => `#${t}`);
}

function rewriteContent(content: string, tone: string): string {
  const prefixes: Record<string, string> = {
    professional: "From a strategic perspective: ",
    funny: "Here's the thing nobody tells you: ",
    marketing: "ATTENTION: This changes everything. ",
    corporate: "We are pleased to share: ",
    friendly: "Hey! So, ",
  };
  const prefix = prefixes[tone] ?? "";
  return `${prefix}${content.trim()}`;
}

export default router;
