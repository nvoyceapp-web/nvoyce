'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

const BUSINESS_TYPES = [
  'Freelance Designer',
  'Freelance Developer',
  'Writer / Copywriter',
  'Consultant',
  'Photographer / Videographer',
  'Marketing / Ads',
  'Virtual Assistant',
  'Other',
]

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional & Formal', desc: 'Polished and authoritative' },
  { value: 'friendly', label: 'Friendly & Conversational', desc: 'Warm and approachable' },
  { value: 'concise', label: 'Concise & Direct', desc: 'Short and to the point' },
]

const PROJECT_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'milestone', label: 'Milestone-Based' },
]

interface OnboardingModalProps {
  onComplete: () => void
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { userId } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [businessType, setBusinessType] = useState('')
  const [industry, setIndustry] = useState('')

  // Step 2
  const [projectTypes, setProjectTypes] = useState<string[]>([])
  const [paymentTerms, setPaymentTerms] = useState('net_30')
  const [chargesTax, setChargesTax] = useState(false)
  const [taxRate, setTaxRate] = useState('')

  // Step 3
  const [tone, setTone] = useState('professional')
  const [commonServices, setCommonServices] = useState('')

  const toggleProjectType = (value: string) => {
    setProjectTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSkip = async () => {
    await markOnboardingComplete()
    onComplete()
  }

  const markOnboardingComplete = async () => {
    if (!userId) return
    await supabase
      .from('user_settings')
      .upsert({ user_id: userId, onboarding_completed: true, updated_at: new Date().toISOString() })
  }

  const handleFinish = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        business_type: businessType || null,
        industry: industry || null,
        project_types: projectTypes.length > 0 ? projectTypes : null,
        default_payment_terms: paymentTerms,
        charges_tax: chargesTax,
        tax_rate: taxRate ? parseFloat(taxRate) : null,
        tone_preference: tone,
        common_services: commonServices || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      onComplete()
    } catch (err) {
      console.error('Onboarding save error:', err)
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1.5 w-12 rounded-full transition-colors ${
                    i <= step ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Skip for now
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 && 'Tell us about your business'}
            {step === 2 && 'How do you work?'}
            {step === 3 && 'Your communication style'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && 'This helps Nvoyce generate better proposals and invoices for you.'}
            {step === 2 && 'We\'ll use this to pre-fill terms and suggest pricing.'}
            {step === 3 && 'Claude will match your tone in every document it generates.'}
          </p>
        </div>

        {/* Step Content */}
        <div className="px-8 py-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What type of work do you do?</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setBusinessType(type)}
                      className={`px-3 py-2 rounded-lg text-sm border text-left transition ${
                        businessType === type
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What industry or niche do you serve? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. SaaS startups, real estate, e-commerce brands"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How do you typically structure projects?</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleProjectType(opt.value)}
                      className={`px-3 py-2 rounded-lg text-sm border text-left transition ${
                        projectTypes.includes(opt.value)
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default payment terms</label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                >
                  {PAYMENT_TERMS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Do you charge tax?</label>
                  <button
                    onClick={() => setChargesTax(!chargesTax)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      chargesTax ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${chargesTax ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {chargesTax && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      placeholder="Tax rate % (e.g. 8.5)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone for proposals and invoices</label>
                <div className="space-y-2">
                  {TONE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTone(opt.value)}
                      className={`w-full px-4 py-3 rounded-lg border text-left transition ${
                        tone === opt.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-medium ${tone === opt.value ? 'text-purple-700' : 'text-gray-900'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What services do you commonly offer? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={commonServices}
                  onChange={e => setCommonServices(e.target.value)}
                  placeholder="e.g. brand identity, logo design, style guides, UI design"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
