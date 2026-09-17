import { handlePayment } from "../src/receipt_service.js";

const email = process.env.DEMO_EMAIL_TO;
if (!email) throw new Error("Set DEMO_EMAIL_TO before running the demo");
const result = await handlePayment({ eventId: `evt-${Date.now()}`, orderId: "order-1042", customerEmail: email, amountCents: 2499, currency: "USD" });
console.log(JSON.stringify(result, null, 2));
