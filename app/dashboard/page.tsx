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
  const [chartView, setChartView] = useState<'week' | 'month'>('week')
  const [timePeriod, setTimePeriod] = useState<'all' | 'ytd' | '30days' | 'thisMonth'>('thisMonth')
  const [selectedMetric, setSelectedMetric] = useState<'avgInvoice' | 'thisMonth' | 'clientCount'>('thisMonth')
  const [showPendingProposals, setShowPendingProposals] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())

  // Get date range for selected time period
  const getDateRange = () => {
    const now = new Date()
    let dateFrom: Date | null = null

    if (timePeriod === 'thisMonth') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (timePeriod === '30days') {
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (timePeriod === 'ytd') {
      dateFrom = new Date(now.getFullYear(), 0, 1)
    }
    // 'all' has no dateFrom

    return dateFrom
  }

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

  // Calculate revenue for chart (monthly)
  const getChartData = () => {
    const dateFrom = getDateRange()
    const monthlyData: { [key: string]: number } = {}
    stats.documents.forEach((doc) => {
      if (doc.status === 'paid') {
        const date = new Date(doc.created_at)
        if (dateFrom && date < dateFrom) return
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + doc.price
      }
    })
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue
      }))
  }

  // Get invoice status breakdown
  const getStatusBreakdown = () => {
    const dateFrom = getDateRange()
    const filteredDocs = stats.documents.filter((d) => {
      if (!dateFrom) return true
      return new Date(d.created_at) >= dateFrom
    })

    const paid = filteredDocs.filter((d) => d.status === 'paid').length
    const unpaid = filteredDocs.filter((d) => d.status !== 'paid')

    // Split unpaid into pending and overdue based on days old
    const now = new Date()
    let pending = 0
    let overdue = 0
    unpaid.forEach((d) => {
      const daysOld = Math.floor((now.getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24))
      if (daysOld >= 30) overdue++
      else pending++
    })

    const total = paid + pending + overdue
    return { paid, pending, overdue, total }
  }

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  // Batch action handlers
  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  const selectAllFiltered = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)))
    }
  }

  const markSelectedAsPaid = () => {
    selectedDocs.forEach((docId) => {
      console.log('Mark as paid:', docId)
    })
    alert(`Marked ${selectedDocs.size} invoice(s) as paid`)
    setSelectedDocs(new Set())
  }

  const sendRemindersToSelected = () => {
    selectedDocs.forEach((docId) => {
      console.log('Send reminder:', docId)
    })
    alert(`Reminders sent to ${selectedDocs.size} client(s)`)
    setSelectedDocs(new Set())
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
      <div className="flex h-screen flex-col lg:flex-row">
        <aside className="hidden lg:flex w-full lg:w-60 bg-white border-r border-gray-100 border-b lg:border-b-0 flex flex-col px-4 py-6">
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

        <main className="flex-1 overflow-auto w-full">
          <div className="px-4 lg:px-10 py-8">
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
                        <div className="bg-white/10 rounded-lg p-3 border border-orange-500/30">
                          <div className="text-sm text-blue-200 mb-1 flex items-center gap-1">
                            ⏰ Oldest unpaid
                          </div>
                          <div className="text-3xl font-bold text-orange-300">{daysOld} days</div>
                          <div className="text-xs text-blue-200 mt-2 font-medium">{oldest.client_name}</div>
                          <div className="text-xs text-blue-300 mt-1">${oldest.price.toLocaleString()} outstanding</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 auto-rows-max">
              {/* Left: Metrics Block with Dropdown */}
              <div className="col-span-1 space-y-4 h-fit">
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                  {(() => {
                    const now = new Date()
                    const dateFrom = getDateRange()
                    const periodDocs = stats.documents.filter((d) => !dateFrom || new Date(d.created_at) >= dateFrom)

                    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                    const thisMonthRevenue = stats.documents
                      .filter((d) => d.status === 'paid' && new Date(d.created_at) >= thisMonthStart)
                      .reduce((sum, d) => sum + (d.price || 0), 0)

                    const paidDocs = periodDocs.filter((d) => d.status === 'paid').length
                    const totalInvoicesInPeriod = periodDocs.length
                    const totalRevenueInPeriod = periodDocs.filter((d) => d.status === 'paid').reduce((sum, d) => sum + (d.price || 0), 0)
                    const uniqueClients = new Set(stats.documents.map((d) => d.client_name)).size
                    const collectionRate = totalInvoicesInPeriod > 0 ? ((paidDocs / totalInvoicesInPeriod) * 100).toFixed(0) : 0
                    const avgInvoiceValue = totalInvoicesInPeriod > 0 ? (totalRevenueInPeriod / totalInvoicesInPeriod).toFixed(0) : 0

                    // Primary metrics (always visible)
                    const primary = [
                      { label: 'Period Revenue', value: loading ? '-' : `$${totalRevenueInPeriod.toLocaleString()}`, sub: 'for selected period' },
                      { label: 'Total Sent', value: loading ? '-' : stats.totalSent.toString(), sub: 'invoices & proposals' },
                      { label: 'Collection Rate', value: loading ? '-' : `${collectionRate}%`, sub: 'of invoices paid' },
                    ]

                    // Additional metrics (selectable via dropdown)
                    const additional = {
                      avgInvoice: { label: 'Avg Invoice Value', value: loading ? '-' : `$${Number(avgInvoiceValue).toLocaleString()}`, sub: 'per invoice' },
                      thisMonth: { label: 'This Month', value: loading ? '-' : `$${thisMonthRevenue.toLocaleString()}`, sub: 'revenue collected' },
                      clientCount: { label: 'Client Count', value: loading ? '-' : uniqueClients.toString(), sub: 'unique clients' },
                    }

                    return (
                      <>
                        {/* Primary metrics grid */}
                        <div className="grid grid-cols-3 gap-3">
                          {primary.map(({ label, value, sub }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs text-gray-500 mb-1">{label}</div>
                              <div className="text-xl font-bold text-gray-900">{value}</div>
                              <div className="text-xs text-gray-400 mt-1">{sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Additional metric with dropdown selector */}
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-600 block">More metrics</label>
                          <div>
                            <select
                              value={selectedMetric}
                              onChange={(e) => setSelectedMetric(e.target.value as any)}
                              className="text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black w-full mb-3"
                            >
                              <option value="thisMonth">This Month</option>
                              <option value="avgInvoice">Avg Invoice Value</option>
                              <option value="clientCount">Client Count</option>
                            </select>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="text-xs text-gray-500 mb-1">{additional[selectedMetric].label}</div>
                              <div className="text-2xl font-bold text-gray-900">{additional[selectedMetric].value}</div>
                              <div className="text-xs text-gray-400 mt-1">{additional[selectedMetric].sub}</div>
                            </div>
                          </div>
                        </div>

                        {/* Secondary info card */}
                        <div className="border-t border-gray-100 pt-6 space-y-4">
                          <button
                            onClick={() => setShowPendingProposals(!showPendingProposals)}
                            className="w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-500 mb-2">Pending Proposals</div>
                                <div className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.pendingProposals}</div>
                                <div className="text-xs text-gray-400 mt-1">awaiting approval</div>
                              </div>
                              <div className="text-xl text-gray-400">{showPendingProposals ? '▼' : '▶'}</div>
                            </div>
                          </button>

                          {showPendingProposals && stats.pendingProposals > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                              {stats.documents
                                .filter((d) => d.doc_type === 'proposal' && d.status !== 'paid')
                                .slice(0, 5)
                                .map((proposal) => (
                                  <div key={proposal.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-gray-100">
                                    <div>
                                      <div className="font-medium text-gray-900">{proposal.client_name}</div>
                                      <div className="text-gray-500">${proposal.price.toLocaleString()}</div>
                                    </div>
                                    <Link href={`/dashboard/documents/${proposal.id}`} className="text-blue-600 hover:text-blue-700 font-semibold">
                                      View
                                    </Link>
                                  </div>
                                ))}
                              {stats.documents.filter((d) => d.doc_type === 'proposal' && d.status !== 'paid').length === 0 && (
                                <div className="text-xs text-gray-500 p-2">No pending proposals</div>
                              )}
                            </div>
                          )}

                          <div className="border-t border-gray-100 pt-4">
                            <div className="text-sm text-gray-500 mb-2">Avg Days to Payment</div>
                            <div className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.avgDaysToPayment}</div>
                            <div className="text-xs text-gray-400 mt-1">after sending</div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Right: Charts - Stacked Vertically */}
              <div className="col-span-1 space-y-4 flex flex-col">
                {/* Revenue Trend Chart */}
                {(() => {
                  const chartData = getChartData()
                  if (chartData.length === 0) return null
                  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)
                  return (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col h-96">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
                        <select
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value as any)}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                        >
                          <option value="thisMonth">This Month</option>
                          <option value="ytd">YTD</option>
                          <option value="30days">Last 30 Days</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                      <div className="flex-1 flex items-end justify-between gap-3 min-h-56">
                        {chartData.slice(-6).map((data) => (
                          <div key={data.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                            <div
                              className="w-8 bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-lg transition-all hover:from-orange-700 hover:to-orange-600 cursor-pointer"
                              style={{ height: `${Math.max((data.revenue / maxRevenue) * 100, 15)}%` }}
                              title={`$${(data.revenue / 1000).toFixed(1)}k`}
                            />
                            <div className="text-xs font-medium text-gray-600 text-center whitespace-nowrap">{data.label}</div>
                            <div className="text-xs text-gray-500">${(data.revenue / 1000).toFixed(1)}k</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Invoice Status Pie Chart */}
                {(() => {
                  const { paid, pending, overdue, total } = getStatusBreakdown()
                  if (total === 0) return null
                  const paidPercent = (paid / total) * 100
                  const pendingPercent = (pending / total) * 100
                  const overduePercent = (overdue / total) * 100
                  return (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col h-96">
                      <h3 className="text-sm font-semibold text-gray-900 mb-6">Invoice Status</h3>
                      <div className="flex-1 flex items-center justify-center gap-12">
                        <svg className="w-40 h-40 flex-shrink-0" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="45" fill="none" stroke="#10b981" strokeWidth="30" strokeDasharray={`${(paidPercent / 100) * 282.7} 282.7`} transform="rotate(-90 60 60)" />
                          <circle cx="60" cy="60" r="45" fill="none" stroke="#f59e0b" strokeWidth="30" strokeDasharray={`${(pendingPercent / 100) * 282.7} 282.7`} strokeDashoffset={`${-((paidPercent / 100) * 282.7)}`} transform="rotate(-90 60 60)" />
                          <circle cx="60" cy="60" r="45" fill="none" stroke="#ef4444" strokeWidth="30" strokeDasharray={`${(overduePercent / 100) * 282.7} 282.7`} strokeDashoffset={`${-(((paidPercent + pendingPercent) / 100) * 282.7)}`} transform="rotate(-90 60 60)" />
                          <text x="60" y="65" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111827">{total}</text>
                          <text x="60" y="82" textAnchor="middle" fontSize="10" fill="#6b7280">total</text>
                        </svg>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div><div className="text-xs font-semibold text-gray-900">{paid} Paid</div><div className="text-xs text-gray-500">{paidPercent.toFixed(0)}%</div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div><div className="text-xs font-semibold text-gray-900">{pending} Pending</div><div className="text-xs text-gray-500">{pendingPercent.toFixed(0)}%</div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div><div className="text-xs font-semibold text-gray-900">{overdue} Overdue</div><div className="text-xs text-gray-500">{overduePercent.toFixed(0)}%</div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {stats.documents.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {selectedDocs.size > 0 && (
                  <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-blue-900">
                      {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={markSelectedAsPaid}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        ✓ Mark as Paid
                      </button>
                      <button
                        onClick={sendRemindersToSelected}
                        className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition font-semibold"
                      >
                        📧 Send Reminders
                      </button>
                      <button
                        onClick={() => setSelectedDocs(new Set())}
                        className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                            onChange={selectAllFiltered}
                            className="rounded border-gray-300 cursor-pointer"
                          />
                        </th>
                        <th
                          onClick={() => toggleSort('client')}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Client{getSortIndicator('client')}
                        </th>
                        <th
                          onClick={() => toggleSort('date')}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                        >
                          Date Sent{getSortIndicator('date')}
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
                            <td className="px-3 py-4">
                              <input
                                type="checkbox"
                                checked={selectedDocs.has(doc.id)}
                                onChange={() => toggleDocSelection(doc.id)}
                                className="rounded border-gray-300 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium">{doc.client_name}</td>
                            <td className="px-6 py-4 text-gray-600 text-sm">{createdDate.toLocaleDateString()}</td>
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
                                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition"
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
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
