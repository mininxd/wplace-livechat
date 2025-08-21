let userData: any = null;
let regionData: any = null;
let allianceData: any = null;
let currentChatRoom = 'region'; // 'region' or 'alliance'

export function getUserData() {
    return userData;
}

export function setUserData(data: any) {
    userData = data;
}

export function getRegionData() {
    return regionData;
}

export function setRegionData(data: any) {
    regionData = data;
}

export function getAllianceData() {
    return allianceData;
}

export function setAllianceData(data: any) {
    allianceData = data;
}

export function getCurrentChatRoom() {
    return currentChatRoom;
}

export function setCurrentChatRoom(room: string) {
    currentChatRoom = room;
}

// --- Settings ---
let settings = {
    enterToSend: true,
};

export const getSettings = () => settings;
export const setSettings = (newSettings: Partial<typeof settings>) => {
    settings = { ...settings, ...newSettings };
    // Also save to localStorage
    try {
        localStorage.setItem('wplace-chat-settings', JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings to localStorage", e);
    }
};
export const loadSettings = () => {
    try {
        const storedSettings = localStorage.getItem('wplace-chat-settings');
        if (storedSettings) {
            settings = { ...settings, ...JSON.parse(storedSettings) };
        }
    } catch (e) {
        console.error("Failed to load settings from localStorage", e);
    }
    return settings;
};
