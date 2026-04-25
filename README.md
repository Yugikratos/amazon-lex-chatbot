# Local Mock Lex V2 + Mock Connect Chatbot

This is a 100% local Node.js Express project that simulates:

- Amazon Lex V2-style chatbot responses
- Amazon Connect-style routing decisions
- Live-agent handoff using Socket.IO

It does not use OpenAI, Ollama, AWS, Twilio, paid APIs, cloud services, or external runtime services.

## Features

- Browser customer chat at `http://localhost:3000`
- Browser agent dashboard at `http://localhost:3000/agent`
- Customer state banner for `BOT_ACTIVE`, `WAITING_FOR_AGENT`, `AGENT_CONNECTED`, and `ENDED`
- `New Session` button for clean demo resets
- Rich agent queue cards with session metadata
- Canned agent replies for faster demos
- Existing `POST /chat` endpoint
- Keyword-based intent detection
- In-memory session state
- In-memory live-agent tasks
- Socket.IO real-time messaging between customer and mock agent
- No database required
- No cloud dependency

## Quick Start

Run the app:

```powershell
cd D:\amazon-lex-chatbot
npm run dev
```

If PowerShell blocks `npm`, run:

```powershell
npm.cmd run dev
```

Open these two pages:

```text
Customer chatbot: http://localhost:3000
Agent dashboard:  http://localhost:3000/agent
```

Fastest test:

1. In the customer page, click `Agent`.
2. In the agent dashboard, click `Accept`.
3. Use a canned reply or type a reply from the agent page.
4. Send a customer reply from the customer page.
5. Click `End Chat` in the agent dashboard.

## Conversation States

| State | Meaning |
| --- | --- |
| `BOT_ACTIVE` | Customer is chatting with the local mock bot |
| `WAITING_FOR_AGENT` | Customer asked for an agent and is waiting in the mock queue |
| `AGENT_CONNECTED` | Mock agent accepted the chat |
| `ENDED` | Agent ended the chat or the bot completed a self-service flow |

## Supported Bot Intents

| Intent | Example message | connectAction |
| --- | --- | --- |
| `GreetingIntent` | `hello` | `ContinueBot` |
| `CheckOrderStatusIntent` | `track my order ORD12345` | `EndConversation` when order ID is found |
| `RaiseComplaintIntent` | `my item arrived damaged for order ORD12345` | `EndConversation` |
| `TalkToAgentIntent` | `I want to talk to a human agent` | `TransferToAgent` |
| `FallbackIntent` | `random unknown text` | `ContinueBot` |

## Project Structure

```text
.
|-- public
|   |-- agent.css
|   |-- agent.html
|   |-- agent.js
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- src
|   |-- config.js
|   |-- intentDetector.js
|   |-- liveChatStore.js
|   |-- mockLex.js
|   |-- server.js
|   `-- sessionStore.js
|-- .env.example
|-- .gitignore
|-- package-lock.json
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18 or later
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create `.env`:

```powershell
copy .env.example .env
```

Default `.env`:

```env
PORT=3000
```

Start the app:

```bash
npm run dev
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

Expected terminal output:

```text
Server listening on port 3000
```

## Easiest Local Test

Open two browser tabs.

Tab 1, customer chat:

```text
http://localhost:3000
```

Tab 2, agent dashboard:

```text
http://localhost:3000/agent
```

### Test Bot Chat

In the customer tab, click or type:

```text
hello
```

Expected:

- Intent: `GreetingIntent`
- Conversation state: `BOT_ACTIVE`
- Connect action: `ContinueBot`

### Test Order Status

In the customer tab, click `Order Status` or type:

```text
track my order ORD12345
```

Expected:

- Intent: `CheckOrderStatusIntent`
- Slot: `orderId = ORD12345`
- Conversation state: `ENDED`
- Connect action: `EndConversation`

### Test Complaint

In the customer tab, click `Complaint` or type:

```text
my item arrived damaged for order ORD12345
```

Expected:

- Intent: `RaiseComplaintIntent`
- Slots include `orderId` and `complaintType`
- Conversation state: `ENDED`
- Connect action: `EndConversation`

### Test Live-Agent Handoff

1. Open customer chat at `http://localhost:3000`.
2. Open agent dashboard at `http://localhost:3000/agent`.
3. In customer chat, click `Agent` or type:

```text
I want to talk to a human agent
```

4. Customer should move to:

```text
WAITING_FOR_AGENT
```

5. Agent dashboard should show a waiting chat.
6. Click `Accept` in the agent dashboard.
7. Customer should move to:

```text
AGENT_CONNECTED
```

8. Type messages from the customer page.
9. Type replies from the agent dashboard.
10. Click `End Chat` in the agent dashboard.
11. Customer should move to:

```text
ENDED
```

Everything happens locally through Express and Socket.IO.

## Demo Script

Use this flow when showing the project:

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000` as the customer.
3. Open `http://localhost:3000/agent` as the mock agent.
4. In the customer page, click `Greeting` to show normal bot handling.
5. Click `Order Status` to show slot extraction and `EndConversation`.
6. Click `New Session` to start a clean customer conversation.
7. Click `Agent` to create a waiting live-agent task.
8. In the customer page, confirm the state banner shows `WAITING_FOR_AGENT`.
9. In the agent dashboard, confirm the waiting card shows session ID, state, created time, and last message.
10. Click `Accept`.
11. Confirm the customer state banner shows `AGENT_CONNECTED`.
12. Use a canned reply, then click `Send`.
13. Send one customer reply from the customer page.
14. Click `End Chat` in the agent dashboard.
15. Confirm the customer state banner shows `ENDED`.

Expected states during the handoff:

