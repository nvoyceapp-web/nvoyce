'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ActivePage = 'dashboard' | 'faq' | 'settings' | 'about'

interface SidebarProps {
  activePage?: ActivePage
}

const navItems = [
  { key: 'dashboard', icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { key: 'create',    icon: '✨', label: 'Create',    href: null },
  { key: 'faq',       icon: '❓', label: 'FAQ',       href: '/dashboard/faq' },
  { key: 'settings',  icon: '⚙️', label: 'Settings',  href: '/dashboard/settings' },
  { key: 'about',     icon: 'ℹ️', label: 'About',     href: '/about' },
]

export default function Sidebar({ activePage }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  function handleMouseLeave() {
    setIsExpanded(false)
    setShowCreate(false)
  }

  return (
    <aside
      className={`hidden lg:flex lg:flex-col flex-shrink-0 bg-purple-50 border-r border-purple-200 py-4 transition-all duration-200 ease-in-out overflow-hidden ${
        isExpanded ? 'w-60' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header — hamburger + logo */}
      <div className="flex items-center px-3 mb-6 gap-3 h-10">
        {/* Hamburger — always visible */}
        <button
          onClick={() => setIsExpanded(true)}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-purple-100 transition"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Wordmark — fades in when expanded */}
        <div className={`transition-all duration-150 overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
          <img
            src="/logo-wordmark.png"
            alt="Nvoyce"
            className="h-7 w-auto object-contain"
          />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1 px-2">
        {navItems.map((item) => {
          const isActive = activePage === item.key

          if (item.key === 'create') {
            return (
              <div key="create">
                <button
                  onClick={() => isExpanded && setShowCreate(!showCreate)}
                  className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition text-left ${
                    isActive
                      ? 'bg-purple-200 text-purple-900 font-medium'
                      : 'text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  <span className="flex-shrink-0 w-6 text-center text-base">{item.icon}</span>
                  <span className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                    {item.label}
                  </span>
                  {isExpanded && (
                    <span className="ml-auto text-gray-400 text-xs">{showCreate ? '▲' : '▼'}</span>
                  )}
                </button>

                {/* Create sub-items */}
                {isExpanded && showCreate && (
                  <div className="ml-4 pl-3 border-l-2 border-purple-200 mt-0.5 space-y-0.5">
                    <Link
                      href="/dashboard/new?type=invoice"
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-purple-100 transition"
                    >
                      <span>📄</span>
                      <span>Invoice</span>
                    </Link>
                    <Link
                      href="/dashboard/new?type=proposal"
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-purple-100 transition"
                    >
                      <span>💼</span>
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
                isActive
                  ? 'bg-purple-200 text-purple-900 font-medium'
                  : 'text-gray-600 hover:bg-purple-100'
              }`}
            >
              <span className="flex-shrink-0 w-6 text-center text-base">{item.icon}</span>
              <span className={`whitespace-nowrap transition-all duration-150 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
