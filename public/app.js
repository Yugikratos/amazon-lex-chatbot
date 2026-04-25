const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const messages = document.querySelector("#messages");
const quickActionButtons = document.querySelectorAll("[data-message]");
const sessionId = getOrCreateSessionId();

document.querySelector("#sessionIdLabel").textContent = sessionId;

appendMessage("bot", "Hello. Try one of the sample buttons or type your own message.");

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
