import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { recognizeText } from "./mockLex.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
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

app.post("/chat", async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required and must be a string" });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required and must be a string" });
    }

    const lexResponse = recognizeText({
      message: message.trim(),
      sessionId
    });

    return res.json(lexResponse);
  } catch (error) {
    next(error);
  }
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

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
