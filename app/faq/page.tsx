'use client'

import Link from 'next/link'
import { useState } from 'react'
import PublicNav from '@/components/PublicNav'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface FAQGroup {
  label: string
  icon: string
  faqs: FAQ[]
}

const faqGroups: FAQGroup[] = [
  {
    label: 'Statuses & Definitions',
    icon: '📖',
    faqs: [
      {
        id: 'invoice-statuses',
        question: 'What are the different invoice statuses?',
        answer:
          '📝 Draft — Invoice created but not yet sent. No document number assigned yet.\n\n📤 Sent — Invoice emailed to client, awaiting payment. Days Outstanding clock starts here.\n\n💛 Partial — Client has paid some but not all of the invoice amount.\n\n🚨 Overdue — Invoice is 30+ days old and still unpaid. Payme will flag these as high priority.\n\n✓ Fully Paid — Payment received and recorded. Invoice moves out of your outstanding balance.',
      },
      {
        id: 'proposal-statuses',
        question: 'What are the different proposal statuses?',
        answer:
          `📝 Draft — Proposal generated and saved. Review and edit it before sending — no document number yet.\n\n📤 Sent — You clicked "Send to Client" and the proposal was emailed. Client can now accept or decline.\n\n👁️ Received — Client has opened the proposal link.\n\n✓ Accepted — Client accepted the proposal. An invoice is automatically generated and sent to the client. You'll receive a 🎉 email notification and a real-time dashboard toast.\n\n✗ Declined — Client declined. You can create a revised proposal if needed.`,
      },
      {
        id: 'days-outstanding',
        question: 'What does "Days Outstanding" mean?',
        answer:
          'Days Outstanding shows how many days have passed since you created the document. For invoices, it tracks how long payment has been pending. For proposals, it shows how long the client has had the proposal without responding.\n\nInvoices overdue at 30+ days are highlighted in red. Proposals pending for 14+ days show a warning indicator.\n\nFully paid invoices and accepted/declined proposals show "—" instead of a number.',
      },
      {
        id: 'overdue',
        question: 'When is an invoice considered overdue?',
        answer:
          `An invoice becomes overdue once it reaches 30+ days without payment. Payme will flag these as high priority and the row turns red in your dashboard.\n\nAt 45+ days, Payme raises the priority to "very overdue". At 60+ days, it's marked as "critical" — your top priority for follow-up.\n\nUse the Send Reminder action (in the ⋯ Actions dropdown or bulk actions bar) to send a reminder email to the client.`,
      },
      {
        id: 'avg-days-payment',
        question: 'What is "Avg Days to Payment"?',
        answer:
          'This is the average number of days it takes your clients to pay after you send an invoice. Calculated across all your fully paid invoices.\n\nIf it says 12 days, it means on average your clients pay within 12 days. This metric helps you forecast cash flow and set realistic payment terms. It appears in the Overview metrics strip on your dashboard.',
      },
    ],
  },
  {
    label: 'Sending & Getting Paid',
    icon: '💸',
    faqs: [
      {
        id: 'proposal-acceptance',
        question: 'How do clients accept proposals?',
        answer:
          'Fill out the 3-step wizard and click "Generate Draft →" on step 3. This saves an editable draft and takes you to a review page.\n\nFrom the draft review page you have three options:\n• ← Back to Edit — returns you to step 3 with all your data pre-filled (the old draft is automatically replaced)\n• Save Draft — keeps it in draft status for later\n• Send to Client — assigns a document number, emails the proposal, and takes you back to your dashboard with a success confirmation\n\nYour client gets an email with a link to the proposal. They can click Accept or Decline directly — no Nvoyce account required. Once accepted, an invoice is automatically generated and sent to the client, and you receive a 🎉 email + real-time dashboard notification.',
      },
      {
        id: 'mark-paid',
        question: 'How do I mark an invoice as paid?',
        answer:
          `If your client pays via the Stripe payment link in their email, the invoice updates automatically — no action needed on your end. You'll also receive a payment email and a real-time dashboard notification.\n\nFor payments made outside of Stripe (bank transfer, cash, check, etc.), open the ⋯ Actions dropdown on any invoice row and click "✓ Mark Paid". This updates the invoice status to Fully Paid in real time — no page reload needed.`,
      },
      {
        id: 'copy-payment-link',
        question: 'How do I share the payment link with my client directly?',
        answer:
          "Every invoice has a Stripe payment link generated when you send it. To share it quickly, open the ⋯ Actions dropdown on the invoice row:\n\n• 🔗 Copy Payment Link — copies the Stripe checkout URL to your clipboard so you can paste it via text, WhatsApp, or any other channel. Handy when a client says they didn't get the email or you want to follow up fast.\n\n• 📱 Show QR Code — opens a QR code modal for the payment link. Your client can scan it with their phone camera to go straight to checkout. You can also download the QR code as a PNG to include in a printed invoice, PDF, or anywhere else.\n\nBoth options only appear for invoices that have a Stripe link attached and are not in Draft status.",
      },
      {
        id: 'notifications',
        question: 'Will I be notified when a client pays or accepts a proposal?',
        answer:
          `Yes — two ways, both happen automatically:\n\n📧 Email notifications:\n• When a client makes any payment (partial or full), you receive a "You got paid" email with the amount, client name, and invoice number. Your client simultaneously receives a payment receipt.\n• When a client accepts a proposal, you receive a "Proposal accepted" email with a link to the auto-generated invoice.\n\n🔔 Real-time dashboard toasts:\nIf you're on the dashboard when the event happens, a slide-in notification appears bottom-right — green 💰 for payments, purple 🎉 for proposal acceptances. A badge counter also appears on your "You're Owed" card.\n\nThe badge clears once you dismiss the toast (or it auto-dismisses after 6 seconds). No manual refresh needed — the dashboard polls every 15 seconds.`,
      },
      {
        id: 'send-reminder',
        question: 'How do I send a payment reminder?',
        answer:
          'Two ways:\n\n1. Individual: Open the ⋯ Actions dropdown on an overdue invoice (14+ days old) and click "📧 Send Reminder".\n\n2. Bulk: Select multiple documents using the checkboxes, then click "📧 Send Reminders (N)" in the blue bulk actions bar that appears at the top of the table.\n\nBulk reminders are smart — they automatically skip invoices that are already fully paid or in draft status, and proposals that are accepted, declined, expired, or draft. The button label shows how many will actually receive a reminder.',
      },
    ],
  },
  {
    label: 'Dashboard & Charts',
    icon: '📊',
    faqs: [
      {
        id: 'payme',
        question: 'What is the Payme assistant?',
        answer:
          'Payme is your smart payment priority engine. It scans all your invoices and proposals, scores them by urgency (overdue days, amount, proposal staleness), and surfaces the top actions you should take right now.\n\nOn your dashboard, Payme appears as a navy collapsed bar above your stats section showing "N actions waiting". Click it to expand and see each recommended action with a Send Reminder or Review button.\n\nDismissing a recommendation hides it for the current session — it will reappear on your next visit if the document is still pending.',
      },
      {
        id: 'charts',
        question: 'What do the dashboard charts show?',
        answer:
          "Your dashboard has three charts in a row below the metrics strip:\n\n📈 Revenue Trend (left) — A bar + trend line chart showing how much revenue you've collected each month. The Y-axis scales to your data range so you can clearly see month-over-month variance.\n\n🍩 Invoice Status (center) — A donut chart breaking down your documents into Paid, Pending, and Overdue. Hover any segment for exact counts.\n\n👥 Top Clients (right) — A horizontal bar chart showing your top 3 clients by total billed. Useful for spotting who drives the most revenue.\n\nAll three charts filter based on the time period selected in the Overview metrics (This Month / YTD / Last 30 Days / All Time).",
      },
      {
        id: 'metrics-strip',
        question: 'What are the six metric cards in the Overview section?',
        answer:
          'The Overview strip shows six key numbers for your selected time period:\n\n• Period Revenue — Total amount collected (fully paid) in the selected period\n• Total Sent — Number of invoices and proposals sent\n• Collection Rate — % of your invoices that have been paid\n• Avg Invoice Value — Average dollar amount per invoice in the period\n• Avg Days to Payment — How fast clients pay you on average\n• Clients — Number of unique clients you\'ve billed\n\nUse the dropdown in the top-right of the section to switch between This Month, YTD, Last 30 Days, and All Time.',
      },
      {
        id: 'search-filter',
        question: 'How do I search and filter my documents?',
        answer:
          'The search bar above the table searches across all document fields — client name, document number (e.g. INV-2026-001), status, document type, client email, business name, and amount. Just start typing and the table filters instantly.\n\nYou can also filter by:\n• Client — dropdown to show only documents for one client\n• Date Range — a preset dropdown with quick options: Today, This Week, This Month, Last 30 Days, Last 90 Days, Year to Date (YTD), and Custom. Selecting Custom reveals From / To date pickers so you can define a specific range.\n\nWhen any filter is active, a "✕ Clear filters" link appears below the filter row. Click it to reset everything at once. If no documents match your filters, the empty state shows a "Clear filters" button to help you recover quickly.',
      },
    ],
  },
  {
    label: 'Document Management',
    icon: '📁',
    faqs: [
      {
        id: 'actions-dropdown',
        question: 'What does the "⋯ Actions" dropdown do?',
        answer:
          `The ⋯ Actions button appears in the Action column for every document. It opens a menu of available actions:\n\nFor invoices:\n• 🔗 Copy Payment Link — copies the Stripe checkout URL to clipboard (only shown if a link exists and status isn't draft)\n• 📱 Show QR Code — opens a scannable QR code for the payment link; downloadable as a PNG (only shown if a link exists)\n• ✓ Mark Paid — manually mark the invoice as fully paid\n• 📧 Send Reminder — send a follow-up email (appears for overdue invoices)\n• 👁️ View Details — opens the full document detail page\n• 🗂 Archive — move the invoice to your archive (only available once fully paid)\n• 🗑️ Delete Draft — permanently delete (only available while still a draft)\n\nFor proposals:\n• 🔗 Copy Link — copies the public proposal URL\n• 📧 Send Follow-up — sends a follow-up email (for stale proposals)\n• 👁️ View Details — opens the full detail page\n• 🗂 Archive — move to archive (only available once accepted)\n• 🗑️ Delete Draft — permanently delete (only available while still a draft)\n\nFrom the draft detail page itself, you'll also see: "Save Draft", "← Back to Edit" (returns to the creation wizard with all data pre-filled), and "Send to Client".`,
      },
      {
        id: 'bulk-actions',
        question: 'How do bulk actions work?',
        answer:
          'Select documents using the checkboxes on the left of each row (or check the header checkbox to select all visible documents). A blue bar appears at the top of the table showing how many are selected and which bulk actions are available:\n\n• 📧 Send Reminders — sends reminders to eligible documents only (skips fully paid, accepted, draft)\n• 🗂 Archive — archives eligible documents only (invoices must be fully paid; proposals must be accepted)\n• 🗑️ Delete Drafts — permanently deletes selected documents that are still in draft status\n\nThe button labels tell you exactly how many will be affected — e.g., "Archive (3 of 5)" means 5 are selected but only 3 are eligible. Ineligible documents are silently skipped.',
      },
      {
        id: 'archive',
        question: 'How does archiving work?',
        answer:
          `Archiving moves a document out of your active view without deleting it. It's a way to keep your dashboard clean once a job is fully wrapped up.\n\nEligibility rules:\n• Invoices — must be Fully Paid before archiving\n• Proposals — must be Accepted before archiving\n\nTo view your archived documents, click the "🗂 View Archived" button in the top-right of the document table. It switches the view to show only archived docs. Click "← Back to Active" to return.\n\nYou can unarchive any document at any time using the ⋯ Actions dropdown.`,
      },
      {
        id: 'delete',
        question: 'Can I delete a document?',
        answer:
          'Yes, but only drafts. Once a document has been sent to a client, it cannot be deleted — this protects the integrity of your records.\n\nTo delete a draft: open the ⋯ Actions dropdown and click "🗑️ Delete Draft".\n\nTo delete multiple drafts at once: select them using the checkboxes and click "🗑️ Delete N Drafts" in the bulk actions bar.\n\nDeletion is permanent and cannot be undone.',
      },
      {
        id: 'document-numbers',
        question: 'How are document numbers assigned?',
        answer:
          'Document numbers are assigned automatically when you send a document — not when you create the draft. This means drafts show "—" in the # column until they are sent.\n\nFormat:\n• Invoices: INV-YYYY-NNN (e.g. INV-2026-001)\n• Proposals: PRO-YYYY-NNN (e.g. PRO-2026-001)\n\nNumbers are sequential per year. The counter resets each January. Once assigned, numbers are permanent and never reused.',
      },
    ],
  },
  {
    label: 'About Nvoyce',
    icon: '🟠',
    faqs: [
      {
        id: 'logo-braille',
        question: 'What do the orange dots inside the N logo mean?',
        answer:
          'They\'re not decorative — they spell "VOICE" in Braille.\n\nNvoyce is a fusion of invoice and voice. Every invoice is a freelancer\'s voice: a declaration of their work, their worth, and their right to be paid. The Braille lettering is a nod to universal access, a reminder that financial tools should work for everyone — and a small secret for those who look closely.\n\nIf you know someone who reads Braille, show them the logo.',
      },
      {
        id: 'name-meaning',
        question: 'What does "Nvoyce" mean?',
        answer:
          'Nvoyce is a portmanteau of invoice and voice. The idea: your invoices are your voice in the business world. They represent your work, your professionalism, and your expectation of being paid fairly.\n\nThe name also nods to the idea that freelancers often go unheard — chasing late payments, following up repeatedly, dealing with clients who don\'t respond. Nvoyce gives that voice structure, persistence, and power.',
      },
    ],
  },
]


