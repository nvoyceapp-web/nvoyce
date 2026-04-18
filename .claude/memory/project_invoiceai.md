---
name: Nvoyce Project
description: AI invoice and proposal generator for freelancers — Nnamdi's current build project
type: project
---

Project: Nvoyce — AI-powered invoice and proposal generator targeting freelancers and small service business owners (photographers, contractors, cleaners, etc.).

**Why:** Serves 3 goals — fast revenue, learning Claude Code end-to-end, and portfolio signal for interviews.

**How to apply:** When Nnamdi asks about this project, reference the scaffolded code in the `nvoyce/` folder in his workspace. The core flow is: 3-step form → Claude API generates structured JSON document → Stripe payment link embedded → client pays.

Stack: Next.js, Claude API (Sonnet), Clerk (auth), Supabase (DB), Stripe (payments), Resend (email), Vercel (deploy).

Pricing: Free (3/month), Pro ($19/month), Business ($39/month).

## Phase 1 MVP (Scaffolded April 4, 2026)
- `app/page.tsx` — Landing page (✅ updated to purple/orange scheme April 6)
- `app/dashboard/page.tsx` — Dashboard with Payme assistant
- `app/dashboard/new/page.tsx` — 3-step document creation wizard with type parameter detection
- `app/dashboard/documents/[id]/page.tsx` — Invoice detail viewer with partial payment tracking
- `app/api/generate/route.ts` — Claude API integration (core)
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `lib/supabase.ts` — DB client + TypeScript types
- `lib/stripe.ts` — Stripe helpers + pricing plans
- `supabase/schema.sql` — Full DB schema with RLS
- `SETUP.md` — Step-by-step setup guide
- `.env.local.example` — All required environment variables

## Enhancements Added (April 2026)
1. **Payme Smart Assistant** — Proactive recommendations ranked by urgency (overdue invoices first), collection trend analysis, top clients analyzer
2. **Metrics Selector** — Dropdown menu for Avg Invoice Value, Avg Days to Payment, Client Count
3. **Document Type Selector** — "✨ Create" dropdown replaces "+ New Document", pre-fills form and skips to step 2
4. **Partial Payment Tracking** — Amount paid input on invoice detail page with auto-calculated outstanding balance
5. **Visual Consistency** — Landing page updated to match dashboard (purple gradient background, orange buttons, purple badges)
6. **Mobile Responsiveness** — Hidden sidebar on mobile, single column layout
7. **Session-Based UX** — Dismissed recommendations and collapsed Payme card persist during session

## Current Status (April 6, 2026)
- **Code**: All features implemented and tested locally
- **Commits**: Latest commit = `fe82455` (landing page style update)
- **Build**: Local build successful; npm install has network issues (403 errors)
- **Push**: Unable to push to GitHub due to proxy/network issues
- **Testing Phase**: Ready for user testing to gather Invoice vs Proposal selection data

## Next Phase (Phase 2): Document viewer page enhancements, email sending via Resend, invoice list with status filters, Stripe subscription checkout
