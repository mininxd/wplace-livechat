import { getSettings, loadSettings, setSettings, getUserData, getRegionData, getAllianceData, getCurrentChatRoom, setCurrentChatRoom, setUserData, setAllianceData, getPreloadedAllianceMessages, setPreloadedAllianceMessages } from './state';
import { fetchMessages, sendMessage, fetchAPI } from './api';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

const debug = true;

// Create floating action button
export const fab = document.createElement('button');
fab.className = 'livechat-fab';
fab.innerHTML = '<i class="material-icons">chat</i>';
fab.style.display = 'flex';
fab.style.visibility = 'visible';
fab.style.opacity = '1';

// Ensure FAB is always visible
const ensureFABVisible = () => {
    if (fab && document.body.contains(fab)) {
        fab.style.display = 'flex';
        fab.style.visibility = 'visible';
        fab.style.opacity = '1';
    } else if (fab) {
        document.body.appendChild(fab);
    }
};

// Check FAB visibility periodically
setInterval(ensureFABVisible, 2000);

// Create modal
export const modal = document.createElement('div');
modal.className = 'livechat-modal';
modal.innerHTML = `
    <div class="livechat-content">
        <div class="livechat-header">
            <div class="livechat-header-main">
                <div class="livechat-user-info" id="userInfo">
                    <h3><i class="material-icons">person</i> Loading...</h3>
                    <div class="livechat-user-details"><i class="material-icons">tag</i> ID: ...</div>
                    <div class="livechat-user-details"><i class="material-icons">place</i> Region: ...</div>
                    <div class="game-status"><i class="material-icons" style="color: #4CAF50; font-size: 8px;">circle</i> Online</div>
                </div>
                    <div class="livechat-header-actions">
                        <button class="livechat-settings-btn"><i class="material-icons">settings</i></button>
                        <button class="livechat-close"><i class="material-icons">close</i></button>
                    </div>
            </div>
            <div class="livechat-tabs" id="chatTabs">
                </div>
        </div>
        <div class="livechat-messages" id="region-messages">
            <div class="loading-indicator">
                <div class="m3-progress-bar" style="width: 50%; margin: 0 auto;"></div>
                <div style="margin-top: 8px;">Loading...</div>
            </div>
        </div>
        <div class="livechat-messages" id="alliance-messages" style="display: none;">
             <div class="loading-indicator">
                <div class="m3-progress-bar" style="width: 50%; margin: 0 auto;"></div>
                <div style="margin-top: 8px;">Loading...</div>
            </div>
        </div>
        <div class="livechat-input-area">
            <div class="livechat-input-wrapper">
                <textarea class="livechat-input" placeholder="Type your message..." rows="1" id="chatInput" disabled maxlength="128"></textarea>
            </div>
            <button class="livechat-send" id="sendButton" disabled>
                <i class="material-icons">send</i>
                <div class="livechat-char-counter" id="charCounter">0/128</div>
            </button>
        </div>
    </div>
`;

// Add elements to page
document.body.appendChild(fab);
document.body.appendChild(modal);

// Create settings modal
export const settingsModal = document.createElement('div');
settingsModal.className = 'livechat-settings-modal';
settingsModal.style.display = 'none'; // Initially hidden
settingsModal.innerHTML = `
    <div class="livechat-settings-content">
        <h4>Chat Settings</h4>
        <div class="setting-item">
            <label for="enter-to-send">Press Enter to send</label>
            <input type="checkbox" id="enter-to-send" />
        </div>
        <button class="livechat-settings-close"><i class="material-icons">close</i></button>
    </div>
`;
document.body.appendChild(settingsModal);

// Get elements
export const regionMessages = document.getElementById('region-messages') as HTMLElement;
export const allianceMessages = document.getElementById('alliance-messages') as HTMLElement;
export const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
export const sendButton = document.getElementById('sendButton') as HTMLButtonElement;
export const charCounter = document.getElementById('charCounter') as HTMLDivElement;
export const closeButton = modal.querySelector('.livechat-close') as HTMLButtonElement;
const settingsButton = modal.querySelector('.livechat-settings-btn') as HTMLButtonElement;
const settingsCloseButton = settingsModal.querySelector('.livechat-settings-close') as HTMLButtonElement;
const enterToSendCheckbox = document.getElementById('enter-to-send') as HTMLInputElement;
export const userInfo = document.getElementById('userInfo') as HTMLElement;
export const chatTabs = document.getElementById('chatTabs') as HTMLElement;

// Load settings on startup
loadSettings();
const settings = getSettings();
enterToSendCheckbox.checked = settings.enterToSend;

