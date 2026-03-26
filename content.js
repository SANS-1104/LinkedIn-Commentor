console.log("✅ LinkedIn Commenter content.js loaded (FINAL)");

function getVisiblePostText() {
  // ✅ Try multiple selectors (VERY IMPORTANT)
  const selectors = [
    '[data-test-id="main-feed-activity-card__commentary"]',
    '.update-components-text',
    '.break-words',
    'span[dir="ltr"]'
  ];

  let elements = [];

  selectors.forEach(sel => {
    elements.push(...document.querySelectorAll(sel));
  });

  console.log(`🔍 Found ${elements.length} possible text elements`);

  for (let el of elements) {
    const rect = el.getBoundingClientRect();

    if (rect.top >= 0 && rect.top < window.innerHeight * 0.6) {
      const text = el.innerText?.trim();

      if (text && text.length > 30) {
        el.style.outline = "2px solid red";
        console.log("✅ Extracted:", text.slice(0, 150));
        return text;
      }
    }
  }

  console.warn("⚠️ No visible post found");
  return null;
}


// ✅ SINGLE listener (correct way)
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_post_content") {
      console.log("📩 Message received from popup");

      setTimeout(() => {
        try {
          const postText = getVisiblePostText();

          if (postText) {
            sendResponse({ success: true, text: postText });
          } else {
            sendResponse({ success: false, text: "" });
          }
        } catch (err) {
          console.error("❌ Error:", err);
          sendResponse({ success: false, error: err.message });
        }
      }, 500); // ⬅️ increased delay (IMPORTANT)

      return true;
    }
  });
} else {
  console.warn("⚠️ chrome.runtime not available");
}