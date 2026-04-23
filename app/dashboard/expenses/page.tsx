'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'
import { EXPENSE_CATEGORIES, type Expense } from '@/lib/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  Software:    'bg-blue-50 text-blue-700',
  Hardware:    'bg-indigo-50 text-indigo-700',
  Marketing:   'bg-pink-50 text-pink-700',
  Travel:      'bg-yellow-50 text-yellow-700',
  Meals:       'bg-orange-50 text-orange-700',
  Freelancers: 'bg-purple-50 text-purple-700',
  Office:      'bg-teal-50 text-teal-700',
  Education:   'bg-green-50 text-green-700',
  Other:       'bg-gray-100 text-gray-600',
}

const BLANK_FORM = {
  description: '',
  amount: '',
  category: 'Other' as string,
  client_name: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function ExpensesPage() {
  const { userId } = useAuth()
  const sidebarRef = useRef<SidebarHandle>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!userId) return
    fetchExpenses()
  }, [userId])

  async function fetchExpenses() {
    setLoading(true)
    const res = await fetch('/api/expenses')
    if (res.ok) {
      const data = await res.json()
      setExpenses(data.expenses || [])
    }
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount || !form.date) return
    setSaving(true)
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        client_name: form.client_name || undefined,
        notes: form.notes || undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setExpenses(prev => [data.expense, ...prev])
      setForm({ ...BLANK_FORM })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (res.ok) setExpenses(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  // Derived filters
  const filtered = expenses.filter(e => {
    if (filterCategory && e.category !== filterCategory) return false
    if (filterMonth && !e.date.startsWith(filterMonth)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !e.description.toLowerCase().includes(q) &&
        !(e.client_name?.toLowerCase().includes(q)) &&
        !e.category.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // Summary stats (always over full set, not filtered)
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisYearKey = `${now.getFullYear()}`

  const totalMonth = expenses
    .filter(e => e.date.startsWith(thisMonthKey))
    .reduce((s, e) => s + Number(e.amount), 0)

  const totalYTD = expenses
    .filter(e => e.date.startsWith(thisYearKey))
    .reduce((s, e) => s + Number(e.amount), 0)

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0)

  // Category breakdown for filtered set
  const byCategory = filtered.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {})
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const anyFilter = filterCategory || filterMonth || searchQuery

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar ref={sidebarRef} activePage="expenses" />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
        <MobileNav activePage="expenses" />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track what you spend to see your true profit</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#0d1b2a] dark:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a2d40] dark:hover:bg-orange-600 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Expense
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${fmt(totalMonth)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Year to Date</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${fmt(totalYTD)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {anyFilter ? 'Filtered Total' : 'All Time'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${fmt(anyFilter ? totalFiltered : expenses.reduce((s, e) => s + Number(e.amount), 0))}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: expense list */}
            <div className="flex-1 min-w-0">
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-40"
                />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">All categories</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {anyFilter && (
                  <button
                    onClick={() => { setFilterCategory(''); setFilterMonth(''); setSearchQuery('') }}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-lg transition"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* List */}
              {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {anyFilter ? 'No expenses match your filters' : 'No expenses yet'}
                  </p>
                  {!anyFilter && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Add your first expense →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(expense => (
                    <div
                      key={expense.id}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3.5 flex items-center gap-3 group"
                    >
                      {/* Category badge */}
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}`}>
                        {expense.category}
                      </span>

                      {/* Description + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{expense.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {expense.client_name && <span> · {expense.client_name}</span>}
                          {expense.notes && <span className="italic"> · {expense.notes}</span>}
                        </p>
                      </div>

                      {/* Amount */}
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">${fmt(Number(expense.amount))}</p>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="opacity-0 group-hover:opacity-100 ml-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30"
                        title="Delete"
                      >
                        {deletingId === expense.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: breakdown */}
            {topCategories.length > 0 && (
              <div className="lg:w-56 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 sticky top-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">By Category</p>
                  <div className="space-y-3">
                    {topCategories.map(([cat, amt]) => {
                      const pct = totalFiltered > 0 ? (amt / totalFiltered) * 100 : 0
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                            <span className="text-gray-500">${fmt(amt)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {anyFilter && (
                    <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      Showing {filtered.length} of {expenses.length} expenses
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Add Expense</h2>
              <button
                onClick={() => { setShowForm(false); setForm({ ...BLANK_FORM }) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
                <input
                  required
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Adobe Creative Suite subscription"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Amount ($) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Client <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Which client is this for?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional details"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm({ ...BLANK_FORM }) }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#0d1b2a] dark:bg-orange-500 text-white text-sm font-semibold hover:bg-[#1a2d40] dark:hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