// Settings modal listeners
settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

settingsCloseButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Setting change listener
enterToSendCheckbox.addEventListener('change', (e) => {
    setSettings({ enterToSend: (e.target as HTMLInputElement).checked });
});


// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';

    // Update character counter
    const count = this.value.length;
    charCounter.textContent = `${count}/128`;
    if (count > 128) {
        charCounter.classList.add('error');
    } else {
        charCounter.classList.remove('error');
    }
});


// Preload alliance messages
async function preloadAllianceMessages() {
    const userData = getUserData();
    if (!userData || !userData.allianceId) {
        if (debug) console.log("User is not in an alliance, skipping preload.");
        return;
    }

    const chatRoomId = `alliance_${userData.allianceId}`;
    if (debug) console.log(`Preloading messages for alliance chat: ${chatRoomId}`);

    try {
        const response = await fetchMessages(chatRoomId);
        if (response && response.data) {
            setPreloadedAllianceMessages(response);
            if (debug) console.log(`Successfully preloaded ${response.data.length} alliance messages.`);
        }
    } catch (error) {
        if (debug) console.error('Error preloading alliance messages:', error);
    }
}

// Initialize user data
export async function initializeUserData() {
    try {
        const userData = await fetchAPI('https://backend.wplace.live/me');
        if (userData) {
            setUserData(userData);
            if (debug) console.log("User data loaded:", userData);

            if (userData.allianceId) {
                try {
                    const allianceData = await fetchAPI(`https://backend.wplace.live/alliance`);
                    if (allianceData) {
                        setAllianceData(allianceData);
                        if (debug) console.log("Alliance data loaded:", allianceData);
                        // Preload messages now that we have alliance data
                        preloadAllianceMessages();
                    }
                } catch (error) {
                    if (debug) console.error('Error loading alliance data:', error);
                }
            }

            updateUserInfo();
            return true;
        }
    } catch (error) {
        if (debug) console.error('Error loading user data:', error);
    }
    return false;
}

// Add debug info to user info display
export function updateUserInfo() {
    const userData = getUserData();
    const regionData = getRegionData();
    const allianceData = getAllianceData();
    const currentChatRoom = getCurrentChatRoom();

    if (userData) {
        let regionName = regionData ? regionData.name : "No region";
        let allianceName = '';
        let allianceDetails = '';

        if (userData.allianceId && allianceData) {
            allianceName = `Alliance: ${allianceData.name}`;
            let details = [];
            if(allianceData.members) details.push(`${allianceData.members} members`);
            if(allianceData.pixelsPainted) details.push(`${allianceData.pixelsPainted.toLocaleString()} pixels`);
            if(allianceData.role) details.push(`Role: ${allianceData.role}`);

            if(details.length > 0) {
                allianceDetails += `<div class="livechat-user-details"><i class="material-icons">group</i> ${details.join(' &bull; ')}</div>`;
            }

            if(allianceData.description){
                allianceDetails += `<div class="livechat-user-details" style="font-style: italic; opacity: 0.8;"><i class="material-icons">info</i> ${allianceData.description}</div>`;
            }
        } else if (userData.allianceId) {
            allianceName = `Alliance`; // Fallback while loading
        }

        let chatContextInfo = currentChatRoom === 'region' ? `Region: ${regionName}` : allianceName;

        userInfo.innerHTML = `
            <h3><i class="material-icons">person</i> ${userData.name} <span style="font-weight: 300; font-size: 14px;">#${userData.id}</span></h3>
            <div class="livechat-user-details"><i class="material-icons">place</i> ${chatContextInfo}</div>
            ${currentChatRoom === 'alliance' ? allianceDetails : ''}
            <div class="game-status"><i class="material-icons" style="color: #4CAF50; font-size: 8px;">circle</i> Level ${Math.floor(userData.level)}</div>
        `;
    } else {
        userInfo.innerHTML = `
            <h3><i class="material-icons">person</i> Loading...</h3>
            <div class="livechat-user-details"><i class="material-icons">place</i> Region: ...</div>
            <div class="game-status"><i class="material-icons" style="color: #FF9800; font-size: 8px;">circle</i> Loading</div>
        `;
    }

    // Update tabs
    chatTabs.innerHTML = '';
    const regionTab = document.createElement('div');
    regionTab.className = 'livechat-tab';
    regionTab.textContent = 'Region';
    regionTab.dataset.room = 'region';
    if (currentChatRoom === 'region') regionTab.classList.add('active');
    chatTabs.appendChild(regionTab);

    if (userData && userData.allianceId) {
        const allianceTab = document.createElement('div');
        allianceTab.className = 'livechat-tab';
        allianceTab.textContent = 'Alliance';
        allianceTab.dataset.room = 'alliance';
        if (currentChatRoom === 'alliance') allianceTab.classList.add('active');
        chatTabs.appendChild(allianceTab);
    }
}

