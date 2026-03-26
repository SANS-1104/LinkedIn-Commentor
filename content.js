console.log("✅ LinkedIn Commenter content.js loaded (stable mode)");

// function getVisiblePostText() {
//   const postSelectors = [
//     "div.feed-shared-update-v2",
//     "div.feed-shared-update",
//     "div.update-components-update",
//     "div.occludable-update",
//     "div.relative.feed-shared-update-v2",
//     "div.scaffold-finite-scroll__content > div"
//   ];

//   const posts = document.querySelectorAll(postSelectors.join(","));
//   console.log(`🔍 Found ${posts.length} possible posts`);

//   let visiblePost = null;
//   let maxVisibleArea = 0;

//   posts.forEach(post => {
//     const rect = post.getBoundingClientRect();
//     const visibleHeight = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
//     const visibleArea = visibleHeight * rect.width;

//     if (visibleArea > maxVisibleArea && visibleHeight > 120) {
//       visiblePost = post;
//       maxVisibleArea = visibleArea;
//     }
//   });

//   if (!visiblePost) {
//     console.warn("⚠️ No visible post element found");
//     return null;
//   }

//   visiblePost.style.outline = "2px solid #0077ff";
//   visiblePost.scrollIntoView({ behavior: "smooth", block: "center" });

//   const allTextNodes = Array.from(
//     visiblePost.querySelectorAll("div, span, p")
//   ).filter(el =>
//     el.innerText &&
//     el.innerText.trim().length > 30 &&
//     !el.innerText.includes("See more") &&
//     !el.innerText.includes("likes") &&
//     !el.innerText.includes("comments")
//   );

//   if (allTextNodes.length === 0) {
//     console.warn("⚠️ No text nodes found inside visible post");
//     return null;
//   }

//   const textElement = allTextNodes.reduce((a, b) =>
//     a.innerText.length > b.innerText.length ? a : b
//   );

//   const text = textElement.innerText.trim();
//   console.log("📘 Found text element:", textElement, "Sample:", text.slice(0, 120), "...");
//   return text;
// }


function getVisiblePostText() {
  // NEW robust selector
  const posts = document.querySelectorAll('[data-id]');

  console.log(`🔍 Found ${posts.length} possible posts`);

  let visiblePost = null;

  for (let post of posts) {
    const rect = post.getBoundingClientRect();

    if (
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.height > 100
    ) {
      visiblePost = post;
      break;
    }
  }

  if (!visiblePost) {
    console.warn("⚠️ No visible post element found");
    return null;
  }

  visiblePost.style.outline = "2px solid red";

  // 🔥 Updated text extraction
  const textBlocks = visiblePost.querySelectorAll(
    'span[dir="ltr"], div[dir="ltr"]'
  );

  let longestText = "";

  textBlocks.forEach(el => {
    const text = el.innerText.trim();
    if (text.length > longestText.length) {
      longestText = text;
    }
  });

  console.log("📘 Extracted:", longestText.slice(0, 150));

  return longestText || null;
}


// 🎧 Listen for popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_post_content") {
    console.log("📩 Message received from popup: get_post_content");

    setTimeout(() => {
      try {
        const postText = getVisiblePostText();
        if (postText) {
          console.log("✅ Sending extracted text back to popup");
          sendResponse({ success: true, text: postText });
        } else {
          console.warn("⚠️ No post text detected.");
          sendResponse({ success: false, text: "" });
        }
      } catch (err) {
        console.error("Extraction error:", err);
        sendResponse({ success: false, text: "", error: err.message });
      }
    }, 200); // small delay ensures DOM stability

    return true; // keep channel open
  }
});
