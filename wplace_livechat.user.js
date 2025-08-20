(function() {
    'use strict';

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

    // Create styles with Google Blue colors
    const styles = `
        .livechat-container {
            font-family: 'Rubik', system-ui, -apple-system, sans-serif;
            position: fixed;
            z-index: 10000;
        }

        .livechat-fab {
            position: fixed;
            bottom: 20vh;
            right: 24px;
            background: #1976D2;
            color: white;
            border: none;
            border-radius: 16px;
            padding: 16px 24px;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.1px;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(25, 118, 210, 0.3);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            z-index: 10001;
            display: flex !important;
            align-items: center;
            gap: 8px;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .livechat-fab:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(25, 118, 210, 0.4);
            background: #1565C0;
        }

        .livechat-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10002;
        }

        .livechat-modal.show {
            display: flex;
        }

        .livechat-content {
            background: #F8F9FA;
            border-radius: 24px;
            width: 400px;
            height: 600px;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 24px 48px rgba(25, 118, 210, 0.2);
            overflow: hidden;
            border: 1px solid rgba(25, 118, 210, 0.1);
        }

        .livechat-header {
            background: #1976D2;
            color: white;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
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
            color: white;
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
            padding: 16px;
            overflow-y: auto;
            background: #F8F9FA;
            scrollbar-width: thin;
            scrollbar-color: rgba(25, 118, 210, 0.3) transparent;
        }

        .livechat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .livechat-messages::-webkit-scrollbar-thumb {
            background: rgba(25, 118, 210, 0.3);
            border-radius: 3px;
        }

        .chat-message {
            margin-bottom: 12px;
            animation: slideIn 0.3s ease-out;
        }

        .message-author {
            font-size: 12px;
            font-weight: 500;
            color: #1976D2;
            margin-bottom: 4px;
        }

        .message-content {
            background: white;
            padding: 12px 16px;
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
            border: 1px solid rgba(25, 118, 210, 0.05);
            font-size: 14px;
            line-height: 1.4;
        }

        .message-content.own {
            background: #1976D2;
            color: white;
            margin-left: auto;
            max-width: 80%;
        }

        .message-content.own .message-author {
            color: rgba(255, 255, 255, 0.9);
        }

        .livechat-input-area {
            padding: 16px 20px;
            background: white;
            border-top: 1px solid rgba(25, 118, 210, 0.1);
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .livechat-input {
            flex: 1;
            border: 2px solid rgba(25, 118, 210, 0.2);
            border-radius: 24px;
            padding: 12px 16px;
            font-size: 14px;
            font-family: 'Rubik', sans-serif;
            resize: none;
            min-height: 20px;
            max-height: 80px;
            background: #F8F9FA;
            transition: border-color 0.2s;
            outline: none;
        }

        .livechat-input:focus {
            border-color: #1976D2;
        }

        .livechat-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .livechat-send {
            background: #1976D2;
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            color: white;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .livechat-send:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
            background: #1565C0;
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
            color: #666;
        }

        .message-content.own .message-timestamp {
            color: rgba(255, 255, 255, 0.7);
        }

        .loading-indicator, .info-message {
            text-align: center;
            padding: 20px;
            color: #666;
        }

        .info-message {
            background: #E3F2FD;
            border-radius: 12px;
            margin: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
        }

        .info-message i {
            font-size: 24px;
            color: #1976D2;
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

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .loading-spinner {
            animation: spin 1s linear infinite;
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
    let lastPixelUrl = null;

    // --- Robust Request Interception ---

    function handlePixelData(pixelData) {
        console.log("Pixel data received:", pixelData);
        if (pixelData && pixelData.region && pixelData.region.name) {
            regionData = pixelData.region;
            console.log("Region data captured:", regionData);

            // Update UI if chat is open
            if (modal.classList.contains('show')) {
                updateUserInfo();
                loadMessages();
            }
        } else {
            console.log("No region data in pixel response");
        }
    }

    // 1. Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0] instanceof Request ? args[0].url : args[0];
        console.log("FMB_DEBUG (fetch):", url); // Verbose logging

        const result = await originalFetch.apply(this, args);

        if (typeof url === "string" && url.includes("https://backend.wplace.live/s0/pixel")) {
            lastPixelUrl = url.split("?")[0];
            console.log("Detected pixel URL via fetch:", lastPixelUrl);

            try {
                const clonedResponse = result.clone();
                const pixelData = await clonedResponse.json();
                handlePixelData(pixelData);
            } catch (e) {
                console.error("Error processing pixel data from fetch:", e);
            }
        }
        return result;
    };

    // 2. Intercept XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url; // Store url for later use in send
        console.log("FMB_DEBUG (XHR open):", url); // Verbose logging
        return originalXhrOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('load', function() {
            console.log("FMB_DEBUG (XHR load):", this._url); // Verbose logging
            if (typeof this._url === "string" && this._url.includes("https://backend.wplace.live/s0/pixel")) {
                lastPixelUrl = this._url.split("?")[0];
                 console.log("Detected pixel URL via XHR:", lastPixelUrl);
                try {
                    const pixelData = JSON.parse(this.responseText);
                    handlePixelData(pixelData);
                } catch (e) {
                    console.error("Error processing pixel data from XHR:", e);
                }
            }
        });
        return originalXhrSend.apply(this, args);
    };

    // This function is kept for cases where the chat is opened after a pixel URL was detected
    async function fetchRegionFromPixel() {
        if (lastPixelUrl && !regionData) { // Only fetch if we don't have region data yet
            try {
                console.log("Manually fetching region from previously detected URL:", lastPixelUrl);
                const pixelData = await fetchAPI(lastPixelUrl);
                handlePixelData(pixelData); // Use the central handler
                return !!regionData;
            } catch (e) {
                console.error("Error manually fetching pixel data:", e);
            }
        }
        return false;
    }

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
                <div class="livechat-user-info" id="userInfo">
                    <h3><i class="ri-user-line"></i> Loading...</h3>
                    <div class="livechat-user-details"><i class="ri-hashtag"></i> ID: ...</div>
                    <div class="livechat-user-details"><i class="ri-map-pin-line"></i> Region: ...</div>
                    <div class="game-status"><i class="ri-circle-fill" style="color: #4CAF50; font-size: 8px;"></i> Online</div>
                </div>
                <button class="livechat-close"><i class="ri-close-line"></i></button>
            </div>
            <div class="livechat-messages" id="chatMessages">
                <div class="loading-indicator">
                    <i class="ri-loader-4-line loading-spinner"></i> Loading...
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
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const closeButton = modal.querySelector('.livechat-close');
    const userInfo = document.getElementById('userInfo');

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
                console.log("User data loaded:", userData);
                updateUserInfo();
                return true;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
        return false;
    }

    // Add debug info to user info display
    function updateUserInfo() {
        if (userData && regionData) {
            userInfo.innerHTML = `
                <h3><i class="ri-user-line"></i> ${userData.name}</h3>
                <div class="livechat-user-details"><i class="ri-hashtag"></i> ID: ${userData.id}</div>
                <div class="livechat-user-details"><i class="ri-map-pin-line"></i> Region: ${regionData.name}</div>
                <div class="game-status"><i class="ri-circle-fill" style="color: #4CAF50; font-size: 8px;"></i> Level ${Math.floor(userData.level)}</div>
            `;
        } else if (userData && !regionData) {
            userInfo.innerHTML = `
                <h3><i class="ri-user-line"></i> ${userData.name}</h3>
                <div class="livechat-user-details"><i class="ri-hashtag"></i> ID: ${userData.id}</div>
                <div class="livechat-user-details"><i class="ri-map-pin-line"></i> No region selected</div>
                <div class="game-status"><i class="ri-circle-fill" style="color: #4CAF50; font-size: 8px;"></i> Level ${Math.floor(userData.level)}</div>
                ${lastPixelUrl ? `<div style="font-size: 10px; opacity: 0.5; margin-top: 4px;">Pixel detected: ${lastPixelUrl.split('/').pop()}</div>` : ''}
            `;
        } else {
            userInfo.innerHTML = `
                <h3><i class="ri-user-line"></i> Loading...</h3>
                <div class="livechat-user-details"><i class="ri-hashtag"></i> ID: ...</div>
                <div class="livechat-user-details"><i class="ri-map-pin-line"></i> Region: ...</div>
                <div class="game-status"><i class="ri-circle-fill" style="color: #FF9800; font-size: 8px;"></i> Loading</div>
            `;
        }
    }

    // Load and display messages
    async function loadMessages() {
        // Try to fetch region data if we don't have it but have a pixel URL
        if (!regionData && lastPixelUrl) {
            console.log("No region data, trying to fetch from pixel URL...");
            await fetchRegionFromPixel();
        }

        if (!regionData) {
            console.log("Still no region data available");
            chatMessages.innerHTML = `
                <div class="info-message">
                    <i class="ri-cursor-line"></i>
                    <div><strong>Tap on a pixel first to enter chat rooms</strong></div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Click on any pixel on the canvas to join the regional chat for that area.</div>
                    ${lastPixelUrl ? `<div style="font-size: 10px; margin-top: 4px; opacity: 0.5;">Debug: Pixel detected but no region data</div>` : ''}
                </div>
            `;
            chatInput.disabled = true;
            sendButton.disabled = true;
            return;
        }

        if (!userData) {
            chatMessages.innerHTML = `
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

        try {
            console.log("Loading messages for region:", regionData.name);
            chatMessages.innerHTML = `
                <div class="loading-indicator">
                    <i class="ri-loader-4-line loading-spinner"></i> Loading messages for ${regionData.name}...
                </div>
            `;

            const response = await fetchMessages(regionData.name);
            chatMessages.innerHTML = '';

            if (response && response.data && response.data.length > 0) {
                console.log(`Loaded ${response.data.length} messages for ${regionData.name}`);
                response.data.forEach(msg => {
                    addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
                });
            } else {
                console.log("No messages found for region:", regionData.name);
                chatMessages.innerHTML = `
                    <div class="info-message">
                        <i class="ri-chat-new-line"></i>
                        <div><strong>Welcome to ${regionData.name} chat!</strong></div>
                        <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Be the first to start the conversation in this region.</div>
                    </div>
                `;
            }

            chatMessages.scrollTop = chatMessages.scrollHeight;
            chatInput.disabled = false;
            sendButton.disabled = false;
        } catch (error) {
            console.error('Error loading messages:', error);
            chatMessages.innerHTML = `
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

    // Add message to chat display
    function addMessageToChat(name, message, timestamp, isOwn = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';

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
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send message function
    async function handleSendMessage() {
        if (!userData || !regionData) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Disable send button
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="ri-loader-4-line loading-spinner"></i>';

        try {
            // Add message to chat immediately with current timestamp
            const currentTime = new Date().toISOString();
            addMessageToChat(userData.name, message, currentTime, true);

            // Clear input
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Send to server
            await sendMessage(userData.id, userData.name, message, regionData.name);

            // Refresh messages after a short delay to get the actual server response
            setTimeout(() => {
                loadMessages();
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
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
            if (modal.classList.contains('show') && regionData && userData) {
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
                Draggable.create(".livechat-content", {
                    trigger: ".livechat-header",
                    bounds: "body"
                });
            });
        });

        // Initialize user data if not already loaded
        if (!userData) {
            await initializeUserData();
        }

        updateUserInfo();
        await loadMessages();
        startAutoRefresh();

        if (userData && regionData) {
            chatInput.focus();
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
    }, 2000);

})();
