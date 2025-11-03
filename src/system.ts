import axios from "axios";

const version = __APP_VERSION__;
let newVersion = "";

export default async function checkNewVersion() {
  try {
    const response = await axios.get(
      "https://wplace-livechat.vercel.app/wplace_livechat.user.js",
      { responseType: "text" }
    );

    const match = response.data.match(/@version\s+([^\s]+)/i);
    if (!match) return "";
    newVersion = match[1];

    if (version < newVersion) {
      return `
        <span 
          class="system-messages" 
          role="alert"
          style="
            font-size: 12px;
            font-weight: 500;
            background: var(--warning-color);
            color: var(--on-background-color);
            padding: 2px 5px;
            border-radius: 5px;
            margin: 2px 0;
            display: inline-block;
            width: fit-content;
          "
        >
          Update Available 
          <strong>${newVersion}</strong> 
          <a 
            href="https://wplace-livechat.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              color: var(--on-background-color);
              text-decoration: underline;
              margin-left: 4px;
            "
          >
            Press Here
          </a>
        </span>
      `;
    }

    return "";
  } catch (error) {
    return "";
  }
}