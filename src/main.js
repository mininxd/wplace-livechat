"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./style.css");
var gsap_1 = require("gsap");
var Draggable_1 = require("gsap/Draggable");
gsap_1.gsap.registerPlugin(Draggable_1.Draggable);
/// <reference types="@types/greasemonkey" />
var debug = false;
// Global state
var userData = null;
var regionData = null;
var allianceData = null;
// let lastPixelUrl: string | null = null;
var currentChatRoom = 'region'; // 'region' or 'alliance'
// --- Data Fetching via Performance Entries ---
var regionDataPoller = null;
var lastCheckedUrl = '';
function checkForPixelUrl() {
    return __awaiter(this, void 0, void 0, function () {
        var resources, pixelResource, url, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (regionData) {
                        if (regionDataPoller)
                            clearInterval(regionDataPoller);
                        return [2 /*return*/];
                    }
                    resources = performance.getEntriesByType("resource");
                    pixelResource = resources.reverse().find(function (r) { return r.name.includes("https://backend.wplace.live/s0/pixel/"); });
                    if (!(pixelResource && pixelResource.name !== lastCheckedUrl)) return [3 /*break*/, 4];
                    lastCheckedUrl = pixelResource.name;
                    url = lastCheckedUrl.split('?')[0];
                    if (debug)
                        console.log("Found pixel URL in performance entries:", url);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchAPI(url)];
                case 2:
                    data = _a.sent();
                    if (data && data.region && data.region.name) {
                        regionData = data.region;
                        if (debug)
                            console.log("Region data fetched successfully:", regionData);
                        if (regionDataPoller)
                            clearInterval(regionDataPoller);
                        // Dispatch a custom event to notify the rest of the script
                        document.dispatchEvent(new CustomEvent('regionDataFound'));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    if (debug)
                        console.error("Error fetching region data from performance entry:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function startDataPolling() {
    if (!regionDataPoller) {
        regionDataPoller = setInterval(checkForPixelUrl, 1000);
    }
}
document.addEventListener('regionDataFound', function () {
    if (modal.classList.contains('show')) {
        updateUserInfo();
        loadMessages();
    }
});
// API functions
var API_BASE = 'https://wplace-live-chat-server.vercel.app';
var fetchAPI = function (url_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1], args_1, true), void 0, function (url, options) {
        var res, e_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(url, __assign({ credentials: 'include' }, options))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    e_1 = _a.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
};
function fetchMessages(region) {
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: "".concat(API_BASE, "/users/").concat(region),
            onload: function (response) {
                try {
                    var data = JSON.parse(response.responseText);
                    resolve(data);
                }
                catch (e) {
                    reject(e);
                }
            },
            onerror: function (error) {
                reject(error);
            }
        });
    });
}
function sendMessage(uid, name, message, region) {
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: "".concat(API_BASE, "/send"),
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                uid: uid.toString(),
                name: name,
                messages: message,
                region: region
            }),
            onload: function (response) {
                try {
                    if (response.status >= 200 && response.status < 300) {
                        var data = response.responseText ? JSON.parse(response.responseText) : {};
                        resolve(data);
                    }
                    else {
                        reject(new Error("HTTP ".concat(response.status)));
                    }
                }
                catch (e) {
                    reject(e);
                }
            },
            onerror: function (error) {
                reject(error);
            }
        });
    });
}
// Create floating action button
var fab = document.createElement('button');
fab.className = 'livechat-fab';
fab.innerHTML = '<i class="ri-chat-3-line"></i> Live Chat';
fab.style.display = 'flex';
fab.style.visibility = 'visible';
fab.style.opacity = '1';
// Ensure FAB is always visible
var ensureFABVisible = function () {
    if (fab && document.body.contains(fab)) {
        fab.style.display = 'flex';
        fab.style.visibility = 'visible';
        fab.style.opacity = '1';
    }
    else if (fab) {
        document.body.appendChild(fab);
    }
};
// Check FAB visibility periodically
setInterval(ensureFABVisible, 2000);
// Create modal
var modal = document.createElement('div');
modal.className = 'livechat-modal';
modal.innerHTML = "\n    <div class=\"livechat-content\">\n        <div class=\"livechat-header\">\n            <div class=\"livechat-header-main\">\n                <div class=\"livechat-user-info\" id=\"userInfo\">\n                    <h3><i class=\"ri-user-line\"></i> Loading...</h3>\n                    <div class=\"livechat-user-details\"><i class=\"ri-hashtag\"></i> ID: ...</div>\n                    <div class=\"livechat-user-details\"><i class=\"ri-map-pin-line\"></i> Region: ...</div>\n                    <div class=\"game-status\"><i class=\"ri-circle-fill\" style=\"color: #4CAF50; font-size: 8px;\"></i> Online</div>\n                </div>\n                <button class=\"livechat-close\"><i class=\"ri-close-line\"></i></button>\n            </div>\n            <div class=\"livechat-tabs\" id=\"chatTabs\">\n                </div>\n        </div>\n        <div class=\"livechat-messages\" id=\"region-messages\">\n            <div class=\"loading-indicator\">\n                <div class=\"m3-progress-bar\" style=\"width: 50%; margin: 0 auto;\"></div>\n                <div style=\"margin-top: 8px;\">Loading...</div>\n            </div>\n        </div>\n        <div class=\"livechat-messages\" id=\"alliance-messages\" style=\"display: none;\">\n             <div class=\"loading-indicator\">\n                <div class=\"m3-progress-bar\" style=\"width: 50%; margin: 0 auto;\"></div>\n                <div style=\"margin-top: 8px;\">Loading...</div>\n            </div>\n        </div>\n        <div class=\"livechat-input-area\">\n            <textarea class=\"livechat-input\" placeholder=\"Type your message...\" rows=\"1\" id=\"chatInput\" disabled></textarea>\n            <button class=\"livechat-send\" id=\"sendButton\" disabled><i class=\"ri-send-plane-fill\"></i></button>\n        </div>\n    </div>\n";
// Add elements to page
document.body.appendChild(fab);
document.body.appendChild(modal);
// Get elements
var regionMessages = document.getElementById('region-messages');
var allianceMessages = document.getElementById('alliance-messages');
var chatInput = document.getElementById('chatInput');
var sendButton = document.getElementById('sendButton');
var closeButton = modal.querySelector('.livechat-close');
var userInfo = document.getElementById('userInfo');
var chatTabs = document.getElementById('chatTabs');
// Auto-resize textarea
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
});
// Initialize user data
function initializeUserData() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, fetchAPI('https://backend.wplace.live/me')];
                case 1:
                    userData = _a.sent();
                    if (!userData) return [3 /*break*/, 6];
                    if (debug)
                        console.log("User data loaded:", userData);
                    if (!userData.allianceId) return [3 /*break*/, 5];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetchAPI("https://backend.wplace.live/alliance/".concat(userData.allianceId))];
                case 3:
                    allianceData = _a.sent();
                    if (allianceData && debug)
                        console.log("Alliance data loaded:", allianceData);
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    if (debug)
                        console.error('Error loading alliance data:', error_2);
                    return [3 /*break*/, 5];
                case 5:
                    updateUserInfo();
                    return [2 /*return*/, true];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_3 = _a.sent();
                    if (debug)
                        console.error('Error loading user data:', error_3);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, false];
            }
        });
    });
}
// Add debug info to user info display
function updateUserInfo() {
    if (userData) {
        var regionName = regionData ? regionData.name : "No region";
        var allianceName = ''; // Default to empty string if not in alliance
        if (userData.allianceId) {
            if (allianceData && allianceData.name) {
                allianceName = "Alliance: ".concat(allianceData.name);
            }
            else {
                allianceName = "Alliance"; // Fallback while loading
            }
        }
        userInfo.innerHTML = "\n            <h3><i class=\"ri-user-line\"></i> ".concat(userData.name, " <span style=\"font-weight: 300;\">#").concat(userData.id, "</span></h3>\n            <div class=\"livechat-user-details\"><i class=\"ri-map-pin-line\"></i> ").concat(currentChatRoom === 'region' ? "Region: ".concat(regionName) : allianceName, "</div>\n            <div class=\"game-status\"><i class=\"ri-circle-fill\" style=\"color: #4CAF50; font-size: 8px;\"></i> Level ").concat(Math.floor(userData.level), "</div>\n        ");
    }
    else {
        userInfo.innerHTML = "\n            <h3><i class=\"ri-user-line\"></i> Loading...</h3>\n            <div class=\"livechat-user-details\"><i class=\"ri-map-pin-line\"></i> Region: ...</div>\n            <div class=\"game-status\"><i class=\"ri-circle-fill\" style=\"color: #FF9800; font-size: 8px;\"></i> Loading</div>\n        ";
    }
    // Update tabs
    chatTabs.innerHTML = '';
    var regionTab = document.createElement('div');
    regionTab.className = 'livechat-tab';
    regionTab.textContent = 'Region';
    regionTab.dataset.room = 'region';
    if (currentChatRoom === 'region')
        regionTab.classList.add('active');
    chatTabs.appendChild(regionTab);
    if (userData && userData.allianceId) {
        var allianceTab = document.createElement('div');
        allianceTab.className = 'livechat-tab';
        allianceTab.textContent = 'Alliance';
        allianceTab.dataset.room = 'alliance';
        if (currentChatRoom === 'alliance')
            allianceTab.classList.add('active');
        chatTabs.appendChild(allianceTab);
    }
}
// Load and display messages
function loadMessages() {
    return __awaiter(this, void 0, void 0, function () {
        var chatRoomId, chatRoomName, messagesContainer, isInitialLoad, response, lastMessage, lastTimestamp_1, newMessages, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    chatRoomId = null;
                    chatRoomName = '';
                    messagesContainer = currentChatRoom === 'region' ? regionMessages : allianceMessages;
                    if (currentChatRoom === 'region') {
                        if (!regionData) {
                            if (debug)
                                console.log("Still no region data available for region chat");
                            messagesContainer.innerHTML = "\n                <div class=\"info-message\">\n                    <i class=\"ri-cursor-line\"></i>\n                    <div><strong>Tap on a pixel to join a region's chat</strong></div>\n                    <div style=\"font-size: 12px; margin-top: 8px; opacity: 0.7;\">Click on any pixel on the canvas to join the regional chat for that area.</div>\n                </div>\n            ";
                            chatInput.disabled = true;
                            sendButton.disabled = true;
                            return [2 /*return*/];
                        }
                        chatRoomId = regionData.name;
                        chatRoomName = regionData.name;
                    }
                    else if (currentChatRoom === 'alliance') {
                        if (!userData || !userData.allianceId) {
                            messagesContainer.innerHTML = "\n                <div class=\"info-message\">\n                    <i class=\"ri-error-warning-line\"></i>\n                    <div><strong>You are not in an alliance.</strong></div>\n                </div>\n            ";
                            chatInput.disabled = true;
                            sendButton.disabled = true;
                            return [2 /*return*/];
                        }
                        chatRoomId = "alliance_".concat(userData.allianceId);
                        chatRoomName = "Alliance Chat";
                    }
                    if (!userData) {
                        messagesContainer.innerHTML = "\n            <div class=\"info-message\">\n                <i class=\"ri-error-warning-line\"></i>\n                <div><strong>Please log in to use chat</strong></div>\n                <div style=\"font-size: 12px; margin-top: 8px; opacity: 0.7;\">You need to be logged in to participate in chat.</div>\n            </div>\n        ";
                        chatInput.disabled = true;
                        sendButton.disabled = true;
                        return [2 /*return*/];
                    }
                    isInitialLoad = messagesContainer.querySelector('.chat-message') === null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (isInitialLoad) {
                        if (debug)
                            console.log("Initial load of messages for ".concat(chatRoomName));
                        messagesContainer.innerHTML = "\n                <div class=\"loading-indicator\">\n                    <div class=\"m3-progress-bar\" style=\"width: 50%; margin: 0 auto;\"></div>\n                    <div style=\"margin-top: 8px;\">Loading messages for ".concat(chatRoomName, "...</div>\n                </div>\n            ");
                    }
                    return [4 /*yield*/, fetchMessages(chatRoomId)];
                case 2:
                    response = _a.sent();
                    if (isInitialLoad) {
                        messagesContainer.innerHTML = ''; // Clear loading indicator
                        if (response && response.data && response.data.length > 0) {
                            if (debug)
                                console.log("Loaded ".concat(response.data.length, " messages for ").concat(chatRoomName));
                            response.data.forEach(function (msg) {
                                addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
                            });
                        }
                        else {
                            if (debug)
                                console.log("No messages found for ".concat(chatRoomName));
                            messagesContainer.innerHTML = "\n                    <div class=\"info-message\">\n                        <i class=\"ri-chat-new-line\"></i>\n                        <div><strong>Welcome to ".concat(chatRoomName, " chat!</strong></div>\n                        <div style=\"font-size: 12px; margin-top: 8px; opacity: 0.7;\">Be the first to start the conversation.</div>\n                    </div>\n                ");
                        }
                    }
                    else {
                        lastMessage = messagesContainer.querySelector('.chat-message:last-child');
                        lastTimestamp_1 = lastMessage ? lastMessage.dataset.timestamp : null;
                        if (lastTimestamp_1 && response && response.data && response.data.length > 0) {
                            newMessages = response.data.filter(function (msg) { return new Date(msg.createdAt) > new Date(lastTimestamp_1); });
                            if (newMessages.length > 0 && debug) {
                                console.log("Found ".concat(newMessages.length, " new messages."));
                            }
                            newMessages.forEach(function (msg) {
                                addMessageToChat(msg.name, msg.messages, msg.createdAt, msg.uid === userData.id.toString());
                            });
                        }
                    }
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    chatInput.disabled = false;
                    sendButton.disabled = false;
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    if (debug)
                        console.error('Error loading messages:', error_4);
                    if (isInitialLoad) {
                        messagesContainer.innerHTML = "\n                <div class=\"info-message\">\n                    <i class=\"ri-error-warning-line\"></i>\n                    <div><strong>Failed to load messages</strong></div>\n                    <div style=\"font-size: 12px; margin-top: 8px; opacity: 0.7;\">Please check your connection and try again.</div>\n                </div>\n            ";
                        chatInput.disabled = true;
                        sendButton.disabled = true;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Add message to chat display
function addMessageToChat(name, message, timestamp, isOwn) {
    if (isOwn === void 0) { isOwn = false; }
    var messagesContainer = currentChatRoom === 'region' ? regionMessages : allianceMessages;
    var messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    if (isOwn) {
        messageDiv.classList.add('own');
    }
    messageDiv.dataset.timestamp = timestamp;
    // Format timestamp
    var date = new Date(timestamp);
    var timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    messageDiv.innerHTML = "\n        <div class=\"message-author\">".concat(isOwn ? "".concat(name, " (You)") : name, "</div>\n        <div class=\"message-content ").concat(isOwn ? 'own' : '', "\">\n            ").concat(message, "\n            <div class=\"message-timestamp\">").concat(timeString, "</div>\n        </div>\n    ");
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
// Send message function
function handleSendMessage() {
    return __awaiter(this, void 0, void 0, function () {
        var chatRoomId, message, error_5, errorTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userData)
                        return [2 /*return*/];
                    chatRoomId = null;
                    if (currentChatRoom === 'region') {
                        if (!regionData) {
                            if (debug)
                                console.error("Cannot send message, no region selected.");
                            return [2 /*return*/];
                        }
                        chatRoomId = regionData.name;
                    }
                    else if (currentChatRoom === 'alliance') {
                        if (!userData.allianceId) {
                            if (debug)
                                console.error("Cannot send message, not in an alliance.");
                            return [2 /*return*/];
                        }
                        chatRoomId = "alliance_".concat(userData.allianceId);
                    }
                    if (!chatRoomId)
                        return [2 /*return*/];
                    message = chatInput.value.trim();
                    if (!message)
                        return [2 /*return*/];
                    // Disable send button
                    sendButton.disabled = true;
                    sendButton.innerHTML = '<i class="ri-loader-4-line loading-spinner"></i>';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Clear input
                    chatInput.value = '';
                    chatInput.style.height = 'auto';
                    // Send to server
                    return [4 /*yield*/, sendMessage(userData.id, userData.name, message, chatRoomId)];
                case 2:
                    // Send to server
                    _a.sent();
                    // Refresh messages after a short delay to get the actual server response
                    setTimeout(function () {
                        loadMessages();
                    }, 1000);
                    return [3 /*break*/, 5];
                case 3:
                    error_5 = _a.sent();
                    if (debug)
                        console.error('Error sending message:', error_5);
                    errorTime = new Date().toISOString();
                    addMessageToChat('System', 'Failed to send message. Please try again.', errorTime, false);
                    return [3 /*break*/, 5];
                case 4:
                    // Re-enable send button
                    sendButton.disabled = false;
                    sendButton.innerHTML = '<i class="ri-send-plane-fill"></i>';
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Auto-refresh messages every 10 seconds
var refreshInterval;
function startAutoRefresh() {
    refreshInterval = setInterval(function () {
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
fab.addEventListener('click', function () { return __awaiter(void 0, void 0, void 0, function () {
    var lastRoom;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                modal.classList.add('show');
                Draggable_1.Draggable.create(fab, {
                    bounds: "body",
                    allowEventDefault: true
                });
                if (!!userData) return [3 /*break*/, 2];
                return [4 /*yield*/, initializeUserData()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                lastRoom = localStorage.getItem('wplace-chat-last-room');
                if (lastRoom === 'alliance' && userData && userData.allianceId) {
                    currentChatRoom = 'alliance';
                    regionMessages.style.display = 'none';
                    allianceMessages.style.display = 'block';
                }
                else {
                    currentChatRoom = 'region';
                    regionMessages.style.display = 'block';
                    allianceMessages.style.display = 'none';
                }
                updateUserInfo();
                return [4 /*yield*/, loadMessages()];
            case 3:
                _a.sent();
                startAutoRefresh();
                if (userData && regionData) {
                    chatInput.focus();
                }
                return [2 /*return*/];
        }
    });
}); });
chatTabs.addEventListener('click', function (e) {
    var target = e.target;
    if (target.classList.contains('livechat-tab')) {
        var room = target.dataset.room;
        if (room && room !== currentChatRoom) {
            currentChatRoom = room;
            localStorage.setItem('wplace-chat-last-room', room);
            if (room === 'region') {
                regionMessages.style.display = 'block';
                allianceMessages.style.display = 'none';
            }
            else {
                regionMessages.style.display = 'none';
                allianceMessages.style.display = 'block';
            }
            updateUserInfo();
            loadMessages();
        }
    }
});
closeButton.addEventListener('click', function () {
    modal.classList.remove('show');
    stopAutoRefresh();
});
modal.addEventListener('click', function (e) {
    if (e.target === modal) {
        modal.classList.remove('show');
        stopAutoRefresh();
    }
});
sendButton.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
// Escape key to close modal
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('show') && !e.target.closest('.livechat-input')) {
        modal.classList.remove('show');
        stopAutoRefresh();
    }
});
// Initialize on page load
setTimeout(function () {
    initializeUserData();
    startDataPolling();
}, 2000);
