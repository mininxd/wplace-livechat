function randNum() {
    return Math.floor(Math.random() * 100);
}

const wplace = async (url, options = {}) => {
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
import pixelUrl from "./detectHttpRequest.js";

export async function userData() {
    const data = await wplace("https://backend.wplace.live/me");
    return data;
}
export async function placeData(url) {
  const targetUrl = url || pixelUrl();
    const data = await wplace(
        `${targetUrl}?x=${randNum()}&y=${randNum()}`
    );
    return data;
}
