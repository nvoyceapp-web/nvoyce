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
            {/* Header Infographic */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 mb-8 border border-orange-100">
                {/* Illustration */}
                <div className="flex-shrink-0">
                  <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background circle */}
                    <circle cx="80" cy="80" r="75" fill="#fff7ed" />

                    {/* Monitor body */}
                    <rect x="28" y="38" width="90" height="62" rx="7" fill="#1e1b4b" />
                    <rect x="33" y="43" width="80" height="50" rx="4" fill="#fef3c7" />

                    {/* Screen — toggle rows */}
                    <rect x="40" y="52" width="28" height="4" rx="2" fill="#9ca3af" opacity="0.6"/>
                    {/* Toggle ON */}
                    <rect x="88" y="50" width="18" height="8" rx="4" fill="#f97316"/>
                    <circle cx="101" cy="54" r="3.5" fill="white"/>

                    <rect x="40" y="63" width="24" height="4" rx="2" fill="#9ca3af" opacity="0.6"/>
                    {/* Toggle OFF */}
                    <rect x="88" y="61" width="18" height="8" rx="4" fill="#d1d5db"/>
                    <circle cx="91" cy="65" r="3.5" fill="white"/>

                    <rect x="40" y="74" width="32" height="4" rx="2" fill="#9ca3af" opacity="0.6"/>
                    {/* Slider */}
                    <rect x="40" y="83" width="52" height="3" rx="1.5" fill="#e5e7eb"/>
                    <rect x="40" y="83" width="34" height="3" rx="1.5" fill="#f97316"/>
                    <circle cx="74" cy="84.5" r="4" fill="#f97316"/>

                    {/* Monitor stand */}
                    <rect x="68" y="100" width="10" height="10" rx="1" fill="#374151" opacity="0.6"/>
                    <rect x="58" y="109" width="30" height="4" rx="2" fill="#374151" opacity="0.5"/>

                    {/* Gear — top right */}
                    <g transform="translate(118, 38)">
                      <circle cx="10" cy="10" r="5" fill="none" stroke="#f97316" strokeWidth="2"/>
                      <circle cx="10" cy="10" r="2" fill="#f97316"/>
                      {[0,60,120,180,240,300].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180
                        const x1 = 10 + 7 * Math.cos(rad)
                        const y1 = 10 + 7 * Math.sin(rad)
                        const x2 = 10 + 9 * Math.cos(rad)
                        const y2 = 10 + 9 * Math.sin(rad)
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
                      })}
                    </g>

                    {/* Person — shadow */}
                    <ellipse cx="100" cy="142" rx="16" ry="7" fill="#f97316" opacity="0.1"/>
                    {/* Person — body */}
                    <rect x="88" y="118" width="22" height="24" rx="5" fill="#f97316" opacity="0.85"/>
                    {/* Person — head */}
                    <circle cx="99" cy="108" r="11" fill="#fcd9b1"/>
                    {/* Hair */}
                    <path d="M88 106 Q90 95 99 94 Q108 95 110 106 Q106 99 99 98 Q92 99 88 106Z" fill="#92400e"/>
                    {/* Eyes */}
                    <circle cx="95.5" cy="107" r="1.5" fill="#1e1b4b"/>
                    <circle cx="102.5" cy="107" r="1.5" fill="#1e1b4b"/>
                    {/* Smile */}
                    <path d="M95 112 Q99 115 103 112" stroke="#e07b54" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    {/* Arms */}
                    <path d="M88 124 Q76 126 72 118" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
                    <path d="M110 124 Q118 124 116 115" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>

                    {/* Sparkle — small */}
                    <circle cx="32" cy="130" r="3" fill="#f97316" opacity="0.4"/>
                    <circle cx="22" cy="118" r="2" fill="#f97316" opacity="0.25"/>
                    <circle cx="38" cy="142" r="2" fill="#f97316" opacity="0.3"/>
                  </svg>
                </div>

                {/* Text */}
                <div>
                  <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Settings</h1>
                  <p className="text-gray-500">
                    Customize your Nvoyce experience — your business profile, branding, payouts, and notification preferences all in one place.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Business Settings
                </h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Business Name
                    </h3>
                        {editingName ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
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
                        <button onClick={() => setEditingName(true)} className="text-orange-500 hover:text-orange-600 text-sm font-semibold ml-4">Edit</button>
                      )}
                    </div>
                  </div>

                  {/* Business Profile */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-5">
                    <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      Business Profile
                      <span className="text-xs text-gray-400 font-normal ml-1">Used by AI to generate better documents</span>
                    </h3>

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
                                ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
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
                                ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
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
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${chargesTax ? 'bg-orange-500' : 'bg-gray-300'}`}
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
                          className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
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
                                ? 'border-orange-500 bg-orange-50 text-orange-600 font-medium'
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving...' : 'Save Business Profile'}
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Business Logo
                    </h3>
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
                          <label className="flex-1 px-4 py-2 border-2 border-orange-200 rounded-lg text-center cursor-pointer hover:bg-orange-50 transition">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                            <span className="text-sm font-medium text-orange-500">{uploading ? 'Uploading...' : 'Change Logo'}</span>
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
                      <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-300 transition">
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
                      <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      Stripe Payouts
                    </h3>
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
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        {stripeConnecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account →'}
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Timezone
                      </h3>
                        <p className="text-sm text-gray-600 mt-1">All dates and times will be displayed in your selected timezone</p>
                      </div>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="ml-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      {settingGroup.section === 'Notifications' && (
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      )}
                      {settingGroup.section === 'Automation' && (
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                      {settingGroup.section}
                    </h2>
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
                              item.enabled ? 'bg-orange-500' : 'bg-gray-300'
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
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                Plan & Billing
              </h2>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Account
              </h2>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Danger Zone
              </h2>
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
