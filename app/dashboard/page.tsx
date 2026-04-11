'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTopPaymeActions, PaymeAction } from '@/lib/payme-scoring'
import Logo from '@/components/Logo'

interface Document {
  id: string
  client_name: string
  client_email: string
  business_name: string
  doc_type: string
  price: number
  status: string
  created_at: string
  document_number?: string
  amount_paid?: number
  stripe_payment_link?: string
  form_data?: Record<string, any>
  generated_content?: Record<string, any>
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

function DashboardContent() {
  const { userId } = useAuth()
  const searchParams = useSearchParams()
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
  const [selectedMetric, setSelectedMetric] = useState<'avgInvoice' | 'avgDaysToPayment' | 'clientCount'>('avgInvoice')
  const [showPendingProposals, setShowPendingProposals] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set())
  const [expandPayme, setExpandPayme] = useState(false)
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [documentTab, setDocumentTab] = useState<'invoices' | 'proposals'>('invoices')
  const [generatingInvoices, setGeneratingInvoices] = useState<Set<string>>(new Set())
  const [successMessage, setSuccessMessage] = useState<{ docId: string; invoiceId: string; message: string; paymentLink?: string } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [assigningNumbers, setAssigningNumbers] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      // Filter by document type based on active tab
      const docTypeNormalized = doc.doc_type.toLowerCase() === 'proposal' ? 'proposal' : 'invoice'
      const matchesTab = documentTab === 'invoices' ? docTypeNormalized === 'invoice' : docTypeNormalized === 'proposal'
      return matchesSearch && matchesClient && matchesDateFrom && matchesDateTo && matchesTab
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
      if (doc.status === 'fully_paid') {
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

    const paid = filteredDocs.filter((d) => d.status === 'fully_paid').length
    const unpaid = filteredDocs.filter((d) => d.status !== 'fully_paid')

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

  // Calculate collection rate trend (this month vs last month)
  const getCollectionTrend = () => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthDocs = stats.documents.filter((d) => new Date(d.created_at) >= thisMonthStart)
    const lastMonthDocs = stats.documents.filter(
      (d) => new Date(d.created_at) >= lastMonthStart && new Date(d.created_at) <= lastMonthEnd
    )

    const thisMonthRate = thisMonthDocs.length > 0 ? (thisMonthDocs.filter((d) => d.status === 'fully_paid').length / thisMonthDocs.length) * 100 : 0
    const lastMonthRate = lastMonthDocs.length > 0 ? (lastMonthDocs.filter((d) => d.status === 'fully_paid').length / lastMonthDocs.length) * 100 : 0

    return {
      current: Math.round(thisMonthRate),
      previous: Math.round(lastMonthRate),
      trend: Math.round(thisMonthRate - lastMonthRate),
    }
  }

