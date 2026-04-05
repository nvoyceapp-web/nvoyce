import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col px-4 py-6">
          <span className="text-lg font-bold text-gray-900 mb-8 px-2">Nvoyce</span>
          <nav className="flex flex-col gap-1 flex-1">
            <Link href="/dashboard" className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-900">
              Dashboard
            </Link>
            <Link href="/dashboard/new" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              + New Document
            </Link>
            <Link href="/dashboard/invoices" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Invoices
            </Link>
            <Link href="/dashboard/proposals" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Proposals
            </Link>
          </nav>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 px-2">
              <span className="text-sm text-gray-600">My Account</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="px-10 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Link
                href="/dashboard/new"
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                + New Document
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-5 mb-10">
              {[
                { label: 'Total Sent', value: '0', sub: 'invoices & proposals' },
                { label: 'Outstanding', value: '$0', sub: 'awaiting payment' },
                { label: 'Collected', value: '$0', sub: 'this month' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="text-sm text-gray-500 mb-1">{label}</div>
                  <div className="text-3xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-400 mt-1">{sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h2>
              <p className="text-gray-500 text-sm mb-6">
                Create your first proposal or invoice in 30 seconds.
              </p>
              <Link
                href="/dashboard/new"
                className="bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
              >
                Create your first document →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
