const socket = io();
const agentId = getOrCreateAgentId();
const waitingTasks = document.querySelector("#waitingTasks");
const waitingCount = document.querySelector("#waitingCount");
const activeTitle = document.querySelector("#activeTitle");
const messages = document.querySelector("#agentMessages");
const form = document.querySelector("#agentForm");
const input = document.querySelector("#agentMessageInput");
const sendButton = form.querySelector("button");
const endChatButton = document.querySelector("#endChatButton");

let activeTask = null;

socket.emit("agent:join", { agentId });

socket.on("agent:tasks", ({ waiting, active }) => {
  renderWaitingTasks(waiting || []);

  if (!activeTask && active?.length) {
    setActiveTask(active[0]);
  }
});

socket.on("live:message", ({ task, message }) => {
  if (!activeTask || task.taskId !== activeTask.taskId) return;

  activeTask = task;
  renderMessage(message);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message || !activeTask) return;

  socket.emit("agent:message", { taskId: activeTask.taskId, message }, (response) => {
    if (!response?.ok) {
      renderSystemMessage(response?.error || "Failed to send message");
    }
  });

  input.value = "";
  input.focus();
});

endChatButton.addEventListener("click", () => {
  if (!activeTask) return;

  socket.emit("agent:end", { taskId: activeTask.taskId }, (response) => {
    if (!response?.ok) {
      renderSystemMessage(response?.error || "Failed to end chat");
      return;
    }

    activeTask = null;
    activeTitle.textContent = "No Active Chat";
    setComposerEnabled(false);
  });
});

function renderWaitingTasks(tasks) {
  waitingCount.textContent = String(tasks.length);
  waitingTasks.replaceChildren();

  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No customers are waiting.";
    waitingTasks.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";

    const title = document.createElement("strong");
    title.textContent = task.sessionId;

    const lastMessage = document.createElement("p");
    lastMessage.textContent = task.lastMessage?.content || "No message";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Accept";
    button.addEventListener("click", () => acceptTask(task.taskId));

    card.append(title, lastMessage, button);
    waitingTasks.appendChild(card);
  });
}

function acceptTask(taskId) {
  socket.emit("agent:accept", { taskId }, (response) => {
    if (!response?.ok) {
      renderSystemMessage(response?.error || "Failed to accept chat");
      return;
    }

    setActiveTask(response.task);
  });
}

function setActiveTask(task) {
  activeTask = task;
  activeTitle.textContent = `Chat: ${task.sessionId}`;
  messages.replaceChildren();
  task.messages.forEach(renderMessage);
  setComposerEnabled(true);
  input.focus();
}

function renderMessage(message) {
  const type = message.sender === "agent" ? "user" : message.sender === "customer" ? "bot" : "system";
  const label = message.sender === "agent" ? "Agent" : message.sender === "customer" ? "Customer" : "System";
  appendMessage(type, `${label}: ${message.content}`);
}

function renderSystemMessage(content) {
  appendMessage("system", content);
}

function appendMessage(type, text) {
  const item = document.createElement("div");
  item.className = `message ${type}`;
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function setComposerEnabled(enabled) {
  input.disabled = !enabled;
  sendButton.disabled = !enabled;
  endChatButton.disabled = !enabled;
  input.placeholder = enabled ? "Type reply to customer..." : "Accept a chat to reply...";
}

function getOrCreateAgentId() {
  const existingAgentId = window.localStorage.getItem("mockAgentId");

  if (existingAgentId) {
    return existingAgentId;
  }

  const newAgentId = `agent-${crypto.randomUUID()}`;
  window.localStorage.setItem("mockAgentId", newAgentId);
  return newAgentId;
}
