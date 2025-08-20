import "./style.css";
import "remixicon/fonts/remixicon.css";
import "./chatRender.js";
import { sendMessages } from "./connect.js";

const uid = "12345";

sendBtn.addEventListener("click", (e) => {
  e.preventDefault();
  sendBtn.classList.add("btn-loading")
  sendMessages(uid, "mininxd", inputMessages.value, "Semarang");
})