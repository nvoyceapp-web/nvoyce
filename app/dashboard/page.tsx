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

  useEffect(() => {
    async function fetchStats() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, client_name, doc_type, price, status, created_at')
          .eq('user_id', userId)
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
  }, [userId])

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

            <div className="grid grid-cols-2 gap-5 mb-10">
              <div className="grid grid-cols-3 gap-5 col-span-2">
                {[
                  { label: 'Total Sent', value: loading ? '-' : stats.totalSent.toString(), sub: 'invoices & proposals' },
                  { label: 'Outstanding', value: loading ? '-' : `$${stats.outstanding.toLocaleString()}`, sub: 'awaiting payment' },
                  { label: 'Collected', value: loading ? '-' : `$${stats.collected.toLocaleString()}`, sub: 'all time' },
                ].map(({ label, value, sub }) => (
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
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Invoices & Proposals</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Days Outstanding</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.documents.map((doc) => {
                        const createdDate = new Date(doc.created_at)
                        const daysOld = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
                        const statusColors: Record<string, string> = {
                          draft: 'bg-gray-100 text-gray-700',
                          sent: 'bg-blue-100 text-blue-700',
                          paid: 'bg-green-100 text-green-700',
                          overdue: 'bg-red-100 text-red-700',
                        }

                        return (
                          <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4 text-gray-900 font-medium">{doc.client_name}</td>
                            <td className="px-6 py-4 text-gray-600 capitalize">{doc.doc_type}</td>
                            <td className="px-6 py-4 text-right text-gray-900 font-semibold">${doc.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[doc.status] || statusColors.draft}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600">{doc.status === 'paid' ? '—' : `${daysOld} days`}</td>
                            <td className="px-6 py-4">
                              <Link href={`/dashboard/documents/${doc.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-semibold">
                                View
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
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