export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <>
      <style>{`
        :root {
          --orange: #e04e1a;
          --ink: #0d1b2a;
          --paper: #fbfaf7;
          --paper-2: #f3efe7;
          --line: #e8e2d5;
          --muted: #6b6558;
          --text: #1a1915;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: var(--paper);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Nav */}
      <PublicNav activePage="faq" />

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '64px 28px 100px' }}>
        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--paper-2)', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace', marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />
            Help & Documentation
          </span>
          <h1 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)', margin: '0 0 16px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 560 }}>
            Everything you need to know about Nvoyce — statuses, payments, and your dashboard.
          </p>
        </div>

        {/* FAQ Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {faqGroups.map((group) => (
            <div key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>{group.icon}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{group.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.faqs.map((faq) => (
                  <div key={faq.id} style={{ background: 'white', borderRadius: 12, border: `1px solid ${expandedId === faq.id ? 'var(--orange)' : 'var(--line)'}`, overflow: 'hidden', transition: 'border-color 200ms' }}>
                    <button
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      style={{ width: '100%', padding: '16px 20px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14, lineHeight: 1.4 }}>{faq.question}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0, transform: expandedId === faq.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>▼</span>
                    </button>
                    {expandedId === faq.id && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: 72, paddingTop: 40, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 20 }}>
            Still have questions?{' '}
            <a href="mailto:support@nvoyce.ai" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>support@nvoyce.ai</a>
          </p>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 24px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Start free — 3 docs on us
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 60px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a"/><rect x="9" y="9" width="3.2" height="22" fill="white"/><rect x="27.8" y="9" width="3.2" height="22" fill="white"/><path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white"/><circle cx="17.5" cy="14" r="1.2" fill="#e04e1a"/><circle cx="22.5" cy="14" r="1.2" fill="#e04e1a"/><circle cx="17.5" cy="20" r="1.2" fill="#e04e1a"/><circle cx="22.5" cy="20" r="1.2" fill="#e04e1a"/><circle cx="17.5" cy="26" r="1.2" fill="#e04e1a"/><circle cx="22.5" cy="26" r="1.2" fill="#e04e1a"/></svg>
              <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', color: '#0d1b2a', lineHeight: 1 }}>nvoyce</span>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['Pricing', '/#pricing'], ['FAQ', '/faq'], ['About', '/about'], ['Sign in', '/sign-in']].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>© 2026 nvoyce</span>
        </div>
      </footer>
    </>
  )
}
