const INTENTS = {
  GREETING: "GreetingIntent",
  CHECK_ORDER_STATUS: "CheckOrderStatusIntent",
  RAISE_COMPLAINT: "RaiseComplaintIntent",
  TALK_TO_AGENT: "TalkToAgentIntent",
  FALLBACK: "FallbackIntent"
};

const keywordRules = [
  {
    intentName: INTENTS.TALK_TO_AGENT,
    keywords: ["agent", "human", "representative", "person", "support executive", "customer care"]
  },
  {
    intentName: INTENTS.RAISE_COMPLAINT,
    keywords: ["complaint", "complain", "issue", "problem", "damaged", "broken", "refund", "return"]
  },
  {
    intentName: INTENTS.CHECK_ORDER_STATUS,
    keywords: ["order", "status", "track", "tracking", "delivery", "shipment", "where is my order"]
  },
  {
    intentName: INTENTS.GREETING,
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
  }
];

export function detectIntent(message) {
  const normalizedMessage = message.toLowerCase();
  const matchedRule = keywordRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(keyword))
  );

  const intentName = matchedRule?.intentName || INTENTS.FALLBACK;

  return {
    name: intentName,
    confidence: intentName === INTENTS.FALLBACK ? 0.2 : 0.95,
    state: intentName === INTENTS.FALLBACK ? "Failed" : "Fulfilled"
  };
}

export function extractSlots(message, intentName) {
  const orderIdMatch = message.match(
    /\b(?:order|order id|order number)?\s*#?\s*([A-Z]*\d[A-Z0-9-]{4,})\b/i
  );

  if (intentName === INTENTS.CHECK_ORDER_STATUS) {
    return {
      orderId: orderIdMatch
        ? { value: { interpretedValue: orderIdMatch[1].toUpperCase() } }
        : null
    };
  }

  if (intentName === INTENTS.RAISE_COMPLAINT) {
    return {
      complaintType: {
        value: {
          interpretedValue: inferComplaintType(message)
        }
      },
      orderId: orderIdMatch
        ? { value: { interpretedValue: orderIdMatch[1].toUpperCase() } }
        : null
    };
  }

  return {};
}

function inferComplaintType(message) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("refund")) return "Refund";
  if (normalizedMessage.includes("return")) return "Return";
  if (normalizedMessage.includes("damaged") || normalizedMessage.includes("broken")) return "DamagedItem";
  if (normalizedMessage.includes("delivery") || normalizedMessage.includes("late")) return "DeliveryIssue";

  return "GeneralComplaint";
}

export { INTENTS };
