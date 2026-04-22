'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import type { ServiceTemplate } from '@/lib/supabase'

const emptyForm = { name: '', description: '', unit_price: '' }

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function RateCardPage() {
  const { userId } = useAuth()
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState<ServiceTemplate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    fetchTemplates()
  }, [userId])

  useEffect(() => {
    if (showModal) setTimeout(() => nameRef.current?.focus(), 50)
  }, [showModal])

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/service-templates')
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openAdd() {
    setEditTemplate(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(t: ServiceTemplate) {
    setEditTemplate(t)
    setForm({ name: t.name, description: t.description || '', unit_price: String(t.unit_price) })
    setError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditTemplate(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Service name is required'); return }
    const price = parseFloat(form.unit_price.replace(/,/g, ''))
    if (isNaN(price) || price < 0) { setError('Enter a valid price'); return }
    setSaving(true)
    setError('')
    const url = editTemplate ? `/api/service-templates/${editTemplate.id}` : '/api/service-templates'
    const method = editTemplate ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, description: form.description, unit_price: price }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Something went wrong'); setSaving(false); return }
    if (editTemplate) {
      setTemplates(prev => prev.map(t => t.id === editTemplate.id ? data : t).sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      setTemplates(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setSaving(false)
    closeModal()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/service-templates/${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
    setDeleteConfirm(null)
  }

  const filtered = templates.filter(t => {
    const q = search.toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
  })

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      <Sidebar activePage="rate-card" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileNav activePage="rate-card" />
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0d1b2a] tracking-tight">Rate Card</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {templates.length} service{templates.length !== 1 ? 's' : ''} saved — pick from these when creating invoices or proposals
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d1b2a] text-white text-sm font-medium hover:bg-[#1a2d40] transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Service
            </button>
          </div>

          {/* Search */}
          {templates.length > 0 && (
            <div className="relative mb-5 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p className="text-[#0d1b2a] font-semibold mb-1">No services yet</p>
              <p className="text-gray-500 text-sm mb-5">Build your rate card to fill proposals and invoices in one click</p>
              <button
                onClick={openAdd}
                className="px-4 py-2 rounded-lg bg-[#0d1b2a] text-white text-sm font-medium hover:bg-[#1a2d40] transition"
              >
                Add Service
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No services match &ldquo;{search}&rdquo;</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 transition group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0d1b2a] text-sm truncate">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Rate</span>
                    <span className="text-base font-bold text-[#0d1b2a]">${formatPrice(t.unit_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#0d1b2a] mb-5">{editTemplate ? 'Edit Service' : 'Add Service'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Service name <span className="text-red-500">*</span></label>
                <input
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Brand Photography Session"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. 2-hour session, 50 edited photos delivered via Google Drive"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    value={form.unit_price}
                    onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="500.00"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-[#0d1b2a] text-white text-sm font-medium hover:bg-[#1a2d40] transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : editTemplate ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </div>
            <h3 className="font-bold text-[#0d1b2a] mb-1">Delete service?</h3>
            <p className="text-sm text-gray-500 mb-5">This won&apos;t affect any existing documents.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
