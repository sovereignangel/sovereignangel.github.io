---
name: integration-stripe
description: Add Stripe checkout, subscription management, and webhook handling
invocation: user
---

# Stripe Integration

Add Stripe payments to the venture. Covers checkout, subscriptions, and webhooks.

## Dependencies

```json
{
  "stripe": "^17.0.0",
  "@stripe/stripe-js": "^4.0.0"
}
```

## Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Files to Generate

### `lib/stripe.ts` — Server-side client
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})
```

### `app/api/checkout/route.ts` — Create checkout session
- Accept `priceId` and optional `customerId`
- Create Stripe Checkout Session
- Return session URL for redirect

### `app/api/webhooks/stripe/route.ts` — Webhook handler
Handle these events:
- `checkout.session.completed` — Activate subscription
- `customer.subscription.updated` — Handle plan changes
- `customer.subscription.deleted` — Handle cancellation
- `invoice.payment_failed` — Handle failed payments

Use `stripe.webhooks.constructEvent()` for signature verification.

### `components/PricingTable.tsx` — Pricing page
- 2-3 tier cards (Free, Pro, Enterprise)
- Highlight the recommended tier
- Each card: name, price, features list, CTA button
- CTA calls the checkout API route

## Patterns

- Never expose `STRIPE_SECRET_KEY` to the client
- Use Stripe Checkout (hosted) — don't build custom payment forms
- Store `stripeCustomerId` on the user record for returning customers
- Use Stripe's price IDs (configured in dashboard) — don't hardcode prices