// Load and display messages
export async function loadMessages() {
    const userData = getUserData();
    const regionData = getRegionData();
    const currentChatRoom = getCurrentChatRoom();
    const initialChatRoom = currentChatRoom;
    let chatRoomId: string | null = null;
    let chatRoomName = '';
    const messagesContainer = currentChatRoom === 'region' ? regionMessages : allianceMessages;

    if (currentChatRoom === 'region') {
        if (!regionData) {
            if (debug) console.log("Still no region data available for region chat");
            messagesContainer.innerHTML = `
                <div class="info-message">
                    <i class="material-icons">near_me</i>
                    <div><strong>Tap on a pixel to join a region's chat</strong></div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Click on any pixel on the canvas to join the regional chat for that area.</div>
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
            return;
        }
        chatRoomId = regionData.name;
        chatRoomName = regionData.name;
    } else if (currentChatRoom === 'alliance') {
        if (!userData || !userData.allianceId) {
             messagesContainer.innerHTML = `
                <div class="info-message">
                    <i class="material-icons">warning</i>
                    <div><strong>You are not in an alliance.</strong></div>
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
            return;
        }
        chatRoomId = `alliance_${userData.allianceId}`;
        chatRoomName = "Alliance Chat";
    }

    if (!userData) {
        messagesContainer.innerHTML = `
            <div class="info-message">
                <i class="material-icons">warning</i>
                <div><strong>Please log in to use chat</strong></div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">You need to be logged in to participate in chat.</div>
            </div>
        `;
        chatInput.disabled = true;
        sendButton.disabled = true;
        return;
    }

    const isInitialLoad = messagesContainer.querySelector('.chat-message') === null;

    try {
        if (isInitialLoad) {
            if (debug) console.log(`Initial load of messages for ${chatRoomName}`);
            messagesContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="m3-progress-bar" style="width: 50%; margin: 0 auto;"></div>
                    <div style="margin-top: 8px;">Loading messages for ${chatRoomName}...</div>
                </div>
            `;
        }

        let response: any;
        const preloadedMessages = getPreloadedAllianceMessages();

        // Use preloaded messages only on the initial load of the alliance chat
        if (currentChatRoom === 'alliance' && preloadedMessages && isInitialLoad) {
            if (debug) console.log("Using preloaded alliance messages.");
            response = preloadedMessages;
            setPreloadedAllianceMessages(null); // Clear after use
        } else {
            response = await fetchMessages(chatRoomId as string);
        }

        if (getCurrentChatRoom() !== initialChatRoom) {
            if (debug) console.log(`Room changed from ${initialChatRoom} to ${getCurrentChatRoom()}. Aborting message load.`);
            return;
        }

        if (isInitialLoad) {
            messagesContainer.innerHTML = ''; // Clear loading indicator
            if (response && response.data && response.data.length > 0) {
                if (debug) console.log(`Loaded ${response.data.length} messages for ${chatRoomName}`);
                response.data.forEach((msg: any) => {
                    addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
                });
            } else {
                if (debug) console.log(`No messages found for ${chatRoomName}`);
                messagesContainer.innerHTML = `
                    <div class="info-message">
                        <i class="material-icons">chat</i>
                        <div><strong>Welcome to ${chatRoomName} chat!</strong></div>
                        <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Be the first to start the conversation.</div>
                    </div>
                `;
            }
        } else {
            // This is a refresh, only add new messages
            const lastMessage = messagesContainer.querySelector('.chat-message:last-child') as HTMLElement;
            const lastTimestamp = lastMessage ? lastMessage.dataset.timestamp : null;

            if (lastTimestamp && response && response.data && response.data.length > 0) {
                const newMessages = response.data.filter((msg: any) => new Date(msg.createdAt) > new Date(lastTimestamp));
                if (newMessages.length > 0 && debug) {
                    console.log(`Found ${newMessages.length} new messages.`);
                }
                newMessages.forEach((msg: any) => {
                    addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
                });
            }
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        chatInput.disabled = false;
        sendButton.disabled = false;
    } catch (error) {
        if (debug) console.error('Error loading messages:', error);
        if (isInitialLoad) {
            messagesContainer.innerHTML = `
                <div class="info-message">
                    <i class="material-icons">warning</i>
                    <div><strong>Failed to load messages</strong></div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Please check your connection and try again.</div>
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
        }
    }
}

