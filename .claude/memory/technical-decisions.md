---
name: Nvoyce Technical Architecture
description: Complete stack, design decisions, database schema, and architectural patterns
type: project
---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16.2.2 + React 19 | Hybrid SSR/CSR, file-based routing, Turbopack |
| Styling | Tailwind CSS 4 | Utility-first, zero CSS files, mobile-first |
| State | React Hooks (useState) | Simple, performant, co-located |
| Auth | Clerk | Production-ready, email + OAuth, user webhooks |
| Database | Supabase (PostgreSQL) | SQL flexibility, RLS security, Vercel-friendly |
| API | Next.js /api routes | Collocated backend, one deployment |
| AI | Claude Sonnet 4.6 | Fast (~1-2s), affordable, best for structured output |
| Payments | Stripe | Payment links, webhooks, test mode |
| Email | Resend | Clean API, high deliverability, dev-friendly |
| Deploy | Vercel | One-click from GitHub, Turbopack, ~60s build |

## Key Design Decisions

**1. useState vs Redux/Context**
- **Decision:** useState (simple, co-located state)
- **Trade-off:** No persistence across sessions ↔ 60% less code
- **When to upgrade:** If features need global state (theme, prefs, tokens)

**2. Supabase vs Firebase**
- **Decision:** PostgreSQL + RLS instead of Firestore
- **Trade-off:** SQL power ↔ less mature than Firebase
- **RLS Strategy:** Every query scoped by `auth.uid() = user_id` at table level

**3. Claude Sonnet vs Opus**
- **Decision:** Sonnet for invoice/proposal generation
- **Trade-off:** Fast (1-2s) + cheap ↔ less capable for complex reasoning
- **Pattern:** System prompt enforces JSON output structure to prevent markdown wrapping

**4. Next.js /api routes vs Separate Backend**
- **Decision:** /api routes (collocated, one deployment)
- **Trade-off:** Single point of failure ↔ simpler ops + faster iteration
- **Note:** Phase 2 may split backend for async email jobs

**5. Public API Routes & RLS**
- **Decision:** Use supabaseServer (service role key) to bypass RLS for public endpoints
- **Pattern:** POST /api/proposals/accept, /api/proposals/decline, /api/proposals/notify are unauthenticated
- **Middleware:** Explicitly whitelist public routes in Clerk middleware (don't block with auth)

**6. User Branding & Logo System**
- **Decision:** User logo takes precedence, nvoyce brand logo as fallback
- **Trade-off:** Professional user branding ↔ continuous nvoyce visibility
- **Storage:** Supabase storage bucket "logos" (public), public URL stored in user_settings.logo_url
- **Display Logic:** User logo (if exists in user_settings) → Brand logo (/public/logo.png) → never empty
- **Locations:** Documents (approval page), Emails (invoice/proposal), Dashboard widgets
- **Fetch Strategy:** Fetch user_settings at view/send time (not at draft creation) so logo updates apply retroactively

## Database Schema

**documents** (invoices & proposals)
- id, user_id, doc_type ('invoice' | 'proposal'), status, client_name, client_email
- businessName, serviceDescription, price, amountPaid, paymentNotes
- timeline, paymentTerms, notes, formData (JSONB), generatedContent (JSONB)
- expirationDays, expiresAt, created_at, updated_at, document_number (INV/PRO-YYYY-NNN)

**user_settings** (branding & preferences)
- user_id (PRIMARY KEY, TEXT)
- business_name (TEXT) - Editable in Settings
- logo_url (TEXT) - Public URL from Supabase storage bucket "logos"
- timezone (TEXT) - From timezone dropdown in Settings
- created_at, updated_at (TIMESTAMPS)

**users** (via Clerk)
- clerk_id, email, business_name, timezone

## API Route Pattern

**Claude Integration** (/api/generate)
- Receives form data → calls Claude Sonnet → **strips markdown code blocks** → parses JSON → stores in Supabase → returns doc ID

**Public Proposal Acceptance** (/api/proposals/accept)
- Gets proposal ID → uses supabaseServer (service role) → auto-generates invoice from proposal → calls Claude to transform → updates statuses → sends emails

## Known Issues & Fixes

**Claude JSON Wrapping:** Claude sometimes wraps JSON in ```json...``` blocks. Fix: regex strip before JSON.parse
```typescript
json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
```

**useSearchParams Client-Only:** In Next.js 16, useSearchParams is client-only. Fix: wrap in Suspense boundary at page level

**Clerk Middleware Blocking Public Routes:** Middleware was authenticating all routes. Fix: explicitly whitelist public API routes in middleware pathname check

**Emoji Alignment:** Use flex justify-center (not inline-block) for centering
```jsx
<div className="flex justify-center"><div className="text-7xl">✓</div></div>
```

**TypeScript null vs undefined in Supabase:** When updating Supabase records, null explicitly clears a field (important for logo removal), undefined skips updating that field. In email/document functions, use null to support clearing operations.

**Settings Page Architecture:** All user preferences (business name, logo, timezone, notifications) collected in one place (`app/dashboard/settings/page.tsx`). Organized by concern: Business Settings first (identity/branding), then Notifications, then Automations. Business name stored in Clerk metadata, other settings in user_settings table for shared access across API routes.

## Color System

- **Purple (#7c3aed):** Trust, AI intelligence, professional
- **Orange (#ea580c):** Action, urgency, payment, warmth
- Landing/dashboard: gradient (from-purple-50 via-white to-purple-50)
- Buttons: orange-600 with orange-500 focus rings

## Deployment

- **Vercel:** One-click from GitHub, Turbopack ~60s build
- **Environment Variables:** Clerk keys, Supabase URL/keys, Claude API, Stripe keys, Resend API
- **.gitignore:** Must exclude .next/, dist/, build/, node_modules/ from day 1
