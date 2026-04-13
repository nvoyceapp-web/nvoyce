'use client'

import Link from 'next/link'
import Sidebar, { SidebarHandle } from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

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

export default function SettingsPage() {
  const { user } = useUser()
  const { userId } = useAuth()
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

    async function fetchLogo() {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('logo_url')
          .eq('user_id', userId)
          .single()

        if (!error && data?.logo_url) {
          setLogoUrl(data.logo_url)
        }
      } catch (err) {
        console.error('Error fetching logo:', err)
      }
    }

    fetchLogo()
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
    if (!user) return
    await user.update({ unsafeMetadata: { ...user.unsafeMetadata, businessName: nameInput } })
    setBusinessName(nameInput)
    setEditingName(false)
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
      <TopBar onHamburgerClick={() => sidebarRef.current?.open()} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar ref={sidebarRef} activePage="settings" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
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

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-gray-200">
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
