import { z } from "zod";
import { sendEmail } from "./infrai.js";

export const paymentEventSchema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;
export type ReceiptDecision = { status: "sent" | "review"; audit: string; messageId?: string };

export async function handlePayment(raw: unknown): Promise<ReceiptDecision> {
  const event = paymentEventSchema.parse(raw);
  const audit = `payment ${event.eventId} order ${event.orderId} amount ${event.amountCents} ${event.currency}`;
  if (event.amountCents > 500000) return { status: "review", audit: `${audit}; manual risk review required` };
  const result = await sendEmail({
    to: event.customerEmail,
    subject: `Receipt for order ${event.orderId}`,
    html: `<p>Payment received: ${(event.amountCents / 100).toFixed(2)} ${event.currency}</p><p>Order: ${event.orderId}</p>`,
  }, `receipt-${event.eventId}`);
  return { status: "sent", audit: `${audit}; receipt dispatched`, messageId: result?.message_id };
}
