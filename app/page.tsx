import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <>
      <style>{`
        :root {
          --orange: #ff6b1a;
          --orange-soft: #fff1e8;
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
          text-rendering: optimizeLegibility;
        }
        .nv-display {
          font-family: var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif;
          letter-spacing: -0.02em;
        }
        .nv-mono { font-family: ui-monospace, 'JetBrains Mono', monospace; }
        @media (max-width: 880px) {
          .nv-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .nv-tri { grid-template-columns: 1fr !important; }
          .nv-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .nv-nav-links { display: none !important; }
          .nv-footer-grid { grid-template-columns: 1fr !important; }
          .nv-cta { padding: 48px 28px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(251,250,247,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <NvoyceMark />
          <nav style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            <span className="nv-nav-links" style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
              {[['Pricing', '#pricing'], ['FAQ', '/dashboard/faq'], ['About', '/about']].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>{label}</Link>
              ))}
            </span>
            <Link href="/sign-in" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '8px 16px', borderRadius: 10,
              background: 'var(--orange)', color: 'white',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}>Start free</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: '64px 28px 48px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }} className="nv-hero-grid">
            <div>
              <span className="nv-mono" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 99,
                background: 'var(--paper-2)', color: 'var(--muted)',
                border: '1px solid var(--line)',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 22,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />
                AI-powered · Invoices & Proposals
              </span>

              <h1 className="nv-display" style={{
                fontSize: 'clamp(46px, 7vw, 88px)',
                fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95,
                color: 'var(--ink)', margin: '0 0 28px',
              }}>
                We do the<br />
                hard stuff.<br />
                <span style={{ color: 'var(--orange)' }}>You get paid.</span>
              </h1>

              <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 520, margin: '0 0 32px' }}>
                Nvoyce turns a three-line brief into a ready-to-send invoice or proposal.
                Reminders send themselves. Payments land with a toast.
                Your job is the work — not the chasing.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href="/sign-up" style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '16px 26px', borderRadius: 10,
                  background: 'var(--orange)', color: 'white',
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 600, fontSize: 15, textDecoration: 'none',
                }}>Start free — 3 docs on us</Link>
                <Link href="/sign-in" style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '16px 26px', borderRadius: 10,
                  background: 'transparent', color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontWeight: 600, fontSize: 15, textDecoration: 'none',
                }}>Sign in →</Link>
              </div>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 32, marginTop: 44, paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Avg. time to first send', value: '38s' },
                  { label: 'Faster payouts', value: '2.4×', delta: 'vs. email-first workflows' },
                  { label: 'Paid in full', value: '94%', delta: 'within 14 days of send' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="nv-mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                    <div className="nv-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em' }}>{s.value}</div>
                    {s.delta && <div className="nv-mono" style={{ fontSize: 11, color: 'var(--orange)', marginTop: 4 }}>{s.delta}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice card mock */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'white', border: '1px solid var(--line)',
                borderRadius: 16, padding: 28,
                boxShadow: '0 8px 40px rgba(13,27,42,0.10)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div className="nv-mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice</div>
                    <div className="nv-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>INV-2026-047</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 99, background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 600 }}>Awaiting payment</span>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginBottom: 20 }}>
                  {[
                    { desc: 'Brand identity design', qty: 1, amount: '$2,400' },
                    { desc: 'Logo variations (×3)', qty: 3, amount: '$900' },
                    { desc: 'Style guide document', qty: 1, amount: '$600' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.desc}</div>
                        <div className="nv-mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>qty {item.qty}</div>
                      </div>
                      <div className="nv-display" style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.amount}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <span className="nv-display" style={{ fontWeight: 600, color: 'var(--ink)' }}>Total due</span>
                  <span className="nv-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)' }}>$3,900</span>
                </div>
                <div style={{ width: '100%', padding: '14px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>Pay $3,900 →</div>
              </div>
              <div style={{
                position: 'absolute', top: -16, right: -8,
                background: 'var(--ink)', color: 'white',
                padding: '6px 10px', borderRadius: 8, transform: 'rotate(3deg)',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-space-grotesk), sans-serif',
              }}>← AI-generated in 38s</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE TRIPTYCH ── */}
      <section style={{ padding: '80px 28px', background: 'var(--ink)', color: 'white', marginTop: 40 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 50, flexWrap: 'wrap', gap: 20 }}>
            <h2 className="nv-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: 0, maxWidth: 600 }}>
              Three small robots.<br />One quiet tab.
            </h2>
            <span className="nv-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              01 · Draft · 02 · Send · 03 · Collect
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }} className="nv-tri">
            {[
              { n: '01', t: 'Drafts itself', d: 'Three fields in, one invoice out. Claude writes the line items, the tone, and the details. You approve.' },
              { n: '02', t: 'Sends and signs', d: 'Proposals get a link. Clients accept without signing up. The moment they do, an invoice is born and sent.' },
              { n: '03', t: 'Chases politely', d: "Payme remembers who owes you and when. Soft nudges at 14 and 30 days. You forget; we don't." },
            ].map(f => (
              <div key={f.n} style={{ padding: 26, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="nv-mono" style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: '0.08em' }}>{f.n}</span>
                <h3 className="nv-display" style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 10px', color: 'white' }}>{f.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT SECTION ── */}
      <section style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="nv-hero-grid">
          {/* Phone mock */}
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 280, background: 'var(--ink)', borderRadius: 36, padding: '28px 20px', boxShadow: '0 24px 80px rgba(13,27,42,0.18)' }}>
              <div style={{ background: 'white', borderRadius: 20, padding: 22 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div className="nv-mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment request</div>
                  <div className="nv-display" style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', marginTop: 8, letterSpacing: '-0.02em' }}>$3,900</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>from Meridian Studio</div>
                </div>
                <div style={{ background: 'var(--paper-2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Brand identity · INV-2026-047</div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>Due on receipt</div>
                </div>
                <div style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>Pay now →</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12 }}>
                  {['Apple Pay', 'Card', 'ACH'].map(m => (
                    <span key={m} className="nv-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="nv-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--paper-2)', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22 }}>For your clients</span>
            <h2 className="nv-display" style={{ fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '0 0 20px', color: 'var(--ink)' }}>
              A link.<br />A tap.<br />Paid.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460, marginBottom: 28 }}>
              Clients get a link. No login, no PDF wrangling, no wire instructions.
              One clean page with your brand, your amount, and a Stripe-powered pay button.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Apple Pay', 'Google Pay', 'Card', 'ACH', 'Bank transfer'].map(m => (
                <span key={m} className="nv-mono" style={{ padding: '4px 10px', borderRadius: 99, background: 'var(--paper-2)', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BRAND STORY ── */}
      <section style={{ padding: '80px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <span className="nv-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'white', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22 }}>The Braille tells the story</span>
          <h2 className="nv-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 20px', maxWidth: 820, color: 'var(--ink)' }}>
            Every invoice is a freelancer's voice —
            a declaration of work, worth, and the right to be paid.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 600, lineHeight: 1.65 }}>
            The orange dots inside the N spell "VOICE" in Braille. A reminder that financial tools should work for everyone — and a small secret for those who look closely.
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
          <span className="nv-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--paper-2)', color: 'var(--muted)', border: '1px solid var(--line)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22 }}>Simple pricing</span>
          <h2 className="nv-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '0 0 48px', color: 'var(--ink)' }}>
            Start free. Upgrade when it pays for itself.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto' }} className="nv-tri">
            {[
              { name: 'Free', price: '$0', desc: '', features: ['3 documents/month', 'AI generation', 'Stripe payment links', 'Email delivery'], highlight: false },
              { name: 'Pro', price: '$19.99', desc: '/mo', features: ['Unlimited documents', 'Everything in Free', 'Payme smart reminders', 'Priority support'], highlight: true },
              { name: 'Business', price: '$39.99', desc: '/mo', features: ['Everything in Pro', 'Team features', 'Custom branding', 'Early access'], highlight: false },
            ].map(plan => (
              <div key={plan.name} style={{ padding: 28, borderRadius: 16, background: plan.highlight ? 'var(--ink)' : 'white', border: plan.highlight ? 'none' : '1px solid var(--line)', textAlign: 'left' }}>
                <div className="nv-mono" style={{ fontSize: 11, color: plan.highlight ? 'var(--orange)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>
                <div className="nv-display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: plan.highlight ? 'white' : 'var(--ink)' }}>
                  {plan.price}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>{plan.desc}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: plan.highlight ? 'rgba(255,255,255,0.75)' : 'var(--muted)' }}>
                      <span style={{ color: 'var(--orange)', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" style={{ display: 'block', padding: '12px', borderRadius: 10, textAlign: 'center', background: plan.highlight ? 'var(--orange)' : 'transparent', border: plan.highlight ? 'none' : '1px solid var(--line)', color: plan.highlight ? 'white' : 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Get started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '20px 28px 100px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="nv-cta" style={{ background: 'var(--orange)', color: 'white', padding: '80px 48px', borderRadius: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <h2 className="nv-display" style={{ fontSize: 'clamp(42px, 6vw, 78px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
              Stop chasing.<br />Start getting paid.
            </h2>
            <p style={{ fontSize: 17, opacity: 0.9, maxWidth: 520, margin: '22px auto 32px' }}>
              Because no one started freelancing to chase invoices.
            </p>
            <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'var(--ink)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start your free trial →</Link>
              <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.24)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 60px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }} className="nv-footer-grid">
          <div>
            <NvoyceMark />
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>
              We do the hard stuff. You get paid. Invoices, proposals, reminders and payouts — from one quiet tab.
            </p>
          </div>
          {([
            ['Product', ['Invoices', 'Proposals', 'Payme', 'Pricing']],
            ['Company', ['About', 'FAQ', 'Changelog']],
            ['Contact', ['hello@nvoyce.ai', 'support@nvoyce.ai']],
          ] as [string, string[]][]).map(([t, items]) => (
            <div key={t}>
              <div className="nv-display" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>{t}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(i => (
                  <li key={i}><a href={i.includes('@') ? `mailto:${i}` : '#'} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1240, margin: '40px auto 0', display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 14 }}>
          <span className="nv-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>© 2026 nvoyce · Stop chasing. Start getting paid.</span>
          <span className="nv-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>The orange dots in the N spell "VOICE" in Braille.</span>
        </div>
      </footer>
    </>
  )
}

function NvoyceMark() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-label="nvoyce">
        <rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a" />
        <rect x="9" y="9" width="3.2" height="22" fill="white" />
        <rect x="27.8" y="9" width="3.2" height="22" fill="white" />
        <path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white" />
        <circle cx="17.5" cy="14" r="1.2" fill="#ff6b1a" />
        <circle cx="22.5" cy="14" r="1.2" fill="#ff6b1a" />
        <circle cx="17.5" cy="20" r="1.2" fill="#ff6b1a" />
        <circle cx="22.5" cy="20" r="1.2" fill="#ff6b1a" />
        <circle cx="17.5" cy="26" r="1.2" fill="#ff6b1a" />
        <circle cx="22.5" cy="26" r="1.2" fill="#ff6b1a" />
      </svg>
      <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#0d1b2a', lineHeight: 1 }}>nvoyce</span>
    </div>
  )
}
