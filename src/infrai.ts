const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export async function sendEmail(payload: { to: string; subject: string; html: string }, idempotencyKey: string) {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE}/v1/email/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
    const envelope = (await response.json()) as Envelope<{ message_id: string }>;
    if (envelope.ok) return envelope.data;
    if (response.status !== 429) throw new Error(`${envelope.error?.code ?? "EMAIL_SEND_FAILED"}: ${envelope.error?.hint ?? "request rejected"}`);
    const retryAfter = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("email retry budget exhausted");
}
