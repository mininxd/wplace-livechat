import "./style.css";
import "remixicon/fonts/remixicon.css";
import { refreshChat, stopPolling } from "./chatRender.js";
import { sendMessages } from "./connect.js";

const uid = "12345";
const region = "Semarang";

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
  
  if (!inputMessages.value.trim()) return;
  
  sendBtn.classList.add("btn-loading");
  
  // Add message to UI immediately
  const div = document.createElement("div");
  div.className = "px-4 py-2 rounded-3xl max-w-[70%] user self-end bg-[#d1f7c4]";
  div.innerHTML = `
    <p class="text-xs font-medium">mininxd <span class="text-gray-500">#${uid}</span></p>
    <p class="mt-1">${inputMessages.value}</p>
  `;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  const messageText = inputMessages.value;
  inputMessages.value = "";
  
  sendMessages(uid, "mininxd", messageText, region)
    .finally(() => {
      sendBtn.classList.remove("btn-loading");
    });
});