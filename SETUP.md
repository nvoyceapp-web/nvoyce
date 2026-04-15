# Nvoyce — Setup & System Design

> AI-powered invoice and proposal generator for freelancers and gig workers.
> **Status:** Phase 1.2 complete — automated reminders live, production deployed at app.nvoyce.ai

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, `'use client'` components) |
| Auth | Clerk (useAuth, clerkClient, middleware) |
| Database | Supabase (service role key bypasses RLS) |
| AI | Anthropic Claude Sonnet (claude-sonnet-4-6) |
| Payments | Stripe (payment links, checkout, webhooks) |
| Email | Resend (transactional, FROM: invoices@nvoyce.ai) |
| Cron | Vercel Cron Jobs (daily reminders at 9am UTC) |
| Deployment | Vercel (auto-deploys from GitHub main branch) |
| Domain | app.nvoyce.ai → Vercel. nvoyce.ai → marketing (Lovable) |

---

## Prerequisites

- Node.js 18+
- Git

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Accounts & Keys

### Anthropic
1. https://console.anthropic.com → API Keys → create key

### Clerk
1. https://dashboard.clerk.com → create app
2. Copy Publishable Key + Secret Key from API Keys tab
3. Configure Clerk webhook → `CLERK_WEBHOOK_SECRET` (for welcome email on signup)

### Supabase
1. https://supabase.com → create project
2. Settings → API → copy URL, anon key, service_role key
3. SQL Editor → run `supabase/schema.sql`

**Required columns (run if missing):**
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reminder_14_sent_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;
```

**Required tables:**
- `documents` — invoices + proposals
- `subscriptions` — user plan (free/pro), status, Stripe subscription ID
- `user_settings` — logo_url, business_name, timezone per user

### Stripe
1. https://dashboard.stripe.com → Developers → API keys
2. Create two products: Pro ($19.99/mo) and Business ($39.99/mo)
3. Copy the `price_...` IDs (NOT `prod_...` IDs)
4. Webhooks → add endpoint: `https://app.nvoyce.ai/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`
5. Copy webhook signing secret

### Resend
1. https://resend.com → API Keys → create key
2. Domain: invoices@nvoyce.ai (verified)

---

## Step 3 — Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...
FROM_EMAIL=invoices@nvoyce.ai

# Cron (protects /api/cron/* routes from unauthorized calls)
CRON_SECRET=your-secret-here

