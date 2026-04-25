const sessions = new Map();

export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      turnCount: 0,
      currentIntent: null,
      slots: {},
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return sessions.get(sessionId);
}

export function updateSession(sessionId, { message, intent, slots, connectAction }) {
  const session = getSession(sessionId);

  session.turnCount += 1;
  session.currentIntent = intent.name;
  session.slots = {
    ...session.slots,
    ...removeEmptySlots(slots)
  };
  session.history.push({
    message,
    intentName: intent.name,
    connectAction,
    timestamp: new Date().toISOString()
  });
  session.updatedAt = new Date().toISOString();

  return session;
}

function removeEmptySlots(slots) {
  return Object.fromEntries(
    Object.entries(slots).filter(([, value]) => value !== null && value !== undefined)
  );
}
