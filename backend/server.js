// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" +
  process.env.GEMINI_API_KEY;

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("LinkedIn AI Commenter backend is running ✅");
});

app.post("/api/generate-comments", async (req, res) => {
  try {
    const { postText } = req.body;

    if (!postText || postText.trim().length < 5) {
      return res
        .status(400)
        .json({ error: "Post text is missing or too short." });
    }

    // 🧠 Prompt for Gemini
    const prompt = `
You are an expert at writing insightful, concise LinkedIn comments.

Generate 3 short, natural, varied and friendly comments (1-2 sentences each) that could be posted on this LinkedIn post:

"${postText}"

Format your response as plain text with each comment on a new line.
Ensure that the comments are crispy, add emoijis relavant to post
`;

    // 🔥 Gemini API call
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

    res.json({ comments });
  } catch (err) {
    console.error("Error generating comments:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
