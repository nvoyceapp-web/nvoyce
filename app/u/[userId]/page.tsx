import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase-server'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const { data } = await supabaseServer
    .from('user_settings')
    .select('business_name')
    .eq('user_id', userId)
    .single()

  const name = data?.business_name || 'Freelancer'
  return {
    title: `${name} — Nvoyce Profile`,
    description: `Work with ${name}. View services, rates, and get in touch.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params

  // Fetch profile settings
  const { data: settings } = await supabaseServer
    .from('user_settings')
    .select('business_name, logo_url, business_type, common_services, bio, contact_email')
    .eq('user_id', userId)
    .single()

  if (!settings) notFound()

  // Fetch published service templates / rate card
  const { data: services } = await supabaseServer
    .from('service_templates')
    .select('id, name, description, unit_price')
    .eq('user_id', userId)
    .order('unit_price', { ascending: true })

  const businessName = settings.business_name || 'Independent Freelancer'
  const logoUrl = settings.logo_url || null
  const businessType = settings.business_type || null
  const commonServices: string[] = settings.common_services || []
  const bio = settings.bio || null
  const contactEmail = settings.contact_email || null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="https://nvoyce.ai" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a" />
            <rect x="9" y="9" width="3.2" height="22" fill="white" />
            <rect x="27.8" y="9" width="3.2" height="22" fill="white" />
            <path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white" />
            <circle cx="17.5" cy="14" r="1.2" fill="#e04e1a" />
            <circle cx="22.5" cy="14" r="1.2" fill="#e04e1a" />
            <circle cx="17.5" cy="20" r="1.2" fill="#e04e1a" />
            <circle cx="22.5" cy="20" r="1.2" fill="#e04e1a" />
            <circle cx="17.5" cy="26" r="1.2" fill="#e04e1a" />
            <circle cx="22.5" cy="26" r="1.2" fill="#e04e1a" />
          </svg>
          <span className="text-sm font-semibold text-gray-500">nvoyce</span>
        </a>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo / avatar */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${businessName} logo`}
                  className="w-20 h-20 object-contain rounded-xl border border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#0d1b2a] flex items-center justify-center text-white text-2xl font-bold font-display">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + type */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 font-display">{businessName}</h1>
              {businessType && (
                <p className="text-sm text-gray-500 mt-1">{businessType}</p>
              )}
              {bio && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{bio}</p>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-white bg-[#e04e1a] hover:bg-[#c23d10] px-4 py-2 rounded-lg transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Get in touch
                </a>
              )}
            </div>
          </div>

          {/* Common services tags */}
          {commonServices.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {commonServices.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rate card / services */}
        {services && services.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Services & Rates
            </h2>
            <div className="divide-y divide-gray-50">
              {services.map((svc) => (
                <div key={svc.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                    {svc.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{svc.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ${svc.unit_price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {contactEmail && (
          <div className="bg-[#0d1b2a] rounded-2xl p-8 text-center">
            <p className="text-white font-semibold text-lg mb-2">Ready to work together?</p>
            <p className="text-gray-400 text-sm mb-6">Send a message and {businessName} will get back to you.</p>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 bg-[#e04e1a] hover:bg-[#c23d10] text-white font-semibold text-sm px-6 py-3 rounded-xl transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact {businessName}
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <a href="https://nvoyce.ai" className="font-semibold hover:text-gray-600 transition">
            Nvoyce
          </a>
          {' '}— AI invoices &amp; proposals for freelancers
        </p>
      </footer>
    </div>
  )
}
