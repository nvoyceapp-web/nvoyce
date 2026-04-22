'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/supabase'

const paymentTermsDisplayMap: Record<string, string> = {
  due_on_receipt: 'Due on receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_60: 'Net 60',
  net_90: 'Net 90',
}

type DocType = 'invoice' | 'proposal'

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

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const typeParam = searchParams.get('type') as DocType | null
  const prefillId = searchParams.get('prefill')
  // Track the draft ID that came from "← Back to Edit" so we can replace it on regenerate
  const [replaceDraftId, setReplaceDraftId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [clientSuggestions, setClientSuggestions] = useState<Contact[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const clientNameRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
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

  // Pre-fill business name and payment terms from user settings (only on fresh wizard, not prefill)
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
        // Remember the draft we came from — it will be deleted when a new draft is generated
        if (data.status === 'draft') setReplaceDraftId(data.id)
        setStep(3)
      }
    }
    prefillForm()
  }, [prefillId])

  // Load contacts for autocomplete
  useEffect(() => {
    if (!userId) return
    fetch('/api/contacts').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setContacts(data)
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

  const validateStep = (currentStep: number): boolean => {
    const errors: string[] = []

    if (currentStep === 1) {
      if (!form.businessName.trim()) {
        errors.push('Business name is required')
      }
      if (!form.clientName.trim()) {
        errors.push('Client name is required')
      }
      if (!form.clientEmail.trim()) {
        errors.push('Client email is required')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) {
        errors.push('Please enter a valid email address')
      }
    }

    if (currentStep === 2) {
      if (!form.serviceDescription.trim()) {
        errors.push('Service description is required')
      }
      if (!form.price.trim()) {
        errors.push('Price is required')
      } else if (isNaN(parseFloat(form.price.replace(/,/g, '')))) {
        errors.push('Price must be a valid number')
      }
      // Timeline is only required for proposals
      if (form.docType === 'proposal' && !form.timeline.trim()) {
        errors.push('Timeline/deadline is required for proposals')
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setValidationErrors([])
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1)
    }
  }

  const handleGenerate = async () => {
    // Validate all fields before submission
    const allErrors: string[] = []

    // Step 1 validation
    if (!form.businessName.trim()) allErrors.push('Business name is required')
    if (!form.clientName.trim()) allErrors.push('Client name is required')
    if (!form.clientEmail.trim()) allErrors.push('Client email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) allErrors.push('Please enter a valid email address')

    // Step 2 validation
    if (!form.serviceDescription.trim()) allErrors.push('Service description is required')
    if (!form.price.trim()) allErrors.push('Price is required')
    else if (isNaN(parseFloat(form.price.replace(/,/g, '')))) allErrors.push('Price must be a valid number')
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
        body: JSON.stringify({ ...form, replaceDraftId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setValidationErrors([data.error || 'Failed to generate document. Please try again.'])
        return
      }

      if (data.id) {
        router.push(`/dashboard/documents/${data.id}`)
      }
    } catch (err) {
      console.error(err)
      setValidationErrors(['Failed to generate document. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  return (
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
      {/* Desktop centering wrapper */}
      <div className="flex items-center justify-center py-6 sm:py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 w-full max-w-xl p-5 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              />
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
                <div
                  ref={suggestionsRef}
                  className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                >
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
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                What service did you provide / are you proposing?
              </label>
              <textarea
                value={form.serviceDescription}
                onChange={(e) => update('serviceDescription', e.target.value)}
                placeholder="e.g. Brand photography session — 2 hours, 50 edited photos, delivered via Google Drive"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Price</label>
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
              <Row label="Amount" value={`$${form.price}`} />
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
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="bg-orange-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-orange-700 transition"
            >
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
