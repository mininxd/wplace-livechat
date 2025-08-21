import { getUserData, getRegionData, getAllianceData, getCurrentChatRoom, setCurrentChatRoom, setUserData, setAllianceData } from './state';
import { fetchMessages, sendMessage, fetchAPI } from './api';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

const debug = false;

export const fab = document.createElement('button');
fab.className = 'livechat-fab';
fab.innerHTML = '<i class="ri-chat-3-line"></i> Live Chat';
fab.style.display = 'flex';
fab.style.visibility = 'visible';
fab.style.opacity = '1';

const ensureFABVisible = () => {
    if (fab && document.body.contains(fab)) {
        fab.style.display = 'flex';
        fab.style.visibility = 'visible';
        fab.style.opacity = '1';
    } else if (fab) {
        document.body.appendChild(fab);
    }
};

setInterval(ensureFABVisible, 2000);

export const modal = document.createElement('div');
modal.className = 'livechat-modal';
modal.innerHTML = `
    <div class="livechat-content">
        <div class="livechat-header">
            <div class="livechat-header-main">
                <div class="livechat-user-info" id="userInfo">
                    <h3><i class="ri-user-line"></i> Loading...</h3>
                    <div class="livechat-user-details"><i class="ri-hashtag"></i> ID: ...</div>
                    <div class="livechat-user-details"><i class="ri-map-pin-line"></i> Region: ...</div>
                    <div class="game-status"><i class="ri-circle-fill" style="color: #4CAF50; font-size: 8px;"></i> Online</div>
                </div>
                <button class="livechat-close"><i class="ri-close-line"></i></button>
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
            <textarea class="livechat-input" placeholder="Type your message..." rows="1" id="chatInput" disabled></textarea>
            <button class="livechat-send" id="sendButton" disabled><i class="ri-send-plane-fill"></i></button>
        </div>
    </div>
`;

document.body.appendChild(fab);
document.body.appendChild(modal);

const regionMessages = document.getElementById('region-messages') as HTMLElement;
const allianceMessages = document.getElementById('alliance-messages') as HTMLElement;
export const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
export const sendButton = document.getElementById('sendButton') as HTMLButtonElement;
export const closeButton = modal.querySelector('.livechat-close') as HTMLButtonElement;
const userInfo = document.getElementById('userInfo') as HTMLElement;
export const chatTabs = document.getElementById('chatTabs') as HTMLElement;

chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
});

export async function initializeUserData() {
    try {
        const userData = await fetchAPI('https://backend.wplace.live/me');
        if (userData) {
            setUserData(userData);
            if (debug) console.log("User data loaded:", userData);

            if (userData.allianceId) {
                try {
                    const allianceData = await fetchAPI(`https://backend.wplace.live/alliance/${userData.allianceId}`);
                    if (allianceData && debug) {
                        setAllianceData(allianceData);
                        console.log("Alliance data loaded:", allianceData);
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

export function updateUserInfo() {
    const userData = getUserData();
    const regionData = getRegionData();
    const allianceData = getAllianceData();
    const currentChatRoom = getCurrentChatRoom();

    if (userData) {
        let regionName = regionData ? regionData.name : "No region";
        let allianceName = ''; // Default to empty string if not in alliance
        if (userData.allianceId) {
            if (allianceData && allianceData.name) {
                allianceName = `Alliance: ${allianceData.name}`;
            } else {
                allianceName = `Alliance`; // Fallback while loading
            }
        }

        userInfo.innerHTML = `
            <h3><i class="ri-user-line"></i> ${userData.name} <span style="font-weight: 300;">#${userData.id}</span></h3>
            <div class="livechat-user-details"><i class="ri-map-pin-line"></i> ${currentChatRoom === 'region' ? `Region: ${regionName}` : allianceName}</div>
            <div class="game-status"><i class="ri-circle-fill" style="color: #4CAF50; font-size: 8px;"></i> Level ${Math.floor(userData.level)}</div>
        `;
    } else {
        userInfo.innerHTML = `
            <h3><i class="ri-user-line"></i> Loading...</h3>
            <div class="livechat-user-details"><i class="ri-map-pin-line"></i> Region: ...</div>
            <div class="game-status"><i class="ri-circle-fill" style="color: #FF9800; font-size: 8px;"></i> Loading</div>
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

export async function loadMessages() {
    const userData = getUserData();
    const regionData = getRegionData();
    const currentChatRoom = getCurrentChatRoom();

    let chatRoomId: string | null = null;
    let chatRoomName = '';
    const messagesContainer = currentChatRoom === 'region' ? regionMessages : allianceMessages;

    if (currentChatRoom === 'region') {
        if (!regionData) {
            if (debug) console.log("Still no region data available for region chat");
            messagesContainer.innerHTML = `
                <div class="info-message">
                    <i class="ri-cursor-line"></i>
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
                    <i class="ri-error-warning-line"></i>
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
                <i class="ri-error-warning-line"></i>
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

        const response = await fetchMessages(chatRoomId as string);

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
                        <i class="ri-chat-new-line"></i>
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
                    <i class="ri-error-warning-line"></i>
                    <div><strong>Failed to load messages</strong></div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Please check your connection and try again.</div>
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
        }
    }
}

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

export async function handleSendMessage() {
    const userData = getUserData();
    const regionData = getRegionData();
    const currentChatRoom = getCurrentChatRoom();

    if (!userData) return;

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

    // Disable send button
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="ri-loader-4-line loading-spinner"></i>';

    try {
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Send to server
        await sendMessage(userData.id, userData.name, message, chatRoomId);

        // Refresh messages after a short delay to get the actual server response
        setTimeout(() => {
            loadMessages();
        }, 1000);

    } catch (error) {
        if (debug) console.error('Error sending message:', error);
        // Show error message
        const errorTime = new Date().toISOString();
        addMessageToChat('System', 'Failed to send message. Please try again.', errorTime, false);
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="ri-send-plane-fill"></i>';
    }
}

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

export function handleFabClick() {
    modal.classList.add('show');

    Draggable.create(fab, {
        bounds: "body",
        allowEventDefault: true
    });

    const userData = getUserData();

    // Initialize user data if not already loaded
    if (!userData) {
        initializeUserData();
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
    loadMessages();
    startAutoRefresh();

    if (userData && getRegionData()) {
        chatInput.focus();
    }
}