```text
BOT_ACTIVE -> WAITING_FOR_AGENT -> AGENT_CONNECTED -> ENDED
```

## Frontend Pages

### Customer Chat

URL:

```text
http://localhost:3000
```

Use this page as the customer. It has:

- Chat message input
- Quick intent buttons
- Conversation state banner
- `New Session` button
- Bot response area
- Intent display
- Connect action display
- Conversation state display
- Slots and session state panels
- Link to the agent dashboard

### Agent Dashboard

URL:

```text
http://localhost:3000/agent
```

Use this page as the mock support agent. It has:

- Waiting customer queue
- Waiting chat cards with session ID, state, created time, and last customer message
- `Accept` button
- Live chat workspace
- Canned reply buttons
- Agent reply input
- `End Chat` button

No login is required because this is a local mock project.

## API Endpoints

### Customer Frontend

```http
GET /
```

Serves the browser chat UI.

### Agent Dashboard

```http
GET /agent
```

Serves the mock agent dashboard.

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Chat

```http
POST /chat
Content-Type: application/json
```

Request:

```json
{
  "message": "I want to talk to a human agent",
  "sessionId": "demo-1"
}
```

Response when handoff starts:

```json
{
  "sessionId": "demo-1",
  "conversationState": "WAITING_FOR_AGENT",
  "intent": {
    "name": "TalkToAgentIntent",
    "confidence": 0.95,
    "state": "Fulfilled"
  },
  "messages": [
    {
      "contentType": "PlainText",
      "content": "I will transfer you to a support agent now."
    }
  ],
  "connectAction": "TransferToAgent",
  "agentTask": {
    "taskId": "task-demo-1",
    "sessionId": "demo-1",
    "state": "WAITING_FOR_AGENT"
  }
}
```

## PowerShell API Tests

The browser UI is easier, but the API still works directly.

Greeting:

```powershell
$body = @{ message = "hello"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Order status:

```powershell
$body = @{ message = "track my order ORD12345"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Complaint:

```powershell
$body = @{ message = "my item arrived damaged for order ORD12345"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Agent handoff:

```powershell
$body = @{ message = "I want to talk to a human agent"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Fallback:

```powershell
$body = @{ message = "random unknown text"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

## How The Local Handoff Works

1. Customer sends a message through the browser UI.
2. Browser calls `POST /chat`.
3. `src/intentDetector.js` detects intent using keywords.
4. `src/mockLex.js` builds a Lex V2-style response.
5. If the intent is `TalkToAgentIntent`, `src/server.js` creates a mock agent task.
6. Socket.IO sends the waiting task to all open `/agent` dashboards.
7. Agent clicks `Accept`.
8. Server changes state to `AGENT_CONNECTED`.
9. Customer and agent exchange Socket.IO messages.
10. Agent can use canned replies or type custom replies.
11. Agent clicks `End Chat`.
12. Server changes state to `ENDED`.

## Important Files

### `src/server.js`

Main Express and Socket.IO server.

It handles:

- Static frontend files
- `/health`
- `/chat`
- `/agent`
- Socket.IO customer events
- Socket.IO agent events
- Agent task creation on `TalkToAgentIntent`

### `src/intentDetector.js`

Keyword-based intent detection and slot extraction.

### `src/mockLex.js`

Creates Lex V2-style responses:

- `sessionId`
- `conversationState`
- `intent`
- `sessionState`
- `messages`
- `slots`
- `connectAction`

### `src/sessionStore.js`

In-memory customer session state.

### `src/liveChatStore.js`

In-memory mock agent task state.

### `public/index.html`

Customer chatbot page with state banner, quick actions, details panel, and new-session control.

### `public/agent.html`

Mock live-agent dashboard with waiting queue, queue metadata, canned replies, and end-chat control.

## Socket.IO Events

### Customer Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `customer:join` | Browser to server | Join a customer session room |
| `live:state` | Server to browser | Notify customer about state changes |
| `live:message` | Server to browser | Deliver agent/system messages |

### Agent Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `agent:join` | Agent browser to server | Join the agent dashboard |
| `agent:tasks` | Server to agent browser | Send waiting/active tasks |
| `agent:accept` | Agent browser to server | Accept a waiting customer chat |
| `agent:message` | Agent browser to server | Send message to customer |
| `agent:end` | Agent browser to server | End the active chat |
| `live:message` | Server to agent browser | Deliver customer/system messages |

## Local-Only Limitations

- Sessions are stored in memory.
- Agent tasks are stored in memory.
- Data is lost when the server restarts.
- Multiple Node.js instances will not share sessions.
- There is no authentication.
- There is no real queue, routing profile, or contact center backend.

For this project, those limitations are intentional because the goal is a free local mock.

## Useful Commands

Start dev server:

```bash
npm run dev
```

Start normal server:

```bash
npm start
```

Check health:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

Open customer page:

```text
http://localhost:3000
```

Open agent dashboard:

```text
http://localhost:3000/agent
```

## Troubleshooting

### Browser still shows old page

Stop and restart the server:

```powershell
Ctrl + C
npm run dev
```

Then refresh the browser.

### Port 3000 is already in use

Either stop the old server with `Ctrl + C`, or change `.env`:

```env
PORT=3001
```

Then open:

```text
http://localhost:3001
http://localhost:3001/agent
```

### Agent dashboard does not show waiting chat

Check these steps:

1. Open both pages from the same running server.
2. In the customer page, click `Agent`.
3. Confirm the customer page shows `WAITING_FOR_AGENT`.
4. Confirm the agent dashboard queue count increases.
5. Refresh `/agent` if it was opened before the server restarted.

### Messages do not move between customer and agent

Make sure the agent clicked `Accept`. Live messages only start after the state becomes:

```text
AGENT_CONNECTED
```
