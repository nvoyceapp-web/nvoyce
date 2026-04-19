import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import AboutDashboard from './_components/AboutDashboard'
import PublicNav from '@/components/PublicNav'

export default async function AboutPage() {
  const { userId } = await auth()
  if (userId) return <AboutDashboard />
  return (
    <>
      <style>{`
        :root {
          --orange: #e04e1a;
          --ink: #0d1b2a;
          --ink-2: #1a2f45;
          --paper: #fbfaf7;
          --paper-2: #f3efe7;
          --line: #e8e2d5;
          --muted: #6b6558;
          --text: #1a1915;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: var(--paper);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }
        @media (max-width: 640px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <PublicNav activePage="about" />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '64px 28px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 72 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--paper-2)', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace', marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />
            About Nvoyce
          </span>
          <h1 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, color: 'var(--ink)', margin: '0 0 24px' }}>
            We do the hard stuff.<br />
            <span style={{ color: 'var(--orange)' }}>You get paid.</span>
          </h1>
          <p style={{ fontSize: 19, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
            Invoicing and proposals shouldn&apos;t slow you down. Most freelancers spend
            too much time on admin instead of doing the work they love. We&apos;re changing that.
          </p>
        </div>

        {/* Mission */}
        <section style={{ marginBottom: 72 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Our Mission</span>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)', margin: '12px 0 20px' }}>
            Built for people who work for themselves.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 640, marginBottom: 16 }}>
            Nvoyce automates the hard stuff — invoice generation, payment tracking, and smart reminders.
            So you can focus on delivering great work and getting paid on time.
          </p>
          <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 640 }}>
            We believe freelancers deserve the same professional tools as big companies.
            A three-line brief in, a ready-to-send invoice out. That&apos;s the whole idea.
          </p>
        </section>

        {/* Core Values */}
        <section style={{ marginBottom: 72 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Values</span>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)', margin: '12px 0 32px' }}>
            How we think about this.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }} className="about-grid">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                ),
                title: 'Speed',
                desc: 'Create an invoice in seconds. Get paid faster with automated reminders and intelligent prioritization.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                ),
                title: 'Simplicity',
                desc: 'Intuitive tools that work the way you think. No complicated workflows or unnecessary features.',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: 'Empowerment',
                desc: "Built for freelancers, by people who understand your challenges. Your success is our success.",
              },
            ].map(v => (
              <div key={v.title} style={{ padding: 24, borderRadius: 14, background: 'white', border: '1px solid var(--line)' }}>
                <div style={{ marginBottom: 14 }}>{v.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', margin: '0 0 10px' }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand story */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ background: 'var(--ink)', borderRadius: 20, padding: '48px 40px', display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Hidden in plain sight</span>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: 0, lineHeight: 1.1 }}>
              The orange dots inside the N spell <span style={{ color: 'var(--orange)' }}>"VOICE"</span> in Braille.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 620, margin: 0 }}>
              Nvoyce is a fusion of <em>invoice</em> and <em>voice</em> — because every invoice is a freelancer&apos;s voice:
              a declaration of their work, their worth, and their right to be paid. The Braille lettering is a nod
              to universal access, a reminder that financial tools should work for everyone, and a tiny secret
              for those who look closely.
            </p>
          </div>
        </section>

        {/* What makes us different */}
        <section style={{ marginBottom: 72 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Features</span>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(28px, 3vw, 38px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)', margin: '12px 0 32px' }}>
            What makes Nvoyce different.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                title: 'Instant AI invoicing',
                desc: 'Generate professional invoices and proposals with AI in seconds, not hours.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
                title: 'Smart reminders (Payme)',
                desc: "Intelligent follow-ups on overdue invoices so you never lose track of money owed to you.",
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                title: 'Real-time insights',
                desc: 'Track payment patterns, outstanding invoices, and cash flow at a glance.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e04e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
                title: 'Shareable proposals',
                desc: 'Send clients a link to review and accept — no sign-up required. Invoice auto-generates the moment they accept.',
              },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: 20, background: 'white', borderRadius: 12, border: '1px solid var(--line)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--orange)', borderRadius: 20, padding: '56px 40px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: '0 0 16px', lineHeight: 1 }}>
            Stop chasing.<br />Start getting paid.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 32 }}>
            Because no one started freelancing to chase invoices.
          </p>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', borderRadius: 10, background: 'var(--ink)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Start free — 3 docs on us
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 60px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ textDecoration: 'none' }}><NvoyceMark /></Link>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {([['Pricing', '/#pricing'], ['FAQ', '/faq'], ['About', '/about'], ['Sign in', '/sign-in']] as [string, string][]).map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>© 2026 nvoyce</span>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>
              <a href="mailto:hello@nvoyce.ai" style={{ color: 'var(--muted)', textDecoration: 'none' }}>hello@nvoyce.ai</a>
              {' · '}
              <a href="mailto:support@nvoyce.ai" style={{ color: 'var(--muted)', textDecoration: 'none' }}>support@nvoyce.ai</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
