import './style.css'
import { startDataPolling } from './api'
import { getSettings } from './state'
import {
    fab,
    modal,
    closeButton,
    chatTabs,
    sendButton,
    chatInput,
    handleFabClick,
    handleTabClick,
    handleSendMessage,
    disconnectFromEvents,
    initializeUserData,
    updateUserInfo,
    loadMessages,
    establishSseConnection
} from './ui'

/// <reference types="@types/greasemonkey" />

document.addEventListener('regionDataFound', () => {
    if (modal.classList.contains('show')) {
        updateUserInfo();
        loadMessages();
        establishSseConnection();
    }
});

fab.addEventListener('click', handleFabClick);
chatTabs.addEventListener('click', handleTabClick);
closeButton.addEventListener('click', () => {
    modal.classList.remove('show');
    disconnectFromEvents();
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        disconnectFromEvents();
    }
});
sendButton.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (getSettings().enterToSend && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show') && !(e.target as HTMLElement).closest('.livechat-input')) {
        modal.classList.remove('show');
        disconnectFromEvents();
    }
});

setTimeout(() => {
    initializeUserData();
    startDataPolling();
}, 2000);