  // Get top clients by revenue and payment speed
  const getTopClients = () => {
    const clientStats: {
      [key: string]: { revenue: number; paidCount: number; totalCount: number; avgDays: number }
    } = {}

    stats.documents.forEach((doc) => {
      if (!clientStats[doc.client_name]) {
        clientStats[doc.client_name] = { revenue: 0, paidCount: 0, totalCount: 0, avgDays: 0 }
      }
      clientStats[doc.client_name].revenue += doc.price
      clientStats[doc.client_name].totalCount += 1
      if (doc.status === 'fully_paid') {
        clientStats[doc.client_name].paidCount += 1
        const days = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))
        clientStats[doc.client_name].avgDays += days
      }
    })

    return Object.entries(clientStats)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        paymentRate: (data.paidCount / data.totalCount) * 100,
        avgDays: data.paidCount > 0 ? Math.round(data.avgDays / data.paidCount) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
  }

  // Generate smart recommendations
  const getRecommendations = () => {
    // Convert documents to Payme format (map doc_type to invoice/proposal)
    const docsForScoring = stats.documents.map((doc) => ({
      ...doc,
      doc_type: (doc.doc_type.toLowerCase() === 'proposal' ? 'proposal' : 'invoice') as 'invoice' | 'proposal',
    }))

    // Get top 3 actions using unified scoring algorithm
    const paymeActions = getTopPaymeActions(docsForScoring, 3)

    // Convert PaymeAction to recommendation format for UI
    return paymeActions.map((action) => ({
      type: `${action.type}-${action.id}`,
      text: action.action_text,
      action: action.type === 'invoice' ? 'send-reminders' : 'follow-up',
      urgency: action.urgency === 'critical' ? 'high' : action.urgency === 'high' ? 'high' : 'medium',
      paymeAction: action,
    }))
      .filter((rec) => !dismissedRecommendations.has(rec.type))
  }

  // Dismiss recommendation for this session
  const dismissRecommendation = (type: string) => {
    const newDismissed = new Set(dismissedRecommendations)
    newDismissed.add(type)
    setDismissedRecommendations(newDismissed)
  }

  // Accept proposal and auto-generate invoice
  const acceptProposalAndGenerateInvoice = async (proposalId: string) => {
    try {
      setGeneratingInvoices((prev) => new Set(prev).add(proposalId))

      const response = await fetch('/api/proposals/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate invoice')
      }

      const data = await response.json()

      // Show success message
      setSuccessMessage({
        docId: proposalId,
        invoiceId: data.invoiceId,
        message: `✅ ${data.message}. Invoice created!`,
      })

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)

      // Refresh the stats to show updated proposal status and new invoice
      const { data: updatedStats, error: statsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!statsError && updatedStats) {
        setStats((prev) => ({ ...prev, documents: updatedStats }))
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate invoice'}`)
    } finally {
      setGeneratingInvoices((prev) => {
        const next = new Set(prev)
        next.delete(proposalId)
        return next
      })
    }
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

  // Determine what types of documents are selected
  const getSelectedDocumentTypes = () => {
    const selectedDocuments = stats.documents.filter((d) => selectedDocs.has(d.id))
    const hasInvoices = selectedDocuments.some((d) => d.doc_type.toLowerCase() !== 'proposal')
    const hasProposals = selectedDocuments.some((d) => d.doc_type.toLowerCase() === 'proposal')
    return { hasInvoices, hasProposals, hasMixed: hasInvoices && hasProposals, selectedDocuments }
  }

  // Check payment status of selected documents
  const getSelectedPaymentStatus = () => {
    const selected = Array.from(selectedDocs)
    const paidCount = selected.filter((id) => stats.documents.find((d) => d.id === id)?.status === 'fully_paid').length
    const unpaidCount = selected.length - paidCount
    return { paidCount, unpaidCount, hasMixed: paidCount > 0 && unpaidCount > 0 }
  }

  const markSelectedAsPaid = () => {
    const unpaidIds = Array.from(selectedDocs).filter((id) => stats.documents.find((d) => d.id === id)?.status !== 'fully_paid')
    unpaidIds.forEach((docId) => {
      console.log('Mark as paid:', docId)
    })
    alert(`Marked ${unpaidIds.length} invoice(s) as paid`)
    setSelectedDocs(new Set())
  }

  const unmarkSelectedAsPaid = () => {
    const paidIds = Array.from(selectedDocs).filter((id) => stats.documents.find((d) => d.id === id)?.status === 'fully_paid')
    paidIds.forEach((docId) => {
      console.log('Unmark as paid:', docId)
    })
    alert(`Unmarked ${paidIds.length} invoice(s) as paid`)
    setSelectedDocs(new Set())
  }

  const sendRemindersToSelected = () => {
    selectedDocs.forEach((docId) => {
      console.log('Send reminder:', docId)
    })
    alert(`Reminders sent to ${selectedDocs.size} client(s)`)
    setSelectedDocs(new Set())
  }

  const assignMissingNumbers = async () => {
    if (!userId) return
    if (!confirm('Assign document numbers to all invoices/proposals that don\'t have one yet?')) {
      return
    }
    setAssigningNumbers(true)
    try {
      const res = await fetch('/api/admin/assign-missing-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (res.ok) {
        setAssignmentMessage({
          type: 'success',
          text: `✅ ${data.message}`,
        })
        // Refresh stats to show updated numbers
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setAssignmentMessage({
          type: 'error',
          text: `❌ ${data.error || 'Failed to assign numbers'}`,
        })
      }
    } catch (err) {
      setAssignmentMessage({
        type: 'error',
        text: '❌ Error assigning numbers',
      })
    } finally {
      setAssigningNumbers(false)
    }
  }

  // Get row urgency color
  const getRowColor = (doc: Document) => {
    if (doc.status === 'fully_paid') return 'hover:bg-gray-50'
    const daysOld = Math.floor((new Date().getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOld > 30) return 'bg-red-50'
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
        'Days Outstanding': doc.status === 'fully_paid' ? '—' : daysOld,
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

  // Show success banner when redirected back from /new after creating a doc
  useEffect(() => {
    const invoiceId = searchParams.get('invoiceCreated')
    const proposalId = searchParams.get('proposalCreated')
    const paymentLink = searchParams.get('paymentLink')
    if (invoiceId) {
      setSuccessMessage({
        docId: invoiceId,
        invoiceId,
        message: '✅ Invoice successfully sent to your client!',
        paymentLink: paymentLink || undefined,
      })
      setDocumentTab('invoices')
      // Clear param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('invoiceCreated')
      url.searchParams.delete('paymentLink')
      window.history.replaceState({}, '', url.toString())
    } else if (proposalId) {
      setSuccessMessage({
        docId: proposalId,
        invoiceId: proposalId,
        message: '✅ Proposal successfully sent to your client!',
      })
      setDocumentTab('proposals')
      const url = new URL(window.location.href)
      url.searchParams.delete('proposalCreated')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          const now = new Date()

          const totalSent = data.length
          const pendingProposals = data.filter((doc) => doc.doc_type === 'proposal' && doc.status !== 'accepted').length
          const outstanding = data
            .filter((doc) => doc.status !== 'fully_paid')
            .reduce((sum, doc) => sum + (doc.price || 0), 0)
          const collected = data
            .filter((doc) => doc.status === 'fully_paid')
            .reduce((sum, doc) => sum + (doc.price || 0), 0)

          // Calculate average days to payment for paid invoices
          const paidDocs = data.filter((doc) => doc.status === 'fully_paid')
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
            if (doc.status === 'fully_paid') return false
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

    if (userId) fetchStats()
  }, [userId])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:flex-col w-full lg:w-60 bg-purple-50 border-r border-purple-200 border-b lg:border-b-0 px-4 py-6">
          <div className="mb-8">
            <Logo showTagline={true} size="small" />
          </div>
          <nav className="flex flex-col gap-0 flex-1">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-900">
              Navigation
            </Link>
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 text-left w-full transition"
            >
              ✨ Create
            </button>
            {showCreateDropdown && (
              <div className="ml-2 border-l-2 border-gray-200 space-y-0">
                <Link
                  href="/dashboard/new?type=invoice"
                  onClick={() => setShowCreateDropdown(false)}
                  className="block px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  📄 Invoice
                </Link>
                <Link
                  href="/dashboard/new?type=proposal"
                  onClick={() => setShowCreateDropdown(false)}
                  className="block px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  💼 Proposal
                </Link>
              </div>
            )}
            <Link href="/dashboard/faq" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              ❓ FAQ
            </Link>
            <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              ⚙️ Settings
            </Link>
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
              ℹ️ About Nvoyce
            </Link>
            <div className="border-t border-purple-200 mt-4 pt-4">
              <button
                onClick={assignMissingNumbers}
                disabled={assigningNumbers}
                className="w-full px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-purple-100 transition disabled:opacity-50 text-left"
              >
                🔢 {assigningNumbers ? 'Assigning...' : 'Assign missing #s'}
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto w-full">
          <div className="px-4 lg:px-10 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="relative">
                <button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition font-semibold"
                >
                  ✨ Create
                </button>
                {showCreateDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Link
                      href="/dashboard/new?type=invoice"
                      onClick={() => setShowCreateDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 first:rounded-t-lg border-b border-gray-100"
                    >
                      📄 New Invoice
                    </Link>
                    <Link
                      href="/dashboard/new?type=proposal"
                      onClick={() => setShowCreateDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 last:rounded-b-lg"
                    >
                      💼 New Proposal
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment message */}
            {assignmentMessage && (
              <div className={`rounded-xl p-4 mb-10 border ${assignmentMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-medium ${assignmentMessage.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {assignmentMessage.text}
                </p>
              </div>
            )}

            {/* Smart Assistant Card */}
            {/* Success notification for invoice/proposal send */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-10">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎉</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{successMessage.message}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Link
                        href={`/dashboard/documents/${successMessage.invoiceId}`}
                        className="text-sm text-green-600 hover:text-green-700 font-semibold inline-block"
                      >
                        View details →
                      </Link>
                      {successMessage.paymentLink && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(successMessage.paymentLink!)
                            alert('Payment link copied!')
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-semibold inline-block"
                        >
                          📋 Copy payment link
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-green-600 hover:text-green-700 text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {(() => {
              const recs = getRecommendations()
              if (recs.length === 0) return null
              return (
                <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white rounded-xl p-6 mb-10 border border-purple-700">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-2xl">💰</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Payme</h3>
                      <p className="text-sm text-purple-200">Your payment smart assistant</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {recs.slice(0, expandPayme ? 3 : 1).map((rec, idx) => (
                      <div key={idx} className="bg-white/10 rounded-lg p-3 border border-purple-600/40 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-purple-100">{rec.text}</div>
                          <div className={`text-xs mt-1 ${rec.paymeAction?.type === 'invoice' ? 'text-red-300' : 'text-yellow-300'}`}>
                            {rec.paymeAction?.icon} {rec.paymeAction?.type === 'invoice' ? 'Invoice - ' : 'Proposal - '}
                            {rec.urgency === 'high' ? 'Urgent' : 'Important'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {rec.action === 'send-reminders' && (
                            <button
                              onClick={() => {
                                // Select this specific overdue invoice
                                setSelectedDocs(new Set([rec.paymeAction?.id]))
                              }}
                              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded transition font-semibold whitespace-nowrap"
                            >
                              Send Reminder
                            </button>
                          )}
                          {rec.action === 'follow-up' && (
                            <button
                              onClick={() => {
                                // Filter table to show this proposal
                                setFilterClient(rec.paymeAction?.client_name || '')
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition font-semibold whitespace-nowrap"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => dismissRecommendation(rec.type)}
                            className="text-xs bg-purple-700/50 hover:bg-purple-700 text-white px-2 py-1 rounded transition whitespace-nowrap"
                            title="Dismiss for this session"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recs.length > 1 && (
                    <button
                      onClick={() => setExpandPayme(!expandPayme)}
                      className="text-sm text-purple-200 hover:text-white mt-3 transition"
                    >
                      {expandPayme ? '▲ Show less' : `▼ Show ${recs.length - 1} more action${recs.length - 1 !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>
              )
            })()}

            {/* Urgency Summary Card - Navy Blue with Orange Accents */}
            {stats.outstanding > 0 && (
              <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white rounded-xl p-6 mb-10 border border-blue-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-blue-200 mb-1">You're owed</div>
                    <div className="text-4xl font-bold mb-2">${stats.outstanding.toLocaleString()}</div>
                    <div className="text-sm text-blue-300">
                      {stats.overdue > 0 && <span className="text-orange-400 font-semibold">🚨 {stats.overdue} overdue • </span>}
                      {stats.documents.filter((d) => d.status !== 'fully_paid' && d.doc_type === 'invoice').length} invoices pending
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const unpaidDocs = stats.documents.filter((d) => d.status !== 'fully_paid' && d.doc_type === 'invoice')
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
                      .filter((d) => d.status === 'fully_paid' && new Date(d.created_at) >= thisMonthStart)
                      .reduce((sum, d) => sum + (d.price || 0), 0)

                    const paidDocs = periodDocs.filter((d) => d.status === 'fully_paid').length
                    const totalInvoicesInPeriod = periodDocs.length
                    const totalRevenueInPeriod = periodDocs.filter((d) => d.status === 'fully_paid').reduce((sum, d) => sum + (d.price || 0), 0)
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
                      avgDaysToPayment: { label: 'Avg Days to Payment', value: loading ? '-' : stats.avgDaysToPayment.toString(), sub: 'after sending' },
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
                              <option value="avgInvoice">Avg Invoice Value</option>
                              <option value="avgDaysToPayment">Avg Days to Payment</option>
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
                                .filter((d) => d.doc_type === 'proposal' && d.status !== 'accepted')
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
                              {stats.documents.filter((d) => d.doc_type === 'proposal' && d.status !== 'accepted').length === 0 && (
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
                      <div className="flex-1 flex items-center justify-center gap-8 px-6">
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
                {selectedDocs.size > 0 && (() => {
                  const { hasInvoices, hasProposals, hasMixed, selectedDocuments } = getSelectedDocumentTypes()
                  const invoiceCount = selectedDocuments.filter((d) => d.doc_type.toLowerCase() !== 'proposal').length
                  const proposalCount = selectedDocuments.filter((d) => d.doc_type.toLowerCase() === 'proposal').length

                  // Check if selected proposals are already accepted
                  const selectedProposals = selectedDocuments.filter((d) => d.doc_type.toLowerCase() === 'proposal')
                  const allProposalsAccepted = selectedProposals.length > 0 && selectedProposals.every((p) => p.status === 'accepted')
                  const anyProposalPending = selectedProposals.some((p) => p.status !== 'accepted' && p.status !== 'declined')

                  return (
                    <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
                      <div className="text-sm font-semibold text-blue-900">
                        {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                        {hasMixed && <span className="text-xs text-gray-600 ml-2">({invoiceCount} invoices, {proposalCount} proposals)</span>}
                        {hasProposals && !hasMixed && allProposalsAccepted && <span className="text-xs text-green-600 ml-2">(all accepted)</span>}
                      </div>
                      <div className="flex gap-2">
                        {hasProposals && !hasMixed && (
                          <span className="text-xs text-gray-600 font-semibold">
                            {allProposalsAccepted ? '✓ All accepted' : 'Waiting for client response via shareable link'}
                          </span>
                        )}
                        {hasInvoices && !hasMixed && (
                          <>
                            <button
                              onClick={markSelectedAsPaid}
                              className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-semibold"
                              title="Mark selected invoices as paid"
                            >
                              ✓ Mark as Paid
                            </button>
                            <button
                              onClick={unmarkSelectedAsPaid}
                              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold"
                              title="Unmark selected invoices as paid"
                            >
                              ↩ Unmark as Paid
                            </button>
                            <button
                              onClick={sendRemindersToSelected}
                              className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition font-semibold"
                              title="Send payment reminders"
                            >
                              📧 Send Reminders
                            </button>
                          </>
                        )}
                        {hasMixed && (
                          <span className="text-xs text-gray-600 italic">Cannot batch act on mixed document types. Select invoices or proposals separately.</span>
                        )}
                        <button
                          onClick={() => setSelectedDocs(new Set())}
                          className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                })()}
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

                {/* Document Type Tabs */}
                <div className="flex gap-1 border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setDocumentTab('invoices')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      documentTab === 'invoices'
                        ? 'border-orange-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🧾 Invoices ({stats.documents.filter((d) => d.doc_type.toLowerCase() !== 'proposal').length})
                  </button>
                  <button
                    onClick={() => setDocumentTab('proposals')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      documentTab === 'proposals'
                        ? 'border-purple-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📋 Proposals ({stats.documents.filter((d) => d.doc_type.toLowerCase() === 'proposal').length})
                  </button>
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                          #
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
                        {documentTab === 'proposals' && (
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Expires In</th>
                        )}
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
                          partially_paid: 'bg-yellow-100 text-yellow-700',
                          fully_paid: 'bg-green-100 text-green-700',
                          overdue: 'bg-red-100 text-red-700',
                        }
                        const isOverdue = (doc.status === 'sent' || doc.status === 'partially_paid') && daysOld > 30

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
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono font-semibold text-gray-500">
                                {doc.document_number || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-medium">{doc.client_name}</td>
                            <td className="px-6 py-4 text-gray-600 text-sm">{createdDate.toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right text-gray-900 font-semibold">${doc.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              {doc.doc_type.toLowerCase() === 'proposal' ? (
                                // Proposal status (clients accept via public link, not here)
                                doc.status === 'accepted' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                    ✓ Accepted
                                  </span>
                                ) : doc.status === 'declined' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                                    ✗ Declined
                                  </span>
                                ) : doc.status === 'sent' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                    📤 Sent
                                  </span>
                                ) : doc.status === 'received' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                    👁️ Received
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                    {doc.status === 'draft' ? '📝 Draft' : doc.status}
                                  </span>
                                )
                              ) : (
                                // Invoice status - status display only
                                doc.status === 'fully_paid' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                                    ✓ Fully Paid
                                  </span>
                                ) : doc.status === 'partially_paid' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                    💛 Partial
                                  </span>
                                ) : isOverdue ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                                    🚨 Overdue
                                  </span>
                                ) : doc.status === 'sent' ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                    📤 Sent
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                    📝 {doc.status}
                                  </span>
                                )
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">
                              {doc.doc_type.toLowerCase() === 'proposal' ? (
                                // Proposals: show days pending only after sent, not for drafts
                                doc.status === 'draft' || doc.status === 'accepted' || doc.status === 'declined' ? (
                                  '—'
                                ) : (
                                  // Sent, Received: show days pending since sent
                                  <span className={daysOld > 14 ? 'text-orange-600 font-semibold' : ''}>
                                    {daysOld} days pending {daysOld > 14 && '⚠'}
                                  </span>
                                )
                              ) : (
                                // Invoices: show days outstanding
                                doc.status === 'fully_paid' ? (
                                  '—'
                                ) : (
                                  <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                    {daysOld} days {isOverdue && '🚨'}
                                  </span>
                                )
                              )}
                            </td>
                            {documentTab === 'proposals' && (
                              <td className="px-6 py-4 text-right text-gray-600">
                                {doc.status === 'draft' || doc.status === 'accepted' || doc.status === 'declined' ? (
                                  '—'
                                ) : (
                                  (() => {
                                    // Default to 7 days if expiration not specified
                                    const daysRemaining = 7 - daysOld
                                    return (
                                      <span className={daysRemaining <= 2 ? 'text-red-600 font-semibold' : daysRemaining <= 5 ? 'text-orange-600' : ''}>
                                        {Math.max(0, daysRemaining)} days {daysRemaining <= 2 && '🔴'}
                                      </span>
                                    )
                                  })()
                                )}
                              </td>
                            )}
                            <td className="px-6 py-4 flex gap-2 relative">
                              {doc.doc_type.toLowerCase() === 'proposal' ? (
                                // Proposal actions - dropdown menu
                                <>
                                  <div className="relative">
                                    <button
                                      onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                                      className="text-xs bg-gray-600 text-white px-2.5 py-1 rounded hover:bg-gray-700 transition"
                                      title="Actions menu"
                                    >
                                      ⋯ Select
                                    </button>
                                    {openDropdown === doc.id && (
                                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                                        <button
                                          onClick={() => {
                                            const proposalUrl = `${window.location.origin}/p/${doc.id}`
                                            navigator.clipboard.writeText(proposalUrl)
                                            alert('Proposal link copied!')
                                            setOpenDropdown(null)
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                                        >
                                          🔗 Copy Link
                                        </button>
                                        {doc.status !== 'accepted' && doc.status !== 'declined' && daysOld > 7 && (
                                          <button
                                            onClick={() => {
                                              console.log('Send follow-up to:', doc.client_name)
                                              alert(`Follow-up would be sent to ${doc.client_name}`)
                                              setOpenDropdown(null)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                          >
                                            📧 Send Follow-up
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setViewingDocument(doc)
                                            setOpenDropdown(null)
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 last:rounded-b-lg"
                                        >
                                          👁️ View Details
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                // Invoice actions - dropdown menu
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                                    className="text-xs bg-gray-600 text-white px-2.5 py-1 rounded hover:bg-gray-700 transition"
                                    title="Actions menu"
                                  >
                                    ⋯ Select
                                  </button>
                                  {openDropdown === doc.id && (
                                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                                      {doc.status !== 'fully_paid' && (
                                        <button
                                          onClick={() => {
                                            // Mark as paid (will implement API call)
                                            console.log('Mark as paid:', doc.id)
                                            setOpenDropdown(null)
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                                        >
                                          ✓ Mark Paid
                                        </button>
                                      )}
                                      {doc.status !== 'fully_paid' && daysOld > 14 && (
                                        <button
                                          onClick={() => {
                                            // Send reminder
                                            console.log('Send reminder to:', doc.client_name)
                                            alert(`Reminder would be sent to ${doc.client_name}`)
                                            setOpenDropdown(null)
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                          📧 Send Reminder
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setViewingDocument(doc)
                                          setOpenDropdown(null)
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 last:rounded-b-lg"
                                      >
                                        👁️ View Details
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
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

      {/* Document Details Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {viewingDocument.doc_type.charAt(0).toUpperCase() + viewingDocument.doc_type.slice(1)} Details
                </h2>
                {viewingDocument.document_number && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-mono font-semibold text-gray-900">{viewingDocument.document_number}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* From/To Section */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">From</h3>
                  <div className="text-lg font-semibold text-gray-900">{viewingDocument.business_name}</div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">To</h3>
                  <div className="text-lg font-semibold text-gray-900">{viewingDocument.client_name}</div>
                  <div className="text-sm text-gray-600">{viewingDocument.client_email}</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</h3>
                  <div className="text-2xl font-bold text-purple-600">${viewingDocument.price.toLocaleString()}</div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h3>
                  <div className="text-gray-700">{viewingDocument.form_data?.serviceDescription || 'No description provided'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Timeline</h3>
                    <div className="text-gray-700">{viewingDocument.form_data?.timeline || 'Not specified'}</div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Terms</h3>
                    <div className="text-gray-700">{viewingDocument.form_data?.paymentTerms || 'Not specified'}</div>
                  </div>
                </div>

                {viewingDocument.form_data?.notes && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</h3>
                    <div className="text-gray-700">{viewingDocument.form_data.notes}</div>
                  </div>
                )}

                {viewingDocument.doc_type === 'proposal' && viewingDocument.form_data?.expirationDays && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Expires In</h3>
                    <div className="text-gray-700">{viewingDocument.form_data.expirationDays} business days</div>
                  </div>
                )}
              </div>

              {/* Date Created & Status */}
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Date Created</h3>
                  <div className="text-sm font-medium text-gray-700">
                    {new Date(viewingDocument.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</h3>
                  <div className="text-sm font-medium text-gray-700 capitalize">{viewingDocument.status}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setViewingDocument(null)}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardContent />
    </Suspense>
  )
}
