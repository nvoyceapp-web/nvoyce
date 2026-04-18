---
name: Settings Page & Branding System (April 11, 2026)
description: Logo upload, user branding integration, settings reorganization, email logo display
type: project
---

## Settings Page Restructured (April 11, 2026)

**What Changed:**
- Reverted settings page from simplified logo-only version back to full-featured original
- Integrated logo upload INTO the restored settings page (not as replacement)
- Reorganized sections: Business Settings (Name, Logo, Timezone) → Notifications → Automations → Danger Zone

**Business Settings Section Now Contains:**
1. **Business Name** - Editable input, saved to Clerk metadata
2. **Business Logo** - Upload/change/remove, saved to user_settings.logo_url
3. **Timezone** - Dropdown selector, applies to all dates/times in documents

**Logo Storage & Retrieval:**
- User uploads logo in Settings → stored in Supabase user_settings table
- Logo is public URL from Supabase storage bucket "logos"
- Fallback to `/public/logo.png` (brand logo) if no user logo uploaded

## Logo Display System

**Hierarchy:**
1. If user uploaded logo → display that
2. If no user logo → display brand logo (`/logo.png`)
3. Locations: Documents, Emails, Approval pages

**Files Updated:**
- `app/dashboard/settings/page.tsx` - Settings UI with logo upload
- `app/dashboard/documents/[id]/page.tsx` - Display user logo or brand logo fallback
- `lib/email.ts` - Fetch user logo for invoice/proposal emails, fallback to brand logo
- `app/api/invoices/send/route.ts` - Pass userId to email function
- `app/api/proposals/send/route.ts` - Pass userId to email function
- `public/logo.png` - Brand logo (dark navy Nvoyce with red pixel accent)

## Brand Logo Implementation

**Default Logo:** Dark navy Nvoyce wordmark with red pixel in "i"
- Tagline: "We do the hard stuff. You get paid."
- Stored at: `/public/logo.png`
- Used as fallback when users haven't uploaded their own logo

**User Logo Flow:**
1. Upload in Settings → Supabase storage
2. Get public URL → save to user_settings.logo_url
3. On document view → fetch from user_settings, display
4. On email send → fetch from user_settings, embed in email HTML
5. Logo appears centered in documents with "Made with nvoyce" footer

## Key Design Decisions

**Why:** Logo on documents (not just emails)
- Freelancers/gig workers need professional branding
- User's logo takes precedence → feels like their tool
- Nvoyce branding maintained via subtle footer credit

**Why:** User logo fetched at view/send time, not at draft creation
- Logo can be updated after draft created
- No need to regenerate drafts when logo changes
- Simpler state management

**Why:** Fallback to brand logo instead of showing nothing
- Professional appearance even before logo upload
- Continuous brand presence
- Users feel Nvoyce is premium/polished

## TypeScript Fixes Applied

- Fixed settingsData type casting in setSettings()
- Used `as UserSettings` cast for proper type handling
- Preserved null value handling for Supabase updates (important for clearing fields)

## Testing Notes

- Logo upload: drag/drop or click to upload PNG/JPG under 5MB
- Logo preview: shows uploaded image with change/remove buttons
- Email headers: includes logo at top, centered
- Document pages: shows user logo if exists, brand logo if not
- Logo removal: clears from user_settings (null value)
