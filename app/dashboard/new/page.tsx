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
}

function NewDocumentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as DocType | null
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
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
  })

  // Auto-advance to step 2 if type is pre-selected from URL
  useEffect(() => {
    if (typeParam && ['invoice', 'proposal'].includes(typeParam)) {
      setStep(2)
    }
  }, [typeParam])

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleGenerate = async () => {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-xl p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-black' : 'bg-gray-200'
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
                        ? 'border-black bg-black text-white'
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client name</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client email</label>
              <input
                type="email"
                value={form.clientEmail}
                onChange={(e) => update('clientEmail', e.target.value)}
                placeholder="client@company.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
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
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => update('paymentTerms', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option>Due on receipt</option>
                <option>Net 7</option>
                <option>Net 14</option>
                <option>Net 30</option>
                <option>50% upfront, 50% on delivery</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Any additional notes? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything else to include..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
              <Row label="Type" value={form.docType} />
              <Row label="From" value={form.businessName} />
              <Row label="To" value={`${form.clientName} (${form.clientEmail})`} />
              <Row label="Service" value={form.serviceDescription} />
              <Row label="Amount" value={`$${form.price}`} />
              <Row label="Timeline" value={form.timeline} />
              <Row label="Payment terms" value={form.paymentTerms} />
              {form.notes && <Row label="Notes" value={form.notes} />}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Claude will generate a professional document from this info. Takes about 10 seconds.
            </p>
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
              onClick={() => setStep((s) => s + 1)}
              className="bg-black text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-black text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <NewDocumentContent />
    </Suspense>
  )
}
