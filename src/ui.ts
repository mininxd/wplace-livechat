import { getSettings, loadSettings, setSettings, getUserData, getRegionData, getAllianceData, getCurrentChatRoom, setCurrentChatRoom, setUserData, setAllianceData, getPreloadedAllianceMessages, setPreloadedAllianceMessages, getPixelData, getDisplayedChatRoomId, setDisplayedChatRoomId, getMessagesFromCache, setMessagesInCache } from './state';
import { fetchMessages, sendMessage, fetchAPI, connectToEvents, checkEventProgress } from './api';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import sort from "./lib/libSort.js";

gsap.registerPlugin(Draggable);

function getRoomNameFromRanges(xRange: string, yRange: string): string {
    if (xRange === '0-499' && yRange === '0-499') return 'Room 1';
    if (xRange === '500-999' && yRange === '0-499') return 'Room 2';
    if (xRange === '0-499' && yRange === '500-999') return 'Room 3';
    if (xRange === '500-999' && yRange === '500-999') return 'Room 4';
    return `${xRange}, ${yRange}`; // Fallback
}

const debug = import.meta.env.VITE_DEBUG === 'true';
let eventSource: EventSource | null = null;
let cooldownInterval: any = null;
let cooldownRemaining = 0;

export function startCooldownDisplay(duration: number) {
    if (cooldownInterval) clearInterval(cooldownInterval);

    cooldownRemaining = duration;
    updateUserInfo(); // Initial display

    cooldownInterval = setInterval(() => {
        cooldownRemaining--;
        if (cooldownRemaining > 0) {
            updateUserInfo();
        } else {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
            cooldownRemaining = 0;
            updateUserInfo(); // Final update to remove the cooldown display
        }
    }, 1000);
}

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
                    <div class="livechat-user-details" id="area-info"><i class="material-icons">my_location</i> Area: ...</div>
                </div>
                    <div class="livechat-header-actions">
                        <button class="livechat-stats-btn"><i class="material-icons">query_stats</i></button>
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
        <label class="setting-item">
            <span>Press Enter to Send</span>
            <div class="m3-switch">
                <input type="checkbox" id="enter-to-send" />
                <div class="m3-switch-track"></div>
                <div class="m3-switch-thumb-container">
                    <div class="m3-switch-thumb"></div>
                </div>
            </div>
        </label>
        <label class="setting-item">
            <span>Lock Chat to Region</span>
            <div class="m3-switch">
                <input type="checkbox" id="lock-chat" />
                <div class="m3-switch-track"></div>
                <div class="m3-switch-thumb-container">
                    <div class="m3-switch-thumb"></div>
                </div>
            </div>
        </label>
        <button class="livechat-settings-close"><i class="material-icons">close</i></button>
    </div>
`;
document.body.appendChild(settingsModal);

// Create stats modal
export const statsModal = document.createElement('div');
statsModal.className = 'livechat-stats-modal';
statsModal.style.display = 'none'; // Initially hidden
statsModal.innerHTML = `
    <div class="livechat-stats-content">
        <h4>Event Stats</h4>
        <div id="stats-data"></div>
        <button class="livechat-stats-close"><i class="material-icons">close</i></button>
    </div>
