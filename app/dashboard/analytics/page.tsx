'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface Document {
  id: string
  client_name: string
  doc_type: string
  price: number
  status: string
  created_at: string
  amount_paid?: number
  is_archived?: boolean
}

const ORANGE = '#e04e1a'
const PURPLE = '#7c3aed'
const GREEN = '#16a34a'
const YELLOW = '#ca8a04'
const RED = '#dc2626'
const BLUE = '#2563eb'

const STATUS_COLORS: Record<string, string> = {
  paid: GREEN,
  sent: BLUE,
  draft: '#9ca3af',
  accepted: GREEN,
  declined: RED,
  expired: YELLOW,
  archived: '#9ca3af',
}

type Range = '30d' | '90d' | '12m' | 'all'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function KpiCard({ label, value, sub, color = ORANGE }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-[#0d1b2a] tracking-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { userId } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('12m')

  useEffect(() => {
    if (!userId) return
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('id, client_name, doc_type, price, status, created_at, amount_paid, is_archived')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      setDocs(data || [])
      setLoading(false)
    }
    load()
  }, [userId])

  // Filter by range
  const filtered = docs.filter(d => {
    if (range === 'all') return true
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 365
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return new Date(d.created_at) >= cutoff
  })

  const paid = filtered.filter(d => d.status === 'paid')
  const sent = filtered.filter(d => ['sent', 'paid'].includes(d.status))
  const totalRevenue = paid.reduce((s, d) => s + (d.price || 0), 0)
  const collectionRate = sent.length > 0 ? Math.round((paid.length / sent.length) * 100) : 0
  const outstanding = filtered.filter(d => d.status === 'sent').reduce((s, d) => s + (d.price || 0), 0)

  // Monthly revenue + volume (last 12 months)
  const monthlyMap: Record<string, { revenue: number; invoices: number; proposals: number }> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    monthlyMap[key] = { revenue: 0, invoices: 0, proposals: 0 }
  }
  filtered.forEach(d => {
    const date = new Date(d.created_at)
    const key = date.toLocaleString('default', { month: 'short', year: '2-digit' })
    if (monthlyMap[key]) {
      if (d.status === 'paid') monthlyMap[key].revenue += d.price || 0
      if (d.doc_type === 'invoice') monthlyMap[key].invoices++
      else monthlyMap[key].proposals++
    }
  })
  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  // Top clients by revenue
  const clientMap: Record<string, number> = {}
  paid.forEach(d => {
    clientMap[d.client_name] = (clientMap[d.client_name] || 0) + (d.price || 0)
  })
  const topClients = Object.entries(clientMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, revenue]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, revenue }))

  // Status breakdown
  const statusMap: Record<string, number> = {}
  filtered.forEach(d => {
    statusMap[d.status] = (statusMap[d.status] || 0) + 1
  })
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  // Doc type split
  const invoiceCount = filtered.filter(d => d.doc_type === 'invoice').length
  const proposalCount = filtered.filter(d => d.doc_type === 'proposal').length

  const ranges: { label: string; value: Range }[] = [
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 12 months', value: '12m' },
    { label: 'All time', value: 'all' },
  ]

  return (
    <div className="flex h-screen bg-[#fafaf8] overflow-hidden">
      <Sidebar activePage="analytics" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <MobileNav activePage="analytics" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-[#0d1b2a] tracking-tight">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Revenue trends, client insights, and document performance</p>
              </div>
              {/* Range selector */}
              <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
                {ranges.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRange(r.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      range === r.value
                        ? 'bg-[#0d1b2a] text-white'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${paid.length} paid docs`} color={ORANGE} />
                  <KpiCard label="Outstanding" value={fmt(outstanding)} sub={`${filtered.filter(d => d.status === 'sent').length} awaiting payment`} color={BLUE} />
                  <KpiCard label="Collection Rate" value={`${collectionRate}%`} sub="paid / sent" color={collectionRate >= 70 ? GREEN : RED} />
                  <KpiCard label="Docs Created" value={String(filtered.length)} sub={`${invoiceCount} invoices · ${proposalCount} proposals`} color={PURPLE} />
                </div>

                {/* Revenue Trend */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-[#0d1b2a] mb-1">Revenue over time</h2>
                  <p className="text-xs text-gray-400 mb-5">Monthly paid invoice revenue</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} width={48} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e0d8' }} />
                      <Line type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3, fill: ORANGE }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume + Top Clients */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Monthly Volume */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-[#0d1b2a] mb-1">Document volume</h2>
                    <p className="text-xs text-gray-400 mb-5">Invoices vs proposals created per month</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={28} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e0d8' }} />
                        <Bar dataKey="invoices" name="Invoices" fill={ORANGE} radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="proposals" name="Proposals" fill={PURPLE} radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Clients */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-[#0d1b2a] mb-1">Top clients</h2>
                    <p className="text-xs text-gray-400 mb-5">By paid revenue</p>
                    {topClients.length === 0 ? (
                      <div className="flex items-center justify-center h-48 text-sm text-gray-400">No paid invoices yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e0d8' }} />
                          <Bar dataKey="revenue" fill={ORANGE} radius={[0, 4, 4, 0]} maxBarSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-[#0d1b2a] mb-1">Status breakdown</h2>
                  <p className="text-xs text-gray-400 mb-5">All documents by current status</p>
                  {statusData.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-400">No documents yet</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                            {statusData.map((entry, i) => (
                              <Cell key={i} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e0d8' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 flex-1">
                        {statusData.map(s => (
                          <div key={s.name} className="flex items-center gap-2 text-sm">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.name] || '#9ca3af' }} />
                            <span className="text-gray-600 capitalize">{s.name}</span>
                            <span className="font-semibold text-[#0d1b2a]">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
