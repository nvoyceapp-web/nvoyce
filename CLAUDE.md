# Nvoyce — Claude Context

AI-powered invoice and proposal generator for freelancers and gig workers.
Live at [app.nvoyce.ai](https://app.nvoyce.ai)

---

## Rules

- **Never commit or push from a local Claude Code session** — all changes go through Cowork → GitHub → Vercel
- Do what has been asked; nothing more, nothing less
- Always read a file before editing it
- Never commit secrets, credentials, or .env files
- Run `npm run build` to verify before committing

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | Supabase (PostgreSQL, service role key bypasses RLS) |
| AI | Anthropic Claude Sonnet (claude-sonnet-4-6) |
| Payments | Stripe (payment links, webhooks, subscriptions) |
| Email | Resend (FROM: invoices@nvoyce.ai) |
| Cron | Vercel Cron Jobs (daily reminders at 9am UTC) |
| Deployment | Vercel (auto-deploys from GitHub main) |

---

## Project Structure

```
app/
  page.tsx                          # Landing page
  about/page.tsx                    # About + features
  dashboard/
    page.tsx                        # Main dashboard (stats, charts, table, toasts)
    new/page.tsx                    # 3-step wizard (invoice + proposal creation)
    documents/[id]/page.tsx         # Draft review + sent detail page
    settings/page.tsx               # Logo upload, notifications, billing
    faq/page.tsx                    # FAQ accordion
  p/[proposalId]/page.tsx           # Public proposal acceptance page (no auth)
  api/
    generate/route.ts               # Claude AI generation → saves draft
    invoices/send/route.ts          # Draft → sent (number, payment link, email)
    proposals/
      send/route.ts
      generate-invoice/route.ts     # Acceptance → auto-creates invoice
      notify/route.ts               # Freelancer email on acceptance
      decline/route.ts
    payment-link/route.ts           # Stripe payment link creation
    webhooks/stripe/route.ts        # Payment events → status + emails
    documents/
      status/route.ts               # Mark paid / update amount_paid
      archive/route.ts
      delete/route.ts
    stripe/
      create-checkout/route.ts
      billing-portal/route.ts
    cron/
      reminders/route.ts            # Overdue + expiry reminder emails (9am UTC)
lib/
  email.ts                          # All 10 Resend email functions
  supabase.ts                       # Supabase client + Document types
  supabase-server.ts                # Server-side Supabase (service role)
  stripe.ts                         # Stripe client + createPaymentLink()
  document-numbers.ts               # assignDocumentNumber() — INV/PRO-YYYY-NNN
components/
  Sidebar.tsx
  TopBar.tsx
  MobileNav.tsx
  QRModal.tsx
```

---

## Key Flows

**Invoice:** wizard → Generate Draft → review/edit → Send to Client → Stripe link created → email sent → client pays → webhook auto-updates status → toast notification

**Proposal:** same wizard → client receives `/p/[id]` link → accepts → invoice auto-generated → both parties notified

**Reminders:** daily cron checks overdue invoices (14d, 30d) and expiring proposals (1–2 days) → sends targeted emails, tracked via `reminder_14_sent_at`, `reminder_30_sent_at`, `expiry_reminder_sent_at`

---

## Subscription Tiers

- **Free:** 3 docs/month (enforced in `/api/generate`)
- **Pro:** $19.99/mo — unlimited
- **Business:** $39.99/mo — future team features
- Default for users with no subscription row: **pro** (prevents false gating)

---

## Document Numbers

- Assigned at **send time** only (drafts show `—`)
- Format: `INV-YYYY-NNN` / `PRO-YYYY-NNN` (sequential per year per user)

---

## Build & Dev

```bash
npm install
npm run dev
npm run build   # always verify before committing
```

For Stripe webhook testing locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

See `SETUP.md` for full env var reference and database schema.
