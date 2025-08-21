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
