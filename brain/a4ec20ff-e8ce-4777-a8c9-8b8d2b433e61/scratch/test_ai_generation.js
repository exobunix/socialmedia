const path = require("path");
const fs = require("fs");

function loadEnv() {
  const envPath = path.resolve(__dirname, "../../../../.env");
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

const { platformConfigsTable, decrypt } = require("@workspace/db");

function getDefaultModel(provider) {
  switch (provider) {
    case "gemini": return "gemini-1.5-flash";
    case "openai": return "gpt-4o-mini";
    case "claude": return "claude-3-5-sonnet-latest";
    case "groq": return "llama3-8b-8192";
    default: return "default";
  }
}

function getSanitizedModel(provider, model) {
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
    return "llama3-8b-8192";
  }
  return model;
}

async function getActiveTextProvider() {
  const providers = ["gemini", "openai", "claude", "groq"];
  for (const p of providers) {
    const config = await platformConfigsTable.findOne({ platform: p, isEnabled: true }).lean();
    if (config?.aiConfig?.apiKey) {
      try {
        const apiKey = decrypt(config.aiConfig.apiKey);
        return {
          provider: p,
          apiKey,
          model: getSanitizedModel(p, config.aiConfig.model),
          promptTemplate: config.aiConfig.promptTemplate || ""
        };
      } catch (err) {
        console.error(`Failed to decrypt API key for ${p}:`, err);
      }
    }
  }
  return null;
}

async function callAiTextProvider(prompt) {
  const provider = await getActiveTextProvider();
  if (!provider) {
    throw new Error("No active AI Text Provider is configured and enabled.");
  }

  const { provider: name, apiKey, model, promptTemplate } = provider;
  const finalPrompt = promptTemplate ? `${promptTemplate}\n\n${prompt}` : prompt;

  console.log(`Routing text generation to provider: ${name} (${model})`);

  if (name === "gemini") {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Gemini API returned status ${res.status}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
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
        messages: [{ role: "user", content: finalPrompt }]
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `OpenAI API returned status ${res.status}`);
    }
    return data.choices?.[0]?.message?.content;
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
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Claude API returned status ${res.status}`);
    }
    return data.content?.[0]?.text;
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
        messages: [{ role: "user", content: finalPrompt }]
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Groq API returned status ${res.status}`);
    }
    return data.choices?.[0]?.message?.content;
  }

  throw new Error(`Unsupported text provider: ${name}`);
}

async function test() {
  console.log("Database connected. Fetching AI configurations...");
  try {
    const provider = await getActiveTextProvider();
    if (!provider) {
      console.log("No active provider resolved.");
      process.exit(0);
    }
    console.log("Active Provider resolved:", { provider: provider.provider, model: provider.model });
    
    console.log("Running callAiTextProvider test...");
    const result = await callAiTextProvider("Write a short joke about programming");
    console.log("AI TEXT RESULT SUCCESS! Output:\n", result);
  } catch (err) {
    console.error("AI TEXT GENERATION ERROR DETECTED:", err.message || err);
  }
  process.exit(0);
}

// Allow mongoose to connect
setTimeout(test, 2000);
