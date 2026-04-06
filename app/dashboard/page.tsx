'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface Document {
  id: string
  client_name: string
  doc_type: string
  price: number
  status: string
  created_at: string
}

interface Stats {
  totalSent: number
  outstanding: number
  collected: number
  pendingProposals: number
  avgDaysToPayment: number
  overdue: number
  documents: Document[]
}

export default function DashboardPage() {
  const { userId } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalSent: 0,
    outstanding: 0,
    collected: 0,
    pendingProposals: 0,
    avgDaysToPayment: 0,
    overdue: 0,
    documents: []
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'client' | 'amount' | 'date' | 'status' | 'days'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort documents
  const filteredDocuments = stats.documents
    .filter((doc) => {
      const matchesSearch = doc.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = !filterClient || doc.client_name === filterClient
      const docDate = new Date(doc.created_at)
      const matchesDateFrom = !dateFrom || docDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || docDate <= new Date(dateTo)
      return matchesSearch && matchesClient && matchesDateFrom && matchesDateTo
    })
    .sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'client':
          aVal = a.client_name.toLowerCase()
          bVal = b.client_name.toLowerCase()
          break
        case 'amount':
          aVal = a.price
          bVal = b.price
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'days':
          aVal = Math.floor((new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24))
          bVal = Math.floor((new Date().getTime() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24))
          break
        case 'date':
        default:
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

  // Get unique client names for filter dropdown
  const uniqueClients = Array.from(new Set(stats.documents.map((doc) => doc.client_name)))

  // Sort toggle function
  const toggleSort = (field: 'client' | 'amount' | 'date' | 'status' | 'days') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  // Get row urgency color
  const getRowColor = (doc: Document) => {
    if (doc.status === 'paid') return 'bg-green-50'
    const daysOld = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOld > 30) return 'bg-red-50'
    if (daysOld > 14) return 'bg-yellow-50'
    return 'hover:bg-gray-50'
  }

  // Export to Excel
  const exportToExcel = () => {
    if (filteredDocuments.length === 0) {
      alert('No documents to export')
      return
    }

    // Prepare data for export
    const exportData = filteredDocuments.map((doc) => {
      const createdDate = new Date(doc.created_at)
      const daysOld = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        'Client Name': doc.client_name,
        'Type': doc.doc_type.toUpperCase(),
        'Amount': `$${doc.price.toLocaleString()}`,
        'Status': doc.status,
        'Date Sent': createdDate.toLocaleDateString(),
        'Days Outstanding': doc.status === 'paid' ? '—' : daysOld,
      }
    })

    // Create CSV content
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map((row) => headers.map((h) => `"${row[h as keyof typeof row]}"`).join(',')),
    ].join('\n')

    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nvoyce-invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, client_name, doc_type, price, status, created_at')
          .eq('user_id', 'test-user')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          const now = new Date()

          const totalSent = data.length
          const pendingProposals = data.filter((doc) => doc.doc_type === 'proposal' && doc.status !== 'paid').length
          const outstanding = data
            .filter((doc) => doc.status !== 'paid')
            .reduce((sum, doc) => sum + (doc.price || 0), 0)
          const collected = data
            .filter((doc) => doc.status === 'paid')
            .reduce((sum, doc) => sum + (doc.price || 0), 0)

          // Calculate average days to payment for paid invoices
          const paidDocs = data.filter((doc) => doc.status === 'paid')
          const avgDaysToPayment = paidDocs.length > 0
            ? Math.round(
                paidDocs.reduce((sum, doc) => {
                  const createdDate = new Date(doc.created_at)
                  const days = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                  return sum + days
                }, 0) / paidDocs.length
              )
            : 0

          // Count overdue (unpaid for more than 30 days)
          const overdue = data.filter((doc) => {
            if (doc.status === 'paid') return false
            const createdDate = new Date(doc.created_at)
            const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
            return daysOld > 30
          }).length

          setStats({ totalSent, outstanding, collected, pendingProposals, avgDaysToPayment, overdue, documents: data })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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

            {/* Urgency Summary Card - Navy Blue with Orange Accents */}
            {stats.outstanding > 0 && (
              <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white rounded-xl p-6 mb-10 border border-blue-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-blue-200 mb-1">You're owed</div>
                    <div className="text-4xl font-bold mb-2">${stats.outstanding.toLocaleString()}</div>
                    <div className="text-sm text-blue-300">
                      {stats.overdue > 0 && <span className="text-orange-400 font-semibold">🚨 {stats.overdue} overdue • </span>}
                      {stats.documents.filter((d) => d.status !== 'paid').length} invoices pending
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const unpaidDocs = stats.documents.filter((d) => d.status !== 'paid')
                      if (unpaidDocs.length === 0) return null
                      const oldest = unpaidDocs.reduce((oldest, current) => {
                        return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest
                      })
                      const daysOld = Math.floor((new Date().getTime() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <div>
                          <div className="text-sm text-blue-200 mb-1">Oldest unpaid</div>
                          <div className="text-2xl font-bold text-orange-400">{daysOld} days</div>
                          <div className="text-xs text-blue-300 mt-1">{oldest.client_name}</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 mb-10">
              <div className="grid grid-cols-3 gap-5 col-span-2">
                {(() => {
                  const now = new Date()
                  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                  const thisMonthRevenue = stats.documents
                    .filter((d) => d.status === 'paid' && new Date(d.created_at) >= thisMonthStart)
                    .reduce((sum, d) => sum + (d.price || 0), 0)

                  return [
                    { label: 'This Month', value: loading ? '-' : `$${thisMonthRevenue.toLocaleString()}`, sub: 'revenue collected' },
                    { label: 'Total Sent', value: loading ? '-' : stats.totalSent.toString(), sub: 'invoices & proposals' },
                    { label: 'Outstanding', value: loading ? '-' : `$${stats.outstanding.toLocaleString()}`, sub: 'awaiting payment' },
                  ]
                })().map(({ label, value, sub }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="text-sm text-gray-500 mb-1">{label}</div>
                    <div className="text-3xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-400 mt-1">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Pending Proposals</div>
                  <div className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.pendingProposals}</div>
                  <div className="text-xs text-gray-400 mt-1">awaiting approval</div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-sm text-gray-500 mb-1">Avg Days to Payment</div>
                  <div className="text-3xl font-bold text-gray-900">{loading ? '-' : stats.avgDaysToPayment}</div>
                  <div className="text-xs text-gray-400 mt-1">after sending</div>
                </div>
                {stats.overdue > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm text-red-600 mb-1 font-semibold">⚠️ Overdue</div>
                    <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
                    <div className="text-xs text-red-500 mt-1">invoices 30+ days</div>
                  </div>
                )}
              </div>
            </div>

            {stats.documents.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Invoices & Proposals</h2>
                    <button
                      onClick={exportToExcel}
                      className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
                    >
                      ⬇️ Export to CSV
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Search client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                    />
                    <select
                      value={filterClient}
                      onChange={(e) => setFilterClient(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                    >
                      <option value="">All clients</option>
                      {uniqueClients.map((client) => (
                        <option key={client} value={client}>
                          {client}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>

                  {filteredDocuments.length !== stats.documents.length && (
                    <div className="text-xs text-gray-500">
                      Showing {filteredDocuments.length} of {stats.documents.length} documents
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th
                          onClick={() => toggleSort('client')}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Client{getSortIndicator('client')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                        <th
                          onClick={() => toggleSort('amount')}
                          className="px-6 py-3 text-right text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Amount{getSortIndicator('amount')}
                        </th>
                        <th
                          onClick={() => toggleSort('status')}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Status{getSortIndicator('status')}
                        </th>
                        <th
                          onClick={() => toggleSort('days')}
                          className="px-6 py-3 text-right text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Days Outstanding{getSortIndicator('days')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => {
                        const createdDate = new Date(doc.created_at)
                        const daysOld = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                        const statusColors: Record<string, string> = {
                          draft: 'bg-gray-100 text-gray-700',
                          sent: 'bg-blue-100 text-blue-700',
                          paid: 'bg-green-100 text-green-700',
                          overdue: 'bg-red-100 text-red-700',
                        }
                        const isOverdue = doc.status !== 'paid' && daysOld > 30

                        return (
                          <tr key={doc.id} className={`border-b border-gray-100 ${getRowColor(doc)} transition`}>
                            <td className="px-6 py-4 text-gray-900 font-medium">{doc.client_name}</td>
                            <td className="px-6 py-4 text-gray-600 capitalize">{doc.doc_type}</td>
                            <td className="px-6 py-4 text-right text-gray-900 font-semibold">${doc.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              {doc.status === 'paid' ? (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                  ✓ Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    // Mark as paid (will implement API call)
                                    console.log('Mark as paid:', doc.id)
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {doc.status === 'paid' ? '—' : (
                                <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                  {daysOld} days {isOverdue && '🚨'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              {doc.status !== 'paid' && daysOld > 14 && (
                                <button
                                  onClick={() => {
                                    // Send reminder (will implement email)
                                    console.log('Send reminder to:', doc.client_name)
                                    alert(`Reminder would be sent to ${doc.client_name}`)
                                  }}
                                  className="text-xs bg-orange-600 text-white px-2.5 py-1 rounded hover:bg-orange-700 transition"
                                  title="Send payment reminder"
                                >
                                  📧 Remind
                                </button>
                              )}
                              <Link href={`/dashboard/documents/${doc.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-semibold">
                                View
                              </Link>
                            </td>
                          </tr>
                        )
                      })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No documents found. Try adjusting your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
