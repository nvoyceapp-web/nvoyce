'use client'

import Link from 'next/link'
import { useState } from 'react'

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-full lg:w-60 bg-purple-50 border-r border-purple-200 flex flex-col px-4 py-6">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 mb-8 px-2">
            Nvoyce
          </Link>
          <nav className="flex flex-col gap-1 flex-1">
            <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
              ← Back to Dashboard
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
              <p className="text-lg text-gray-600">Customize your Nvoyce experience and manage notifications.</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-8">
              {settings.map((settingGroup) => (
                <div key={settingGroup.section}>
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

            {/* Business Settings */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h2>
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

            {/* Account Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Business Name</h3>
                    <p className="text-sm text-gray-600 mt-1">Wanderlust Trips</p>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-semibold">Edit</button>
                </div>
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
