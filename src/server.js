import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { config } from "./config.js";
import { INTENTS } from "./intentDetector.js";
import {
  acceptTask,
  addLiveMessage,
  createAgentTask,
  endTask,
  findTaskBySessionId,
  listAgentTasks,
  listWaitingTasks,
  toTaskSummary
} from "./liveChatStore.js";
import { recognizeText } from "./mockLex.js";
import { CONVERSATION_STATES, getConversationState, setConversationState } from "./sessionStore.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": ["'self'", "ws:", "wss:"],
        "script-src": ["'self'"]
      }
    }
  })
);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/agent", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/agent.html"));
});

app.post("/chat", async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required and must be a string" });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required and must be a string" });
    }

    const currentState = getConversationState(sessionId);
    const activeTask = findTaskBySessionId(sessionId);

    if (activeTask && currentState === CONVERSATION_STATES.AGENT_CONNECTED) {
      const { message: liveMessage } = addLiveMessage({
        taskId: activeTask.taskId,
        sender: "customer",
        content: message.trim()
      });

      io.to(taskRoom(activeTask.taskId)).emit("live:message", {
        task: toTaskSummary(activeTask),
        message: liveMessage
      });

      return res.json(createLiveResponse({
        sessionId,
        conversationState: CONVERSATION_STATES.AGENT_CONNECTED,
        content: "Message sent to the connected agent.",
        connectAction: "TransferToAgent",
        task: activeTask
      }));
    }

    if (activeTask && currentState === CONVERSATION_STATES.WAITING_FOR_AGENT) {
      const { message: queuedMessage } = addLiveMessage({
        taskId: activeTask.taskId,
        sender: "customer",
        content: message.trim()
      });

      io.to("agents").emit("agent:tasks", getAgentTaskPayload());
      io.to(taskRoom(activeTask.taskId)).emit("live:message", {
        task: toTaskSummary(activeTask),
        message: queuedMessage
      });

      return res.json(createLiveResponse({
        sessionId,
        conversationState: CONVERSATION_STATES.WAITING_FOR_AGENT,
        content: "You are still waiting for an agent. Your message has been added to the queue.",
        connectAction: "TransferToAgent",
        task: activeTask
      }));
    }

    if (currentState === CONVERSATION_STATES.ENDED) {
      setConversationState(sessionId, CONVERSATION_STATES.BOT_ACTIVE);
    }

    const lexResponse = recognizeText({
      message: message.trim(),
      sessionId
    });

    if (lexResponse.intent.name === INTENTS.TALK_TO_AGENT) {
      const task = createAgentTask({
        sessionId,
        customerMessage: message.trim()
      });

      lexResponse.agentTask = toTaskSummary(task);
      io.to("agents").emit("agent:tasks", getAgentTaskPayload());
      io.to(customerRoom(sessionId)).emit("live:state", {
        conversationState: CONVERSATION_STATES.WAITING_FOR_AGENT,
        task: toTaskSummary(task)
      });
    }

    return res.json(lexResponse);
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.on("customer:join", ({ sessionId }) => {
    if (!sessionId) return;

    socket.join(customerRoom(sessionId));
    const task = findTaskBySessionId(sessionId);

    if (task && task.state !== CONVERSATION_STATES.ENDED) {
      socket.join(taskRoom(task.taskId));
      socket.emit("live:state", {
        conversationState: task.state,
        task: toTaskSummary(task)
      });
    }
  });

  socket.on("agent:join", ({ agentId }) => {
    if (!agentId) return;

    socket.data.agentId = agentId;
    socket.join("agents");
    socket.emit("agent:tasks", getAgentTaskPayload(agentId));
  });

  socket.on("agent:accept", ({ taskId }, callback) => {
    try {
      const agentId = socket.data.agentId || `agent-${socket.id}`;
      const task = acceptTask({ taskId, agentId });

      setConversationState(task.sessionId, CONVERSATION_STATES.AGENT_CONNECTED);
      socket.join(taskRoom(task.taskId));

      const connectedMessage = {
        sender: "system",
        content: "Agent connected.",
        timestamp: new Date().toISOString()
      };

      io.to(customerRoom(task.sessionId)).emit("live:state", {
        conversationState: CONVERSATION_STATES.AGENT_CONNECTED,
        task: toTaskSummary(task)
      });
      io.to(taskRoom(task.taskId)).emit("live:message", {
        task: toTaskSummary(task),
        message: connectedMessage
      });
      io.to("agents").emit("agent:tasks", getAgentTaskPayload(agentId));
      callback?.({ ok: true, task: toTaskSummary(task) });
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("agent:message", ({ taskId, message }, callback) => {
    try {
      if (!message || typeof message !== "string") {
        throw new Error("message is required");
      }

      const { task, message: liveMessage } = addLiveMessage({
        taskId,
        sender: "agent",
        content: message.trim()
      });

      io.to(taskRoom(task.taskId)).to(customerRoom(task.sessionId)).emit("live:message", {
        task: toTaskSummary(task),
        message: liveMessage
      });
      callback?.({ ok: true });
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("agent:end", ({ taskId }, callback) => {
    try {
      const task = endTask(taskId);
      setConversationState(task.sessionId, CONVERSATION_STATES.ENDED);

      const endedMessage = {
        sender: "system",
        content: "Agent ended the chat.",
        timestamp: new Date().toISOString()
      };

      io.to(taskRoom(task.taskId)).emit("live:message", {
        task: toTaskSummary(task),
        message: endedMessage
      });
      io.to(customerRoom(task.sessionId)).emit("live:state", {
        conversationState: CONVERSATION_STATES.ENDED,
        task: toTaskSummary(task)
      });
      io.to("agents").emit("agent:tasks", getAgentTaskPayload(socket.data.agentId));
      callback?.({ ok: true });
    } catch (error) {
      callback?.({ ok: false, error: error.message });
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error);

  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? "Internal server error" : error.message || "Request failed";

  res.status(statusCode).json({
    error: message
  });
});

function createLiveResponse({ sessionId, conversationState, content, connectAction, task }) {
  return {
    sessionId,
    conversationState,
    intent: {
      name: "LiveAgentIntent",
      confidence: 1,
      state: "Fulfilled"
    },
    sessionState: {
      dialogAction: {
        type: "Close"
      },
      intent: {
        name: "LiveAgentIntent",
        state: "Fulfilled",
        slots: {}
      },
      sessionAttributes: {
        connectAction,
        conversationState,
        taskId: task.taskId
      }
    },
    messages: [
      {
        contentType: "PlainText",
        content
      }
    ],
    slots: {},
    connectAction,
    agentTask: toTaskSummary(task)
  };
}

function getAgentTaskPayload(agentId) {
  return {
    waiting: listWaitingTasks().map(toTaskSummary),
    active: agentId ? listAgentTasks(agentId).map(toTaskSummary) : []
  };
}

function customerRoom(sessionId) {
  return `customer:${sessionId}`;
}

function taskRoom(taskId) {
  return `task:${taskId}`;
}

server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
