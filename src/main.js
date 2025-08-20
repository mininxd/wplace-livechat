import "./style.css";
import "remixicon/fonts/remixicon.css";
import { refreshChat, stopPolling } from "./chatRender.js";
import { sendMessages } from "./connect.js";
import { userData, placeData } from "./lib/wplaceData.js";

import { isDetected } from "./lib/detectHttpRequest.js";

function run() {
  return (async function() {
    // Fetch user data
    const user = await userData();
    const username =  user.name
    const userId = user.id

    let isDelaying = false;
    let delayTimeout = null;

    // Fetch place data
    const place = await placeData();
    const region = place.region.name;
    
    usernameEl.innerHTML = username;
    uidEl.innerHTML = userId;
    regionEl.innerHTML = region;
    // Handle live chat button click
    document.getElementById("liveChatBtn").addEventListener("click", () => {
      chatModal.showModal();
      refreshChat(region);
    });

    // Handle modal close
    chatModal.addEventListener("close", () => {
      stopPolling();
    });

    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();

      if (!inputMessages.value.trim() || isDelaying) return;

      // Disable button and set delay state
      isDelaying = true;
      sendBtn.classList.add("btn-disabled");
      sendBtn.disabled = true;

      // Add message to UI immediately
      const div = document.createElement("div");
      div.className = "px-4 py-2 rounded-3xl max-w-[70%] user self-end bg-[#d1f7c4]";
      div.innerHTML = `
        <p class="text-xs font-medium">mininxd <span class="text-gray-500">#${userId}</span></p>
        <p class="mt-1">${inputMessages.value}</p>
      `;
      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      const messageText = inputMessages.value;
      inputMessages.value = ""; // Clear input immediately

      sendMessages(userId, "mininxd", messageText, region)
        .finally(() => {
          delayTimeout = setTimeout(() => {
            isDelaying = false;
            sendBtn.classList.remove("btn-disabled");
            sendBtn.disabled = false;
            delayTimeout = null;
          }, 5000);
        });
    });
  })();
}


(async () => {
  console.log("Starting Live Chat...");
  if (await isDetected()) run();
})();

