'use client'

import Link from 'next/link'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileNav from '@/components/MobileNav'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useUser, useAuth, useClerk } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PLANS } from '@/lib/plans'

const BUSINESS_TYPES = [
  'Freelance Designer', 'Freelance Developer', 'Writer / Copywriter',
  'Consultant', 'Photographer / Videographer', 'Marketing / Ads',
  'Virtual Assistant', 'Other',
]

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional & Formal' },
  { value: 'friendly', label: 'Friendly & Conversational' },
  { value: 'concise', label: 'Concise & Direct' },
]

const PROJECT_TYPE_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'milestone', label: 'Milestone-Based' },
]

const TIMEZONES = [
  { value: 'EST', label: 'Eastern Time (ET)', offset: '-5' },
  { value: 'CST', label: 'Central Time (CT)', offset: '-6' },
  { value: 'MST', label: 'Mountain Time (MT)', offset: '-7' },
  { value: 'PST', label: 'Pacific Time (PT)', offset: '-8' },
  { value: 'AKST', label: 'Alaska Time (AKST)', offset: '-9' },
  { value: 'HST', label: 'Hawaii Time (HST)', offset: '-10' },
  { value: 'UTC', label: 'UTC / GMT', offset: '+0' },
  { value: 'GMT', label: 'London (GMT)', offset: '+0' },
  { value: 'CET', label: 'Central European Time (CET)', offset: '+1' },
  { value: 'IST', label: 'India Standard Time (IST)', offset: '+5:30' },
  { value: 'SGT', label: 'Singapore Time (SGT)', offset: '+8' },
  { value: 'AEST', label: 'Australian Eastern Time (AEST)', offset: '+10' },
]

