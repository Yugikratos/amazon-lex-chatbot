import { detectIntent, extractSlots, INTENTS } from "./intentDetector.js";
import { updateSession } from "./sessionStore.js";

const CONNECT_ACTIONS = {
  CONTINUE_BOT: "ContinueBot",
  TRANSFER_TO_AGENT: "TransferToAgent",
  END_CONVERSATION: "EndConversation"
};

export function recognizeText({ message, sessionId }) {
  const intent = detectIntent(message);
  const slots = extractSlots(message, intent.name);
  const connectAction = getConnectAction(intent.name, slots);
  const session = updateSession(sessionId, {
    message,
    intent,
    slots,
    connectAction
  });

  return {
    sessionId,
    intent,
    sessionState: {
      dialogAction: {
        type: connectAction === CONNECT_ACTIONS.CONTINUE_BOT ? "ElicitIntent" : "Close"
      },
      intent: {
        name: intent.name,
        state: intent.state,
        slots: session.slots
      },
      sessionAttributes: {
        turnCount: String(session.turnCount),
        lastIntent: intent.name,
        connectAction
      }
    },
    messages: getMessages(intent.name, slots),
    slots: session.slots,
    connectAction
  };
}

function getConnectAction(intentName, slots) {
  if (intentName === INTENTS.TALK_TO_AGENT) {
    return CONNECT_ACTIONS.TRANSFER_TO_AGENT;
  }

  if (intentName === INTENTS.CHECK_ORDER_STATUS && slots.orderId) {
    return CONNECT_ACTIONS.END_CONVERSATION;
  }

  if (intentName === INTENTS.RAISE_COMPLAINT) {
    return CONNECT_ACTIONS.END_CONVERSATION;
  }

  if (intentName === INTENTS.FALLBACK) {
    return CONNECT_ACTIONS.CONTINUE_BOT;
  }

  return CONNECT_ACTIONS.CONTINUE_BOT;
}

function getMessages(intentName, slots) {
  const responses = {
    [INTENTS.GREETING]: "Hello. I can help with order status, complaints, or connecting you to an agent.",
    [INTENTS.CHECK_ORDER_STATUS]: slots.orderId
      ? `Your order ${slots.orderId.value.interpretedValue} is being checked. You will receive the latest status shortly.`
      : "I can check your order status. Please share your order ID.",
    [INTENTS.RAISE_COMPLAINT]: "I have captured your complaint. Our support team will review it and follow up.",
    [INTENTS.TALK_TO_AGENT]: "I will transfer you to a support agent now.",
    [INTENTS.FALLBACK]: "I did not understand that. You can ask about an order, raise a complaint, or request an agent."
  };

  return [
    {
      contentType: "PlainText",
      content: responses[intentName]
    }
  ];
}
