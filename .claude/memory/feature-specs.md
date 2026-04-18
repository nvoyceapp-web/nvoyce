---
name: Nvoyce Feature Specifications
description: Payme algorithm, metrics dropdown, document type selector, proposal expiration, email workflows
type: project
---

## Feature 1: Payme Smart Assistant

**Problem:** Gig workers manage 5-50 clients; invoices pile up without systematic follow-up → lose 5-10% revenue

**Solution:** Show top 1 recommendation by default, expandable to 3, with dismiss button + session-based persistence

**Ranking Algorithm:**
```
ORDER BY daysOverdue DESC, invoiceAmount DESC, clientPaymentSpeed ASC
Thresholds:
- 30+ days overdue → HIGH priority
- 45+ days: 1.5x multiplier
- 60+ days: 2.0x multiplier (CRITICAL)
- 3+ days since proposal sent → FLAG (stale proposal)
- 2+ days before expiration → ALERT
- 2+ days as draft → STALE DRAFT FLAG
```

## Feature 2: Metrics Dropdown

**Options:** Avg Invoice Value (default), Avg Days to Payment, Client Count

**Why Dropdown:** Compact, mobile-friendly, scales to 10+ metrics. Tabs consume space, sidebar hides on mobile.

## Feature 3: Document Type Selector (✨ Create)

**Pattern:** Clicking option → `/dashboard/new?type=invoice` → pre-fills docType, but stays on Step 1 for client info

**Why URL Parameters:** Enables A/B testing (?type=invoice vs no param), bookmarkable URLs, natural pre-population

## Feature 4: Partial Payment Tracking

**Pattern:** Form input for amount_paid + payment_notes, auto-calculate outstanding

**Status Badges:** Pending (0%), Partially Paid (1-99%), Fully Paid (100%)

## Feature 5: Proposal Expiration & Countdown

**Default:** 7 days, configurable to 3/5/7/14/30 days

**Client View:** Visual countdown "Expires in X days" with color coding:
- Blue if >2 days
- Amber if ≤2 days
- Red if expired

**Freelancer Alert:** Payme flags proposals expiring within 2 days: "🔴 Your proposal expires in 1 day"

## Feature 6: Proposal Review Flow (Shipped April 10)

**Flow:** Generate → Review Page (amber banner) → 3 action buttons:
- **Send to Client** — calls `/api/proposals/send`, updates status to "sent", emails client
- **Save as Draft** — navigates back to dashboard
- **← Edit Inputs** — navigates to `/dashboard/new?type=proposal&prefill=${id}` (prefill fetches doc and restores form)

**Known Issue:** Edit Inputs prefill currently resets to Step 1 instead of jumping to Step 3. Fix deferred.

**Print/PDF:** `@media print` hides nav/banners, sets `@page { margin: 1in }` for clean PDF output.

**Favicon:** `app/icon.png` — white background with Nvoyce logo (Next.js auto-serves as favicon).

## Feature 7: Email Automation (In Development)

**MVP Workflows:**
1. Proposal Sent → Email to client (Resend)
2. Proposal Accepted → Email to freelancer + auto-generate invoice
3. Proposal Declined → Email to freelancer
4. Invoice Created → Email to client (once Stripe ships)
5. Payment Received → Email to freelancer (webhook from Stripe)

**Phase 2 Workflows:**
- Proposal Expiring (2 days) → Email to client
- Invoice Overdue (14, 30 days) → Email to client

**Email Service:** Resend

## Feature 8: User Branding & Logo System (✅ Shipped April 11)

**Problem:** Freelancers/gig workers need professional branding; documents should feel like theirs, not Nvoyce's

**Solution:** Allow users to upload logo in Settings; display on documents, emails, and approval pages

**User Logo Upload:**
- Location: Settings → Business Settings section
- File types: PNG, JPG
- Max size: 5MB
- Upload: Drag-drop or click
- Storage: Supabase "logos" bucket → public URL saved to user_settings
- Actions: Upload, Preview, Change, Remove

**Logo Display Hierarchy:**
```
If user_settings.logo_url exists
  → Display user's uploaded logo (max-width: 384px, centered)
Else
  → Display brand logo /public/logo.png (dark navy Nvoyce, max-width: 384px, centered)
```

**Logo Locations:**
1. **Document Approval Page** — Top of document, large centered display
2. **Invoice Emails** — Header of email, max-width: 320px
3. **Proposal Emails** — Header of email, max-width: 320px
4. **Proposal Acceptance Auto-Invoice** — Uses same logo as original proposal

**Brand Logo Details:**
- Design: Dark navy Nvoyce wordmark with red pixel accent in "i"
- Tagline: "We do the hard stuff. You get paid."
- File: `public/logo.png`
- Purpose: Professional fallback when users haven't uploaded their own logo

**Database Schema:**
```
user_settings:
- user_id (TEXT, PRIMARY KEY)
- logo_url (TEXT, public URL from Supabase storage)
- business_name (TEXT)
- timezone (TEXT)
- created_at, updated_at (TIMESTAMPS)
```

**Email Logo Integration:**
- Fetch user logo at send time (not stored in document)
- Allows retroactive logo updates
- Fallback to brand logo if not found
- Embedded in email HTML as centered image

**Design Decisions:**
- User logo takes precedence over brand logo → feels like user's tool
- Logo fetched at view/send time → simpler state, allows updates
- Brand logo as fallback (not empty) → professional appearance from day one
- Large logo size (192px max-height) → prominent, professional
- Centered and object-contain → respects aspect ratio
- Test domain: onboarding@resend.dev (no verification needed)
- Production domain: invoices@nvoyce.ai (requires domain verification)
- Clerk webhook: user.created → sendWelcomeEmail
