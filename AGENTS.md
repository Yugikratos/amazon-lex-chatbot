# Repository Guidelines

## Project Structure & Module Organization

This is a local Node.js Express mock chatbot with Socket.IO live-agent handoff.

- `src/server.js`: Express server, routes, Socket.IO events, and static frontend serving.
- `src/intentDetector.js`: keyword-based intent detection and slot extraction.
- `src/mockLex.js`: Lex V2-style response builder.
- `src/sessionStore.js`: in-memory customer session state.
- `src/liveChatStore.js`: in-memory mock agent task state.
- `public/index.html`, `public/app.js`, `public/styles.css`: customer chat frontend.
- `public/agent.html`, `public/agent.js`, `public/agent.css`: mock agent dashboard.
- `.env.example`: local configuration example.

There is currently no `tests/` directory.

## Build, Test, and Development Commands

Install dependencies:

```bash
npm install
```

Run locally with file watching:

```bash
npm run dev
```

Run normally:

```bash
npm start
```

Check syntax before committing:

```bash
node --check src/server.js
node --check public/app.js
node --check public/agent.js
```

## Coding Style & Naming Conventions

Use ES modules (`import` / `export`) and keep code in plain JavaScript. Prefer `const` by default and `let` only when reassignment is required. Use two-space indentation, semicolons, and descriptive camelCase names for variables and functions. Constants that represent fixed states or enums should use uppercase object keys, for example `CONVERSATION_STATES.BOT_ACTIVE`.

Keep route handlers thin where possible. Put reusable state or chatbot logic in `src/*Store.js`, `src/mockLex.js`, or `src/intentDetector.js`.

## Testing Guidelines

No automated test framework is configured yet. For now, verify changes manually:

1. Start `npm run dev`.
2. Open `http://localhost:3000`.
3. Open `http://localhost:3000/agent`.
4. Test greeting, order status, complaint, fallback, and live-agent handoff.
5. Verify `New Session` resets the visible customer session.
6. Verify canned agent replies reach the customer after `Accept`.

If tests are added later, prefer colocated `*.test.js` files or a top-level `tests/` directory.

## Commit & Pull Request Guidelines

Recent history uses short informal messages, but new commits should be clearer and imperative, for example:

```text
Add agent handoff dashboard
Fix conversation state reset
Update README testing steps
```

Pull requests should include a short summary, manual test steps, screenshots for frontend changes, and any known limitations. Link related issues when available.

## Security & Configuration Tips

This project must remain local and free. Do not add OpenAI, Ollama, AWS, Twilio, paid APIs, cloud dependencies, or external runtime services. Do not commit `.env`, credentials, API keys, or generated `node_modules/`.

## Frontend Contribution Notes

Keep the customer and agent pages easy to demo in two tabs. When changing handoff behavior, update the visible state banner, the details panel, and the README demo script together. Avoid adding build tooling unless it clearly improves this small local mock.
