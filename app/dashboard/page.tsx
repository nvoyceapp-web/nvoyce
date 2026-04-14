'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getTopPaymeActions, PaymeAction } from '@/lib/payme-scoring'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'
import QRModal from '@/components/QRModal'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart } from 'recharts'

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
  is_archived?: boolean
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
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
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
  const [datePreset, setDatePreset] = useState('all')
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
  const createDropdownTimer = useRef<NodeJS.Timeout | null>(null)
  const [documentTab, setDocumentTab] = useState<'invoices' | 'proposals'>('invoices')
  const [generatingInvoices, setGeneratingInvoices] = useState<Set<string>>(new Set())
  const [successMessage, setSuccessMessage] = useState<{ docId: string; invoiceId: string; message: string } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const actionDropdownTimer = useRef<NodeJS.Timeout | null>(null)
  const [qrModal, setQrModal] = useState<{ url: string; label: string } | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [assigningNumbers, setAssigningNumbers] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [bulkActionNotice, setBulkActionNotice] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  // Payment + proposal notification state
  const [paymentToasts, setPaymentToasts] = useState<Array<{ toastId: string; clientName: string; amount: number; isPartial: boolean; type: 'payment' | 'proposal_accepted' }>>([])
  const [newPaymentCount, setNewPaymentCount] = useState(0)
  const prevStatusMapRef = useRef<Map<string, string>>(new Map())
  const isFirstFetchRef = useRef(true)
  const [pollTrigger, setPollTrigger] = useState(0)

  const sidebarRef = useRef<SidebarHandle>(null)

  const dismissToast = (toastId: string) => {
    setPaymentToasts(prev => {
      const remaining = prev.filter(t => t.toastId !== toastId)
      // If no toasts left after dismissal, clear the green dot too
      if (remaining.length === 0) setNewPaymentCount(0)
      return remaining
    })
  }

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
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset)
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setDateFrom(fmt(now)); setDateTo(fmt(now))
    } else if (preset === 'this_week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      setDateFrom(fmt(start)); setDateTo(fmt(now))
    } else if (preset === 'this_month') {
      setDateFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1))); setDateTo(fmt(now))
    } else if (preset === 'last_30') {
      setDateFrom(fmt(new Date(now.getTime() - 30 * 864e5))); setDateTo(fmt(now))
    } else if (preset === 'last_90') {
      setDateFrom(fmt(new Date(now.getTime() - 90 * 864e5))); setDateTo(fmt(now))
    } else if (preset === 'this_year') {
      setDateFrom(fmt(new Date(now.getFullYear(), 0, 1))); setDateTo(fmt(now))
    } else if (preset === 'all' || preset === 'custom') {
      if (preset === 'all') { setDateFrom(''); setDateTo('') }
    }
  }

  const filteredDocuments = stats.documents
    .filter((doc) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || [
        doc.client_name,
        doc.document_number ?? '',
        doc.status,
        doc.doc_type,
        doc.client_email ?? '',
        doc.business_name ?? '',
        doc.price?.toString() ?? '',
      ].some((field) => field.toLowerCase().includes(q))
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
    const selectedDocuments = stats.documents.filter((d) => selectedDocs.has(d.id))
    // Eligible: invoices not fully_paid/draft; proposals not accepted/declined/expired/draft
    const eligible = selectedDocuments.filter((d) => {
      if (d.doc_type.toLowerCase() === 'proposal') {
        return !['accepted', 'declined', 'expired', 'draft'].includes(d.status)
      } else {
        return !['fully_paid', 'draft'].includes(d.status)
      }
    })
    const skipped = selectedDocuments.length - eligible.length

    if (eligible.length === 0) {
      setBulkActionNotice({ type: 'warning', text: 'No eligible documents for reminders. Only unpaid/pending documents can receive reminders.' })
      setTimeout(() => setBulkActionNotice(null), 5000)
      return
    }

    // TODO: wire to actual email API when ready
    eligible.forEach((doc) => console.log('Send reminder:', doc.id))

    let message = `📧 Reminders sent to ${eligible.length} document${eligible.length !== 1 ? 's' : ''}.`
    if (skipped > 0) message += ` ${skipped} skipped — not eligible (already paid, accepted, or draft).`

    setBulkActionNotice({ type: 'success', text: message })
    setTimeout(() => setBulkActionNotice(null), 6000)
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

  const deleteDocument = async (docId: string, docType: string) => {
    if (!confirm(`Delete this ${docType}? This action cannot be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: [docId] }),
      })
      const data = await res.json()
      if (res.ok) {
        // Remove from local state
        setStats((prev) => ({
          ...prev,
          documents: prev.documents.filter((d) => d.id !== docId),
        }))
        setOpenDropdown(null)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert('Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  const deleteSelectedDrafts = async () => {
    const selectedDocuments = stats.documents.filter((d) => selectedDocs.has(d.id))
    const draftCount = selectedDocuments.filter((d) => d.status === 'draft').length

    if (draftCount === 0) {
      alert('No drafts selected')
      return
    }

    if (!confirm(`Delete ${draftCount} draft(s)? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const draftIds = selectedDocuments.filter((d) => d.status === 'draft').map((d) => d.id)
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: draftIds }),
      })
      const data = await res.json()
      if (res.ok) {
        // Remove from local state
        setStats((prev) => ({
          ...prev,
          documents: prev.documents.filter((d) => !draftIds.includes(d.id)),
        }))
        setSelectedDocs(new Set())
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert('Failed to delete drafts')
    } finally {
      setDeleting(false)
    }
  }

  const bulkArchiveSelected = async () => {
    const selectedDocuments = stats.documents.filter((d) => selectedDocs.has(d.id))
    // Eligible: invoices that are fully_paid, proposals that are accepted — and not already archived
    const eligible = selectedDocuments.filter((d) => {
      if (d.is_archived) return false
      if (d.doc_type.toLowerCase() === 'proposal') return d.status === 'accepted'
      return d.status === 'fully_paid'
    })
    const skipped = selectedDocuments.length - eligible.length

    if (eligible.length === 0) {
      setBulkActionNotice({ type: 'warning', text: 'No eligible documents to archive. Only fully paid invoices and accepted proposals can be archived.' })
      setTimeout(() => setBulkActionNotice(null), 5000)
      return
    }

    setArchiving(true)
    try {
      await Promise.all(
        eligible.map((doc) =>
          fetch('/api/documents/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id, action: 'archive' }),
          })
        )
      )

      // Refetch documents
      const { data: updated } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false })
      if (updated) setStats((prev) => ({ ...prev, documents: updated }))

      let message = `🗂 Archived ${eligible.length} document${eligible.length !== 1 ? 's' : ''}.`
      if (skipped > 0) message += ` ${skipped} skipped — not eligible (must be fully paid invoice or sent proposal).`

      setBulkActionNotice({ type: 'success', text: message })
      setTimeout(() => setBulkActionNotice(null), 6000)
      setSelectedDocs(new Set())
    } catch (err) {
      setBulkActionNotice({ type: 'error', text: '❌ Failed to archive some documents. Please try again.' })
      setTimeout(() => setBulkActionNotice(null), 5000)
    } finally {
      setArchiving(false)
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
    if (invoiceId || proposalId) {
      // Trigger a refetch of stats to show the newly sent document
      const refetchStats = async () => {
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
          if (!error && data) {
            setStats((prev) => ({ ...prev, documents: data }))
          }
        } catch (err) {
          console.error('Error refetching stats:', err)
        }
      }
      refetchStats()
    }
    if (invoiceId) {
      setSuccessMessage({
        docId: invoiceId,
        invoiceId,
        message: '✅ Invoice successfully sent to your client!',
      })
      setDocumentTab('invoices')
      // Clear param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('invoiceCreated')
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
  }, [searchParams, userId])

  useEffect(() => {
    if (!userId) return
    async function fetchTrial() {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end, stripe_subscription_id')
        .eq('user_id', userId)
        .single()
      if (data?.plan === 'pro' && !data?.stripe_subscription_id && data?.current_period_end) {
        const daysLeft = Math.ceil(
          (new Date(data.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        setTrialDaysLeft(daysLeft > 0 ? daysLeft : 0)
      }
    }
    fetchTrial()
  }, [userId])

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .eq('is_archived', showArchived)
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

          // Detect new payments + proposal acceptances since last fetch
          if (!isFirstFetchRef.current) {
            const newToasts: typeof paymentToasts = []
            data.forEach(doc => {
              const prevStatus = prevStatusMapRef.current.get(doc.id)
              const isNewPayment =
                (doc.status === 'fully_paid' || doc.status === 'partially_paid') &&
                prevStatus !== undefined &&
                prevStatus !== doc.status
              const isNewAcceptance =
                doc.doc_type === 'proposal' &&
                doc.status === 'accepted' &&
                prevStatus !== undefined &&
                prevStatus !== 'accepted'
              if (isNewPayment) {
                newToasts.push({
                  toastId: `${doc.id}-${Date.now()}`,
                  clientName: doc.client_name,
                  amount: doc.amount_paid || doc.price,
                  isPartial: doc.status === 'partially_paid',
                  type: 'payment',
                })
              }
              if (isNewAcceptance) {
                newToasts.push({
                  toastId: `${doc.id}-accepted-${Date.now()}`,
                  clientName: doc.client_name,
                  amount: doc.price,
                  isPartial: false,
                  type: 'proposal_accepted',
                })
              }
            })
            if (newToasts.length > 0) {
              setPaymentToasts(prev => [...prev, ...newToasts])
              setNewPaymentCount(prev => prev + newToasts.length)
              // Auto-dismiss each toast after 6 seconds
              newToasts.forEach(t => {
                setTimeout(() => dismissToast(t.toastId), 6000)
              })
            }
          }
          // Update status snapshot
          const newMap = new Map<string, string>()
          data.forEach(doc => newMap.set(doc.id, doc.status))
          prevStatusMapRef.current = newMap
          isFirstFetchRef.current = false

          setStats({ totalSent, outstanding, collected, pendingProposals, avgDaysToPayment, overdue, documents: data })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchStats()
  }, [userId, showArchived, pollTrigger])

  // Poll every 15 seconds for new payments
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => setPollTrigger(t => t + 1), 15000)
    return () => clearInterval(interval)
  }, [userId])

  const canArchive = (doc: Document) => {
    if (doc.is_archived) return true // can always unarchive
    if (doc.doc_type === 'invoice') return doc.status === 'fully_paid'
    if (doc.doc_type === 'proposal') return doc.status === 'accepted'
    return false
  }

  const archiveDocument = async (docId: string, isCurrentlyArchived: boolean) => {
    setArchiving(true)
    try {
      const res = await fetch('/api/documents/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, action: isCurrentlyArchived ? 'unarchive' : 'archive' }),
      })
      const data = await res.json()
      if (data.success) {
        // Refetch to update the list
        const { data: updated } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .eq('is_archived', showArchived)
          .order('created_at', { ascending: false })
        if (updated) setStats((prev) => ({ ...prev, documents: updated }))
      }
    } catch (err) {
      console.error('Archive error:', err)
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="hidden lg:block">
        <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="dashboard" />

        <main className="flex-1 overflow-auto w-full">
          {/* Trial countdown banner */}
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a2f45] text-white px-4 py-2.5 flex items-center justify-between text-sm">
              <span>
                🎉 You're on a <span className="font-semibold">7-day Pro trial</span> —{' '}
                <span className="text-orange-400 font-semibold">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</span>
              </span>
              <a href="/dashboard/settings" className="text-orange-400 font-semibold hover:text-orange-300 transition">
                Upgrade to keep Pro →
              </a>
            </div>
          )}
          {trialDaysLeft === 0 && (
            <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="font-semibold">Your Pro trial has ended — you're now on the Free plan (3 docs/month)</span>
              <a href="/dashboard/settings" className="underline font-semibold hover:text-orange-100 transition">
                Upgrade now →
              </a>
            </div>
          )}
          <MobileNav activePage="dashboard" />
          <div className="px-4 lg:px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold font-display text-gray-900">Dashboard</h1>
              <div
                className="relative"
                onMouseEnter={() => { if (createDropdownTimer.current) clearTimeout(createDropdownTimer.current) }}
                onMouseLeave={() => { createDropdownTimer.current = setTimeout(() => setShowCreateDropdown(false), 150) }}
              >
                <button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-orange-500">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create
                </button>
                {showCreateDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Link
                      href="/dashboard/new?type=invoice"
                      onClick={() => setShowCreateDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 first:rounded-t-lg border-b border-gray-100"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Invoice
                      </span>
                    </Link>
                    <Link
                      href="/dashboard/new?type=proposal"
                      onClick={() => setShowCreateDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 last:rounded-b-lg"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                          <line x1="12" y1="12" x2="12" y2="16"/>
                          <line x1="10" y1="14" x2="14" y2="14"/>
                        </svg>
                        Proposal
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Payme — action recommendations, shown prominently below header */}
            {(() => {
              const recs = getRecommendations()
              if (recs.length === 0) return null
              const hasUrgent = recs.some(r => r.urgency === 'high')
              return (
                <div className={`rounded-xl overflow-hidden mb-6 border ${hasUrgent ? 'border-orange-300' : 'border-[#1a2f45]'}`}>
                  {/* Header */}
                  <button
                    onClick={() => setExpandPayme(!expandPayme)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-white transition ${hasUrgent ? 'bg-gradient-to-r from-[#0d1b2a] to-[#1a2f45]' : 'bg-gradient-to-r from-[#0d1b2a] to-[#1a2f45]'} hover:opacity-90`}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span className="font-semibold text-sm tracking-wide">Payme</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasUrgent ? 'bg-orange-500/30 text-orange-300' : 'bg-white/10 text-gray-300'}`}>
                        {recs.length} action{recs.length !== 1 ? 's' : ''} waiting
                      </span>
                      {/* Top action preview when collapsed */}
                      {!expandPayme && (
                        <span className="text-xs text-gray-400 hidden sm:inline truncate max-w-xs">
                          — {recs[0].text}
                        </span>
                      )}
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandPayme ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Body */}
                  {expandPayme && (
                    <div className="bg-[#0d1b2a] px-5 pb-5 pt-3 space-y-2 border-t border-white/10">
                      {recs.map((rec, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3.5 border border-white/10 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white">{rec.text}</div>
                            <div className={`text-xs mt-1 font-medium ${rec.urgency === 'high' ? 'text-orange-400' : 'text-gray-400'}`}>
                              {rec.paymeAction?.type === 'invoice' ? 'Invoice' : 'Proposal'} · {rec.urgency === 'high' ? 'Urgent' : 'Heads up'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {rec.action === 'send-reminders' && (
                              <button
                                onClick={() => setSelectedDocs(new Set([rec.paymeAction?.id]))}
                                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition font-semibold"
                              >
                                Remind
                              </button>
                            )}
                            {rec.action === 'follow-up' && (
                              <button
                                onClick={() => setFilterClient(rec.paymeAction?.client_name || '')}
                                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition font-semibold"
                              >
                                Review
                              </button>
                            )}
                            <button
                              onClick={() => dismissRecommendation(rec.type)}
                              className="text-gray-500 hover:text-gray-300 transition p-1"
                              title="Dismiss"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Assignment message */}
            {assignmentMessage && (
              <div className={`rounded-xl p-4 mb-10 border ${assignmentMessage.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-medium ${assignmentMessage.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {assignmentMessage.text}
                </p>
              </div>
            )}

            {/* Bulk action notice (skip/success toast) */}
            {bulkActionNotice && (
              <div className={`rounded-xl p-4 mb-6 border flex items-start gap-3 ${
                bulkActionNotice.type === 'success' ? 'bg-green-50 border-green-200' :
                bulkActionNotice.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-medium flex-1 ${
                  bulkActionNotice.type === 'success' ? 'text-green-900' :
                  bulkActionNotice.type === 'warning' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  {bulkActionNotice.text}
                </p>
                <button
                  onClick={() => setBulkActionNotice(null)}
                  className={`text-lg ${bulkActionNotice.type === 'success' ? 'text-green-600' : bulkActionNotice.type === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}
                >
                  ✕
                </button>
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

            {/* Urgency Summary Card - Neutral, matching Overview card style */}
            {stats.outstanding > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 relative"
                onClick={() => setNewPaymentCount(0)}
              >
                {newPaymentCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md cursor-pointer z-10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    {newPaymentCount} new
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex-1 mr-4">
                    <div className="text-sm text-gray-500 mb-1">You're owed</div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">${stats.outstanding.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      {stats.overdue > 0 && <span className="text-orange-500 font-semibold">🚨 {stats.overdue} overdue • </span>}
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
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                            ⏰ Oldest unpaid
                          </div>
                          <div className="text-3xl font-bold text-orange-500">{daysOld} days</div>
                          <div className="text-xs text-gray-700 mt-2 font-medium">{oldest.client_name}</div>
                          <div className="text-xs text-gray-500 mt-1">${oldest.price.toLocaleString()} outstanding</div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ── Metrics strip — full width, 2 rows of 3 ── */}
            {(() => {
              const dateFrom = getDateRange()
              const periodDocs = stats.documents.filter((d) => !dateFrom || new Date(d.created_at) >= dateFrom)
              const paidDocs = periodDocs.filter((d) => d.status === 'fully_paid').length
              const totalInPeriod = periodDocs.length
              const revenueInPeriod = periodDocs.filter((d) => d.status === 'fully_paid').reduce((s, d) => s + (d.price || 0), 0)
              const uniqueClients = new Set(stats.documents.map((d) => d.client_name)).size
              const collectionRate = totalInPeriod > 0 ? ((paidDocs / totalInPeriod) * 100).toFixed(0) : 0
              const avgInvoiceValue = totalInPeriod > 0 ? Math.round(revenueInPeriod / totalInPeriod) : 0

              const metrics = [
                { label: 'Period Revenue', value: loading ? '—' : `$${revenueInPeriod.toLocaleString()}`, sub: 'collected' },
                { label: 'Total Sent', value: loading ? '—' : stats.totalSent.toString(), sub: 'invoices & proposals' },
                { label: 'Collection Rate', value: loading ? '—' : `${collectionRate}%`, sub: 'of invoices paid' },
                { label: 'Avg Invoice Value', value: loading ? '—' : `$${avgInvoiceValue.toLocaleString()}`, sub: 'per invoice' },
                { label: 'Avg Days to Payment', value: loading ? '—' : stats.avgDaysToPayment.toString(), sub: 'after sending' },
                { label: 'Clients', value: loading ? '—' : uniqueClients.toString(), sub: 'unique clients' },
              ]

              return (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Overview</h3>
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
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                    {metrics.map(({ label, value, sub }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-1 leading-tight">{label}</div>
                        <div className="text-xl font-bold text-gray-900">{value}</div>
                        <div className="text-xs text-gray-400 mt-1">{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Charts row — 3 equal columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

              {/* 1. Revenue Trend — ComposedChart */}
              {(() => {
                const chartData = getChartData()
                if (chartData.length === 0) return null
                const revenues = chartData.map((d) => d.revenue)
                const minRev = Math.min(...revenues)
                const maxRev = Math.max(...revenues)
                const pad = (maxRev - minRev) * 0.2 || maxRev * 0.1
                const yMin = Math.max(0, Math.floor((minRev - pad) / 100) * 100)
                const yMax = Math.ceil((maxRev + pad) / 100) * 100
                const fmtY = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                return (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col h-72">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
                        <p className="text-xs text-gray-400">collected by month</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData.slice(-6)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[yMin, yMax]} tickFormatter={fmtY} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={46} />
                          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                          <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} strokeDasharray="4 2" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })()}

              {/* 2. Invoice Status — Recharts donut */}
              {(() => {
                const { paid, pending, overdue, total } = getStatusBreakdown()
                if (total === 0) return null
                const data = [
                  { name: 'Paid', value: paid, color: '#10b981' },
                  { name: 'Pending', value: pending, color: '#f59e0b' },
                  { name: 'Overdue', value: overdue, color: '#ef4444' },
                ]
                return (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col h-72">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Status</h3>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius="55%"
                              outerRadius="80%"
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3 flex-shrink-0">
                        <div className="text-xs text-gray-400 font-medium">{total} total</div>
                        {data.map(({ name, value, color }) => (
                          <div key={name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{value} {name}</div>
                              <div className="text-xs text-gray-400">{total > 0 ? ((value / total) * 100).toFixed(0) : 0}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 3. Top Clients — horizontal BarChart */}
              {(() => {
                const topClients = getTopClients()
                if (topClients.length === 0) return null
                const data = topClients.map((c) => ({ name: c.name.split(' ')[0], fullName: c.name, revenue: c.revenue }))
                return (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col h-72">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Top Clients</h3>
                      <p className="text-xs text-gray-400">by total billed</p>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#374151' }}
                            axisLine={false}
                            tickLine={false}
                            width={56}
                          />
                          <Tooltip
                            formatter={(v: number, _: any, props: any) => [`$${v.toLocaleString()}`, props.payload.fullName]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                          />
                          <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })()}

            </div>

            {stats.documents.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {selectedDocs.size > 0 && (() => {
                  const { hasInvoices, hasProposals, hasMixed, selectedDocuments } = getSelectedDocumentTypes()
                  const invoiceCount = selectedDocuments.filter((d) => d.doc_type.toLowerCase() !== 'proposal').length
                  const proposalCount = selectedDocuments.filter((d) => d.doc_type.toLowerCase() === 'proposal').length

                  // Eligible for reminders: invoices not fully_paid/draft; proposals not accepted/declined/expired/draft
                  const reminderEligible = selectedDocuments.filter((d) => {
                    if (d.doc_type.toLowerCase() === 'proposal') {
                      return !['accepted', 'declined', 'expired', 'draft'].includes(d.status)
                    } else {
                      return !['fully_paid', 'draft'].includes(d.status)
                    }
                  })
                  // Eligible for archive: fully_paid invoices, accepted proposals, not already archived
                  const archiveEligible = selectedDocuments.filter((d) => {
                    if (d.is_archived) return false
                    if (d.doc_type.toLowerCase() === 'proposal') return d.status === 'accepted'
                    return d.status === 'fully_paid'
                  })
                  const draftCount = selectedDocuments.filter((d) => d.status === 'draft').length

                  const reminderLabel = reminderEligible.length < selectedDocuments.length && reminderEligible.length > 0
                    ? `📧 Send Reminders (${reminderEligible.length} of ${selectedDocuments.length})`
                    : `📧 Send Reminders (${reminderEligible.length})`
                  const archiveLabel = archiveEligible.length < selectedDocuments.length && archiveEligible.length > 0
                    ? `🗂 Archive (${archiveEligible.length} of ${selectedDocuments.length})`
                    : `🗂 Archive (${archiveEligible.length})`

                  return (
                    <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm font-semibold text-blue-900">
                        {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                        {hasMixed && <span className="text-xs text-gray-500 ml-2">({invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}, {proposalCount} proposal{proposalCount !== 1 ? 's' : ''})</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        {reminderEligible.length > 0 && (
                          <button
                            onClick={sendRemindersToSelected}
                            className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition font-semibold"
                            title="Send reminders to eligible documents only"
                          >
                            {reminderLabel}
                          </button>
                        )}
                        {archiveEligible.length > 0 && (
                          <button
                            onClick={bulkArchiveSelected}
                            disabled={archiving}
                            className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition font-semibold disabled:opacity-50"
                            title="Archive eligible documents only (fully paid invoices, sent proposals)"
                          >
                            {archiveLabel}
                          </button>
                        )}
                        {draftCount > 0 && (
                          <button
                            onClick={deleteSelectedDrafts}
                            disabled={deleting}
                            className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                            title={`Delete ${draftCount} draft(s)`}
                          >
                            🗑️ Delete {draftCount} Draft{draftCount !== 1 ? 's' : ''}
                          </button>
                        )}
                        {reminderEligible.length === 0 && archiveEligible.length === 0 && draftCount === 0 && (
                          <span className="text-xs text-gray-500 italic">No bulk actions available for these documents</span>
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
                    <h2 className="text-xl font-bold font-display text-gray-900">Invoices & Proposals</h2>
                    <button
                      onClick={exportToExcel}
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition"
                    >
                      ⬇ Export CSV
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black flex-1 min-w-32"
                    />
                    <select
                      value={filterClient}
                      onChange={(e) => setFilterClient(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black flex-1 min-w-32 bg-white"
                    >
                      <option value="">All clients</option>
                      {uniqueClients.map((client) => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                    <select
                      value={datePreset}
                      onChange={(e) => applyDatePreset(e.target.value)}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black flex-1 min-w-36 bg-white"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="this_week">This week</option>
                      <option value="this_month">This month</option>
                      <option value="last_30">Last 30 days</option>
                      <option value="last_90">Last 90 days</option>
                      <option value="this_year">Year to date (YTD)</option>
                      <option value="custom">Custom range</option>
                    </select>
                    {/* Custom range pickers — only visible when custom is selected */}
                    {datePreset === 'custom' && (
                      <>
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
                      </>
                    )}
                  </div>

                  {/* Clear filters */}
                  {(searchQuery || filterClient || dateFrom || dateTo) && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSearchQuery(''); setFilterClient(''); setDateFrom(''); setDateTo(''); setDatePreset('all') }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                      >
                        ✕ Clear filters
                      </button>
                      {filteredDocuments.length !== stats.documents.length && (
                        <span className="text-xs text-gray-400">
                          Showing {filteredDocuments.length} of {stats.documents.length} documents
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Document Type Tabs + Archive Toggle */}
                <div className="flex items-center justify-between border-b border-gray-200 mb-4">
                  <div className="flex gap-1">
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
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition mb-1 ${
                      showArchived
                        ? 'bg-gray-100 text-gray-900 border-gray-400 font-semibold'
                        : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    🗂 {showArchived ? '← Back to Active' : 'View Archived'}
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
                        const daysOld = Math.max(0, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
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
                                  <div
                                    className="relative"
                                    onMouseEnter={() => { if (actionDropdownTimer.current) clearTimeout(actionDropdownTimer.current) }}
                                    onMouseLeave={() => { actionDropdownTimer.current = setTimeout(() => setOpenDropdown(null), 150) }}
                                  >
                                    <button
                                      onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition"
                                      title="Actions menu"
                                    >
                                      ⋯ Actions
                                    </button>
                                    {openDropdown === doc.id && (
                                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                                        {doc.status !== 'draft' && (
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
                                        )}
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
                                          className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                                        >
                                          👁️ View Details
                                        </button>
                                        {canArchive(doc) && (
                                          <button
                                            onClick={() => {
                                              archiveDocument(doc.id, doc.is_archived || false)
                                              setOpenDropdown(null)
                                            }}
                                            disabled={archiving}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                          >
                                            🗂 {doc.is_archived ? 'Unarchive' : 'Archive'}
                                          </button>
                                        )}
                                        {doc.status === 'draft' && (
                                          <button
                                            onClick={() => {
                                              deleteDocument(doc.id, doc.doc_type)
                                              setOpenDropdown(null)
                                            }}
                                            disabled={deleting}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg disabled:opacity-50"
                                          >
                                            🗑️ Delete Draft
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                // Invoice actions - dropdown menu
                                <div
                                  className="relative"
                                  onMouseEnter={() => { if (actionDropdownTimer.current) clearTimeout(actionDropdownTimer.current) }}
                                  onMouseLeave={() => { actionDropdownTimer.current = setTimeout(() => setOpenDropdown(null), 150) }}
                                >
                                  <button
                                    onClick={() => setOpenDropdown(openDropdown === doc.id ? null : doc.id)}
                                    className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition"
                                    title="Actions menu"
                                  >
                                    ⋯ Actions
                                  </button>
                                  {openDropdown === doc.id && (
                                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                                      {doc.stripe_payment_link && doc.status !== 'draft' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(doc.stripe_payment_link!)
                                              alert('Payment link copied!')
                                              setOpenDropdown(null)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                                          >
                                            🔗 Copy Payment Link
                                          </button>
                                          <button
                                            onClick={() => {
                                              setQrModal({ url: doc.stripe_payment_link!, label: `${doc.client_name} — Invoice` })
                                              setOpenDropdown(null)
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                          >
                                            <span className="flex items-center gap-2">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                                <rect x="3" y="14" width="7" height="7"/>
                                                <rect x="14" y="14" width="3" height="3"/>
                                              </svg>
                                              Show QR Code
                                            </span>
                                          </button>
                                        </>
                                      )}
                                      {doc.status !== 'fully_paid' && (
                                        <button
                                          onClick={async () => {
                                            setOpenDropdown(null)
                                            try {
                                              const res = await fetch('/api/documents/status', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ documentId: doc.id, status: 'fully_paid' }),
                                              })
                                              const data = await res.json()
                                              if (data.success) {
                                                setStats((prev) => ({
                                                  ...prev,
                                                  documents: prev.documents.map((d) =>
                                                    d.id === doc.id ? { ...d, status: 'fully_paid' } : d
                                                  ),
                                                }))
                                              } else {
                                                alert(`Error: ${data.error}`)
                                              }
                                            } catch (err) {
                                              alert('Failed to mark as paid')
                                            }
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-gray-50"
                                        >
                                          ✓ Mark Paid
                                        </button>
                                      )}
                                      {doc.status !== 'fully_paid' && daysOld > 14 && (
                                        <button
                                          onClick={() => {
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
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                                      >
                                        👁️ View Details
                                      </button>
                                      {canArchive(doc) && (
                                        <button
                                          onClick={() => {
                                            archiveDocument(doc.id, doc.is_archived || false)
                                            setOpenDropdown(null)
                                          }}
                                          disabled={archiving}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                          🗂 {doc.is_archived ? 'Unarchive' : 'Archive'}
                                        </button>
                                      )}
                                      {doc.status === 'draft' && (
                                        <button
                                          onClick={() => {
                                            deleteDocument(doc.id, doc.doc_type)
                                            setOpenDropdown(null)
                                          }}
                                          disabled={deleting}
                                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg disabled:opacity-50"
                                        >
                                          🗑️ Delete Draft
                                        </button>
                                      )}
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
                          <td colSpan={documentTab === 'proposals' ? 9 : 8} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="text-4xl">🔍</div>
                              <div className="text-gray-700 font-semibold text-sm">No {documentTab} match your filters</div>
                              <div className="text-gray-400 text-xs">Try adjusting your search or date range</div>
                              {(searchQuery || filterClient || dateFrom || dateTo) && (
                                <button
                                  onClick={() => { setSearchQuery(''); setFilterClient(''); setDateFrom(''); setDateTo(''); setDatePreset('all') }}
                                  className="mt-1 text-xs text-orange-600 hover:text-orange-700 font-semibold border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                                >
                                  ✕ Clear filters
                                </button>
                              )}
                            </div>
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

      {/* QR Code Modal */}
      {qrModal && (
        <QRModal
          url={qrModal.url}
          label={qrModal.label}
          onClose={() => setQrModal(null)}
        />
      )}

      {/* Payment Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {paymentToasts.map(toast => {
          const isProposal = toast.type === 'proposal_accepted'
          const dotColor = isProposal ? 'bg-purple-400' : toast.isPartial ? 'bg-yellow-400' : 'bg-green-400'
          const dotSolid = isProposal ? 'bg-purple-500' : toast.isPartial ? 'bg-yellow-500' : 'bg-green-500'
          const iconBg = isProposal ? 'bg-purple-100' : toast.isPartial ? 'bg-yellow-100' : 'bg-green-100'
          const icon = isProposal ? '🎉' : toast.isPartial ? '💛' : '💰'
          const title = isProposal ? 'Proposal accepted!' : toast.isPartial ? 'Partial payment received' : 'Payment received!'
          const subtitle = isProposal
            ? `${toast.clientName} accepted for $${toast.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : `$${toast.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${toast.clientName}`
          return (
            <div
              key={toast.toastId}
              className="pointer-events-auto flex items-center gap-4 bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-4 min-w-[300px] max-w-sm animate-fade-in"
              style={{ animation: 'slideInRight 0.3s ease-out' }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <span className="text-lg">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs truncate">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotSolid}`} />
                </span>
                <button
                  onClick={() => dismissToast(toast.toastId)}
                  className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-1"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
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
