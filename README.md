# Nvoyce

**AI-powered invoice and proposal generator for freelancers and gig workers.**

Live at [app.nvoyce.ai](https://app.nvoyce.ai)

---

## What it does

Nvoyce lets freelancers create professional invoices and proposals in seconds using AI, send them to clients, collect payments via Stripe, and track everything from a real-time dashboard — without the overhead of traditional invoicing software.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Sonnet |
| Payments | Stripe (payment links, webhooks, subscriptions) |
| Email | Resend |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Features

- **AI document generation** — Claude generates professional invoice and proposal content from a 3-step form in ~2 seconds
- **Client proposal flow** — clients receive a proposal link, can accept or decline without signing up; acceptance auto-generates an invoice
- **Stripe payments** — payment links embedded in every invoice; webhooks auto-update status on payment
- **Real-time dashboard** — live toast notifications when invoices are paid or proposals are accepted; polling-based status diffing
- **Automated reminders** — Vercel Cron sends overdue invoice reminders at 14 and 30 days, and proposal expiry warnings 2 days before deadline
- **Subscription billing** — Free / Pro ($19.99/mo) / Business ($39.99/mo) tiers with Stripe Checkout and customer portal
- **Custom branding** — freelancers upload their logo; displayed on all documents and emails
- **Document management** — draft editing, document numbering (INV/PRO-YYYY-NNN), archive, search, CSV export
- **10 transactional email workflows** — welcome, invoice sent, proposal sent/accepted/declined, payment receipts, overdue reminders, expiry warnings
- **Mobile responsive** — full mobile nav, responsive dashboard and document pages

---

## Architecture

```
Client (Browser)
    ↓ HTTPS
Next.js App Router (Vercel)
    ↓ API Routes
┌─────────────┬──────────────┬────────────┬───────────┐
│  Supabase   │ Anthropic AI │   Stripe   │  Resend   │
│ (Postgres)  │  (Claude)    │ (Payments) │  (Email)  │
└─────────────┴──────────────┴────────────┴───────────┘
    ↑
Vercel Cron (daily reminders — 9am UTC)
```

---

## Key Flows

**Invoice creation:** 3-step wizard → Claude generates draft → freelancer reviews and edits → Send to Client → Stripe payment link created → invoice emailed → client pays → webhook auto-updates status → freelancer gets "you got paid" email + dashboard toast.

**Proposal flow:** Same wizard → draft → Send to Client → client receives proposal link → accepts → invoice auto-generated → both parties notified.

**Automated reminders:** Daily cron checks overdue invoices (14d, 30d past due) and expiring proposals (1–2 days out) → sends targeted emails to clients.

---

## Local Setup

See [SETUP.md](./SETUP.md) for full environment variable reference, database schema, and architecture documentation.

```bash
npm install
npm run dev
```

---

## Status

Production — monetizable, live users, automated billing and email workflows running.

---

Built with [Claude](https://claude.ai) · [Nvoyce](https://nvoyce.ai)
