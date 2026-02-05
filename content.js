// console.log("✅ LinkedIn Commenter content.js loaded (debug mode)");

// // 🧠 Function to find the visible LinkedIn post
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

//   // 🌈 Highlight detected post
//   visiblePost.style.outline = "2px solid #0077ff";
//   visiblePost.scrollIntoView({ behavior: "smooth", block: "center" });

//   // 🧠 Try to find largest text-containing element inside post
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

//   // Pick the one with the most text
//   const textElement = allTextNodes.reduce((a, b) =>
//     a.innerText.length > b.innerText.length ? a : b
//   );

//   const text = textElement.innerText.trim();
//   console.log("📘 Found text element:", textElement, "Sample:", text.slice(0, 120), "...");
//   return text;
// }

// // 🎧 Listen for popup messages
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "get_post_content") {
//     try {
//       const postText = getVisiblePostText();
//       if (postText) {
//         console.log("✅ Extracted text:", postText.slice(0, 100), "...");
//         sendResponse({ text: postText });
//       } else {
//         console.warn("⚠️ No post text detected.");
//         sendResponse({ text: "" });
//       }
//     } catch (err) {
//       console.error("Extraction error:", err);
//       sendResponse({ text: "" });
//     }
//     return true;
//   }
// });



console.log("✅ LinkedIn Commenter content.js loaded (stable mode)");

function getVisiblePostText() {
  const postSelectors = [
    "div.feed-shared-update-v2",
    "div.feed-shared-update",
    "div.update-components-update",
    "div.occludable-update",
    "div.relative.feed-shared-update-v2",
    "div.scaffold-finite-scroll__content > div"
  ];

  const posts = document.querySelectorAll(postSelectors.join(","));
  console.log(`🔍 Found ${posts.length} possible posts`);

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
    console.warn("⚠️ No visible post element found");
    return null;
  }

  visiblePost.style.outline = "2px solid #0077ff";
  visiblePost.scrollIntoView({ behavior: "smooth", block: "center" });

  const allTextNodes = Array.from(
    visiblePost.querySelectorAll("div, span, p")
  ).filter(el =>
    el.innerText &&
    el.innerText.trim().length > 30 &&
    !el.innerText.includes("See more") &&
    !el.innerText.includes("likes") &&
    !el.innerText.includes("comments")
  );

  if (allTextNodes.length === 0) {
    console.warn("⚠️ No text nodes found inside visible post");
    return null;
  }

  const textElement = allTextNodes.reduce((a, b) =>
    a.innerText.length > b.innerText.length ? a : b
  );

  const text = textElement.innerText.trim();
  console.log("📘 Found text element:", textElement, "Sample:", text.slice(0, 120), "...");
  return text;
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
