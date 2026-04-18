---
name: Nvoyce Production Issues & Fixes
description: All production bugs from April 7 deployment with root causes and prevention strategies
type: project
originSessionId: 216de5a3-4a57-4630-90e3-ec49ff9d844f
---
# Nvoyce — Critical Issues & Lessons Learned

---

## INCIDENT: Dashboard Blank / Stats Not Loading (April 11, 2026)

### Symptom
Dashboard loaded visually but showed $0, 0 documents, all zeros. Invoices and proposals existed in the database but weren't showing.

### Misleading Errors (Red Herrings)
- `No API key found in request`
- `order=created_at.desc:1 400 (Bad Request)`

We chased the wrong causes for ~2 hours:
- Supabase client version (2.49 vs 2.103)
- Environment variables not loading
- Next.js middleware deprecation
- Browser/build cache
- node_modules reinstall

**None of these were the cause.**

### Real Root Cause
**Actual error (buried in console):**
```
column documents.is_archived does not exist
```

The archive feature added `.eq('is_archived', showArchived)` to the `fetchStats` query but the `is_archived` column was **never added to the Supabase database**. Every query silently failed with a misleading 400 error.

### Fix
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
```

---

## PREVENTION RULES — MUST FOLLOW EVERY TIME

### Rule 1: Schema Change = Migration Required
Any time a new column is referenced in code, a SQL migration MUST be communicated to the user BEFORE pushing.

Steps:
1. Write the `ALTER TABLE` SQL
2. Tell the user to run it in Supabase SQL Editor
3. Confirm it ran before pushing the code

### Rule 2: Read the Full Error Response
When a dashboard query fails with 400:
1. Open DevTools → Network → click the failed request → **Response tab**
2. Read the FULL response body first
3. The real error is always in the response, not just the status code

### Rule 3: New Column Checklist
Before writing any query that references a new column:
- [ ] Write the `ALTER TABLE ... ADD COLUMN` SQL
- [ ] Tell user to run it in Supabase SQL Editor
- [ ] Confirm it ran successfully
- [ ] Then write the code that uses it

---

## Database Schema — Required Columns Reference

Columns that must exist before any query references them:

| Column | Table | Type | Migration SQL |
|--------|-------|------|---------------|
| `document_number` | documents | TEXT | `ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number TEXT` |
| `stripe_payment_link` | documents | TEXT | `ALTER TABLE documents ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT` |
| `amount_paid` | documents | NUMERIC | `ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0` |
| `is_archived` | documents | BOOLEAN | `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE` |

---

## Stripe Checkout Failing — Wrong ID Type (April 13, 2026)

**Symptom:** "Failed to start checkout" error when clicking Upgrade in Settings.
**Cause:** Vercel env vars `STRIPE_PRO_PRICE_ID` and `STRIPE_BUSINESS_PRICE_ID` were set to `prod_...` (product IDs) instead of `price_...` (price IDs). Stripe requires the Price ID.
**Fix:** In Stripe Dashboard → Products → click product → copy the `price_...` ID from the Pricing section.
**Prevention:** Always use `price_` IDs for checkout sessions, not `prod_` IDs. They are different objects in Stripe.

---

## April 14, 2026 — Post-MVP Polish Fixes

### Client-facing "Pay Now" banner on freelancer's detail page
- **Symptom:** "View Details" from dashboard success banner showed the client-facing payment page (black "Pay securely online / Pay $X now" box) to the freelancer.
- **Root cause:** The detail page at `/dashboard/documents/[id]` rendered the Stripe payment banner regardless of who was viewing.
- **Fix:** Removed the payment link banner block entirely from the detail page. Freelancer uses "Copy payment link" / QR code in the top bar; the banner was only useful on the client-facing public page.

### Orphaned draft duplication on "Back to Edit" → regenerate
- **Symptom:** Every click of "Generate Draft →" created a new DB row. Using "← Back to Edit" then regenerating left the old draft as a permanent orphan alongside the new one.
- **Fix:** Wizard tracks `replaceDraftId` state (set when prefill loads a draft). Passed as `replaceDraftId` in generate request body. Route atomically deletes old draft (guards: `user_id` match AND `status = 'draft'`) before inserting new one.

### Invoice creation sent user to read-only client view after sending
- **Symptom:** Step 3 "Send to Client" button generated + sent the invoice, then redirected to `/dashboard/documents/[id]` — which showed the already-sent (read-only) detail page that looked like the client payment page.
- **Fix:** Removed `handleGenerateAndSend` entirely. Step 3 now has a single "Generate Draft →" button (saves draft, goes to editable detail page). Sending happens from the draft detail page → redirects to `/dashboard?invoiceCreated=id` → success banner.

### Payment received email: dark background + small logo
- **Symptom:** "You got paid" email had dark navy (#0d1b2a) header background around logo; logo was 140px.
- **Fix:** White header background with subtle bottom border; logo enlarged to 280px. Both `sendPaymentReceivedEmail` and `sendProposalAcceptedEmail` now call `getUserLogo(userId)` for custom logo.

### Duplicate `sendProposalAcceptedEmail` build error
- **Symptom:** Turbopack build failed — `sendProposalAcceptedEmail` defined at both line 321 (old stub) and line 912 (new full version).
- **Fix:** Deleted old stub (lacked proposalNumber, userId, custom logo). One clean definition at line 844.

### Free tier false-blocking users with no subscription row
- **Symptom:** Generate route defaulted missing subscription to 'free', blocking valid users from generating documents.
- **Fix:** `const plan = sub?.plan || 'pro'` — users without a subscription row get pro treatment until billing row is created at signup.

### /api/proposals/notify was a dead stub
- **Symptom:** Freelancers received no email when proposals were accepted (route only logged to console).
- **Fix:** Rewrote route to fetch proposal from Supabase, get freelancer email from Clerk, call `sendProposalAcceptedEmail()`. Non-blocking — acceptance flow never fails due to email errors.

---

## Previously Resolved Issues (April 7 Deployment)

### Dashboard Showing No Data
- **Cause:** `user_id` hardcoded as `'test-user'`
- **Fix:** Use `const { userId } = useAuth()` from Clerk
- **Prevention:** Never hardcode user IDs

### Dashboard Columns 400 Error
- **Cause:** Explicit select of non-existent columns
- **Fix:** Use `select('*')`
- **Prevention:** Use `select('*')` unless performance requires otherwise

### useEffect Not Running on Auth Load
- **Cause:** `userId` missing from dependency array
- **Fix:** Add `userId` to `useEffect([..., userId])`
- **Prevention:** Always include data dependencies in useEffect arrays

### Payment Page Redirect Bug
- **Cause:** Stripe payment link URL passed as `?paymentLink=` query param — the `?` inside the URL broke query string parsing
- **Fix:** Never pass full URLs as query params. Fetch data directly from the document
- **Prevention:** Don't embed URLs inside URL query strings
