// ==UserScript==
// @name         Wplace Live Chats
// @version      1.0
// @description  Livechat for wplace.live
// @author       mininxd
// @match        https://wplace.live/*
// @match        https://wplace.live
// @grant        GM_xmlhttpRequest
// @connect      wplace-live-chat-server.vercel.app
// @connect      backend.wplace.live
// ==/UserScript==

(function() {
    'use strict';

    const debug = true;

    // Load external resources
    const loadCSS = (href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    };

    const loadJS = (src, callback) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    };

    // Load Rubik font and Remix Icons
    loadCSS('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
    loadCSS('https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css');

    // Create styles with Material You colors
    const styles = `
        :root {
            --sys-color-primary: #1a73e8;
            --sys-color-primary-dark: #1a63d3;
            --sys-color-on-primary: #ffffff;
            --sys-color-primary-container: #d6e2ff;
            --sys-color-on-primary-container: #001a41;
            --sys-color-secondary: #565f71;
            --sys-color-on-secondary: #ffffff;
            --sys-color-secondary-container: #dae2f9;
            --sys-color-on-secondary-container: #131c2b;
            --sys-color-tertiary: #d63384;
            --sys-color-on-tertiary: #ffffff;
            --sys-color-tertiary-container: #ffd7ec;
            --sys-color-on-tertiary-container: #30001f;
            --sys-color-surface: #fdfbff;
            --sys-color-on-surface: #1b1b1f;
            --sys-color-surface-variant: #e1e2ec;
            --sys-color-on-surface-variant: #44474f;
            --sys-color-outline: #74777f;
            --sys-color-shadow: #000000;
            --sys-color-surface-container-highest: #e6e0e9;
        }

        .livechat-container {
            font-family: 'Rubik', system-ui, -apple-system, sans-serif;
            position: fixed;
            z-index: 10000;
        }

        .livechat-fab {
            position: fixed;
            bottom: 20vh;
            right: 24px;
            background: var(--sys-color-primary);
            color: var(--sys-color-on-primary);
            border: none;
            border-radius: 16px;
            padding: 16px 24px;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.1px;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10001;
            display: flex !important;
            align-items: center;
            gap: 8px;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .livechat-fab:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            background: var(--sys-color-primary-dark);
        }

        .livechat-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10002;
        }

        .livechat-modal.show {
            display: flex;
        }

        .livechat-content {
            background: var(--sys-color-surface);
            border-radius: 24px;
            width: 400px;
            height: 600px;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            border: 1px solid var(--sys-color-outline);
        }

        .livechat-header {
            background: linear-gradient(135deg, var(--sys-color-primary), var(--sys-color-primary-dark));
            color: var(--sys-color-on-primary);
            padding: 12px 24px 0;
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid var(--sys-color-outline);
        }

        .livechat-header-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            padding-bottom: 12px;
        }

        .livechat-tabs {
            display: flex;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin: 0 -24px;
            padding: 0 12px;
        }

        .livechat-tab {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            color: var(--sys-color-on-primary);
            opacity: 0.7;
            transition: all 0.2s;
            font-size: 14px;
            font-weight: 500;
        }

        .livechat-tab.active {
            opacity: 1;
            border-bottom-color: var(--sys-color-on-primary);
        }

        .livechat-tab:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
        }

        .livechat-user-info h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 500;
        }

        .livechat-user-details {
            font-size: 12px;
            opacity: 0.9;
            margin: 2px 0;
        }

        .livechat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            color: var(--sys-color-on-primary);
            cursor: pointer;
            font-size: 18px;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .livechat-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .livechat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: var(--sys-color-surface);
            scrollbar-width: thin;
            scrollbar-color: var(--sys-color-primary) transparent;
        }

        .livechat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .livechat-messages::-webkit-scrollbar-thumb {
            background: var(--sys-color-primary);
            border-radius: 3px;
        }

        .chat-message {
            margin-bottom: 12px;
            animation: slideIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .chat-message.own {
            align-items: flex-end;
        }

        .message-author {
            font-size: 12px;
            font-weight: 600;
            color: var(--sys-color-secondary);
            margin-bottom: 4px;
        }

        .message-content {
            background: var(--sys-color-surface-container-highest);
            padding: 14px 18px;
            border-radius: 18px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--sys-color-surface-variant);
            font-size: 16px;
            line-height: 1.4;
            color: var(--sys-color-on-surface);
            max-width: 80%;
            overflow-wrap: break-word;
            word-break: break-word;
        }

        .message-content.own {
            background: var(--sys-color-primary);
            color: var(--sys-color-on-primary);
        }

        .message-content.own .message-author {
            color: var(--sys-color-on-primary);
        }

        .livechat-input-area {
            padding: 16px 20px;
            background: var(--sys-color-surface-container-highest);
            border-top: 1px solid var(--sys-color-outline);
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .livechat-input {
            flex: 1;
            border: 2px solid var(--sys-color-surface-variant);
            border-radius: 24px;
            padding: 12px 16px;
            font-size: 14px;
            font-family: 'Rubik', sans-serif;
            resize: none;
            min-height: 20px;
            max-height: 80px;
            background: var(--sys-color-surface);
            transition: border-color 0.2s;
            outline: none;
            overflow-y: hidden;
        }

        .livechat-input:focus {
            border-color: var(--sys-color-primary);
        }

        .livechat-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .livechat-send {
            background: var(--sys-color-primary);
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            color: var(--sys-color-on-primary);
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .livechat-send:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            background: var(--sys-color-secondary);
        }

        .livechat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .game-status {
            font-size: 11px;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 8px;
            margin-top: 4px;
            display: inline-block;
        }

        .message-timestamp {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
            color: var(--sys-color-on-surface-variant);
        }

        .message-content.own .message-timestamp {
            color: rgba(255, 255, 255, 0.7);
        }

        .loading-indicator, .info-message {
            text-align: center;
            padding: 20px;
            color: var(--sys-color-on-surface-variant);
        }

        .info-message {
            background: var(--sys-color-primary-container);
            border-radius: 12px;
            margin: 16px;
            border: 1px solid var(--sys-color-outline);
        }

        .info-message i {
            font-size: 24px;
            color: var(--sys-color-primary);
            margin-bottom: 8px;
            display: block;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .m3-progress-bar {
            position: relative;
            width: 100%;
            height: 4px;
            background-color: var(--sys-color-surface-variant);
            border-radius: 2px;
            overflow: hidden;
        }

        .m3-progress-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 40%;
            background-color: var(--sys-color-primary);
            border-radius: 2px;
            animation: m3-progress-single-line 1.5s linear infinite;
        }

        @keyframes m3-progress-single-line {
            0% {
                left: -40%;
            }
            100% {
                left: 100%;
            }
        }

        @media (max-width: 480px) {
            .livechat-content {
                width: 100%;
                height: 100%;
                border-radius: 0;
                max-width: 100vw;
                max-height: 100vh;
            }

            .livechat-fab {
                bottom: 15vh;
                right: 16px;
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Global state
    let userData = null;
    let regionData = null;
    let allianceData = null;
    let lastPixelUrl = null;
    let currentChatRoom = 'region'; // 'region' or 'alliance'

    // --- Data Fetching via Performance Entries ---
    let regionDataPoller = null;
    let lastCheckedUrl = '';

    async function checkForPixelUrl() {
        if (regionData) {
            if (regionDataPoller) clearInterval(regionDataPoller);
            return;
        }

        const resources = performance.getEntriesByType("resource");
        const pixelResource = resources.reverse().find(r => r.name.includes("https://backend.wplace.live/s0/pixel/"));

        if (pixelResource && pixelResource.name !== lastCheckedUrl) {
            lastCheckedUrl = pixelResource.name;
            const url = lastCheckedUrl.split('?')[0];
            if (debug) console.log("Found pixel URL in performance entries:", url);

            try {
                const data = await fetchAPI(url);
                if (data && data.region && data.region.name) {
                    regionData = data.region;
                    if (debug) console.log("Region data fetched successfully:", regionData);
                    if (regionDataPoller) clearInterval(regionDataPoller);

                    // Dispatch a custom event to notify the rest of the script
                    document.dispatchEvent(new CustomEvent('regionDataFound'));
                }
            } catch (error) {
                if (debug) console.error("Error fetching region data from performance entry:", error);
            }
        }
    }

    function startDataPolling() {
        if (!regionDataPoller) {
            regionDataPoller = setInterval(checkForPixelUrl, 1000);
        }
    }

    document.addEventListener('regionDataFound', () => {
        if (modal.classList.contains('show')) {
            updateUserInfo();
            loadMessages();
        }
    });

    // API functions
    const API_BASE = 'https://wplace-live-chat-server.vercel.app';

    const fetchAPI = async (url, options = {}) => {
        try {
            const res = await fetch(url, {
                credentials: 'include',
                ...options
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    };

    function fetchMessages(region) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${API_BASE}/users/${region}`,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    function sendMessage(uid, name, message, region) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${API_BASE}/send`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    uid: uid.toString(),
                    name: name,
                    messages: message,
                    region: region
                }),
                onload: function(response) {
                    try {
                        if (response.status >= 200 && response.status < 300) {
                            const data = response.responseText ? JSON.parse(response.responseText) : {};
                            resolve(data);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // Create floating action button
    const fab = document.createElement('button');
    fab.className = 'livechat-fab';
    fab.innerHTML = '<i class="ri-chat-3-line"></i> Live Chat';
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
    const modal = document.createElement('div');
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

    // Add elements to page
    document.body.appendChild(fab);
    document.body.appendChild(modal);

    // Get elements
    const regionMessages = document.getElementById('region-messages');
    const allianceMessages = document.getElementById('alliance-messages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const closeButton = modal.querySelector('.livechat-close');
    const userInfo = document.getElementById('userInfo');
    const chatTabs = document.getElementById('chatTabs');

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });

    // Initialize user data
    async function initializeUserData() {
        try {
            userData = await fetchAPI('https://backend.wplace.live/me');
            if (userData) {
                if (debug) console.log("User data loaded:", userData);

                if (userData.allianceId) {
                    try {
                        allianceData = await fetchAPI(`https://backend.wplace.live/alliance`);
                        if (allianceData && debug) console.log("Alliance data loaded:", allianceData);
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
    function updateUserInfo() {
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
                    allianceDetails += `<div class="livechat-user-details"><i class="ri-group-line"></i> ${details.join(' &bull; ')}</div>`;
                }

                if(allianceData.description){
                    allianceDetails += `<div class="livechat-user-details" style="font-style: italic; opacity: 0.8;"><i class="ri-information-line"></i> ${allianceData.description}</div>`;
                }
            } else if (userData.allianceId) {
                allianceName = `Alliance`; // Fallback while loading
            }

            let chatContextInfo = currentChatRoom === 'region' ? `Region: ${regionName}` : allianceName;

            userInfo.innerHTML = `
                <h3><i class="ri-user-line"></i> ${userData.name} <span style="font-weight: 300;">#${userData.id}</span></h3>
                <div class="livechat-user-details"><i class="ri-map-pin-line"></i> ${chatContextInfo}</div>
                ${allianceDetails}
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

    // Load and display messages
    async function loadMessages() {
        let chatRoomId = null;
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

            const response = await fetchMessages(chatRoomId);

            if (isInitialLoad) {
                messagesContainer.innerHTML = ''; // Clear loading indicator
                if (response && response.data && response.data.length > 0) {
                    if (debug) console.log(`Loaded ${response.data.length} messages for ${chatRoomName}`);
                    response.data.forEach(msg => {
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
                const lastMessage = messagesContainer.querySelector('.chat-message:last-child');
                const lastTimestamp = lastMessage ? lastMessage.dataset.timestamp : null;

                if (lastTimestamp && response && response.data && response.data.length > 0) {
                    const newMessages = response.data.filter(msg => new Date(msg.createdAt) > new Date(lastTimestamp));
                    if (newMessages.length > 0 && debug) {
                        console.log(`Found ${newMessages.length} new messages.`);
                    }
                    newMessages.forEach(msg => {
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

    // Add message to chat display
    function addMessageToChat(name, message, timestamp, isOwn = false) {
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
    async function handleSendMessage() {
        if (!userData) return;

        let chatRoomId = null;
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

    // Auto-refresh messages every 10 seconds
    let refreshInterval;

    function startAutoRefresh() {
        refreshInterval = setInterval(() => {
            if (modal.classList.contains('show') && userData) {
                if (currentChatRoom === 'region' && !regionData) {
                    // Don't refresh region chat if there's no region data
                    return;
                }
                loadMessages();
            }
        }, 10000);
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    // Event listeners
    fab.addEventListener('click', async () => {
        modal.classList.add('show');

        // Load GSAP and Draggable
        loadJS('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js', () => {
            loadJS('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/Draggable.min.js', () => {
                gsap.registerPlugin(Draggable);
                Draggable.create(".livechat-fab", {
                    bounds: "body",
                    allowEventDefault: true
                });
            });
        });

        // Initialize user data if not already loaded
        if (!userData) {
            await initializeUserData();
        }

        // Set initial chat room
        let lastRoom = localStorage.getItem('wplace-chat-last-room');
        if (lastRoom === 'alliance' && userData && userData.allianceId) {
            currentChatRoom = 'alliance';
            regionMessages.style.display = 'none';
            allianceMessages.style.display = 'block';
        } else {
            currentChatRoom = 'region';
            regionMessages.style.display = 'block';
            allianceMessages.style.display = 'none';
        }

        updateUserInfo();
        await loadMessages();
        startAutoRefresh();

        if (userData && regionData) {
            chatInput.focus();
        }
    });

    chatTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('livechat-tab')) {
            const room = e.target.dataset.room;
            if (room !== currentChatRoom) {
                currentChatRoom = room;
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
    });

    closeButton.addEventListener('click', () => {
        modal.classList.remove('show');
        stopAutoRefresh();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            stopAutoRefresh();
        }
    });

    sendButton.addEventListener('click', handleSendMessage);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show') && !e.target.closest('.livechat-input')) {
            modal.classList.remove('show');
            stopAutoRefresh();
        }
    });

    // Initialize on page load
    setTimeout(() => {
        initializeUserData();
        startDataPolling();
    }, 2000);

})();