`;
document.body.appendChild(statsModal);

// Create info popup
export const infoPopup = document.createElement('div');
infoPopup.className = 'livechat-info-popup';
document.body.appendChild(infoPopup);


// Get elements
export const regionMessages = document.getElementById('region-messages') as HTMLElement;
export const allianceMessages = document.getElementById('alliance-messages') as HTMLElement;
export const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
export const sendButton = document.getElementById('sendButton') as HTMLButtonElement;
export const closeButton = modal.querySelector('.livechat-close') as HTMLButtonElement;
const statsButton = modal.querySelector('.livechat-stats-btn') as HTMLButtonElement;
const settingsButton = modal.querySelector('.livechat-settings-btn') as HTMLButtonElement;
const statsCloseButton = statsModal.querySelector('.livechat-stats-close') as HTMLButtonElement;
const settingsCloseButton = settingsModal.querySelector('.livechat-settings-close') as HTMLButtonElement;
const enterToSendCheckbox = document.getElementById('enter-to-send') as HTMLInputElement;
const lockChatCheckbox = document.getElementById('lock-chat') as HTMLInputElement;
export const userInfo = document.getElementById('userInfo') as HTMLElement;
export const chatTabs = document.getElementById('chatTabs') as HTMLElement;

// Load settings on startup
loadSettings();
const settings = getSettings();
enterToSendCheckbox.checked = settings.enterToSend;
lockChatCheckbox.checked = settings.lockChat;

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


// Stats modal listeners
statsButton.addEventListener('click', async () => {
    const statsData = await checkEventProgress();
    const statsDataElement = document.getElementById('stats-data') as HTMLElement;
    if (statsData && statsData.claimed) {
        statsDataElement.innerHTML = `<p>Pumpkins Number Claimed:</p>
        <span>${sort(statsData.claimed)}</span>
        `;
    } else {
        statsDataElement.innerHTML = `<p>Could not load stats.</p>`;
    }
    statsModal.style.display = 'flex';
});

statsCloseButton.addEventListener('click', () => {
    statsModal.style.display = 'none';
});

statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) {
        statsModal.style.display = 'none';
    }
});

// Setting change listener
enterToSendCheckbox.addEventListener('change', (e) => {
    setSettings({ enterToSend: (e.target as HTMLInputElement).checked });
});

lockChatCheckbox.addEventListener('change', (e) => {
    setSettings({ lockChat: (e.target as HTMLInputElement).checked });
});


// Auto-resize textarea and handle character limit
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';

    const count = this.value.length;
    if (count > 128) {
        this.classList.add('input-error');
        sendButton.disabled = true;
    } else {
        this.classList.remove('input-error');
        sendButton.disabled = false;
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
    const pixelData = getPixelData();
    const currentChatRoom = getCurrentChatRoom();

    if (userData) {
        let regionName = regionData ? regionData.name.split('_')[0] : "No region";
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

        let regionInfo = '';
        let areaInfo = '';

        let regionDisplay = '';

        if (currentChatRoom === 'region') {
            if (pixelData) {
                let cooldownText = '';
                if (cooldownRemaining > 0) {
                    cooldownText = ` <span style="opacity: 0.7;">(cooldown: ${cooldownRemaining}s)</span><i class="material-icons cooldown-info-icon" id="cooldown-info">info_outline</i>`;
                }
                const line1 = `${regionName} #${pixelData.boardId}${cooldownText}`;

                const roomName = getRoomNameFromRanges(pixelData.xRange, pixelData.yRange);
                const rangesText = `(${pixelData.xRange}, ${pixelData.yRange})`;
                const line2 = `${roomName} ${rangesText}`;

                regionDisplay = `
                    <div class="livechat-user-details"><i class="material-icons">place</i> ${line1}</div>
                    <div class="livechat-user-details"><i class="material-icons">my_location</i> ${line2}</div>
                `;
            } else {
                regionDisplay = `<div class="livechat-user-details"><i class="material-icons">place</i> ${regionName}</div>`;
            }
        } else {
            regionDisplay = `
                <div class="livechat-user-details"><i class="material-icons">group</i> ${allianceName}</div>
                ${allianceDetails}
            `;
        }

        userInfo.innerHTML = `
            <h3><i class="material-icons">person</i> ${userData.name} <span style="font-weight: 300; font-size: 14px;">#${userData.id}</span></h3>
            ${regionDisplay}
            <div class="game-status">Level ${Math.floor(userData.level)}</div>
        `;

        if (cooldownRemaining > 0) {
            const infoIcon = document.getElementById('cooldown-info');
            if (infoIcon) {
                infoIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    infoPopup.textContent = `You can change regions once cooldown.`;
                    const rect = infoIcon.getBoundingClientRect();
                    infoPopup.style.left = `${rect.left + window.scrollX}px`;
                    infoPopup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                    infoPopup.classList.add('show');
                    setTimeout(() => infoPopup.classList.remove('show'), 3000);
                });
            }
        }
    } else {
        userInfo.innerHTML = `
            <h3><i class="material-icons">person</i> Loading...</h3>
            <div class="livechat-user-details"><i class="material-icons">place</i> Region: ...</div>
            <div class="livechat-user-details" id="area-info"><i class="material-icons">my_location</i> Area: ...</div>
            <div class="game-status">Loading</div>
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

function renderMessageList(messagesContainer: HTMLElement, response: any, chatRoomName: string, pixelData: any) {
    const userData = getUserData();
    messagesContainer.innerHTML = '';
    if (response && response.data && response.data.length > 0) {
        if (debug) console.log(`Loaded ${response.data.length} messages for ${chatRoomName}`);
        response.data.forEach((msg: any) => {
            addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
        });
    } else {
        if (debug) console.log(`No messages found for ${chatRoomName}`);

        let mainWelcomeText = `Welcome to ${chatRoomName} chat!`;
        let conversationText = 'Be the first to start the conversation.';

        if (getCurrentChatRoom() === 'region' && pixelData) {
            mainWelcomeText = `Welcome to ${chatRoomName} #${pixelData.boardId} chat!`;
            const roomName = getRoomNameFromRanges(pixelData.xRange, pixelData.yRange);
            conversationText = `Be the first to start the conversation in <strong>${roomName}</strong>`;
        }

        const welcomeMessage = `
            <div><strong>${mainWelcomeText}</strong></div>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">${conversationText}</div>
        `;

        messagesContainer.innerHTML = `
            <div class="info-message">
                <i class="material-icons">chat</i>
                ${welcomeMessage}
            </div>
        `;
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// Load and display messages
export async function loadMessages() {
    const userData = getUserData();
    const regionData = getRegionData();
    const pixelData = getPixelData();
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
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.75;">Click on any pixel on the canvas to join the regional chat for that area.</div>
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
            return;
        }
        chatRoomId = regionData.name;
        chatRoomName = regionData.name.split('_')[0];
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

    if (chatRoomId && chatRoomId === getDisplayedChatRoomId()) {
        if (debug) console.log(`Messages for room ${chatRoomId} are already displayed. Skipping fetch.`);
        return;
    }

    // --- Caching Logic ---
    const cachedMessages = getMessagesFromCache(chatRoomId as string);

    if (cachedMessages) {
        // --- Cache Hit ---
        if (debug) console.log(`Found cached messages for ${chatRoomId}. Rendering instantly from cache.`);
        renderMessageList(messagesContainer, cachedMessages, chatRoomName, pixelData);
        setDisplayedChatRoomId(chatRoomId);
        chatInput.disabled = false;
        sendButton.disabled = false;
    } else {
        // --- Cache Miss ---
        messagesContainer.innerHTML = `
            <div class="loading-indicator">
                <div class="m3-progress-bar" style="width: 50%; margin: 0 auto;"></div>
                <div style="margin-top: 8px;">Loading...</div>
            </div>`;
        chatInput.disabled = true;
        sendButton.disabled = true;

        try {
            let response: any;
            const preloadedMessages = getPreloadedAllianceMessages();

            if (currentChatRoom === 'alliance' && preloadedMessages) {
                if (debug) console.log("Using preloaded alliance messages.");
                response = preloadedMessages;
                setPreloadedAllianceMessages(null);
            } else {
                response = await fetchMessages(chatRoomId as string);
            }

            if (getCurrentChatRoom() !== initialChatRoom) {
                if (debug) console.log(`Room changed from ${initialChatRoom} to ${getCurrentChatRoom()}. Aborting message render.`);
                return;
            }

            // Update cache and render the new list
            setMessagesInCache(chatRoomId as string, response);
            renderMessageList(messagesContainer, response, chatRoomName, pixelData);

            setDisplayedChatRoomId(chatRoomId);
            chatInput.disabled = false;
            sendButton.disabled = false;

        } catch (error) {
            if (debug) console.error('Error loading messages:', error);
            setDisplayedChatRoomId(null);
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

// Helper to sanitize HTML
function escapeHTML(str: string) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
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
            ${escapeHTML(message)}
            <div class="message-timestamp">${timeString}</div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function showSystemMessage(message: string) {
    addMessageToChat('System', message, new Date().toISOString(), false);
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

        // The new message will be received via SSE, so no manual refresh is needed.

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

export function disconnectFromEvents() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
        if (debug) console.log("SSE connection closed.");
    }
}

export function establishSseConnection() {
    disconnectFromEvents(); // Ensure any existing connection is closed

    const userData = getUserData();
    const regionData = getRegionData();
    const currentChatRoom = getCurrentChatRoom();
    let chatRoomId: string | null = null;

    if (currentChatRoom === 'region') {
        if (!regionData) return;
        chatRoomId = regionData.name;
    } else if (currentChatRoom === 'alliance') {
        if (!userData || !userData.allianceId) return;
        chatRoomId = `alliance_${userData.allianceId}`;
    }

    if (chatRoomId && userData) {
        if (debug) console.log(`Establishing SSE connection for ${chatRoomId}`);
        const currentRoomId = chatRoomId; // Capture room ID for closure

        eventSource = connectToEvents(chatRoomId, (newMessage) => {
            if (debug) console.log("SSE message received:", newMessage);

            // Ensure the message is for the currently active chat room
            if (newMessage.region === currentRoomId) {
                // Add message to the visible chat UI
                addMessageToChat(newMessage.name, newMessage.messages, newMessage.createdAt, newMessage.uid === userData.id.toString());

                // Also add the new message to the cache for this room
                const cachedResponse = getMessagesFromCache(currentRoomId);
                if (cachedResponse && cachedResponse.data) {
                    const newMsgData = {
                        name: newMessage.name,
                        messages: newMessage.messages,
                        createdAt: newMessage.createdAt,
                        uid: newMessage.uid
                    };
                    cachedResponse.data.push(newMsgData);
                    setMessagesInCache(currentRoomId, cachedResponse);
                    if (debug) console.log(`Appended new message to cache for ${currentRoomId}`);
                }
            }
        });
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
            loadMessages(); // Load history for the new room
            establishSseConnection(); // Establish SSE for the new room
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
    establishSseConnection();

    if (userData && getRegionData()) {
    }
}
