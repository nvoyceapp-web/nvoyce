'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
  const typeParam = searchParams.get('type') as DocType | null
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
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
      if (!form.timeline.trim()) {
        errors.push('Timeline is required')
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
    if (!form.timeline.trim()) allErrors.push('Timeline is required')

    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 w-full max-w-xl p-8">
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
                    <div className="text-lg mb-1">{type === 'invoice' ? '🧾' : '📋'}</div>
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

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client name</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
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
              <label className="text-sm font-medium text-gray-700 block mb-1">Timeline / deadline</label>
              <input
                type="text"
                value={form.timeline}
                onChange={(e) => update('timeline', e.target.value)}
                placeholder="e.g. Delivered within 7 business days"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
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
                <option>Net 30</option>
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
              className="bg-orange-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : '✨ Generate with AI'}
            </button>
          )}
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
