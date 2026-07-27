const loginUrl = "https://socialmedia-mj71.onrender.com/api/auth/login";
const generateCaptionUrl = "https://socialmedia-mj71.onrender.com/api/ai/generate-caption";

async function runTest() {
  console.log("Logging in to production API...");
  const loginRes = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "adarshdeepsachan@gmail.com",
      password: "admin@123"
    })
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Login successful!");

  // Test Caption Generation
  console.log("Requesting live AI Caption Generation...");
  const captionRes = await fetch(generateCaptionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      topic: "Announcing our new social automation tool",
      platform: "linkedin",
      tone: "professional"
    })
  });

  console.log("Caption Response Status:", captionRes.status);
  const captionData = await captionRes.json();
  console.log("Caption Response Data:", JSON.stringify(captionData, null, 2));
}

runTest().catch(console.error);
