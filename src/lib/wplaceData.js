import pixelUrl from "./detectHttpRequest.js";
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

export async function userData() {
    const data = await wplace("https://backend.wplace.live/me");
    return data;
}
export async function placeData(url) {
  const targetUrl = await pixelUrl();
  if (!targetUrl == null) {
  
    const data = await wplace(
        `${targetUrl}?x=${randNum()}&y=${randNum()}`
    );
    return data;
  }
}
