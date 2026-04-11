'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UserSettings {
  user_id: string
  logo_url?: string
  business_name?: string
  updated_at?: string
}

export default function SettingsPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!userId) return

    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          setSettings(data)
          setBusinessName(data.business_name || '')
          setLogoUrl(data.logo_url || '')
        } else if (error?.code === 'PGRST116') {
          setSettings(null)
        } else {
          console.error('Error fetching settings:', error)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
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
      setUploadMessage({ type: 'success', text: '✅ Logo uploaded successfully' })
    } catch (err) {
      console.error('Upload error:', err)
      setUploadMessage({ type: 'error', text: '❌ Failed to upload logo' })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!userId) return

    setSaving(true)
    try {
      const settingsData = {
        user_id: userId,
        business_name: businessName || undefined,
        logo_url: logoUrl || undefined,
        updated_at: new Date().toISOString(),
      }

      if (settings) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([settingsData])

        if (error) throw error
      }

      setSettings(settingsData)
      setUploadMessage({ type: 'success', text: '✅ Settings saved' })
      setTimeout(() => setUploadMessage(null), 3000)
    } catch (err) {
      console.error('Save error:', err)
      setUploadMessage({ type: 'error', text: '❌ Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:flex-col w-60 bg-purple-50 border-r border-purple-200 px-4 py-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mb-8">
            ← Back to Dashboard
          </Link>
          <nav className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-gray-900 px-3 py-2">Settings</div>
            <Link href="/dashboard/settings" className="px-3 py-2 rounded-lg bg-white text-sm font-medium">
              ⚙️ Branding
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-4 lg:px-10 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Customize how your invoices and proposals appear to clients</p>

            {uploadMessage && (
              <div
                className={`rounded-lg p-4 mb-6 ${
                  uploadMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                {uploadMessage.text}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-8">
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used on invoices and proposals</p>
              </div>

              <div className="mb-8 pb-8 border-b border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Business Logo
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your logo to display on invoices and proposals. Max 5MB.
                </p>

                {logoUrl && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                      <img src={logoUrl} alt="Logo" className="h-24 object-contain" />
                      <p className="text-xs text-gray-500 mt-2">Your logo preview</p>
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 cursor-pointer"
                    />
                  </label>
                  {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-semibold"
                >
                  {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
