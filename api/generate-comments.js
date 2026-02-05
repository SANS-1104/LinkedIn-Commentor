import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { postText } = req.body;

    if (!postText || postText.trim().length < 5) {
      return res
        .status(400)
        .json({ error: "Post text is missing or too short." });
    }

    const GEMINI_API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const prompt = `
You are an expert at writing insightful, concise LinkedIn comments.

Generate 3 short, natural, varied and friendly comments (1-2 sentences each) that could be posted on this LinkedIn post:

"${postText}"

Format your response as plain text with each comment on a new line.
Ensure that the comments are crispy, add emojis relevant to post
`;

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

    if (!data.candidates?.length) {
      console.error("Gemini API error:", data);
      return res
        .status(500)
        .json({ error: "Gemini did not return any suggestions." });
    }

    const raw = data.candidates[0]?.content?.parts?.[0]?.text || "";

    const comments = raw
      .split(/\n+/)
      .map((c) => c.replace(/^[-•\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return res.status(200).json({ comments });

  } catch (err) {
    console.error("Error generating comments:", err);
    return res.status(500).json({ error: err.message });
  }
}
