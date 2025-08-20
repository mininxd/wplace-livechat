import { getMessages } from "./connect.js";

const currentUserId = "12911";
const chatContainer = document.getElementById("chatContainer");
let lastMessageTimestamp = null;

async function renderNewMessages(region) {
  const allMessages = await getMessages(region);

  // Only take messages that are newer than last rendered
  const newMessages = lastMessageTimestamp
    ? allMessages.data.filter(msg => new Date(msg.createdAt) > new Date(lastMessageTimestamp))
    : allMessages.data; // first load: render all

  if (!newMessages.length) return;

  newMessages.forEach(msg => {
    const div = document.createElement("div");

    const isCurrentUser = msg.uid === currentUserId;
    div.className = `px-4 py-2 rounded-3xl max-w-[70%] ${
      isCurrentUser ? "user self-end bg-[#d1f7c4]" : "participant self-start bg-[#e3e9f4]"
    }`;

    div.innerHTML = `
      <p class="text-xs font-medium">${msg.name} <span class="text-gray-500">#${msg.uid}</span></p>
      <p class="mt-1">${msg.messages}</p>
    `;

    chatContainer.appendChild(div);
  });

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Update the last message timestamp
  lastMessageTimestamp = newMessages[newMessages.length - 1].createdAt;
}

// Initial load
await renderNewMessages("Semarang");

// Poll every 3 seconds for new messages
// setInterval(() => renderNewMessages("Semarang"), 3000);
