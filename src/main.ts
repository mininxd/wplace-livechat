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
    stopAutoRefresh,
    initializeUserData,
    updateUserInfo,
    loadMessages
} from './ui'

/// <reference types="@types/greasemonkey" />

document.addEventListener('regionDataFound', () => {
    if (modal.classList.contains('show')) {
        updateUserInfo();
        loadMessages();
    }
});

fab.addEventListener('click', handleFabClick);
chatTabs.addEventListener('click', handleTabClick);
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
    if (getSettings().enterToSend && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show') && !(e.target as HTMLElement).closest('.livechat-input')) {
        modal.classList.remove('show');
        stopAutoRefresh();
    }
});

setTimeout(() => {
    initializeUserData();
    startDataPolling();
}, 2000);
