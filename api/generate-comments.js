export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Vercel can give body as string or object
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { postText } = body || {};

    if (!postText || postText.trim().length < 5) {
      return res
        .status(400)
        .json({ error: "Post text is missing or too short." });
    }

    const prompt = `
You are an expert at writing insightful, concise LinkedIn comments.

Generate 3 short, natural, friendly comments (1–2 sentences each)
for this LinkedIn post:

"${postText}"

Return each comment on a new line and add relevant emojis.
`;

    const GEMINI_API_URL =
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data?.candidates?.length) {
      console.error("Gemini API error:", data);
      return res.status(500).json({
        error: "Gemini did not return candidates",
        raw: data,
      });
    }

    const raw =
      data.candidates[0]?.content?.parts?.[0]?.text || "";

    const comments = raw
      .split(/\n+/)
      .map(c => c.replace(/^[-•\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return res.status(200).json({ comments });
  } catch (err) {
    console.error("Function crash:", err);
    return res.status(500).json({
      error: err.message || "Function crashed",
    });
  }
}
