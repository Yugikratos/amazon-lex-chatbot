# Mock Amazon Lex V2 + Amazon Connect Chatbot

This project is a Node.js Express app that simulates an Amazon Lex V2 chatbot and Amazon Connect routing without using AWS. It includes both:

- A backend API: `POST /chat`
- A browser frontend: `http://localhost:3000`

Use this project to test chatbot flows locally before replacing the mock logic with real Amazon Lex V2 `RecognizeTextCommand` and Amazon Connect contact flows.

## What It Does

- Accepts a user message and `sessionId`
- Detects intents using keyword-based logic
- Stores session state in memory
- Returns a Lex V2-style response format
- Simulates Amazon Connect routing with `connectAction`
- Provides a simple frontend for testing without PowerShell JSON commands

## Supported Intents

| Intent | Example message | Result |
| --- | --- | --- |
| `GreetingIntent` | `hello` | Starts or continues the bot conversation |
| `CheckOrderStatusIntent` | `track my order ORD12345` | Extracts order ID and returns order-status response |
| `RaiseComplaintIntent` | `my item arrived damaged for order ORD12345` | Captures complaint type and order ID |
| `TalkToAgentIntent` | `I want to talk to a human agent` | Simulates transfer to an agent |
| `FallbackIntent` | `random unknown text` | Handles unrecognized input |

## Simulated Amazon Connect Actions

| connectAction | Meaning |
| --- | --- |
| `ContinueBot` | Keep the customer in the bot flow |
| `TransferToAgent` | Transfer the customer to a support agent or queue |
| `EndConversation` | End the self-service flow after completing the request |

## Project Structure

```text
.
|-- public
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- src
|   |-- config.js
|   |-- intentDetector.js
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

No AWS account or AWS credentials are required for this mock version.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```powershell
copy .env.example .env
```

The only environment variable currently used is:

```env
PORT=3000
```

Start the development server:

```bash
npm run dev
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

You should see:

```text
Server listening on port 3000
```

## Use The Frontend

Open this URL in your browser:

```text
http://localhost:3000
```

The frontend includes:

- Chat input
- Quick test buttons for all intents
- Intent display
- Connect action display
- Slots display
- Session state display

This is the easiest way to check the chatbot.

