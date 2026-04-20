
function buildPrompt(type, userPrompt) {
  switch (type) {
    case "caption":
      return `You are a creative social media expert. Generate a single engaging, trendy Instagram/social media caption for this post: "${userPrompt}". Include 1-2 relevant emojis. Keep it under 150 characters. Return only the caption text, nothing else.`;

    case "hashtags":
      return `You are a social media hashtag expert. Generate exactly 10 relevant, trending hashtags for this topic: "${userPrompt}". Each hashtag must start with #. Return them on a single line separated by spaces. Return ONLY the hashtags, nothing else.`;

    case "postIdea":
      return `You are a creative social media content strategist. Generate exactly 5 unique and engaging post ideas for this topic: "${userPrompt}". Format each idea as a numbered list (1. 2. 3. 4. 5.). Each idea should be one concise sentence. Return only the numbered list, nothing else.`;

    case "comment":
      return `You are a friendly, authentic social media user. Generate a single warm, genuine comment for this context: "${userPrompt}". Keep it under 80 characters, sound natural and human. Include 1 emoji. Return only the comment text, nothing else.`;

    default:
      throw new Error("Invalid type. Must be: caption, hashtags, postIdea, or comment.");
  }
}

export const vibeAIGenerate = async (req, res) => {
  try {
    const { type, prompt } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ message: "type and prompt are required." });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      return res.status(500).json({ message: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file." });
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const aiPrompt = buildPrompt(type, prompt);

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", JSON.stringify(errData, null, 2));
      const geminiMsg = errData?.error?.message || "AI service error.";
      return res.status(502).json({ message: geminiMsg });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return res.status(502).json({ message: "No response from AI. Try again." });
    }

    res.json({ result: text });
  } catch (error) {
    console.error("VibeAI error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
