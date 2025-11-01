document.getElementById("generate").addEventListener("click", async () => {
  const suggestionsDiv = document.getElementById("suggestions");
  suggestionsDiv.innerHTML = "<p>⏳ Reading post and generating comments...</p>";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ask content script for the LinkedIn post text
    chrome.tabs.sendMessage(tab.id, { action: "get_post_content" }, async (response) => {
      if (!response || !response.text) {
        suggestionsDiv.innerHTML = "<p style='color:red;'>No post text detected. Please open a post first.</p>";
        return;
      }

      const postText = response.text;
      const loader = document.getElementById("loader");
      loader.style.display = "block";
      suggestionsDiv.innerHTML = "";

      // 🧠 Call your local backend API
      const res = await fetch("http://localhost:5000/api/generate-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText }),
      });

      loader.style.display = "none";

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Server returned an error");
      }

      const data = await res.json();

      if (!data.comments || data.comments.length === 0) {
        suggestionsDiv.innerHTML = "<p style='color:red;'>No suggestions received. Try another post.</p>";
        return;
      }

      // ✅ Display comment suggestions
      suggestionsDiv.innerHTML = "<h4>Suggested Comments:</h4>";
      data.comments.forEach((c) => {
        const p = document.createElement("p");
        p.className = "comment-suggestion";
        p.textContent = c;

        // ✅ Clicking copies comment directly from popup (no message to content.js)
        p.onclick = async () => {
          try {
            await navigator.clipboard.writeText(c);
            p.textContent = "Copied!";
            setTimeout(() => (p.textContent = c), 1500);
          } catch (err) {
            console.error("Clipboard copy failed:", err);
            alert("Failed to copy comment. Please copy manually.");
          }
        };

        suggestionsDiv.appendChild(p);
      });
    });
  } catch (error) {
    console.error("Error generating comments:", error);
    suggestionsDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
});
