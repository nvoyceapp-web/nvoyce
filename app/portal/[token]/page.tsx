import { notFound } from 'next/navigation'

interface Document {
  id: string
  doc_type: 'invoice' | 'proposal'
  doc_number: string | null
  client_name: string
  status: string
  price: number
  amount_paid: number | null
  created_at: string
  generated_content: { subject?: string } | null
}

interface PortalData {
  clientEmail: string
  businessName: string
  documents: Document[]
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Paid' },
  sent:     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Awaiting payment' },
  accepted: { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Accepted' },
  declined: { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Declined' },
  expired:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expired' },
  archived: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Archived' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function getPortalData(token: string): Promise<PortalData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nvoyce.ai'
  try {
    const res = await fetch(`${baseUrl}/api/portal/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getPortalData(token)
  if (!data) notFound()

  const { businessName, clientEmail, documents } = data

  const totalPaid = documents.filter(d => d.status === 'paid').reduce((s, d) => s + (d.price || 0), 0)
  const totalOutstanding = documents.filter(d => d.status === 'sent').reduce((s, d) => s + (d.price || 0), 0)
  const invoices = documents.filter(d => d.doc_type === 'invoice')
  const proposals = documents.filter(d => d.doc_type === 'proposal')

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Client Portal</p>
            <h1 className="text-xl font-bold text-[#0d1b2a] tracking-tight">{businessName}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Viewing as</p>
            <p className="text-sm font-medium text-[#0d1b2a]">{clientEmail}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Summary cards */}
        {documents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total paid</p>
              <p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Outstanding</p>
              <p className="text-xl font-bold text-blue-600">{fmt(totalOutstanding)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Invoices</p>
              <p className="text-xl font-bold text-[#0d1b2a]">{invoices.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Proposals</p>
              <p className="text-xl font-bold text-[#0d1b2a]">{proposals.length}</p>
            </div>
          </div>
        )}

        {/* Document list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#0d1b2a]">All documents</h2>
            <p className="text-xs text-gray-400 mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} from {businessName}</p>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No documents yet</p>
              <p className="text-gray-400 text-xs mt-1">Documents will appear here once {businessName} sends them</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {documents.map(doc => {
                const style = STATUS_STYLES[doc.status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: doc.status }
                const isProposal = doc.doc_type === 'proposal'
                const subject = doc.generated_content?.subject || null

                return (
                  <div key={doc.id} className="px-5 py-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isProposal ? 'bg-purple-100' : 'bg-orange-100'}`}>
                      {isProposal ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#0d1b2a]">
                          {doc.doc_number || (isProposal ? 'Proposal' : 'Invoice')}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      {subject && <p className="text-xs text-gray-500 truncate mt-0.5">{subject}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.created_at)}</p>
                    </div>

                    {/* Amount + action */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#0d1b2a]">{fmt(doc.price)}</p>
                      {doc.status === 'paid' && doc.amount_paid && (
                        <p className="text-xs text-green-600">Paid {fmt(doc.amount_paid)}</p>
                      )}
                      {/* Link to proposal acceptance page if still open */}
                      {isProposal && doc.status === 'sent' && (
                        <a
                          href={`/p/${doc.id}`}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1 block"
                        >
                          View proposal →
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by{' '}
          <a href="https://app.nvoyce.ai" className="text-[#e04e1a] hover:underline font-medium">Nvoyce</a>
        </p>
      </div>
    </div>
  )
}
