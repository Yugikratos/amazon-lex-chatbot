const sessions = new Map();

export const CONVERSATION_STATES = {
  BOT_ACTIVE: "BOT_ACTIVE",
  WAITING_FOR_AGENT: "WAITING_FOR_AGENT",
  AGENT_CONNECTED: "AGENT_CONNECTED",
  ENDED: "ENDED"
};

export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      turnCount: 0,
      conversationState: CONVERSATION_STATES.BOT_ACTIVE,
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

export function setConversationState(sessionId, conversationState) {
  const session = getSession(sessionId);
  session.conversationState = conversationState;
  session.updatedAt = new Date().toISOString();
  return session;
}

export function getConversationState(sessionId) {
  return getSession(sessionId).conversationState;
}

function removeEmptySlots(slots) {
  return Object.fromEntries(
    Object.entries(slots).filter(([, value]) => value !== null && value !== undefined)
  );
}