function SettingsContent() {
  const { user } = useUser()
  const { userId } = useAuth()
  const { signOut } = useClerk()
  const searchParams = useSearchParams()
  const [businessName, setBusinessName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const sidebarRef = useRef<SidebarHandle>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      const saved = (user.unsafeMetadata?.businessName as string) || ''
      setBusinessName(saved)
      setNameInput(saved)
    }
  }, [user])

  useEffect(() => {
    if (!userId) return

    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('logo_url, business_name, business_type, industry, common_services, project_types, default_payment_terms, charges_tax, tax_rate, tone_preference, stripe_connect_complete')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          if (data.logo_url) setLogoUrl(data.logo_url)
          // Supabase business_name takes priority over Clerk metadata
          if (data.business_name) {
            setBusinessName(data.business_name)
            setNameInput(data.business_name)
          }
          if (data.business_type) setBusinessType(data.business_type)
          if (data.industry) setIndustry(data.industry)
          if (data.common_services) setCommonServices(data.common_services)
          if (data.project_types) setProjectTypes(data.project_types)
          if (data.default_payment_terms) setPaymentTerms(data.default_payment_terms)
          if (data.charges_tax !== null) setChargesTax(data.charges_tax)
          if (data.tax_rate !== null) setTaxRate(String(data.tax_rate))
          if (data.tone_preference) setTonePreference(data.tone_preference)
          if (data.stripe_connect_complete) setStripeConnectComplete(data.stripe_connect_complete)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
      }
    }

    fetchSettings()
  }, [userId])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return

    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'Logo must be under 5MB' })
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-logo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      setLogoUrl(publicUrl)

      // Save to user_settings
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (saveError) throw saveError

      setUploadMessage({ type: 'success', text: '✅ Logo uploaded successfully' })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setUploadMessage({ type: 'error', text: '❌ Failed to upload logo' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ logo_url: null })
        .eq('user_id', userId)

      if (error) throw error

      setLogoUrl('')
      setUploadMessage({ type: 'success', text: '✅ Logo removed' })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (err) {
      console.error('Remove error:', err)
      setUploadMessage({ type: 'error', text: '❌ Failed to remove logo' })
    }
  }

  async function saveBusinessName() {
    if (!user || !userId) return
    // Save to both Clerk metadata and user_settings so all reads are consistent
    await Promise.all([
      user.update({ unsafeMetadata: { ...user.unsafeMetadata, businessName: nameInput } }),
      supabase.from('user_settings').upsert({
        user_id: userId,
        business_name: nameInput || null,
        updated_at: new Date().toISOString(),
      }),
    ])
    setBusinessName(nameInput)
    setEditingName(false)
  }
  // Subscription state
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'business'>('free')
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business'>('free')
  const [subStatus, setSubStatus] = useState<string>('active')
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [subMessage, setSubMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!userId) return
    async function fetchSubscription() {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .single()
      if (data) {
        setCurrentPlan(data.plan as 'free' | 'pro' | 'business')
        setSelectedPlan(data.plan as 'free' | 'pro' | 'business')
        setSubStatus(data.status)
      }
    }
    fetchSubscription()

    // Show success/cancel messages from Stripe redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setSubMessage({ type: 'success', text: '🎉 You\'re now on the ' + currentPlan + ' plan!' })
      window.history.replaceState({}, '', '/dashboard/settings')
    } else if (params.get('cancelled') === 'true') {
      setSubMessage({ type: 'error', text: 'Upgrade cancelled — no changes made.' })
      window.history.replaceState({}, '', '/dashboard/settings')
    }
  }, [userId])

  async function handleUpgrade(plan: 'pro' | 'business') {
    setUpgradingPlan(plan)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      setSubMessage({ type: 'error', text: err?.message || 'Failed to start checkout. Try again.' })
      setUpgradingPlan(null)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      setSubMessage({ type: 'error', text: 'Could not open billing portal. Try again.' })
      setPortalLoading(false)
    }
  }

  // Stripe Connect state
  const [stripeConnectComplete, setStripeConnectComplete] = useState(false)
  const [stripeConnecting, setStripeConnecting] = useState(false)
  const [stripeMessage, setStripeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleConnectStripe = async () => {
    setStripeConnecting(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err: any) {
      setStripeMessage({ type: 'error', text: err?.message || 'Could not start Stripe setup. Try again.' })
      setStripeConnecting(false)
    }
  }

  // After returning from Stripe onboarding, verify and persist the completion status
  useEffect(() => {
    const isReturn = searchParams.get('stripe_return') === 'true'
    const isRefresh = searchParams.get('stripe_refresh') === 'true'
    if (!isReturn && !isRefresh) return
    if (!userId) return

    async function verifyStripeStatus() {
      const res = await fetch('/api/stripe/connect')
      const data = await res.json()
      if (data.connected) {
        setStripeConnectComplete(true)
        setStripeMessage({ type: 'success', text: '✅ Stripe connected! Payments will now go directly to your bank account.' })
      } else if (isRefresh) {
        // Link expired — show the connect button again so they can restart
        setStripeMessage({ type: 'error', text: 'Your Stripe setup link expired. Click "Connect Stripe" to try again.' })
      }
      // Clean up the query param without triggering a navigation
      window.history.replaceState({}, '', '/dashboard/settings')
    }
    verifyStripeStatus()
  }, [userId, searchParams])

  // Business profile state
  const [businessType, setBusinessType] = useState('')
  const [industry, setIndustry] = useState('')
  const [commonServices, setCommonServices] = useState('')
  const [projectTypes, setProjectTypes] = useState<string[]>([])
  const [paymentTerms, setPaymentTerms] = useState('net_30')
  const [chargesTax, setChargesTax] = useState(false)
  const [taxRate, setTaxRate] = useState('')
  const [tonePreference, setTonePreference] = useState('professional')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const toggleProjectType = (value: string) => {
    setProjectTypes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setProfileSaving(true)
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        business_type: businessType || null,
        industry: industry || null,
        common_services: commonServices || null,
        project_types: projectTypes.length > 0 ? projectTypes : null,
        default_payment_terms: paymentTerms,
        charges_tax: chargesTax,
        tax_rate: taxRate ? parseFloat(taxRate) : null,
        tone_preference: tonePreference,
        updated_at: new Date().toISOString(),
      })
      setProfileMessage({ type: 'success', text: '✅ Business profile saved' })
      setTimeout(() => setProfileMessage(null), 3000)
    } catch {
      setProfileMessage({ type: 'error', text: '❌ Failed to save. Try again.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [paymeAlerts, setPaymeAlerts] = useState(true)
  const [overdueReminders, setOverdueReminders] = useState(true)
  const [autoInvoices, setAutoInvoices] = useState(true)
  const [timezone, setTimezone] = useState('EST')

  const settings = [
    {
      section: 'Notifications',
      items: [
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          description: 'Receive emails when clients accept proposals or make payments',
          enabled: emailNotifications,
          onChange: setEmailNotifications,
        },
        {
          id: 'payme-alerts',
          label: 'Payme Smart Alerts',
          description: 'Get notified about overdue invoices and stale proposals',
          enabled: paymeAlerts,
          onChange: setPaymeAlerts,
        },
        {
          id: 'overdue-reminders',
          label: 'Overdue Invoice Reminders',
          description: 'Reminder emails for invoices over 30 days unpaid',
          enabled: overdueReminders,
          onChange: setOverdueReminders,
        },
      ],
    },
    {
      section: 'Automation',
      items: [
        {
          id: 'auto-invoices',
          label: 'Auto-Generate Invoices',
          description: 'Automatically create invoices when proposals are accepted',
          enabled: autoInvoices,
          onChange: setAutoInvoices,
        },
      ],
    },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="hidden lg:block">
        <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="settings" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <MobileNav activePage="settings" />
          <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold font-display text-gray-900 mb-3">Settings</h1>
              <p className="text-lg text-gray-600">Customize your Nvoyce experience and manage notifications.</p>
            </div>

            {/* Business Settings */}
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Business Name</h3>
                        {editingName ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                              placeholder="Enter your business name"
                              autoFocus
                            />
                            <button onClick={saveBusinessName} className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">Save</button>
                            <button onClick={() => setEditingName(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">{businessName || 'Not set — click Edit to add'}</p>
                        )}
                      </div>
                      {!editingName && (
                        <button onClick={() => setEditingName(true)} className="text-purple-600 hover:text-purple-700 text-sm font-semibold ml-4">Edit</button>
                      )}
                    </div>
                  </div>

                  {/* Business Profile */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-5">
                    <h3 className="font-medium text-gray-900">Business Profile <span className="text-xs text-gray-400 font-normal ml-1">Used by AI to generate better documents</span></h3>

                    {profileMessage && (
                      <div className={`p-3 rounded text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {profileMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type of work</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Niche</label>
                      <input
                        type="text"
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        placeholder="e.g. SaaS startups, real estate, e-commerce brands"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project structure</label>
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
                        <label className="text-sm font-medium text-gray-700">Charge tax?</label>
                        <button
                          onClick={() => setChargesTax(!chargesTax)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${chargesTax ? 'bg-purple-600' : 'bg-gray-300'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${chargesTax ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {chargesTax && (
                        <input
                          type="number"
                          value={taxRate}
                          onChange={e => setTaxRate(e.target.value)}
                          placeholder="Tax rate % (e.g. 8.5)"
                          className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document tone</label>
                      <div className="grid grid-cols-3 gap-2">
                        {TONE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setTonePreference(opt.value)}
                            className={`px-3 py-2 rounded-lg text-xs border text-center transition ${
                              tonePreference === opt.value
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Common services</label>
                      <textarea
                        value={commonServices}
                        onChange={e => setCommonServices(e.target.value)}
                        placeholder="e.g. brand identity, logo design, style guides"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving...' : 'Save Business Profile'}
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900">Business Logo</h3>
                      <p className="text-sm text-gray-600 mt-1">Upload your logo to display on invoices and proposals</p>
                    </div>

                    {uploadMessage && (
                      <div className={`mb-4 p-3 rounded text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {uploadMessage.text}
                      </div>
                    )}

                    {logoUrl ? (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <img src={logoUrl} alt="Your logo" className="max-h-32 max-w-xs" />
                        </div>
                        <div className="flex gap-2">
                          <label className="flex-1 px-4 py-2 border-2 border-purple-200 rounded-lg text-center cursor-pointer hover:bg-purple-50 transition">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                            <span className="text-sm font-medium text-purple-600">{uploading ? 'Uploading...' : 'Change Logo'}</span>
                          </label>
                          <button
                            onClick={handleRemoveLogo}
                            className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-300 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{uploading ? 'Uploading...' : 'Click to upload logo'}</p>
                          <p className="text-gray-600 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Stripe Payouts */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">Stripe Payouts</h3>
                      {stripeConnectComplete && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          ✓ Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {stripeConnectComplete
                        ? 'Your Stripe account is connected. Client payments go directly to your bank account.'
                        : 'Connect your Stripe account so client payments deposit directly into your bank. Takes about 2 minutes.'}
                    </p>
                    {stripeMessage && (
                      <div className={`mb-4 p-3 rounded text-sm ${stripeMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {stripeMessage.text}
                      </div>
                    )}
                    {!stripeConnectComplete && (
                      <button
                        onClick={handleConnectStripe}
                        disabled={stripeConnecting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        {stripeConnecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account →'}
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Timezone</h3>
                        <p className="text-sm text-gray-600 mt-1">All dates and times will be displayed in your selected timezone</p>
                      </div>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="ml-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Sections - Notifications & Automation */}
              <div className="pt-8 border-t border-gray-200">
                {settings.map((settingGroup) => (
                  <div key={settingGroup.section} className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{settingGroup.section}</h2>
                    <div className="space-y-4">
                      {settingGroup.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.label}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          <button
                            onClick={() => item.onChange(!item.enabled)}
                            className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                              item.enabled ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                item.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan & Billing */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Plan & Billing</h2>
              <p className="text-sm text-gray-500 mb-6">You are currently on the <span className="font-semibold text-[#0d1b2a] capitalize">{currentPlan}</span> plan.</p>

              {subMessage && (
                <div className={`mb-6 p-3 rounded-lg text-sm ${subMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {subMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {(['free', 'pro', 'business'] as const).map((planKey) => {
                  const plan = PLANS[planKey]
                  const isCurrentPlan = currentPlan === planKey
                  const isSelected = selectedPlan === planKey
                  const isPastDue = isCurrentPlan && subStatus === 'past_due'

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`rounded-xl border-2 p-5 flex flex-col gap-3 transition cursor-pointer ${
                        isSelected
                          ? 'border-[#0d1b2a] bg-[#0d1b2a] text-white shadow-lg'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-orange-400' : 'text-gray-400'}`}>
                          {plan.name}{isCurrentPlan && !isSelected ? ' (current)' : ''}
                        </p>
                        <p className="text-2xl font-bold font-display">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                          {plan.price > 0 && <span className={`text-sm font-normal ml-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>/mo</span>}
                        </p>
                      </div>
                      <ul className="space-y-1 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className={`text-xs flex items-start gap-1.5 ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="text-orange-400 mt-0.5">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2">
                        {isCurrentPlan && planKey !== 'free' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleManageBilling() }}
                            disabled={portalLoading}
                            className={`w-full text-xs text-center py-2 rounded-lg border transition ${isSelected ? 'border-white/30 text-white hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {portalLoading ? 'Loading...' : 'Manage Billing'}
                          </button>
                        )}
                        {isPastDue && <p className="text-xs text-orange-400 mt-2 text-center">⚠️ Payment past due</p>}
                        {isCurrentPlan && planKey === 'free' && (
                          <p className={`text-xs text-center mt-1 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>3 docs/month</p>
                        )}
                        {!isCurrentPlan && (
                          <button
                            onClick={(e) => { e.stopPropagation(); planKey !== 'free' && handleUpgrade(planKey) }}
                            disabled={!!upgradingPlan || planKey === 'free'}
                            className={`w-full py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                              isSelected
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            {upgradingPlan === planKey ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sign Out */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sign Out</h3>
                  <p className="text-sm text-gray-600 mt-1">{user?.emailAddresses?.[0]?.emailAddress}</p>
                </div>
                <button
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="text-sm font-semibold text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Sign out
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h2>
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">Permanently delete your account and all associated data.</p>
                <button className="mt-4 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>}>
      <SettingsContent />
    </Suspense>
  )
}
