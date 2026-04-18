---
name: Nvoyce Build Roadmap & Phases
description: v0.1–v0.3 pre-MVP builds, v1.0 MVP launch, v1.1+ expansion phases
type: project
originSessionId: 216de5a3-4a57-4630-90e3-ec49ff9d844f
---
> **Versioning convention:** v0.x = pre-MVP builds. v1.0 = public MVP launch. v1.x = post-MVP expansion.

## v0.1 — Foundation (April 4–7, 2026) ✅ COMPLETE

**Features Shipped:**
- 3-step form wizard (client, service, price, timeline, terms)
- Claude AI document generation (proposals + invoices)
- Payme smart assistant
- Dashboard with proposal/invoice list + partial payment tracking
- Metrics dropdown (avg value, days to payment, client count)
- Document type selector (Invoice vs Proposal)
- Proposal expiration dates + countdown
- Public proposal acceptance flow (clients don't need signup)
- View details modal
- Form validation (required fields by step)
- Purple/orange branding
- Mobile responsive
- Vercel deployment

**Metrics Baseline:** Time-to-first-invoice, Payment Completion Rate, Repeat Invoice Rate, NPS

## Phase 0.2 — Stickiness & Branding (April 8–10, 2026) ✅ COMPLETE

**Shipped:**
- Email automation: proposal sent, accepted, declined flows (Resend)
- Proposal review flow with amber banner + Send to Client / Save as Draft / Edit Inputs buttons
- Fire-and-forget email pattern (status update first, email second)
- Draft-first workflow with inline editing on approval page
- Document numbering system (INV-YYYY-NNN / PRO-YYYY-NNN assigned at send time)
- Document deletion (drafts only, single + bulk)
- Stripe payment links embedded in invoices at send time (stripe_payment_link column)
- User logo upload system (Supabase Storage → user_settings → emails + approval pages)
- Brand fallback logo (public/logo.png) when user has no logo
- Settings page restructure (Business Settings → Notifications → Automations → Danger Zone)
- Currency formatting with commas, email logo 320px, bold business name
- Print/PDF styles, favicon, FAQ + SETUP.md updated
- System design document created (nvoyce-system-design.html)

## Phase 0.3 — Dashboard Overhaul & Launch Polish (April 11, 2026) ✅ COMPLETE

**Dashboard UI overhaul:**
- Full metrics strip (6 cards: Period Revenue, Total Sent, Collection Rate, Avg Invoice Value, Avg Days to Payment, Clients)
- 3-column Recharts charts row (Revenue Trend ComposedChart w/ Y-axis + trend line, Invoice Status donut PieChart, Top Clients horizontal BarChart)
- Payme collapsed strip with expand toggle
- "You're owed" card promoted first
- Create button → ghost style; Export CSV → small ghost button
- Navigation label → Menu; Actions dropdown (renamed from Select)
- Date filter From/To labels above inputs

**Document management:**
- Archive eligibility fix: invoices must be fully_paid, proposals must be accepted
- Mark Paid wired to real /api/documents/status API (optimistic local state update)
- Copy Payment Link added to invoice dropdown (for texting Stripe link to clients)
- Search expanded to 7 fields: name, doc #, status, type, email, business name, amount

**Bulk actions:**
- Removed Mark/Unmark Paid; added filtered Archive + Send Reminders with eligibility counts ("3 of 5" labels)

**Launch-critical fixes:**
- Mobile nav (hamburger + slide-down overlay)
- Clear filters button (appears when any filter active)
- Upgraded table empty state (icon + message + CTA)
- Fixed negative days outstanding (Math.max(0,…))
- Removed one-time migration button ("Assign missing #s")

---

## 🚀 Phase 1.0 — Public MVP Launch ✅ COMPLETE (April 13, 2026)

Stripe webhooks + subscription billing = product is monetizable.

**Shipped:**
- Stripe webhook at /api/webhooks/stripe (invoice auto-pay, subscription lifecycle)
- Subscription billing UI in Settings (Free/Pro $19.99/Business $39.99, upgrade flow, billing portal)
- Free tier gating in generate route (3 docs/month enforced)
- Stripe products + price IDs configured in Stripe dashboard
- STRIPE_WEBHOOK_SECRET + price IDs added to Vercel env vars
- subscriptions table live in Supabase
- ProductHunt submission pending

---

## Phase 1.1 — Notifications, Draft Flow & UX Polish ✅ COMPLETE (April 14, 2026)

**Payment Notifications:**
- `sendPaymentConfirmationEmail()` — client receipt for partial and full payments
- `sendPaymentReceivedEmail()` — freelancer "you got paid" email with custom logo support
- Both fire from Stripe webhook on any payment event (fully_paid or partially_paid)
- Real-time dashboard toast (bottom-right slide-in) + green dot badge on You're Owed card
- Polling every 15s; prevStatusMapRef diffs to detect transitions without false positives on load

**Proposal Accepted Notifications:**
- `sendProposalAcceptedEmail()` — freelancer 🎉 email with proposal number, amount, custom logo
- `/api/proposals/notify` rewritten — was a dead stub, now fetches user via Clerk and fires email
- Dashboard detects `accepted` status transition → purple 🎉 toast, same badge counter as payments

**Invoice & Draft Flow Overhaul:**
- Step 3 unified to single "Generate Draft →" button for both invoices and proposals
- Removed `handleGenerateAndSend`; draft detail page is now the mandatory review step
- Draft detail page: "Save Draft" (always visible), "← Back to Edit" (was Re-generate), "Send to Client"
- After Send: redirects to `/dashboard?invoiceCreated=id` → green success banner + "View details →"
- Orphaned draft fix: `replaceDraftId` passed through wizard → generate route atomically deletes old draft before inserting new one (guards: own user + status=draft only)
- Numbers only editable on text fields in draft; qty/price/totals always read-only

**Bug Fixes:**
- Removed client-facing "Pay securely online / Pay $X now" banner from freelancer's detail page
- Email logo: white background header (was dark navy #0d1b2a), logo 280px (was 140px)
- `sendPaymentReceivedEmail` + `sendProposalAcceptedEmail` now fetch user's custom logo via userId
- Duplicate `sendProposalAcceptedEmail` definition removed (old stub at line 321 collided with new)
- Free tier false block: `sub?.plan || 'pro'` default prevents users with no subscription row from being gated

**Content Updates:**
- FAQ: 5 entries updated/added (proposal flow, notifications, mark-paid, actions dropdown, Back to Edit)
- About: Added Real-Time Notifications to features list; updated Shareable Proposals copy
- Settings: already accurate, no changes needed

**Shipped later in session:**
- Save Payment button wired to DB (`/api/documents/status` extended to accept `amount_paid`)
- Payment Tracking section: shows "tracked automatically" note when Stripe link exists; Save Payment form only shown for off-platform invoices (no Stripe link)

---

## Phase 1.2 — Automated Reminders ✅ COMPLETE (April 14, 2026)

**Overdue Invoice Reminders (Vercel Cron — 9am UTC daily):**
- `sendInvoiceOverdueReminderEmail()` — amber at 14 days, red "Final Notice" at 30 days
- Cron at `/api/cron/reminders` queries invoices with `status = sent | partially_paid`
- Parses `generated_content.dueDate` to compute days overdue
- Tracking columns `reminder_14_sent_at` + `reminder_30_sent_at` prevent duplicate sends

**Proposal Expiring Soon:**
- `sendProposalExpiringEmail()` — amber email when 1–2 days remain before expiry
- Expiry computed from `created_at + form_data.expirationDays`
- Tracking column `expiry_reminder_sent_at` prevents duplicate sends

**SQL migration required:**
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reminder_14_sent_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;
```

**Pending:**
- ProductHunt submission

---

## v1.2 — Polish & Personalization (1–2 months post-launch)

**Dark Mode** — Light / Auto / Dark theme selector in Settings
- Use `next-themes` + Tailwind `darkMode: 'class'`
- Full dark mode styling across all pages, cards, charts, modals
- Preference persisted per user

---

## v1.1 — Expansion (2–3 months post-launch)

**Advanced AI Recommendations** (ML models trained on Nvoyce data)

**Integrations:** Slack, SMS, WhatsApp, QuickBooks, FreshBooks

**Team & Collaboration** features

**Mobile App** — native app published to Apple App Store and Google Play Store (React Native preferred; PWA is not acceptable)

## Risk Mitigation

| Risk | Version | Mitigation |
|------|---------|-----------|
| Email deliverability | v0.2 | Use Resend (high reputation), monitor bounce rates |
| Payment processing delays | v0.3 | Use Stripe test mode first, monitor webhooks |
| User churn | v0.3–v1.0 | Weekly check-ins with first 10 customers |
| Competitor copies features | v1.1+ | Focus on gig worker niche, move fast |

## Timeline

```
Phase 0.1  (Apr 4–7)  | Foundation — core app, Payme, AI generation              ✅
Phase 0.2  (Apr 8–10) | Stickiness — emails, branding, doc numbers, Stripe links  ✅
Phase 0.3  (Apr 11)   | Dashboard overhaul — charts, mobile nav, archive, search   ✅
Phase 1.0  (Apr 12–13)| 🚀 Public MVP Launch — Stripe webhooks + subscriptions     🔜
v1.1+      (May+)     | Expansion — mobile app, integrations, AI upgrades
```
