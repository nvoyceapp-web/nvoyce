'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Contact, ServiceTemplate } from '@/lib/supabase'

const paymentTermsDisplayMap: Record<string, string> = {
  due_on_receipt: 'Due on receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_60: 'Net 60',
  net_90: 'Net 90',
}

type DocType = 'invoice' | 'proposal'

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface FormData {
  docType: DocType
  clientName: string
  clientEmail: string
  businessName: string
  serviceDescription: string
  price: string
  timeline: string
  paymentTerms: string
  notes: string
  expirationDays?: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const typeParam = searchParams.get('type') as DocType | null
  const prefillId = searchParams.get('prefill')
  const [replaceDraftId, setReplaceDraftId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [clientSuggestions, setClientSuggestions] = useState<Contact[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const clientNameRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([])
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')

  // Line items & pricing extras
  const [showLineItems, setShowLineItems] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: '1', unitPrice: '' }])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxRate, setTaxRate] = useState('8.25')
  const [discountAmount, setDiscountAmount] = useState('')
  const [depositPercent, setDepositPercent] = useState('')

  const [form, setForm] = useState<FormData>({
    docType: (typeParam && ['invoice', 'proposal'].includes(typeParam) ? typeParam : 'invoice') as DocType,
    clientName: '',
    clientEmail: '',
    businessName: '',
    serviceDescription: '',
    price: '',
    timeline: '',
    paymentTerms: 'Due on receipt',
    notes: '',
    expirationDays: '7',
  })

  // Computed totals from line items
  const lineSubtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)
  const lineTax = taxEnabled && taxRate ? lineSubtotal * (parseFloat(taxRate) / 100) : 0
  const lineDiscount = discountAmount ? parseFloat(discountAmount) || 0 : 0
  const lineTotal = lineSubtotal + lineTax - lineDiscount
  const depositAmount = depositPercent ? lineTotal * (parseFloat(depositPercent) / 100) : 0

  // Simple price computed totals
  const simpleBase = parseFloat(form.price.replace(/,/g, '')) || 0
  const simpleTax = taxEnabled && taxRate ? simpleBase * (parseFloat(taxRate) / 100) : 0
  const simpleDiscount = discountAmount ? parseFloat(discountAmount) || 0 : 0
  const simpleTotal = simpleBase + simpleTax - simpleDiscount
  const simpleDeposit = depositPercent ? simpleTotal * (parseFloat(depositPercent) / 100) : 0

  // Pre-fill business name and payment terms from user settings
  useEffect(() => {
    if (prefillId || !userId) return
    async function loadUserDefaults() {
      const { data } = await supabase
        .from('user_settings')
        .select('business_name, default_payment_terms')
        .eq('user_id', userId)
        .single()
      if (!data) return
      setForm(prev => ({
        ...prev,
        ...(data.business_name ? { businessName: data.business_name } : {}),
        ...(data.default_payment_terms && paymentTermsDisplayMap[data.default_payment_terms]
          ? { paymentTerms: paymentTermsDisplayMap[data.default_payment_terms] }
          : {}),
      }))
    }
    loadUserDefaults()
  }, [userId, prefillId])

  useEffect(() => {
    if (!prefillId) return
    async function prefillForm() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', prefillId)
        .single()
      if (data?.form_data) {
        setForm({
          docType: (data.doc_type as DocType) || 'invoice',
          clientName: data.form_data.clientName || data.client_name || '',
          clientEmail: data.form_data.clientEmail || data.client_email || '',
          businessName: data.form_data.businessName || data.business_name || '',
          serviceDescription: data.form_data.serviceDescription || '',
          price: data.form_data.price || String(data.price) || '',
          timeline: data.form_data.timeline || '',
          paymentTerms: data.form_data.paymentTerms || 'Due on receipt',
          notes: data.form_data.notes || '',
          expirationDays: data.form_data.expirationDays || '7',
        })
        // Restore line items state if present
        if (data.form_data.lineItems && data.form_data.lineItems.length > 0) {
          setLineItems(data.form_data.lineItems)
          setShowLineItems(true)
        }
        if (data.form_data.taxEnabled) setTaxEnabled(data.form_data.taxEnabled)
        if (data.form_data.taxRate) setTaxRate(data.form_data.taxRate)
        if (data.form_data.discountAmount) setDiscountAmount(data.form_data.discountAmount)
        if (data.form_data.depositPercent) setDepositPercent(data.form_data.depositPercent)
        if (data.status === 'draft') setReplaceDraftId(data.id)
        setStep(3)
      }
    }
    prefillForm()
  }, [prefillId])

  // Load contacts and service templates
  useEffect(() => {
    if (!userId) return
    fetch('/api/contacts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setContacts(data)
    })
    fetch('/api/service-templates').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setServiceTemplates(data)
    })
  }, [userId])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          clientNameRef.current && !clientNameRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleClientNameChange(value: string) {
    update('clientName', value)
    if (value.trim().length >= 1) {
      const q = value.toLowerCase()
      const matches = contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
      setClientSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  function selectContact(c: Contact) {
    setForm(prev => ({
      ...prev,
      clientName: c.name,
      clientEmail: c.email || prev.clientEmail,
    }))
    setShowSuggestions(false)
    setValidationErrors([])
  }

  function selectService(t: ServiceTemplate) {
    const desc = t.description ? `${t.name} — ${t.description}` : t.name
    setForm(prev => ({ ...prev, serviceDescription: desc, price: String(t.unit_price) }))
    // Also update first line item if in line items mode
    if (showLineItems) {
      setLineItems(prev => {
        const updated = [...prev]
        updated[0] = { description: t.name, quantity: '1', unitPrice: String(t.unit_price) }
        return updated
      })
    }
    setShowServicePicker(false)
    setServiceSearch('')
    setValidationErrors([])
  }

  function handleToggleLineItems() {
    if (!showLineItems) {
      // Pre-populate first row from service description + price
      setLineItems([{
        description: form.serviceDescription || '',
        quantity: '1',
        unitPrice: form.price || '',
      }])
    }
    setShowLineItems(v => !v)
    setValidationErrors([])
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', quantity: '1', unitPrice: '' }])
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const validateStep = (currentStep: number): boolean => {
    const errors: string[] = []

    if (currentStep === 1) {
      if (!form.businessName.trim()) errors.push('Business name is required')
      if (!form.clientName.trim()) errors.push('Client name is required')
      if (!form.clientEmail.trim()) errors.push('Client email is required')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) errors.push('Please enter a valid email address')
    }

    if (currentStep === 2) {
      if (!form.serviceDescription.trim()) errors.push('Service description is required')
      if (showLineItems) {
        const validItems = lineItems.filter(item => item.description.trim() && item.unitPrice.trim())
        if (validItems.length === 0) errors.push('Add at least one line item with a description and price')
      } else {
        if (!form.price.trim()) errors.push('Price is required')
        else if (isNaN(parseFloat(form.price.replace(/,/g, '')))) errors.push('Price must be a valid number')
      }
      if (form.docType === 'proposal' && !form.timeline.trim()) errors.push('Timeline/deadline is required for proposals')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors([])
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1)
  }

  const handleGenerate = async () => {
    const allErrors: string[] = []
    if (!form.businessName.trim()) allErrors.push('Business name is required')
    if (!form.clientName.trim()) allErrors.push('Client name is required')
    if (!form.clientEmail.trim()) allErrors.push('Client email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) allErrors.push('Please enter a valid email address')
    if (!form.serviceDescription.trim()) allErrors.push('Service description is required')
    if (showLineItems) {
      const validItems = lineItems.filter(item => item.description.trim() && item.unitPrice.trim())
      if (validItems.length === 0) allErrors.push('Add at least one line item with a description and price')
    } else {
      if (!form.price.trim()) allErrors.push('Price is required')
      else if (isNaN(parseFloat(form.price.replace(/,/g, '')))) allErrors.push('Price must be a valid number')
    }
    if (form.docType === 'proposal' && !form.timeline.trim()) allErrors.push('Timeline/deadline is required for proposals')

    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          replaceDraftId,
          // Pricing extras
          lineItems: showLineItems ? lineItems.filter(i => i.description.trim() && i.unitPrice.trim()) : [],
          showLineItems,
          taxEnabled,
          taxRate: taxEnabled ? taxRate : '',
          discountAmount,
          depositPercent,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setValidationErrors([data.error || 'Failed to generate document. Please try again.'])
        return
      }
      if (data.id) router.push(`/dashboard/documents/${data.id}`)
    } catch (err) {
      console.error(err)
      setValidationErrors(['Failed to generate document. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  // Decide what to show for total in step 3 review
  const reviewTotal = showLineItems ? lineTotal : simpleTotal
  const reviewDeposit = showLineItems ? depositAmount : simpleDeposit
  const reviewTax = showLineItems ? lineTax : simpleTax
  const reviewDiscount = showLineItems ? lineDiscount : simpleDiscount

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="font-display font-bold text-xl text-[#0d1b2a] tracking-tight">
          Nvoyce
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
      </div>
      <div className="flex items-center justify-center py-6 sm:py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 w-full max-w-xl p-5 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-orange-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 1 && 'What are you creating?'}
            {step === 2 && 'Tell us about the project'}
            {step === 3 && 'Review & generate'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Document type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['invoice', 'proposal'] as DocType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => update('docType', type)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      form.docType === type
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-2">
                      {type === 'invoice' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                          <line x1="12" y1="12" x2="12" y2="16"/>
                          <line x1="10" y1="14" x2="14" y2="14"/>
                        </svg>
                      )}
                    </div>
                    <div className="font-medium capitalize">{type}</div>
                    <div className={`text-xs mt-0.5 ${form.docType === type ? 'text-gray-300' : 'text-gray-400'}`}>
                      {type === 'invoice' ? 'Request payment for work done' : 'Pitch a project to a client'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Your business name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                placeholder="e.g. Jane Smith Photography"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="relative">
              <label className="text-sm font-medium text-gray-700 block mb-1">Client name</label>
              <input
                ref={clientNameRef}
                type="text"
                value={form.clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => {
                  if (form.clientName.trim().length >= 1 && clientSuggestions.length > 0) setShowSuggestions(true)
                }}
                placeholder="e.g. Acme Corp"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="off"
              />
              {showSuggestions && clientSuggestions.length > 0 && (
                <div ref={suggestionsRef} className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {clientSuggestions.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectContact(c)}
                      className="w-full px-4 py-2.5 text-left hover:bg-purple-50 flex items-center gap-3 transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-700 font-bold text-xs">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0d1b2a] truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email || c.company || ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client email</label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) => update('clientEmail', e.target.value)}
                placeholder="client@company.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Service description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  What service did you provide / are you proposing?
                </label>
                {serviceTemplates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setShowServicePicker(true); setServiceSearch('') }}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Use saved service
                  </button>
                )}
              </div>
              <textarea
                value={form.serviceDescription}
                onChange={(e) => update('serviceDescription', e.target.value)}
                placeholder="e.g. Brand photography session — 2 hours, 50 edited photos, delivered via Google Drive"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Price OR Line Items */}
            {!showLineItems ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <button
                    type="button"
                    onClick={handleToggleLineItems}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium transition flex items-center gap-1"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add line items
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="1,500"
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line items</label>
                  <button
                    type="button"
                    onClick={handleToggleLineItems}
                    className="text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    Switch to single price
                  </button>
                </div>

                {/* Line items rows */}
                <div className="space-y-2">
                  {lineItems.map((item, idx) => {
                    const rowTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => updateLineItem(idx, 'description', e.target.value)}
                            placeholder="Description"
                            className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                          />
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>Qty</span>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                              min="0"
                              step="0.5"
                              className="w-16 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            />
                          </div>
                          <span className="text-gray-400 text-xs">×</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input
                              type="text"
                              value={item.unitPrice}
                              onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-full border border-gray-200 rounded-md pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-20 text-right font-medium">
                            {rowTotal > 0 ? fmt(rowTotal) : '—'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add row
                </button>
              </div>
            )}

            {/* Tax / Discount / Deposit */}
            <div className="space-y-3 pt-1">
              {/* Tax */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTaxEnabled(v => !v)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${taxEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${taxEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-gray-700">Tax</span>
                {taxEnabled && (
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="text"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      className="w-16 border border-gray-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    <span className="text-xs text-gray-400 ml-2">
                      = {fmt(showLineItems ? lineTax : simpleTax)}
                    </span>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-24">Discount</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="text"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-md pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                {discountAmount && parseFloat(discountAmount) > 0 && (
                  <span className="text-xs text-green-600 font-medium">−{fmt(parseFloat(discountAmount))}</span>
                )}
              </div>

              {/* Deposit (invoices only) */}
              {form.docType === 'invoice' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-24">Deposit</span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={depositPercent}
                      onChange={e => setDepositPercent(e.target.value)}
                      placeholder="0"
                      className="w-16 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <span className="text-sm text-gray-500">% upfront</span>
                  </div>
                  {depositPercent && parseFloat(depositPercent) > 0 && (
                    <span className="text-xs text-gray-500">
                      = {fmt(showLineItems ? depositAmount : simpleDeposit)}
                    </span>
                  )}
                </div>
              )}

              {/* Running total */}
              {(taxEnabled || (discountAmount && parseFloat(discountAmount) > 0) || showLineItems) && (
                <div className="flex justify-end pt-1 border-t border-gray-100">
                  <div className="text-right space-y-0.5">
                    {showLineItems && (
                      <p className="text-xs text-gray-400">Subtotal: {fmt(lineSubtotal)}</p>
                    )}
                    {taxEnabled && reviewTax > 0 && (
                      <p className="text-xs text-gray-400">Tax ({taxRate}%): +{fmt(reviewTax)}</p>
                    )}
                    {reviewDiscount > 0 && (
                      <p className="text-xs text-gray-400">Discount: −{fmt(reviewDiscount)}</p>
                    )}
                    <p className="text-sm font-bold text-[#0d1b2a]">Total: {fmt(reviewTotal)}</p>
                    {reviewDeposit > 0 && (
                      <p className="text-xs text-orange-600 font-medium">Deposit due: {fmt(reviewDeposit)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                When will service/delivery be completed? {form.docType === 'proposal' && <span className="text-red-500">*</span>}
                <span className="text-gray-400 font-normal text-xs ml-1">{form.docType === 'invoice' ? '(optional)' : '(required for proposals)'}</span>
              </label>
              <textarea
                value={form.timeline}
                onChange={(e) => update('timeline', e.target.value)}
                placeholder={form.docType === 'proposal' ? 'e.g. Delivered within 7 business days' : 'e.g. Delivered on March 15, 2026'}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none mb-2"
              />
              <div className="grid grid-cols-3 gap-2">
                {['Within 3 days', 'Within 1 week', 'Within 2 weeks', 'Within 1 month', 'Custom date', 'Ongoing'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => update('timeline', preset)}
                    className={`px-3 py-1.5 text-xs rounded border transition ${
                      form.timeline === preset
                        ? 'bg-orange-100 border-orange-400 text-orange-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment terms */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => update('paymentTerms', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option>Due on receipt</option>
                <option>Net 7</option>
                <option>Net 14</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 60</option>
                <option>Net 90</option>
                <option>50% upfront, 50% on delivery</option>
              </select>
            </div>

            {/* Proposal expiration */}
            {form.docType === 'proposal' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Proposal expiration <span className="text-gray-400 font-normal">(business days)</span>
                </label>
                <select
                  value={form.expirationDays || '7'}
                  onChange={(e) => update('expirationDays', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="3">3 business days</option>
                  <option value="5">5 business days</option>
                  <option value="7">7 business days</option>
                  <option value="14">14 business days</option>
                  <option value="30">30 business days</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Client will see when this proposal expires</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Any additional notes? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything else to include..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-xl p-5 space-y-3 text-sm">
              <Row label="Type" value={form.docType} />
              <Row label="From" value={form.businessName} />
              <Row label="To" value={`${form.clientName} (${form.clientEmail})`} />
              <Row label="Service" value={form.serviceDescription} />
              {showLineItems ? (
                <div className="flex gap-3">
                  <span className="text-gray-400 w-28 shrink-0">Line items</span>
                  <div className="space-y-1">
                    {lineItems.filter(i => i.description.trim()).map((item, idx) => {
                      const t = (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0)
                      return (
                        <p key={idx} className="text-gray-900 font-medium">
                          {item.description} — {item.quantity} × {fmt(parseFloat(item.unitPrice) || 0)} = {fmt(t)}
                        </p>
                      )
                    })}
                    <div className="pt-1 space-y-0.5 border-t border-gray-200 mt-1">
                      <p className="text-gray-500">Subtotal: {fmt(lineSubtotal)}</p>
                      {taxEnabled && lineTax > 0 && <p className="text-gray-500">Tax ({taxRate}%): +{fmt(lineTax)}</p>}
                      {lineDiscount > 0 && <p className="text-gray-500">Discount: −{fmt(lineDiscount)}</p>}
                      <p className="font-bold text-[#0d1b2a]">Total: {fmt(lineTotal)}</p>
                      {depositAmount > 0 && <p className="text-orange-600 font-medium">Deposit: {fmt(depositAmount)} ({depositPercent}%)</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Row label="Amount" value={fmt(simpleBase)} />
                  {taxEnabled && simpleTax > 0 && <Row label={`Tax (${taxRate}%)`} value={`+${fmt(simpleTax)}`} />}
                  {simpleDiscount > 0 && <Row label="Discount" value={`−${fmt(simpleDiscount)}`} />}
                  {(taxEnabled || simpleDiscount > 0) && <Row label="Total" value={fmt(simpleTotal)} />}
                  {simpleDeposit > 0 && <Row label="Deposit due" value={`${fmt(simpleDeposit)} (${depositPercent}%)`} />}
                </>
              )}
              <Row label="Timeline" value={form.timeline} />
              <Row label="Payment terms" value={form.paymentTerms} />
              {form.docType === 'proposal' && form.expirationDays && (
                <Row label="Expires in" value={`${form.expirationDays} business days`} />
              )}
              {form.notes && <Row label="Notes" value={form.notes} />}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Claude will generate a professional document from this info. Takes about 10 seconds.
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Please complete the following:</h3>
            <ul className="space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button onClick={handleNext} className="bg-orange-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-orange-700 transition">
              Continue →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-orange-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Generating...' : 'Generate Draft →'}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>

    {/* Service Picker Modal */}
    {showServicePicker && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setShowServicePicker(false) }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0d1b2a]">Choose a Service</h2>
            <button onClick={() => setShowServicePicker(false)} className="text-gray-400 hover:text-gray-600 transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {serviceTemplates.length > 5 && (
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearch}
                onChange={e => setServiceSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {serviceTemplates
              .filter(t => !serviceSearch || t.name.toLowerCase().includes(serviceSearch.toLowerCase()) || t.description?.toLowerCase().includes(serviceSearch.toLowerCase()))
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => selectService(t)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0d1b2a] group-hover:text-orange-700 transition truncate">{t.name}</p>
                    <span className="text-sm font-bold text-[#0d1b2a] flex-shrink-0">${Number(t.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>}
                </button>
              ))}
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <NewDocumentContent />
    </Suspense>
  )
}
