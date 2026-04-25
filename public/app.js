const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const messages = document.querySelector("#messages");
const quickActionButtons = document.querySelectorAll("[data-message]");
const sessionId = getOrCreateSessionId();
const socket = io();

document.querySelector("#sessionIdLabel").textContent = sessionId;

appendMessage("bot", "Hello. Try one of the sample buttons or type your own message.");
socket.emit("customer:join", { sessionId });

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendMessage(input.value);
});

quickActionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await sendMessage(button.dataset.message);
  });
});

async function sendMessage(rawMessage) {
  const message = rawMessage.trim();

  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  input.focus();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sessionId
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Chat request failed");
    }

    const botText = payload.messages?.map((item) => item.content).join("\n") || "No response.";
    appendMessage("bot", botText);
    renderDetails(payload);
  } catch (error) {
    appendMessage("error", error.message);
  }
}

socket.on("live:state", ({ conversationState, task }) => {
  document.querySelector("#conversationState").textContent = conversationState;

  if (task) {
    document.querySelector("#sessionStateOutput").textContent = JSON.stringify(task, null, 2);
  }

  if (conversationState === "WAITING_FOR_AGENT") {
    appendMessage("system", "Waiting for an agent to accept this chat.");
  }

  if (conversationState === "AGENT_CONNECTED") {
    appendMessage("system", "Agent connected. You can keep typing here.");
  }

  if (conversationState === "ENDED") {
    appendMessage("system", "Agent ended the chat. Send a new message to restart with the bot.");
  }
});

socket.on("live:message", ({ message }) => {
  if (!message || message.sender === "customer") return;

  if (message.sender === "agent") {
    appendMessage("bot", `Agent: ${message.content}`);
    return;
  }

  appendMessage("system", message.content);
});

function appendMessage(type, text) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function renderDetails(payload) {
  document.querySelector("#intentName").textContent = payload.intent?.name || "Unknown";
  document.querySelector("#connectAction").textContent = payload.connectAction || "Unknown";
  document.querySelector("#conversationState").textContent =
    payload.conversationState || payload.sessionState?.sessionAttributes?.conversationState || "Unknown";
  document.querySelector("#slotsOutput").textContent = JSON.stringify(payload.slots || {}, null, 2);
  document.querySelector("#sessionStateOutput").textContent = JSON.stringify(
    payload.sessionState || {},
    null,
    2
  );
}

function getOrCreateSessionId() {
  const existingSessionId = window.localStorage.getItem("mockLexSessionId");

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem("mockLexSessionId", newSessionId);
  return newSessionId;
}
