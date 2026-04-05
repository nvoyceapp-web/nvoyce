# Nvoyce — Setup Guide

> Your AI-powered invoice and proposal generator. Follow these steps in order.

---

## Prerequisites

Install these before starting:
- [Node.js 18+](https://nodejs.org) — `node --version` to check
- [Git](https://git-scm.com)
- A code editor ([VS Code](https://code.visualstudio.com) recommended)

---

## Step 1 — Install dependencies

```bash
cd invoiceai
npm install
```

---

## Step 2 — Set up your accounts (free tiers on everything)

### Anthropic (Claude API)
1. Go to https://console.anthropic.com
2. Create an account and go to API Keys
3. Create a new key — copy it

### Clerk (Auth)
1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** from the API Keys tab

### Supabase (Database)
1. Go to https://supabase.com and create a project
2. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this private!)
3. Go to **SQL Editor** and paste + run the contents of `supabase/schema.sql`

### Stripe (Payments)
1. Go to https://dashboard.stripe.com
2. Go to **Developers → API keys** and copy your test keys
3. To receive webhooks locally, install [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the webhook secret it gives you.

### Resend (Email — Phase 2)
1. Go to https://resend.com and create an account
2. Create an API key

---

## Step 3 — Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in all the values from Step 2.

---

## Step 4 — Run locally

```bash
npm run dev
```

Open http://localhost:3000 — you should see the landing page.

---

## Step 5 — Test the flow

1. Click **Get started free** and sign up
2. Click **+ New Document**
3. Fill in the 3-step form
4. Hit **Generate with AI** — Claude will produce your document in ~10 seconds
5. Check your Supabase dashboard to see the record saved

---

## Step 6 — Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow the prompts. Then go to your Vercel dashboard:
- **Settings → Environment Variables** — add all your `.env.local` values
- Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Update your Stripe webhook URL to your Vercel deployment URL

---

## Project Structure

```
nvoyce/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Clerk provider)
│   ├── globals.css                 # Global styles
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard home
│   │   └── new/
│   │       └── page.tsx            # New document form (3-step wizard)
│   └── api/
│       ├── generate/
│       │   └── route.ts            # ← THE CORE: calls Claude, saves to Supabase
│       └── webhooks/
│           └── stripe/
│               └── route.ts        # Stripe webhook handler
├── lib/
│   ├── supabase.ts                 # Supabase client + TypeScript types
│   └── stripe.ts                   # Stripe helpers + pricing plans
├── supabase/
│   └── schema.sql                  # Database schema — run this first
├── middleware.ts                   # Clerk auth middleware
├── .env.local.example              # Environment variable template
└── SETUP.md                        # This file
```

---

## What to build next (Phase 2)

- `app/dashboard/documents/[id]/page.tsx` — Document viewer with payment link
- `app/api/send-invoice/route.ts` — Email invoice to client via Resend
- `app/dashboard/invoices/page.tsx` — Invoice list with status filters
- `app/api/create-checkout/route.ts` — Stripe subscription checkout
- Follow-up email sequences for unpaid invoices

---

## Getting your first customers

1. DM 10 freelancers in your network today — offer free early access
2. Post a screen recording in r/freelance
3. List on ProductHunt once it's polished
4. The moment someone generates their first invoice = they're hooked

---

Nvoyce · Built with Claude · April 2026
