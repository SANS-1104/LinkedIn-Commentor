// document.getElementById("generate").addEventListener("click", async () => {
//   const suggestionsDiv = document.getElementById("suggestions");
//   suggestionsDiv.innerHTML = "<p>⏳ Reading post and generating comments...</p>";

//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     // Ask content script for the LinkedIn post text
//     chrome.tabs.sendMessage(tab.id, { action: "get_post_content" }, async (response) => {
//       if (!response || !response.text) {
//         suggestionsDiv.innerHTML = "<p style='color:red;'>No post text detected. Please open a post first.</p>";
//         return;
//       }

//       const postText = response.text;
//       const loader = document.getElementById("loader");
//       loader.style.display = "block";
//       suggestionsDiv.innerHTML = "";

//       // 🧠 Call your local backend API
//       // const res = await fetch("http://localhost:5000/api/generate-comments", {
//       const res = await fetch("https://linked-in-commentor.vercel.app/api/generate-comments", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ postText }),
//       });

//       loader.style.display = "none";

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(errText || "Server returned an error");
//       }

//       const data = await res.json();

//       if (!data.comments || data.comments.length === 0) {
//         suggestionsDiv.innerHTML = "<p style='color:red;'>No suggestions received. Try another post.</p>";
//         return;
//       }

//       // ✅ Display comment suggestions
//       suggestionsDiv.innerHTML = "<h4>Suggested Comments:</h4>";
//       data.comments.forEach((c) => {
//         const p = document.createElement("p");
//         p.className = "comment-suggestion";
//         p.textContent = c;

//         // ✅ Clicking copies comment directly from popup (no message to content.js)
//         p.onclick = async () => {
//           try {
//             await navigator.clipboard.writeText(c);
//             p.textContent = "Copied!";
//             setTimeout(() => (p.textContent = c), 1500);
//           } catch (err) {
//             console.error("Clipboard copy failed:", err);
//             alert("Failed to copy comment. Please copy manually.");
//           }
//         };

//         suggestionsDiv.appendChild(p);
//       });
//     });
//   } catch (error) {
//     console.error("Error generating comments:", error);
//     suggestionsDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
//   }
// });

async function extractPostText(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // The same detection logic, but runs directly in LinkedIn page context
      const postSelectors = [
        "div.feed-shared-update-v2",
        "div.feed-shared-update",
        "div.update-components-update",
        "div.occludable-update",
        "div.relative.feed-shared-update-v2",
        "div.scaffold-finite-scroll__content > div"
      ];

      const posts = Array.from(document.querySelectorAll('div'))
        .filter(div => div.innerText && div.innerText.length > 100);

      console.log("Possible posts:", posts.length);

      let visiblePost = null;
      let maxVisibleArea = 0;

      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const visibleHeight = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
        const visibleArea = visibleHeight * rect.width;
        if (visibleArea > maxVisibleArea && visibleHeight > 120) {
          visiblePost = post;
          maxVisibleArea = visibleArea;
        }
      });

      if (!visiblePost) {
        console.warn("⚠️ No visible post found (execScript)");
        return "";
      }

      const allTextNodes = Array.from(
        visiblePost.querySelectorAll("div, span, p")
      ).filter(el =>
        el.innerText &&
        el.innerText.trim().length > 30 &&
        !el.innerText.includes("See more") &&
        !el.innerText.includes("likes") &&
        !el.innerText.includes("comments")
      );

      if (allTextNodes.length === 0) return "";

      const textElement = allTextNodes.reduce((a, b) =>
        a.innerText.length > b.innerText.length ? a : b
      );

      visiblePost.style.outline = "2px solid #0077ff";
      visiblePost.scrollIntoView({ behavior: "smooth", block: "center" });

      return textElement.innerText.trim();
    },
  });

  return result || "";
}

document.getElementById("generate").addEventListener("click", async () => {
  const suggestionsDiv = document.getElementById("suggestions");
  const loader = document.getElementById("loader");

  suggestionsDiv.innerHTML = "<p>⏳ Reading post and generating comments...</p>";
  loader.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("No active LinkedIn tab found.");

    const postText = await extractPostText(tab.id);
    console.log("✅ Extracted from executeScript:", postText.slice(0, 120));

    if (!postText || postText.trim().length < 20) {
      suggestionsDiv.innerHTML =
        "<p style='color:red;'>⚠️ No post text detected. Please scroll to a post or open it fully.</p>";
      return;
    }

    loader.style.display = "block";
    suggestionsDiv.innerHTML = "";

    // 🌐 Call your backend
    const res = await fetch("https://linked-in-commentor.vercel.app/api/generate-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postText }),
    });
    // const res = await fetch("http://localhost:5000/api/generate-comments", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ postText }),
    // });

    loader.style.display = "none";

    if (!res.ok) throw new Error(await res.text() || "Server error");
    const data = await res.json();

    if (!data.comments || !data.comments.length) {
      suggestionsDiv.innerHTML = "<p style='color:red;'>No suggestions received. Try another post.</p>";
      return;
    }

    suggestionsDiv.innerHTML = "<h4> Suggested Comments:</h4>";
    data.comments.forEach((c) => {
      const p = document.createElement("p");
      p.className = "comment-suggestion";
      p.textContent = c;

      p.onclick = async () => {
        try {
          await navigator.clipboard.writeText(c);
          p.textContent = "Copied!";
          setTimeout(() => (p.textContent = c), 1500);
        } catch (err) {
          alert("Failed to copy comment. Please copy manually.");
        }
      };

      suggestionsDiv.appendChild(p);
    });
  } catch (err) {
    console.error("Popup error:", err);
    loader.style.display = "none";
    suggestionsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});