# App
NEXT_PUBLIC_APP_URL=https://app.nvoyce.ai
```

---

## Step 4 — Run locally

```bash
npm run dev
```

For webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Project Structure

```
nvoyce/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── about/page.tsx                    # About + features
│   ├── dashboard/
│   │   ├── page.tsx                      # Main dashboard (stats, charts, document table, toasts)
│   │   ├── new/page.tsx                  # 3-step wizard (invoice + proposal creation)
│   │   ├── documents/[id]/page.tsx       # Draft review + sent detail page
│   │   ├── settings/page.tsx             # Logo upload, notifications, billing
│   │   └── faq/page.tsx                  # FAQ (accordion groups)
│   ├── p/[proposalId]/page.tsx           # Public proposal acceptance page (no auth)
│   └── api/
│       ├── generate/route.ts             # Claude AI generation → saves draft
│       ├── invoices/send/route.ts        # Draft → sent (assigns number, payment link, email)
│       ├── proposals/
│       │   ├── send/route.ts             # Proposal → sent
│       │   ├── generate-invoice/route.ts # Acceptance → auto-creates invoice
│       │   ├── notify/route.ts           # Freelancer email on acceptance (via Clerk)
│       │   └── decline/route.ts          # Marks declined, emails freelancer
│       ├── payment-link/route.ts         # Stripe payment link creation
│       ├── webhooks/stripe/route.ts      # Payment events → status update + emails
│       ├── documents/
│       │   ├── status/route.ts           # Mark paid / update status + amount_paid
│       │   ├── archive/route.ts          # Archive eligible documents
│       │   └── delete/route.ts           # Delete drafts only
│       ├── stripe/
│       │   ├── create-checkout/route.ts  # Subscription upgrade checkout
│       │   └── billing-portal/route.ts  # Customer portal link
│       └── cron/
│           ├── expire-trials/route.ts    # Trial expiry (runs midnight UTC)
│           └── reminders/route.ts        # Overdue + expiry reminder emails (runs 9am UTC)
├── lib/
│   ├── email.ts                          # All Resend email functions (10 functions)
│   ├── supabase.ts                       # Supabase client + Document types
│   ├── supabase-server.ts                # Server-side Supabase (service role)
│   ├── stripe.ts                         # Stripe client + createPaymentLink()
│   └── document-numbers.ts              # assignDocumentNumber() — INV/PRO-YYYY-NNN
├── components/
│   ├── Sidebar.tsx                       # Desktop left nav
│   ├── TopBar.tsx                        # Desktop top bar
│   ├── MobileNav.tsx                     # Mobile hamburger + overlay
│   └── QRModal.tsx                       # QR code modal for payment links
├── vercel.json                           # Cron job schedules
└── supabase/schema.sql                   # Database schema
```

---

## Core Flows

### Invoice Creation
1. `/dashboard/new` — 3-step wizard → "Generate Draft →"
2. `POST /api/generate` — Claude generates content → saves `status: 'draft'`
   - If `replaceDraftId` in body: atomically deletes old draft first (prevents duplicates on "← Back to Edit")
3. `/dashboard/documents/[id]` — editable draft review (text fields editable, numbers read-only)
   - "← Back to Edit" → back to wizard with prefill
   - "Save Draft" → stays in draft
   - "Send to Client" → calls `/api/invoices/send`
4. `/api/invoices/send` — assigns document number (INV-YYYY-NNN), creates Stripe payment link, sends invoice email, updates status to `sent`
5. Redirect to `/dashboard?invoiceCreated=id` → success banner + "View details →"

### Proposal Creation
Same as invoice flow but `PRO-YYYY-NNN` numbering. Client receives proposal link at `/p/[id]`.

### Proposal Acceptance (client-initiated)
1. Client visits `/p/[proposalId]` → clicks Accept
2. `POST /api/proposals/generate-invoice` — creates invoice, assigns number, Stripe link, sends invoice email to client, marks proposal `accepted`
3. `POST /api/proposals/notify` — fetches freelancer email via Clerk → sends 🎉 accepted email
4. Dashboard polling detects `accepted` status transition → purple toast notification

### Payment (Stripe webhook)
1. Client pays via Stripe payment link
2. `POST /api/webhooks/stripe` (checkout.session.completed):
   - Updates `amount_paid`, `status` (partially_paid / fully_paid)
   - Sends client payment receipt email (partial: amber; full: green)
   - Sends freelancer "you got paid" email (fetches custom logo)
3. Dashboard polling detects payment status change → green 💰 toast + badge on You're Owed card

### Off-Platform Payment (cash, Zelle, bank transfer)
1. Freelancer opens invoice detail page → Payment Tracking section
2. If no Stripe payment link: "Record Off-Platform Payment" form is shown
3. Freelancer enters amount paid → "✓ Save Payment"
4. `POST /api/documents/status` — writes `amount_paid` + computes status (`partially_paid` / `fully_paid`)
5. Paid and Outstanding cards update instantly (optimistic local state)

### Automated Reminders (Vercel Cron — 9am UTC daily)
`GET /api/cron/reminders` — protected by `Authorization: Bearer CRON_SECRET`

**Overdue invoice reminders:**
- Finds all invoices with `status = sent | partially_paid`
- Parses `generated_content.dueDate` to compute days overdue
- Day 14+: sends amber "Friendly Reminder" email to client → marks `reminder_14_sent_at`
- Day 30+: sends red "Final Notice" email to client → marks `reminder_30_sent_at`
- Tracking columns prevent duplicate sends across cron runs

**Proposal expiring soon:**
- Finds proposals with `status = sent` and no `expiry_reminder_sent_at`
- Computes expiry from `created_at + form_data.expirationDays`
- Sends amber "Your proposal expires in X day(s)" email when 1–2 days remain → marks `expiry_reminder_sent_at`

---

## Email Functions (lib/email.ts)

| Function | Recipient | Trigger |
|----------|-----------|---------|
| `sendWelcomeEmail()` | Freelancer | Clerk webhook: user.created |
| `sendInvoiceEmail()` | Client | Invoice sent |
| `sendProposalSentEmail()` | Client | Proposal sent |
| `sendProposalAcceptedEmail()` | Freelancer | Proposal accepted (via /api/proposals/notify) |
| `sendProposalDeclinedEmail()` | Freelancer | Proposal declined |
| `sendPaymentConfirmationEmail()` | Client | Any Stripe payment |
| `sendPaymentReceivedEmail()` | Freelancer | Any Stripe payment |
| `sendUpgradeConfirmationEmail()` | Freelancer | Subscription upgrade |
| `sendInvoiceOverdueReminderEmail()` | Client | Cron: 14 and 30 days past due |
| `sendProposalExpiringEmail()` | Client | Cron: 1–2 days before proposal expiry |

All emails call `getUserLogo(userId)` internally and fall back to brand logo (`/logo.png`) if no custom logo uploaded.

---

## Document Numbers

- Assigned at **send time** (never on draft creation)
- Format: `INV-YYYY-NNN` / `PRO-YYYY-NNN` (sequential per year per user)
- Function: `assignDocumentNumber(userId, docType, documentId)` in `lib/document-numbers.ts`
- Drafts show `—` in the dashboard number column

---

## Subscription / Free Tier

- Default for users with no subscription row: **pro** (prevents false gating for early users)
- Free tier: 3 documents/month (non-draft), enforced in `/api/generate`
- Pro: $19.99/mo — unlimited documents
- Business: $39.99/mo — (future team features)
- Billing portal: `POST /api/stripe/billing-portal` → Stripe-hosted portal

---

## Known Pending Items

1. **ProductHunt submission** — pending

---

Nvoyce · Built with Claude · Updated April 14, 2026
