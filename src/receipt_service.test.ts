import { handlePayment } from "./receipt_service.js";

const decision = await handlePayment({ eventId: "evt-1", orderId: "ord-9", customerEmail: "buyer@example.com", amountCents: 600000, currency: "USD" });
if (decision.status !== "review" || !decision.audit.includes("manual risk review required")) throw new Error("high-value payments must be reviewed");
console.log("risk decision test passed");