// Add message to chat display
function addMessageToChat(name: string, message: string, timestamp: string, isOwn = false) {
    const currentChatRoom = getCurrentChatRoom();
    const messagesContainer = currentChatRoom === 'region' ? regionMessages : allianceMessages;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    if (isOwn) {
        messageDiv.classList.add('own');
    }
    messageDiv.dataset.timestamp = timestamp;

    // Format timestamp
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    messageDiv.innerHTML = `
        <div class="message-author">${isOwn ? `${name} (You)` : name}</div>
        <div class="message-content ${isOwn ? 'own' : ''}">
            ${message}
            <div class="message-timestamp">${timeString}</div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message function
export async function handleSendMessage() {
    const userData = getUserData();
    const regionData = getRegionData();
    const currentChatRoom = getCurrentChatRoom();

    if (!userData || sendButton.disabled) return;

    let chatRoomId: string | null = null;
    if (currentChatRoom === 'region') {
        if (!regionData) {
            if (debug) console.error("Cannot send message, no region selected.");
            return;
        }
        chatRoomId = regionData.name;
    } else if (currentChatRoom === 'alliance') {
        if (!userData.allianceId) {
            if (debug) console.error("Cannot send message, not in an alliance.");
            return;
        }
        chatRoomId = `alliance_${userData.allianceId}`;
    }

    if (!chatRoomId) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Disable inputs to prevent spam/double-sends
    sendButton.disabled = true;
    chatInput.disabled = true;
    sendButton.innerHTML = '<i class="material-icons loading-spinner">sync</i>';

    try {
        await sendMessage(userData.id, userData.name, message, chatRoomId);

        // Clear input after successful send
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Refresh messages to show the sent message
        setTimeout(loadMessages, 1000);

        // Start 3-second cooldown
        let countdown = 3;
        sendButton.innerHTML = `<span style="font-size: 14px; font-weight: 500;">${countdown}</span>`;
        chatInput.placeholder = `Please wait ${countdown} seconds...`;

        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                sendButton.innerHTML = `<span style="font-size: 14px; font-weight: 500;">${countdown}</span>`;
                chatInput.placeholder = `Please wait ${countdown} seconds...`;
            } else {
                clearInterval(interval);
                sendButton.disabled = false;
                chatInput.disabled = false;
                sendButton.innerHTML = '<i class="material-icons">send</i>';
                chatInput.placeholder = 'Type your message...';
                chatInput.focus();
            }
        }, 1000);

    } catch (error) {
        if (debug) console.error('Error sending message:', error);
        addMessageToChat('System', 'Failed to send message. Please try again.', new Date().toISOString(), false);

        // On error, re-enable immediately
        sendButton.disabled = false;
        chatInput.disabled = false;
        sendButton.innerHTML = '<i class="material-icons">send</i>';
    }
}

// Auto-refresh messages every 10 seconds
let refreshInterval: any;

export function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        const userData = getUserData();
        const regionData = getRegionData();
        const currentChatRoom = getCurrentChatRoom();
        if (modal.classList.contains('show') && userData) {
            if (currentChatRoom === 'region' && !regionData) {
                // Don't refresh region chat if there's no region data
                return;
            }
            loadMessages();
        }
    }, 10000);
}

export function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

export function handleTabClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('livechat-tab')) {
        const room = target.dataset.room;
        if (room && room !== getCurrentChatRoom()) {
            setCurrentChatRoom(room);
            localStorage.setItem('wplace-chat-last-room', room);

            if (room === 'region') {
                regionMessages.style.display = 'block';
                allianceMessages.style.display = 'none';
            } else {
                regionMessages.style.display = 'none';
                allianceMessages.style.display = 'block';
            }

            updateUserInfo();
            loadMessages();
        }
    }
}

export async function handleFabClick() {
    modal.classList.add('show');

    Draggable.create(fab, {
        bounds: "body",
        allowEventDefault: true
    });

    const userData = getUserData();

    // Initialize user data if not already loaded
    if (!userData) {
        await initializeUserData();
    }

    // Set initial chat room
    let lastRoom = localStorage.getItem('wplace-chat-last-room');
    if (lastRoom === 'alliance' && userData && userData.allianceId) {
        setCurrentChatRoom('alliance');
        regionMessages.style.display = 'none';
        allianceMessages.style.display = 'block';
    } else {
        setCurrentChatRoom('region');
        regionMessages.style.display = 'block';
        allianceMessages.style.display = 'none';
    }

    updateUserInfo();
    await loadMessages();
    startAutoRefresh();

    if (userData && getRegionData()) {
        chatInput.focus();
    }
}
