const pixelAPI = window.fetch;
let lastPixelUrl = null;

// Intercept fetch
window.fetch = async function(...args) {
    const url = args[0];

    if (typeof url === "string" && url.includes("https://backend.wplace.live/s0/pixel")) {
        lastPixelUrl = url.split("?")[0];
        console.log("Detected pixel URL:", lastPixelUrl);
    }

    return pixelAPI.apply(this, args);
};

// Exported function to get the last detected pixel URL
export default function main() {
    return lastPixelUrl;
}