## API Endpoints

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
  "message": "track my order ORD12345",
  "sessionId": "demo-1"
}
```

Response:

```json
{
  "sessionId": "demo-1",
  "intent": {
    "name": "CheckOrderStatusIntent",
    "confidence": 0.95,
    "state": "Fulfilled"
  },
  "sessionState": {
    "dialogAction": {
      "type": "Close"
    },
    "intent": {
      "name": "CheckOrderStatusIntent",
      "state": "Fulfilled",
      "slots": {
        "orderId": {
          "value": {
            "interpretedValue": "ORD12345"
          }
        }
      }
    },
    "sessionAttributes": {
      "turnCount": "1",
      "lastIntent": "CheckOrderStatusIntent",
      "connectAction": "EndConversation"
    }
  },
  "messages": [
    {
      "contentType": "PlainText",
      "content": "Your order ORD12345 is being checked. You will receive the latest status shortly."
    }
  ],
  "slots": {
    "orderId": {
      "value": {
        "interpretedValue": "ORD12345"
      }
    }
  },
  "connectAction": "EndConversation"
}
```

## PowerShell Test Requests

The browser UI is easier, but you can also test the API from PowerShell.

Greeting:

```powershell
$body = @{ message = "hello"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Check order status:

```powershell
$body = @{ message = "track my order ORD12345"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Raise complaint:

```powershell
$body = @{ message = "my item arrived damaged for order ORD12345"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Talk to agent:

```powershell
$body = @{ message = "I want to talk to a human agent"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

Fallback:

```powershell
$body = @{ message = "random unknown text"; sessionId = "demo-1" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/chat" -ContentType "application/json" -Body $body
```

## How The Code Works

### `src/server.js`

Creates the Express server, serves the frontend from `public`, exposes `/health`, and handles `/chat`.

### `src/intentDetector.js`

Uses keyword rules to detect the intent:

- Greeting keywords: `hi`, `hello`, `hey`
- Order keywords: `order`, `track`, `status`, `delivery`
- Complaint keywords: `complaint`, `damaged`, `broken`, `refund`, `return`
- Agent keywords: `agent`, `human`, `representative`, `customer care`

It also extracts simple slots such as:

- `orderId`
- `complaintType`

### `src/sessionStore.js`

Stores sessions in memory using a JavaScript `Map`.

Each session tracks:

- `sessionId`
- `turnCount`
- `currentIntent`
- `slots`
- `history`
- timestamps

Sessions are reset when the server restarts.

### `src/mockLex.js`

Builds the Lex V2-style response and decides the simulated Amazon Connect action.

Example:

- `TalkToAgentIntent` returns `TransferToAgent`
- Completed order status returns `EndConversation`
- Fallback returns `ContinueBot`

### `public`

Contains the browser chat UI:

- `index.html`: page layout
- `styles.css`: UI styling
- `app.js`: browser-side chat logic using `fetch("/chat")`

## Replacing The Mock With Real AWS Lex V2

When your real Amazon Lex V2 bot is ready, replace the local logic in `src/mockLex.js` with AWS SDK v3 Lex Runtime V2.

Install the AWS SDK package:

```bash
npm install @aws-sdk/client-lex-runtime-v2
```

Add environment variables:

```env
AWS_REGION=us-east-1
LEX_BOT_ID=your_lex_bot_id
LEX_BOT_ALIAS_ID=your_lex_bot_alias_id
LEX_LOCALE_ID=en_US
```

Example Lex call:

```js
import {
  LexRuntimeV2Client,
  RecognizeTextCommand
} from "@aws-sdk/client-lex-runtime-v2";

const client = new LexRuntimeV2Client({
  region: process.env.AWS_REGION
});

const command = new RecognizeTextCommand({
  botId: process.env.LEX_BOT_ID,
  botAliasId: process.env.LEX_BOT_ALIAS_ID,
  localeId: process.env.LEX_LOCALE_ID,
  sessionId,
  text: message
});

const response = await client.send(command);
```

Then map the real Lex response into the same frontend contract:

- `sessionId`
- `intent`
- `sessionState`
- `messages`
- `slots`
- `connectAction`

Keeping the response shape stable means the frontend does not need major changes when you switch from mock Lex to real Lex.

## Connecting Real Lex To Amazon Connect

With real Amazon Connect:

1. Open the Amazon Connect console.
2. Select your Connect instance.
3. Add your Lex V2 bot alias to the instance integration settings.
4. Open or create a contact flow.
5. Add a `Get customer input` block.
6. Select your Lex V2 bot, alias, and locale.
7. Map Lex intents to contact-flow branches.
8. Route `TalkToAgentIntent` to `Transfer to queue`.
9. Route fallback and no-input branches to retry prompts or a support queue.
10. Publish the contact flow.
11. Attach the flow to a phone number or entry point.

Mock-to-Connect mapping:

| Mock intent | Mock connectAction | Real Amazon Connect behavior |
| --- | --- | --- |
| `GreetingIntent` | `ContinueBot` | Continue in the `Get customer input` flow |
| `CheckOrderStatusIntent` | `EndConversation` | Call Lambda/order API, play result, disconnect or continue |
| `RaiseComplaintIntent` | `EndConversation` | Create complaint case, play confirmation, disconnect or continue |
| `TalkToAgentIntent` | `TransferToAgent` | Transfer to queue |
| `FallbackIntent` | `ContinueBot` | Retry prompt or fallback branch |

## Production Notes

- Add authentication before exposing `/chat` publicly.
- Add rate limiting for public clients.
- Move session state from memory to Redis, DynamoDB, or another shared store for multi-instance deployments.
- Add structured logging for request IDs and session IDs.
- Avoid logging sensitive user messages in production.
- Keep the frontend API contract stable while replacing the mock with AWS services.

## Useful Commands

Start development server:

```bash
npm run dev
```

Start production server:

```bash
npm start
```

Check health:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```
