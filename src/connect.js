import axios from "axios";
const url = "https://wplace-live-chat-server.vercel.app";


export async function sendMessages(uid, username, messages, region) {
  try {
    const res = await axios.post(`${url}/send`, {
      uid, 
      name: username,
      messages,
      region
    });
    return res.data;
  } catch (err) {
    console.error("Failed to send message:", err);
    return null;
  }
}

export async function getMessages(region) {
  try {
    const res = await axios.get(`${url}/users/${region}`)
    return res.data;
  } catch (err) {
    console.error("Failed to send message:", err);
    return null;
  }
}