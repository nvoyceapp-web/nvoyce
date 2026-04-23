'use client'

import { useState, useImperativeHandle, forwardRef, ReactElement } from 'react'
import Link from 'next/link'

export type ActivePage = 'dashboard' | 'clients' | 'rate-card' | 'faq' | 'settings' | 'about' | 'analytics'

export interface SidebarHandle {
  open: () => void
}

interface SidebarProps {
  activePage?: ActivePage
}

const navIcons: Record<string, ReactElement> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  clients: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'rate-card': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  faq: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  about: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'create',    label: 'Create',    href: null },
  { key: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
  { key: 'clients',   label: 'Clients',   href: '/dashboard/clients' },
  { key: 'rate-card', label: 'Rate Card', href: '/dashboard/rate-card' },
  { key: 'faq',       label: 'FAQ',       href: '/dashboard/faq' },
  { key: 'settings',  label: 'Settings',  href: '/dashboard/settings' },
  { key: 'about',     label: 'About',     href: '/about' },
]

const Sidebar = forwardRef<SidebarHandle, SidebarProps>(function Sidebar({ activePage }, ref) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => setIsExpanded(true),
  }))

  function handleMouseLeave() {
    setIsExpanded(false)
    setShowCreate(false)
  }

  return (
    <aside
      className={`hidden lg:flex lg:flex-col flex-shrink-0 bg-white border-r border-gray-200 py-3 transition-all duration-200 ease-in-out overflow-hidden ${
        isExpanded ? 'w-52' : 'w-14'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={handleMouseLeave}
    >
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navItems.map((item) => {
          if (item.key === 'create') {
            return (
              <div key="create">
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition text-left"
                >
                  <span className="flex-shrink-0 w-6 flex items-center justify-center text-orange-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
                    isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
                  }`}>
                    {item.label}
                  </span>
                  {isExpanded && (
                    <span className="ml-auto text-gray-400 text-xs">{showCreate ? '▲' : '▼'}</span>
                  )}
                </button>

                {isExpanded && showCreate && (
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 mt-0.5 space-y-0.5">
                    <Link href="/dashboard/new?type=invoice" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                      <span className="flex-shrink-0 text-gray-500">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </span>
                      <span>Invoice</span>
                    </Link>
                    <Link href="/dashboard/new?type=proposal" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                      <span className="flex-shrink-0 text-gray-500">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                          <line x1="12" y1="12" x2="12" y2="16"/>
                          <line x1="10" y1="14" x2="14" y2="14"/>
                        </svg>
                      </span>
                      <span>Proposal</span>
                    </Link>
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href!}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition ${
                activePage === item.key
                  ? 'bg-purple-100 text-[#0d1b2a] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={`flex-shrink-0 w-6 flex items-center justify-center ${activePage === item.key ? 'text-purple-700' : 'text-gray-500'}`}>{navIcons[item.key]}</span>
              <span className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${
                isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
})

export default Sidebar
