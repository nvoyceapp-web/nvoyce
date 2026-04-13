'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'

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

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sidebarRef = useRef<SidebarHandle>(null)

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
            '📝 Draft — Proposal generated and saved. Review and edit it before sending — no document number yet.\n\n📤 Sent — You clicked "Send to Client" and the proposal was emailed. Client can now accept or decline.\n\n👁️ Received — Client has opened the proposal link.\n\n✓ Accepted — Client accepted the proposal. An invoice is automatically generated from the proposal details.\n\n✗ Declined — Client declined. You can create a revised proposal if needed.',
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
            'An invoice becomes overdue once it reaches 30+ days without payment. Payme will flag these as high priority and the row turns red in your dashboard.\n\nAt 45+ days, Payme raises the priority to "very overdue". At 60+ days, it\'s marked as "critical" — your top priority for follow-up.\n\nUse the Send Reminder action (in the ⋯ Actions dropdown or bulk actions bar) to send a reminder email to the client.',
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
            'After generating a proposal, you land on a review page. Review the content (all fields are editable — click any field to edit), then click ✉ Send to Client.\n\nYour client gets an email with a link to the proposal. They can click Accept or Decline directly from the email — no Nvoyce account required. Once accepted, an invoice is automatically generated and saved to your dashboard.',
        },
        {
          id: 'mark-paid',
          question: 'How do I mark an invoice as paid?',
          answer:
            'Open the ⋯ Actions dropdown on any invoice row and click "✓ Mark Paid". This updates the invoice status to Fully Paid in real time — no page reload needed.\n\nThis is useful when a client pays you via bank transfer, cash, check, or any method outside of Stripe. If your client pays via the Stripe payment link in their email, the invoice will update automatically (once Stripe webhooks are live).',
        },
        {
          id: 'copy-payment-link',
          question: 'How do I share the payment link with my client directly?',
          answer:
            'Every invoice has a Stripe payment link generated when you send it. To grab that link quickly, open the ⋯ Actions dropdown on the invoice row and click "🔗 Copy Payment Link".\n\nThis copies the Stripe checkout URL to your clipboard so you can paste and send it via text, WhatsApp, or any other channel — handy when a client says they didn\'t get the email or you want to follow up fast.\n\nThe Copy Payment Link option only appears for invoices that have a Stripe link attached and are not in Draft status.',
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
            'Payme is your smart payment priority engine. It scans all your invoices and proposals, scores them by urgency (overdue days, amount, proposal staleness), and surfaces the top actions you should take right now.\n\nOn your dashboard, Payme appears as a collapsed purple strip near the top showing "N actions waiting". Click it to expand and see each recommended action with a Send Reminder or Review button.\n\nDismissing a recommendation hides it for the current session — it will reappear on your next visit if the document is still pending.',
        },
        {
          id: 'charts',
          question: 'What do the dashboard charts show?',
          answer:
            'Your dashboard has three charts in a row below the metrics strip:\n\n📈 Revenue Trend (left) — A bar + trend line chart showing how much revenue you\'ve collected each month. The Y-axis scales to your data range so you can clearly see month-over-month variance.\n\n🍩 Invoice Status (center) — A donut chart breaking down your documents into Paid, Pending, and Overdue. Hover any segment for exact counts.\n\n👥 Top Clients (right) — A horizontal bar chart showing your top 3 clients by total billed. Useful for spotting who drives the most revenue.\n\nAll three charts filter based on the time period selected in the Overview metrics (This Month / YTD / Last 30 Days / All Time).',
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
            'The search bar above the table searches across all document fields — client name, document number (e.g. INV-2026-001), status, document type, client email, business name, and amount. Just start typing and the table filters instantly.\n\nYou can also filter by:\n• Client — dropdown to show only documents for one client\n• From / To date — filter by the date the document was created\n\nWhen any filter is active, a "✕ Clear filters" link appears below the filter row. Click it to reset everything at once. If no documents match your filters, the empty state shows a "Clear filters" button to help you recover quickly.',
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
            'The ⋯ Actions button appears in the Action column for every document. It opens a menu of available actions:\n\nFor invoices:\n• 🔗 Copy Payment Link — copies the Stripe checkout URL to clipboard (only shown if a link exists and status isn\'t draft)\n• ✓ Mark Paid — manually mark the invoice as fully paid\n• 📧 Send Reminder — send a follow-up email (appears for overdue invoices)\n• 👁️ View Details — opens the full document detail modal\n• 🗂 Archive — move the invoice to your archive (only available once fully paid)\n• 🗑️ Delete Draft — permanently delete (only available while still a draft)\n\nFor proposals:\n• 🔗 Copy Link — copies the public proposal URL\n• 📧 Send Follow-up — sends a follow-up email (for stale proposals)\n• 👁️ View Details — opens the full detail modal\n• 🗂 Archive — move to archive (only available once accepted)\n• 🗑️ Delete Draft — permanently delete (only available while still a draft)',
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
            'Archiving moves a document out of your active view without deleting it. It\'s a way to keep your dashboard clean once a job is fully wrapped up.\n\nEligibility rules:\n• Invoices — must be Fully Paid before archiving\n• Proposals — must be Accepted before archiving\n\nTo view your archived documents, click the "🗂 View Archived" button in the top-right of the document table. It switches the view to show only archived docs. Click "← Back to Active" to return.\n\nYou can unarchive any document at any time using the ⋯ Actions dropdown.',
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
      icon: '🟣',
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="hidden lg:block">
        <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="faq" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <MobileNav activePage="faq" />
          <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 mb-8 border border-purple-100">
                {/* Illustration */}
                <div className="flex-shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background circle */}
                    <circle cx="80" cy="80" r="75" fill="#f3f0ff" />

                    {/* Tablet body */}
                    <rect x="42" y="38" width="70" height="90" rx="8" fill="#1e1b4b" />
                    <rect x="46" y="44" width="62" height="76" rx="5" fill="#ede9fe" />

                    {/* Tablet screen lines — document content */}
                    <rect x="52" y="52" width="38" height="4" rx="2" fill="#7c3aed" opacity="0.7"/>
                    <rect x="52" y="60" width="50" height="3" rx="1.5" fill="#a78bfa" opacity="0.5"/>
                    <rect x="52" y="66" width="44" height="3" rx="1.5" fill="#a78bfa" opacity="0.5"/>
                    <rect x="52" y="72" width="48" height="3" rx="1.5" fill="#a78bfa" opacity="0.5"/>
                    <rect x="52" y="82" width="38" height="3" rx="1.5" fill="#a78bfa" opacity="0.3"/>
                    <rect x="52" y="88" width="42" height="3" rx="1.5" fill="#a78bfa" opacity="0.3"/>

                    {/* Home button */}
                    <circle cx="77" cy="125" r="4" fill="#4c1d95" opacity="0.5"/>

                    {/* Person — body */}
                    <ellipse cx="95" cy="130" rx="18" ry="10" fill="#7c3aed" opacity="0.15"/>
                    <rect x="83" y="108" width="24" height="26" rx="6" fill="#7c3aed" opacity="0.8"/>

                    {/* Person — head */}
                    <circle cx="95" cy="98" r="12" fill="#fcd9b1"/>
                    {/* Hair */}
                    <path d="M83 95 Q85 83 95 82 Q105 83 107 95 Q103 88 95 87 Q87 88 83 95Z" fill="#92400e"/>

                    {/* Person — eyes */}
                    <circle cx="91" cy="97" r="1.5" fill="#1e1b4b"/>
                    <circle cx="99" cy="97" r="1.5" fill="#1e1b4b"/>

                    {/* Person — smile */}
                    <path d="M91 102 Q95 105 99 102" stroke="#e07b54" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

                    {/* Arms holding tablet */}
                    <path d="M83 115 Q72 118 68 108" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" opacity="0.8"/>
                    <path d="M107 115 Q118 118 112 105" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" opacity="0.8"/>

                    {/* Question mark bubble */}
                    <circle cx="118" cy="58" r="16" fill="#f97316"/>
                    <text x="118" y="64" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="serif">?</text>

                    {/* Small dots — thinking */}
                    <circle cx="104" cy="48" r="3" fill="#f97316" opacity="0.5"/>
                    <circle cx="110" cy="44" r="2" fill="#f97316" opacity="0.3"/>
                  </svg>
                </div>

                {/* Text */}
                <div>
                  <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Frequently Asked Questions</h1>
                  <p className="text-gray-500">
                    Everything you need to know about using Nvoyce — statuses, payments, and your dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Groups */}
            <div className="space-y-10">
              {faqGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">{group.icon}</span>
                    <h2 className="text-sm font-bold text-purple-700 uppercase tracking-wider">{group.label}</h2>
                  </div>
                  <div className="space-y-3">
                    {group.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-300 transition"
                      >
                        <button
                          onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition gap-4"
                        >
                          <h3 className="font-semibold text-gray-900 text-sm">{faq.question}</h3>
                          <span
                            className={`text-gray-400 text-xs flex-shrink-0 transition-transform duration-200 ${
                              expandedId === faq.id ? 'rotate-180' : ''
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {expandedId === faq.id && (
                          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center flex flex-col items-center gap-4">
              <div className="group relative inline-block">
                <img
                  src="/logo-icon.png"
                  alt="Nvoyce N icon — the orange dots spell VOICE in Braille"
                  className="w-12 h-12 object-contain opacity-70 hover:opacity-100 transition cursor-default"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg">
                  The orange dots spell <span className="text-orange-400 font-semibold">"VOICE"</span> in Braille ✦
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Still have questions?{' '}
                <a href="mailto:support@nvoyce.ai" className="text-purple-600 hover:text-purple-700 font-semibold">
                  support@nvoyce.ai
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
