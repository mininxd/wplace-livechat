import "./style.css";
import "remixicon/fonts/remixicon.css";
import { refreshChat, stopPolling } from "./chatRender.js";
import { sendMessages } from "./connect.js";
import { userData, placeData } from "./lib/wplceData.js";

const user = await userData();
const place = await placeData();

const userId = user.id;
const username = user.name;

let isDelaying = false;
let delayTimeout = null;

const region = place.region.name;

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
      // Set delay period after API call completes
      delayTimeout = setTimeout(() => {
        isDelaying = false;
        sendBtn.classList.remove("btn-disabled");
        sendBtn.disabled = false;
        delayTimeout = null;
      }, 2000); // 2 second delay
    });
});