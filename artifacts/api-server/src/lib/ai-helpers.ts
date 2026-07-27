import { platformConfigsTable, decrypt } from "@workspace/db";

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "gemini": return "gemini-1.5-flash";
    case "openai": return "gpt-4o-mini";
    case "claude": return "claude-3-5-sonnet-latest";
    case "groq": return "llama3-8b-8192";
    default: return "default";
  }
}

// 1. Get the first active enabled text provider
export async function getActiveTextProvider() {
  const providers = ["gemini", "openai", "claude", "groq"];
  for (const p of providers) {
    const config = await platformConfigsTable.findOne({ platform: p, isEnabled: true }).lean() as any;
    if (config?.aiConfig?.apiKey) {
      try {
        const apiKey = decrypt(config.aiConfig.apiKey);
        return {
          provider: p,
          apiKey,
          model: config.aiConfig.model || getDefaultModel(p),
          promptTemplate: config.aiConfig.promptTemplate || ""
        };
      } catch (err) {
        console.error(`Failed to decrypt API key for ${p}:`, err);
      }
    }
  }
  return null;
}

// 2. Call active text generator (Gemini, Claude, Groq, OpenAI)
export async function callAiTextProvider(prompt: string, isJson = false): Promise<string> {
  const provider = await getActiveTextProvider();
  if (!provider) {
    throw new Error("No active AI Text Provider is configured and enabled in the Admin Panel.");
  }

  const { provider: name, apiKey, model, promptTemplate } = provider;
  const finalPrompt = promptTemplate ? `${promptTemplate}\n\n${prompt}` : prompt;

  console.log(`Routing text generation to provider: ${name} (${model})`);

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

  throw new Error(`Unsupported text provider: ${name}`);
}

// 3. Call active image generator (DALL-E 3 on OpenAI, or Imagen on Gemini)
export async function callAiImageProvider(prompt: string): Promise<string> {
  // Check image providers: openai (dall-e), gemini (imagen)
  const openaiConfig = await platformConfigsTable.findOne({ platform: "openai", isEnabled: true }).lean() as any;
  const geminiConfig = await platformConfigsTable.findOne({ platform: "gemini", isEnabled: true }).lean() as any;

  if (openaiConfig?.aiConfig?.apiKey) {
    try {
      const apiKey = decrypt(openaiConfig.aiConfig.apiKey);
      console.log("Routing image generation to OpenAI DALL-E 3");
      const res = await fetch("https://api.openai.com/v1/images/generations", {
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
      const data = await res.json() as any;
      if (res.ok && data.data?.[0]?.url) {
        return data.data[0].url;
      }
      console.error("OpenAI DALL-E failed:", data.error?.message);
    } catch (err) {
      console.error("OpenAI image generation error:", err);
    }
  }

  if (geminiConfig?.aiConfig?.apiKey) {
    try {
      const apiKey = decrypt(geminiConfig.aiConfig.apiKey);
      const model = geminiConfig.aiConfig.model || "imagen-3.0-generate-002";
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
    } catch (err) {
      console.error("Gemini Imagen generation error:", err);
    }
  }

  // Fallback to high quality Picsum placeholder seed
  return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 15))}/1024/1024`;
}
