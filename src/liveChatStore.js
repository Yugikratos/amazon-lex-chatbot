import { CONVERSATION_STATES } from "./sessionStore.js";

const tasks = new Map();

export function createAgentTask({ sessionId, customerMessage }) {
  const existingTask = findTaskBySessionId(sessionId);

  if (existingTask && existingTask.state !== CONVERSATION_STATES.ENDED) {
    return existingTask;
  }

  const now = new Date().toISOString();
  const task = {
    taskId: `task-${sessionId}`,
    sessionId,
    state: CONVERSATION_STATES.WAITING_FOR_AGENT,
    agentId: null,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        sender: "customer",
        content: customerMessage,
        timestamp: now
      }
    ]
  };

  tasks.set(task.taskId, task);
  return task;
}

export function listWaitingTasks() {
  return Array.from(tasks.values())
    .filter((task) => task.state === CONVERSATION_STATES.WAITING_FOR_AGENT)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

export function listAgentTasks(agentId) {
  return Array.from(tasks.values()).filter(
    (task) => task.agentId === agentId && task.state === CONVERSATION_STATES.AGENT_CONNECTED
  );
}

export function getTask(taskId) {
  return tasks.get(taskId) || null;
}

export function findTaskBySessionId(sessionId) {
  return Array.from(tasks.values()).find((task) => task.sessionId === sessionId) || null;
}

export function acceptTask({ taskId, agentId }) {
  const task = getTask(taskId);

  if (!task) {
    throw new Error("Agent task not found");
  }

  if (task.state !== CONVERSATION_STATES.WAITING_FOR_AGENT) {
    throw new Error("Agent task is not waiting");
  }

  task.state = CONVERSATION_STATES.AGENT_CONNECTED;
  task.agentId = agentId;
  task.updatedAt = new Date().toISOString();
  return task;
}

export function addLiveMessage({ taskId, sender, content }) {
  const task = getTask(taskId);

  if (!task) {
    throw new Error("Agent task not found");
  }

  const message = {
    sender,
    content,
    timestamp: new Date().toISOString()
  };

  task.messages.push(message);
  task.updatedAt = message.timestamp;
  return { task, message };
}

export function endTask(taskId) {
  const task = getTask(taskId);

  if (!task) {
    throw new Error("Agent task not found");
  }

  task.state = CONVERSATION_STATES.ENDED;
  task.updatedAt = new Date().toISOString();
  return task;
}

export function toTaskSummary(task) {
  return {
    taskId: task.taskId,
    sessionId: task.sessionId,
    state: task.state,
    agentId: task.agentId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    lastMessage: task.messages.at(-1) || null,
    messages: task.messages
  };
}
