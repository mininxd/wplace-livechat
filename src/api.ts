/// <reference types="@types/greasemonkey" />

import { getRegionData, setRegionData, setPixelData } from './state';

const API_BASE = 'https://wplace-live-chat-server.vercel.app';
const debug = false;
let regionDataPoller: any = null;
let lastCheckedUrl = '';

export const fetchAPI = async (url: string, options = {}) => {
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

export function fetchMessages(region: string) {
    return new Promise<any>((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${API_BASE}/messages/${region}`,
            onload: function(response: GM.Response<any>) {
                try {
                    const data = JSON.parse(response.responseText);
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            },
            onerror: function(error: any) {
                reject(error);
            }
        });
    });
}

export function connectToEvents(region: string, onMessage: (data: any) => void): EventSource {
    const url = `${API_BASE}/events/${region}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error('Error parsing SSE message:', e);
        }
    };

    eventSource.onerror = function(err) {
        console.error('EventSource failed:', err);
        // The EventSource will automatically try to reconnect.
        // You might want to add logic here to handle repeated failures.
    };

    return eventSource;
}

export function sendMessage(uid: string, name: string, message: string, region: string) {
    return new Promise<any>((resolve, reject) => {
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
            onload: function(response: GM.Response<any>) {
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
            onerror: function(error: any) {
                reject(error);
            }
        });
    });
}

const getRange = (value: number, rangeSize: number) => {
    const start = Math.floor(value / rangeSize) * rangeSize;
    const end = start + rangeSize - 1;
    return `${start}_${end}`;
};

async function checkForPixelUrl() {
    const regionData = getRegionData();
    if (regionData) {
        if (regionDataPoller) clearInterval(regionDataPoller);
        return;
    }

    const resources = performance.getEntriesByType("resource");
    const pixelResource = resources.reverse().find(r => r.name.includes("https://backend.wplace.live/s0/pixel/"));

    if (pixelResource && pixelResource.name !== lastCheckedUrl) {
        lastCheckedUrl = pixelResource.name;
        const url = new URL(lastCheckedUrl);
        const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
        if (debug) console.log("Found pixel URL in performance entries:", baseUrl);

        try {
            const data = await fetchAPI(baseUrl);
            if (data && data.region && data.region.name) {
                const x = url.searchParams.get('x');
                const y = url.searchParams.get('y');

                if (x && y) {
                    const xRange = getRange(parseInt(x), 250);
                    const yRange = getRange(parseInt(y), 250);
                    data.region.name = `${data.region.name}_${xRange}_${yRange}`;
                    setPixelData({ x, y });
                }

                setRegionData(data.region);
                if (debug) console.log("Region data fetched successfully:", getRegionData());
                if (regionDataPoller) clearInterval(regionDataPoller);

                // Dispatch a custom event to notify the rest of the script
                document.dispatchEvent(new CustomEvent('regionDataFound'));
            }
        } catch (error) {
            if (debug) console.error("Error fetching region data from performance entry:", error);
        }
    }
}

export function startDataPolling() {
    if (!regionDataPoller) {
        regionDataPoller = setInterval(checkForPixelUrl, 1000);
    }
}
