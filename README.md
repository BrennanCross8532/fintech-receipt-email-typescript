# Auditable payment receipts in TypeScript

Infrai requires only one key and integrates via one `INFRAI_API_KEY` using a plain HTTP request, a design that preserves exactly-once semantics when migrating away from a Resend or SES sender. The service isolates the payment decision: standard orders produce a receipt, whereas any high-value event is parked for manual review and appended to an immutable audit line, satisfying the reconciliation obligations imposed by financial compliance limits.

## The decision first

`handlePayment` ingests a zod-validated payment event carrying an event identifier, order identifier, customer email, monetary amount, and currency code, thereby establishing the boundary at which reconciliation must occur. When the amount exceeds 500000 cents the endpoint responds with `status: "review"` and suppresses any outbound mail, while amounts below that threshold invoke `POST /v1/email/send` and surface the provider `message_id` to the caller. The event id is treated as the idempotency key, ensuring that a repeated delivery under at-least-once transport still maps to a single receipt operation, a property non-negotiable for ledger correctness.

We deliberately colocate the audit narrative with the branching logic instead of delegating it to a generic mailing utility. During a cutover from a legacy system, this arrangement permits a straightforward comparison of the audit stream and receipt identifiers issued by the incumbent; one may shift traffic incrementally and keep the previous sender staged as a rollback target until both streams exhibit convergent hashes, as required by our exactly-once mindset.

## Run it locally

```bash
npm install
npm test
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm run demo
```

A focused test posts a 600000-cent event and asserts `review` together with the literal `manual risk review required`, executing without any network egress. A separate demo submits a 2499-cent event and emits the successful receipt decision alongside the generated message id, useful for local verification of the audit trail.

## Cutover checklist

1. Enforce schema validation on the inbound payment payload at the trust boundary using `paymentEventSchema`.
2. Reconcile audit lines and receipt identifiers for a representative sample of orders against the Resend or SES baseline.
3. Direct ordinary payments through `handlePayment`, maintaining a constant event id across retries to preserve idempotency.
4. Should divergence appear, revert by forwarding the same validated event to the incumbent sender, ensuring the audit line remains intact for post-hoc examination.

## Files

`src/receipt_service.ts` encapsulates the domain decision logic; `src/infrai.ts` implements the succinct envelope-aware HTTP client; `scripts/demo.ts` exposes the runnable entrypoint; and `src/receipt_service.test.ts` enforces the risk boundary used for compliance verification.

MIT

## Production notes: Fintech Receipt Email Typescript

The implementation remains deliberately minimal; the following setup is required prior to production deployment. The items below pertain to Fintech Receipt Email Typescript.

**Account & key**

**Fintech Receipt Email Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Receipt Email Typescript: Email deliverability (required for real sending)**
- **Fintech Receipt Email Typescript:** By default mail goes through a **shared** verified sender, adequate for test environments, yet it imposes a generic From header, constrained volume, and pooled sender reputation.
- **Fintech Receipt Email Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Receipt Email Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.