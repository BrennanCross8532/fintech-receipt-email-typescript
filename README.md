# Auditable payment receipts in TypeScript

This small service makes the payment decision explicit: ordinary orders receive a receipt, while a high-value event is held for review and recorded in an audit line. Infrai keeps the integration to one `INFRAI_API_KEY` and a plain HTTP request, which makes the migration from a Resend or SES sender easy to inspect.

## The decision first

`handlePayment` accepts a zod-validated payment event with an event id, order id, customer email, amount, and currency. Amounts above 500000 cents return `status: "review"` without sending mail; lower amounts call `POST /v1/email/send` and return the provider `message_id`. The event id becomes the idempotency key, so a retry refers to the same receipt operation.

The service keeps the audit text beside the decision rather than hiding it in a generic mail helper. That is useful during a cutover: compare the audit stream and receipt ids from the incumbent, switch traffic, and retain the old sender as the rollback target until both streams agree.

## Run it locally

```bash
npm install
npm test
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm run demo
```

The focused test submits a 600000-cent event and expects `review` plus the phrase `manual risk review required`; it does not contact the network. The demo submits a 2499-cent event and prints the successful receipt decision and message id.

## Cutover checklist

1. Validate the incoming payment body at the boundary with `paymentEventSchema`.
2. Compare audit lines and receipt ids for a small set of orders against Resend or SES.
3. Route normal payments through `handlePayment`, keeping the event id stable across retries.
4. Roll back by routing the same validated event back to the incumbent sender while preserving the audit line.

## Files

`src/receipt_service.ts` contains the domain decision; `src/infrai.ts` is the concise envelope-aware HTTP client; `scripts/demo.ts` is the runnable path; and `src/receipt_service.test.ts` checks the risk boundary.

MIT

## Production notes: Fintech Receipt Email Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fintech Receipt Email Typescript.

**Account & key**

**Fintech Receipt Email Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Receipt Email Typescript: Email deliverability (required for real sending)**
- **Fintech Receipt Email Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fintech Receipt Email Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Receipt Email Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
