'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const faqs = [
    {
      id: 'days-outstanding',
      question: 'What does "Days Outstanding" mean?',
      answer:
        'Days Outstanding shows how long ago you created the invoice. A positive number (5 days) means the invoice is 5 days old. A negative number means the invoice has a future date (usually a data issue). This helps you track how long invoices have been waiting for payment.',
    },
    {
      id: 'payme',
      question: 'What is Payme Smart Assistant?',
      answer:
        'Payme is your payment assistant that automatically prioritizes your most urgent invoices and proposals. It highlights invoices that are overdue and proposals that need follow-up, so you can focus on getting paid faster. The higher the priority, the more urgent the action.',
    },
    {
      id: 'invoice-statuses',
      question: 'What are the different invoice statuses?',
      answer:
        '📝 Draft: Invoice created but not yet sent to client. 📤 Sent: Invoice emailed to client, awaiting payment. 🚨 Overdue: Invoice is 30+ days old and unpaid — follow up immediately. ✓ Paid: Payment received and recorded. Use the Status column to track where each invoice stands.',
    },
    {
      id: 'proposal-statuses',
      question: 'What are the different proposal statuses?',
      answer:
        '📝 Draft: Proposal generated and saved — review it before sending. 📤 Sent: You clicked \'Send to Client\' and the proposal was emailed. 👁️ Viewed: Client has opened the proposal link. ✓ Accepted: Client accepted — an invoice is automatically generated. ✗ Declined: Client declined the proposal.',
    },
    {
      id: 'avg-days-payment',
      question: 'What is "Avg Days to Payment"?',
      answer:
        'This is the average number of days it takes your clients to pay after you send an invoice. If it says 12 days, it means on average your clients pay within 12 days. This metric helps you forecast cash flow.',
    },
    {
      id: 'overdue',
      question: 'When is an invoice considered overdue?',
      answer:
        'An invoice becomes overdue once it reaches 30+ days without payment. Payme will flag these as high priority. At 45+ days, priority increases to "very overdue". At 60+ days, it\'s marked as "critical" and should be your top priority for follow-up.',
    },
    {
      id: 'proposal-acceptance',
      question: 'How do clients accept proposals?',
      answer:
        'After generating a proposal, you\'ll land on a review page with an amber banner. Review the proposal, then click ✉ Send to Client — this emails the proposal directly to your client. They can click the link in the email to accept or decline without needing to sign up for Nvoyce. Once accepted, an invoice is automatically generated.',
    },
    {
      id: 'select-dropdown',
      question: 'What is the "⋯ Select" dropdown for?',
      answer:
        'The "⋯ Select" dropdown contains all actions you can take on a document. For invoices: Mark Paid, Send Reminder, View Details. For proposals: View Details, where you can Send to Client, Save as Draft, or Edit Inputs. Keep your dashboard organized by using these action menus.',
    },
    {
      id: 'negative-days',
      question: 'Why do I see negative days outstanding?',
      answer:
        'Negative days mean the invoice has a future date. This usually happens if an invoice was created with the wrong date. You can ignore it or contact support to fix the date. It doesn\'t affect your actual payment tracking.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-full lg:w-60 bg-purple-50 border-r border-purple-200 flex flex-col px-4 py-6">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 mb-8 px-2">
            Nvoyce
          </Link>
          <nav className="flex flex-col gap-1 flex-1">
            <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
              ← Back to Dashboard
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
              <p className="text-lg text-gray-600">
                Learn more about Nvoyce metrics, statuses, and how to use the platform effectively.
              </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-purple-300 transition"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    <span className={`text-lg text-gray-600 transition ${expandedId === faq.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {expandedId === faq.id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600">
                Still have questions?{' '}
                <a href="mailto:support@nvoyce.ai" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
