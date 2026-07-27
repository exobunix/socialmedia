import { platformConfigsTable, decrypt } from "@workspace/db";

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "gemini": return "gemini-1.5-flash";
    case "openai": return "gpt-4o-mini";
    case "claude": return "claude-3-5-sonnet-latest";
    case "groq": return "llama-3.1-8b-instant";
    default: return "default";
  }
}

function getSanitizedModel(provider: string, model: string): string {
  const m = model ? model.trim().toLowerCase() : "";
  if (!m) return getDefaultModel(provider);

  if (provider === "gemini" && !m.startsWith("gemini-")) {
    return "gemini-1.5-flash";
  }
  if (provider === "openai" && !m.startsWith("gpt-") && !m.startsWith("o1-")) {
    return "gpt-4o-mini";
  }
  if (provider === "claude" && !m.startsWith("claude-")) {
    return "claude-3-5-sonnet-latest";
  }
  if (provider === "groq" && !m.startsWith("llama") && !m.startsWith("mixtral") && !m.startsWith("gemma")) {
    return "llama-3.1-8b-instant";
  }
  return model;
}

// 1. Get all active enabled text providers
export async function getActiveTextProviders() {
  const providers = ["gemini", "openai", "claude", "groq"];
  const list = [];
  for (const p of providers) {
    const config = await platformConfigsTable.findOne({ platform: p, isEnabled: true }).lean() as any;
    if (config?.aiConfig?.apiKey) {
      try {
        const apiKey = decrypt(config.aiConfig.apiKey);
        list.push({
          provider: p,
          apiKey,
          model: getSanitizedModel(p, config.aiConfig.model),
          promptTemplate: config.aiConfig.promptTemplate || ""
        });
      } catch (err) {
        console.error(`Failed to decrypt API key for ${p}:`, err);
      }
    }
  }
  return list;
}

// 2. Call active text generator (Gemini, Claude, Groq, OpenAI) with automatic fallback
export async function callAiTextProvider(prompt: string, isJson = false): Promise<string> {
  const providers = await getActiveTextProviders();
  if (providers.length === 0) {
    throw new Error("No active AI Text Provider is configured and enabled in the Admin Panel.");
  }

  let lastError: any = null;
  for (const provider of providers) {
    const { provider: name, apiKey, model, promptTemplate } = provider;
    const finalPrompt = promptTemplate ? `${promptTemplate}\n\n${prompt}` : prompt;

    console.log(`Routing text generation to provider: ${name} (${model})`);

    try {
      if (name === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
          })
        });
        const data = await res.json() as any;
        if (!res.ok || data.error) {
          throw new Error(data.error?.message || `Gemini API returned status ${res.status}`);
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini returned empty response candidates");
        return text;
      }

      if (name === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: finalPrompt }],
            response_format: isJson ? { type: "json_object" } : undefined
          })
        });
        const data = await res.json() as any;
        if (!res.ok || data.error) {
          throw new Error(data.error?.message || `OpenAI API returned status ${res.status}`);
        }
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("OpenAI returned empty completions content");
        return text;
      }

      if (name === "claude") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [{ role: "user", content: finalPrompt }]
          })
        });
        const data = await res.json() as any;
        if (!res.ok || data.error) {
          throw new Error(data.error?.message || `Claude API returned status ${res.status}`);
        }
        const text = data.content?.[0]?.text;
        if (!text) throw new Error("Claude returned empty content blocks");
        return text;
      }

      if (name === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: finalPrompt }],
            response_format: isJson ? { type: "json_object" } : undefined
          })
        });
        const data = await res.json() as any;
        if (!res.ok || data.error) {
          throw new Error(data.error?.message || `Groq API returned status ${res.status}`);
        }
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("Groq returned empty chat completion");
        return text;
      }
    } catch (err: any) {
      console.warn(`Provider ${name} failed:`, err.message || err);
      lastError = err;
      // Continue loop to try next provider
    }
  }

  throw new Error(`All configured AI Text Providers failed. Last error: ${lastError?.message || lastError}`);
}

// 3. Call active image generator (DALL-E 3 on OpenAI, or Imagen on Gemini)
export async function callAiImageProvider(prompt: string): Promise<string> {
  // Check image providers: openai (dall-e), gemini (imagen)
  const openaiConfig = await platformConfigsTable.findOne({ platform: "openai", isEnabled: true }).lean() as any;
  const geminiConfig = await platformConfigsTable.findOne({ platform: "gemini", isEnabled: true }).lean() as any;

  const hasConfiguredProviders = !!(openaiConfig?.aiConfig?.apiKey || geminiConfig?.aiConfig?.apiKey);
  let lastError: any = null;

  if (openaiConfig?.aiConfig?.apiKey) {
    try {
      const apiKey = decrypt(openaiConfig.aiConfig.apiKey);
      console.log("Routing image generation to OpenAI DALL-E 3");
      let res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024"
        })
      });
      let data = await res.json() as any;
      if (res.ok && data.data?.[0]?.url) {
        return data.data[0].url;
      }
      console.error("OpenAI DALL-E 3 failed:", data.error?.message);
      lastError = new Error(data.error?.message || "OpenAI DALL-E 3 failed");

      // Fallback to DALL-E 2
      console.log("Routing image generation fallback to OpenAI DALL-E 2");
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt,
          n: 1,
          size: "512x512"
        })
      });
      data = await res.json() as any;
      if (res.ok && data.data?.[0]?.url) {
        return data.data[0].url;
      }
      console.error("OpenAI DALL-E 2 failed:", data.error?.message);
      lastError = new Error(data.error?.message || "OpenAI DALL-E 2 failed");
    } catch (err: any) {
      console.error("OpenAI image generation error:", err);
      lastError = err;
    }
  }

  if (geminiConfig?.aiConfig?.apiKey) {
    try {
      const apiKey = decrypt(geminiConfig.aiConfig.apiKey);
      let model = geminiConfig.aiConfig.model || "imagen-3.0-generate-002";
      if (!model.trim().toLowerCase().startsWith("imagen-")) {
        model = "imagen-3.0-generate-002";
      }
      console.log(`Routing image generation to Gemini Imagen (${model})`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 }
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.predictions?.[0]?.bytesBase64Encoded) {
        return `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
      }
      console.error("Gemini Imagen failed:", data.error?.message);
      lastError = new Error(data.error?.message || "Gemini Imagen failed");
    } catch (err: any) {
      console.error("Gemini Imagen generation error:", err);
      lastError = err;
    }
  }

  // If the user has active providers configured but all failed, throw the error
  if (hasConfiguredProviders) {
    throw new Error(`All configured AI Image Providers failed. Last error: ${lastError?.message || lastError}`);
  }

  // Fallback to high quality Picsum placeholder seed if nothing is configured
  return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 15))}/1024/1024`;
}
