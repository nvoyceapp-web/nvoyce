'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import Link from 'next/link'

export type ActivePage = 'dashboard' | 'faq' | 'settings' | 'about'

export interface SidebarHandle {
  open: () => void
}

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
                  <span className="flex-shrink-0 w-6 text-center text-base">{item.icon}</span>
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
                      <span>📄</span><span>Invoice</span>
                    </Link>
                    <Link href="/dashboard/new?type=proposal" className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
                      <span>💼</span><span>Proposal</span>
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
              className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              <span className="flex-shrink-0 w-6 text-center text-base">{item.icon}</span>
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
