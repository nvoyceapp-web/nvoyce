'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'

// ─── Color token ───────────────────────────────────────────────────────────
const ORANGE = '#e04e1a'

// ─── Shared atoms ──────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 99,
      background: 'var(--paper-2)', color: 'var(--muted)',
      border: '1px solid var(--line)',
      fontSize: 11, fontFamily: 'ui-monospace, monospace',
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </span>
  )
}

// ─── Demo 1: Invoice auto-generating ───────────────────────────────────────
function InvoiceGenDemo() {
  const script = [
    { k: 'Client',  v: 'Meridian Studio' },
    { k: 'Project', v: 'Brand identity — Q2 sprint' },
    { k: 'Amount',  v: '$4,200.00' },
    { k: 'Due',     v: 'Net 14' },
  ]
  const [phase, setPhase] = useState(0)
  const [typed, setTyped] = useState(0)
  const [lines, setLines] = useState<{ d: string; q: number; r: number; t: number }[]>([])
  const [progress, setProgress] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const fullScript = script.map(s => `${s.k}: ${s.v}`).join('\n')
    const items = [
      { d: 'Brand discovery + research', q: 1, r: 1200, t: 1200 },
      { d: 'Logo exploration (3 routes)', q: 3, r: 600,  t: 1800 },
      { d: 'Type + color system',         q: 1, r: 800,  t: 800  },
      { d: 'Style guide + handoff',        q: 1, r: 400,  t: 400  },
    ]
    async function run() {
      while (mounted.current) {
        setPhase(0); setTyped(0); setLines([]); setProgress(0)
        for (let i = 0; i <= fullScript.length; i++) {
          if (!mounted.current) return
          setTyped(i)
          await delay(22)
        }
        await delay(350)
        setPhase(1)
        for (let p = 0; p <= 100; p += 4) {
          if (!mounted.current) return
          setProgress(p)
          await delay(30)
        }
        setPhase(2)
        for (let i = 0; i < items.length; i++) {
          if (!mounted.current) return
          setLines(prev => [...prev, items[i]])
          await delay(220)
        }
        await delay(2800)
      }
    }
    run()
    return () => { mounted.current = false }
  }, [])

  const fullScript = script.map(s => `${s.k}: ${s.v}`).join('\n')
  const visible = fullScript.slice(0, typed)
  const progressPct = phase === 0 ? (typed / fullScript.length) * 100 : phase === 1 ? progress : 100

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.3fr', minHeight: 340 }}>
      {/* Left: prompt */}
      <div style={{ padding: 18, borderRight: '1px solid var(--line)', background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: ORANGE }} />
          <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>New invoice</span>
        </div>
        <pre style={{ fontSize: 12.5, lineHeight: 1.7, margin: 0, color: 'var(--text)', whiteSpace: 'pre-wrap', minHeight: 120, fontFamily: 'ui-monospace, monospace' }}>
          {visible}
          {phase === 0 && <span style={{ borderLeft: `2px solid ${ORANGE}`, marginLeft: 1 }} />}
        </pre>
        <div style={{ marginTop: 18, display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: ORANGE, transition: 'width 80ms linear' }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'var(--muted)' }}>
            {phase === 0 ? 'Drafting…' : phase === 1 ? 'Generating…' : 'Done ✓'}
          </span>
        </div>
      </div>
      {/* Right: generated invoice */}
      <div style={{ padding: 18, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Invoice</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>INV-2026-041</div>
          </div>
          <div style={{ padding: '3px 8px', borderRadius: 99, background: phase === 2 ? `${ORANGE}22` : 'var(--line)', color: phase === 2 ? ORANGE : 'var(--muted)', fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
            {phase === 2 ? 'Ready' : 'Drafting'}
          </div>
        </div>
        <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, fontSize: 10, color: 'var(--muted)', marginBottom: 8, fontFamily: 'ui-monospace, monospace' }}>
            <span>DESCRIPTION</span><span>QTY</span><span>RATE</span><span style={{ textAlign: 'right' }}>TOTAL</span>
          </div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--line)', animation: 'nvSlideIn 240ms ease-out' }}>
              <span>{l.d}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{l.q}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>${l.r.toLocaleString()}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', textAlign: 'right', fontWeight: 600 }}>${l.t.toLocaleString()}</span>
            </div>
          ))}
          {phase === 2 && lines.length === 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--text)', animation: 'nvFade 260ms ease-out' }}>
              <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: ORANGE, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>$4,200.00</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Demo 2: Dashboard with live toast + sparkline ──────────────────────────
function DashboardDemo() {
  const [paid, setPaid] = useState(12840)
  const [toastKey, setToastKey] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastAmt, setToastAmt] = useState(1200)
  const [spark, setSpark] = useState(() => Array.from({ length: 24 }, (_, i) => 20 + Math.sin(i / 3) * 8 + Math.random() * 6))
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const amounts = [1200, 850, 3400, 620, 2100]
    async function run() {
      await delay(2000)
      let i = 0
      while (mounted.current) {
        const amt = amounts[i % amounts.length]
        setToastAmt(amt)
        setToastKey(k => k + 1)
        setToastVisible(true)
        setPaid(p => p + amt)
        setSpark(s => [...s.slice(1), 30 + Math.random() * 30])
        await delay(3600)
        setToastVisible(false)
        await delay(2400)
        i++
      }
    }
    run()
    return () => { mounted.current = false }
  }, [])

  const max = Math.max(...spark), min = Math.min(...spark)
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * 240
    const y = 50 - ((v - min) / (max - min + 0.01)) * 40
    return [x, y]
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  const fill = `${line} L 240 60 L 0 60 Z`

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, position: 'relative', minHeight: 340, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>This month</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Cash flow</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map((t, i) => (
            <span key={t} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: i === 1 ? 'var(--ink)' : 'transparent', color: i === 1 ? 'var(--paper)' : 'var(--muted)', border: '1px solid var(--line)', fontFamily: 'ui-monospace, monospace' }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
          ${paid.toLocaleString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: ORANGE, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>↑ 23.4%</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>vs last month</span>
        </div>
      </div>
      <svg viewBox="0 0 240 60" style={{ width: '100%', height: 70, display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={ORANGE} stopOpacity="0.35" />
            <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#sparkFill)" />
        <path d={line} fill="none" stroke={ORANGE} strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={ORANGE} />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill={ORANGE} opacity="0.25">
          <animate attributeName="r" values="3;10;3" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
        {[{ l: 'Outstanding', v: '$3,420' }, { l: 'Overdue', v: '$0' }, { l: 'Drafts', v: '2' }].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{s.l}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginTop: 2, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* Toast */}
      <div key={toastKey} style={{ position: 'absolute', right: 14, bottom: 14, background: 'var(--ink)', color: 'white', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, opacity: toastVisible ? 1 : 0, transform: toastVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 360ms cubic-bezier(.2,.8,.2,1)', boxShadow: '0 10px 30px rgba(13,27,42,0.25)', minWidth: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: ORANGE, display: 'grid', placeItems: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>✓</div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'ui-monospace, monospace' }}>PAID</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>+${toastAmt.toLocaleString()} received</div>
        </div>
      </div>
    </div>
  )
}

// ─── Demo 3: Payment phone ──────────────────────────────────────────────────
function PaymentPhoneDemo() {
  const [state, setState] = useState<'view' | 'paying' | 'paid'>('view')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    async function run() {
      while (mounted.current) {
        setState('view');   await delay(2400)
        setState('paying'); await delay(1600)
        setState('paid');   await delay(2200)
      }
    }
    run()
    return () => { mounted.current = false }
  }, [])

  return (
    <div style={{ width: 240, height: 480, background: '#0b0d10', borderRadius: 34, border: '10px solid #1a1d22', boxShadow: '0 20px 60px rgba(13,27,42,0.25)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 70, height: 18, background: '#000', borderRadius: 99, zIndex: 10 }} />
      <div style={{ background: 'var(--paper)', height: '100%', paddingTop: 32 }}>
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'var(--muted)' }}>nvoyce.ai/p/4f2a</span>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: ORANGE }} />
        </div>
        <div style={{ padding: '4px 16px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>From</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Aria Chen Design</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Amount due</div>
          <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>$1,200.00</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>Invoice INV-2026-038 · Due Apr 30</div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Design consultation', '$800'], ['Revisions (2)', '$400']].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{r[0]}</span><span style={{ fontFamily: 'ui-monospace, monospace' }}>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{ width: '100%', padding: '14px', borderRadius: 12, background: state === 'paid' ? '#10b981' : 'var(--ink)', color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-space-grotesk), sans-serif', transition: 'all 280ms ease', textAlign: 'center' }}>
            {state === 'view' && 'Pay $1,200 →'}
            {state === 'paying' && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Processing…</span>}
            {state === 'paid' && '✓ Paid — thanks!'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', marginTop: 8, fontFamily: 'ui-monospace, monospace' }}>Secured by Stripe</div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 99, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'nvSpin 0.8s linear infinite' }} />
}

// ─── Demo 4: Payme assistant ────────────────────────────────────────────────
function PaymeDemo() {
  const [step, setStep] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    async function run() {
      while (mounted.current) {
        for (let i = 0; i < 4; i++) {
          if (!mounted.current) return
          setStep(i)
          await delay(1700)
        }
      }
    }
    run()
    return () => { mounted.current = false }
  }, [])

  const items = [
    { who: 'Meridian Studio',  amt: '$4,200', days: 14 },
    { who: 'Hollow Creative',  amt: '$1,850', days: 7  },
    { who: 'Paige & Co.',      amt: '$620',   days: 2  },
  ]
  const messages = [
    <>Watching <b>3 invoices</b>. No overdue today. I'll ping you if anything changes.</>,
    <><b>Meridian Studio</b> crossed 14 days overdue. Sending a gentle nudge — this client usually pays within 48h.</>,
    <>Reminder sent ✓. I'll check in again in 3 days unless they pay first.</>,
    <>💸 <b>Meridian Studio</b> just paid <b>$4,200</b>. I'll keep watching the other two.</>,
  ]

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: 18, minHeight: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: ORANGE, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: 16 }}>P</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Payme by Nvoyce</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>Built-in reminder assistant</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: '#10b981', display: 'inline-block', animation: 'nvPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>Active</span>
        </div>
      </div>
      <div style={{ background: 'var(--paper-2)', padding: 12, borderRadius: 10, border: '1px solid var(--line)', fontSize: 12, color: 'var(--text)', lineHeight: 1.5, minHeight: 70 }}>
        {messages[step]}
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => {
          const hot = step >= 1 && i === 0 && step < 3
          const paid = step === 3 && i === 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: hot ? `${ORANGE}18` : 'transparent', border: `1px solid ${hot ? ORANGE : 'var(--line)'}`, transition: 'all 320ms ease', opacity: paid ? 0.5 : 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: paid ? '#10b981' : hot ? ORANGE : 'var(--muted)' }} />
              <span style={{ fontSize: 12 }}>{it.who}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'ui-monospace, monospace' }}>{it.amt}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--line)', color: 'var(--muted)', minWidth: 50, textAlign: 'center' as const, fontFamily: 'ui-monospace, monospace' }}>
                {paid ? 'PAID' : `${it.days}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Demo 5: Proposal → Invoice flow ───────────────────────────────────────
function ProposalFlowDemo() {
  const [stage, setStage] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    async function run() {
      while (mounted.current) {
        for (let i = 0; i <= 3; i++) {
          if (!mounted.current) return
          setStage(i)
          await delay(1800)
        }
        await delay(600)
      }
    }
    run()
    return () => { mounted.current = false }
  }, [])

  const nodes = [
    { label: 'Proposal sent',           sub: 'PRO-2026-019' },
    { label: 'Client accepted ✓',       sub: 'by client' },
    { label: 'Invoice auto-generated',  sub: 'INV-2026-042' },
    { label: 'Pay link + QR sent',       sub: 'via Stripe' },
  ]

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, minHeight: 340 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>
        Proposal → Invoice · Live
      </div>
      <div style={{ position: 'relative' }}>
        {nodes.map((n, i) => {
          const active = stage >= i
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', opacity: active ? 1 : 0.35, transition: 'opacity 400ms', position: 'relative' }}>
              {i < nodes.length - 1 && (
                <div style={{ position: 'absolute', left: 12, top: 48, width: 1, height: 22, background: stage > i ? ORANGE : 'var(--line)', transition: 'background 400ms' }} />
              )}
              <div style={{ width: 26, height: 26, borderRadius: 99, background: active ? ORANGE : 'var(--line)', color: active ? 'white' : 'var(--muted)', display: 'grid', placeItems: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, position: 'relative', flexShrink: 0, transition: 'all 400ms' }}>
                {i + 1}
                {stage === i && <span style={{ position: 'absolute', inset: -4, borderRadius: 99, border: `2px solid ${ORANGE}`, animation: 'nvRing 1.6s ease-out infinite' }} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{n.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>{n.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Utility ────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Logo ───────────────────────────────────────────────────────────────────
function NvoyceMark({ size = 30 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="nvoyce">
        <rect x="2" y="2" width="36" height="36" rx="9" fill="#0d1b2a" />
        <rect x="9" y="9" width="3.2" height="22" fill="white" />
        <rect x="27.8" y="9" width="3.2" height="22" fill="white" />
        <path d="M12.2 9 L15 9 L28 27 L28 31 L25.2 31 Z" fill="white" />
        <circle cx="17.5" cy="14" r="1.2" fill={ORANGE} />
        <circle cx="22.5" cy="14" r="1.2" fill={ORANGE} />
        <circle cx="17.5" cy="20" r="1.2" fill={ORANGE} />
        <circle cx="22.5" cy="20" r="1.2" fill={ORANGE} />
        <circle cx="17.5" cy="26" r="1.2" fill={ORANGE} />
        <circle cx="22.5" cy="26" r="1.2" fill={ORANGE} />
      </svg>
      <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: size * 0.67, letterSpacing: '-0.03em', color: '#0d1b2a', lineHeight: 1 }}>nvoyce</span>
    </div>
  )
}

// ─── Demo Player ────────────────────────────────────────────────────────────
const DEMO_SCENES = [
  { id: 'intro',     dur: 4000,  label: 'Welcome' },
  { id: 'draft',     dur: 10000, label: 'AI drafts the invoice' },
  { id: 'send',      dur: 7000,  label: 'Send to client' },
  { id: 'pay',       dur: 8000,  label: 'Client pays' },
  { id: 'dashboard', dur: 9000,  label: 'Live dashboard' },
  { id: 'outro',     dur: 7000,  label: 'Stop chasing.' },
]
const DEMO_TOTAL = DEMO_SCENES.reduce((a, s) => a + s.dur, 0)

function DemoPlayer({ onClose }: { onClose: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const tRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const lastIdxRef = useRef(0)

  const getIdx = (t: number) => {
    let cum = 0
    for (let i = 0; i < DEMO_SCENES.length; i++) {
      if (t < cum + DEMO_SCENES[i].dur) return i
      cum += DEMO_SCENES[i].dur
    }
    return DEMO_SCENES.length - 1
  }

  useEffect(() => {
    if (!playing) return
    function step(ts: number) {
      if (startRef.current == null) startRef.current = ts - tRef.current
      const next = ts - startRef.current
      tRef.current = next >= DEMO_TOTAL ? 0 : next
      if (next >= DEMO_TOTAL) startRef.current = ts
      if (barRef.current) barRef.current.style.width = `${(tRef.current / DEMO_TOTAL) * 100}%`
      const idx = getIdx(tRef.current)
      if (idx !== lastIdxRef.current) { lastIdxRef.current = idx; setActiveIdx(idx) }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  const restart = () => { tRef.current = 0; startRef.current = null; lastIdxRef.current = 0; setActiveIdx(0); setPlaying(true) }

  const SceneWrap = ({ idx, children }: { idx: number; children: React.ReactNode }) => (
    <div className="nv-demo-scene" style={{ position: 'absolute', inset: 0, opacity: activeIdx === idx ? 1 : 0, transform: activeIdx === idx ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 600ms ease, transform 600ms ease', pointerEvents: activeIdx === idx ? 'auto' : 'none' }}>
      {children}
    </div>
  )

  const Caption = ({ small, big }: { small: string; big: React.ReactNode }) => (
    <div className="nv-demo-cap" style={{ position: 'absolute', bottom: 48 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 8 }}>{small}</div>
      <div style={{ fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{big}</div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0b0d10', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes nvIn { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform:none; } }
        .nv-demo-canvas { aspect-ratio: 16/9; }
        .nv-demo-scene  { padding: 40px 48px; }
        .nv-demo-cap    { left: 48px; bottom: 48px; max-width: 480px; }
        @media (max-width: 640px) {
          .nv-demo-canvas { aspect-ratio: unset; height: 100%; }
          .nv-demo-scene  { padding: 16px; }
          .nv-demo-cap    { left: 16px; bottom: 16px; max-width: 280px; }
          .nv-demo-cap div:last-child { font-size: 22px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', color: 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, monospace', fontSize: 11, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
          ← back to nvoyce.ai
        </button>
        <span>{activeIdx + 1} / {DEMO_SCENES.length} · {DEMO_SCENES[activeIdx].label}</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>✕</button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', minHeight: 0 }}>
        <div className="nv-demo-canvas" style={{ width: '100%', maxWidth: 1200, background: 'var(--paper)', borderRadius: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.5)' }}>

          {/* Scene 1 — Intro */}
          <SceneWrap idx={0}>
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', animation: 'nvIn 700ms ease-out' }}>
                <NvoyceMark size={60} />
                <h1 style={{ fontSize: 'clamp(42px,7vw,88px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, margin: '22px 0 14px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                  We do the hard stuff.<br /><span style={{ color: 'var(--orange)' }}>You get paid.</span>
                </h1>
                <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.14em' }}>A 45-second product demo</p>
              </div>
            </div>
          </SceneWrap>

          {/* Scene 2 — Draft */}
          <SceneWrap idx={1}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>{activeIdx === 1 && <InvoiceGenDemo />}</div>
            <Caption small="Step 01 · Invoice creation" big="4 fields in. Professional invoice out. Written for you." />
          </SceneWrap>

          {/* Scene 3 — Send */}
          <SceneWrap idx={2}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>{activeIdx === 2 && <ProposalFlowDemo />}</div>
            <Caption small="Step 02 · Proposal to payment" big="Client accepts. Invoice and pay link generate themselves." />
          </SceneWrap>

          {/* Scene 4 — Pay */}
          <SceneWrap idx={3}>
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', paddingBottom: 80 }}>{activeIdx === 3 && <PaymentPhoneDemo />}</div>
            <Caption small="Step 03 · Your client's experience" big="A link on their phone. No login. Tap once — money moves." />
          </SceneWrap>

          {/* Scene 5 — Dashboard */}
          <SceneWrap idx={4}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>{activeIdx === 4 && <DashboardDemo />}</div>
            <Caption small="Always on · Live dashboard" big="Every dollar tracked. The moment a payment lands, you'll know." />
          </SceneWrap>

          {/* Scene 6 — Outro */}
          <SceneWrap idx={5}>
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(42px,7vw,96px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, margin: 0, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                  Stop chasing.<br /><span style={{ color: 'var(--orange)' }}>Start getting paid.</span>
                </h1>
                <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <Link href="/sign-up" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start free — 3 docs on us</Link>
                  <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', textDecoration: 'underline' }}>← back to nvoyce.ai</button>
                </div>
              </div>
            </div>
          </SceneWrap>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 20px' }}>
        <button onClick={() => setPlaying(p => !p)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 99, width: 36, height: 36, cursor: 'pointer', fontSize: 14, display: 'grid', placeItems: 'center' }}>{playing ? '❚❚' : '▶'}</button>
        <div style={{ width: 280, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
          <div ref={barRef} style={{ height: '100%', background: 'var(--orange)', width: '0%', transition: 'none' }} />
        </div>
        <button onClick={restart} title="Restart" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 99, width: 36, height: 36, cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>↺</button>
      </div>
    </div>
  )
}

// ─── Watch Demo Button ──────────────────────────────────────────────────────
function WatchDemoButton({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '6px 16px 6px 6px', borderRadius: 99,
          background: dark ? 'rgba(255,255,255,0.1)' : 'var(--paper-2)',
          border: dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--line)',
          cursor: 'pointer', color: dark ? 'white' : 'var(--text)',
        }}
      >
        <span style={{ width: 30, height: 30, borderRadius: 99, background: 'var(--orange)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><polygon points="2,1 9,5 2,9" /></svg>
        </span>
        <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13 }}>Watch the 45-second demo</span>
      </button>
      {open && <DemoPlayer onClose={() => setOpen(false)} />}
    </>
  )
}

// ─── Comparison Table ───────────────────────────────────────────────────────
function ComparisonTable() {
  const cols = ['nvoyce', 'QuickBooks', 'FreshBooks', 'Spreadsheets']
  const rows: [string, ...(boolean | string)[]][] = [
    ['AI-drafted invoices & proposals',         true,      false,     false,      false],
    ['One-click client pay (Apple/Google/Card)', true,      true,      true,       false],
    ['Auto reminders (Payme)',                   true,      false,     'manual',   false],
    ['Proposal → invoice in one flow',           true,      false,     false,      false],
    ['No client login required',                 true,      false,     false,      true],
    ['Free tier',                                true,      false,     false,      true],
    ['Monthly cost (solo)',                      '$19.99',  '$35+',    '$19+',     '$0'],
  ]
  return (
    <section style={{ padding: '60px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Tag><span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />Head to head</Tag>
          <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '16px 0 0', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Why freelancers switch.</h2>
        </div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', fontSize: 12 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)' }} />
            {cols.map((c, i) => (
              <div key={c} style={{ padding: '18px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--orange)' : 'var(--muted)', borderBottom: '1px solid var(--line)', background: i === 0 ? 'var(--orange-soft)' : 'transparent', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{c}</div>
            ))}
            {rows.map((row, ri) => (
              <>
                <div key={`label-${ri}`} style={{ padding: '16px 20px', fontSize: 13, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--line)', color: 'var(--text)' }}>{row[0]}</div>
                {(row.slice(1) as (boolean | string)[]).map((v, ci) => (
                  <div key={`cell-${ri}-${ci}`} style={{ padding: '16px 14px', textAlign: 'center', borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--line)', background: ci === 0 ? 'var(--orange-soft)' : 'transparent' }}>
                    {v === true  && <span style={{ color: ci === 0 ? 'var(--orange)' : 'var(--ink)', fontWeight: 700, fontSize: 16 }}>✓</span>}
                    {v === false && <span style={{ color: 'var(--muted)', fontSize: 16 }}>—</span>}
                    {v === 'manual' && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const }}>manual</span>}
                    {typeof v === 'string' && v !== 'manual' && <span style={{ fontSize: 12, color: ci === 0 ? 'var(--ink)' : 'var(--muted)', fontWeight: ci === 0 ? 700 : 400, fontFamily: 'ui-monospace, monospace' }}>{v}</span>}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ Accordion ──────────────────────────────────────────────────────────
function FAQAccordion() {
  const [open, setOpen] = useState(-1)
  const items = [
    { q: 'How is this different from QuickBooks or FreshBooks?', a: 'QuickBooks and FreshBooks are accounting tools that happen to send invoices. Nvoyce is built around the single act of getting paid — draft fast, send clean, collect automatically. No general-ledger bloat, no client logins, no PDF wrangling.' },
    { q: 'Who writes the invoice — me or the AI?', a: 'Both, depending on the flow. When you create an invoice manually, you fill in a short brief (client, project, amount) and Nvoyce drafts the line items, description, and closing. You review and edit the draft before anything sends — nothing reaches your client without you clicking "Send". If a client accepts a proposal, Nvoyce automatically generates and sends the invoice on your behalf, with no extra steps required.' },
    { q: 'Do my clients need an account?', a: 'No. Clients click a pay link or scan a QR code, see a clean pay page, and tap Apple Pay / Google Pay / card / ACH. No login, no download, no PDF.' },
    { q: 'Does Payme spam my clients?', a: 'Payme sends a soft, on-brand nudge at 14 days and a firmer one at 30. You can turn it off per invoice, or disable it entirely. It never sends more than what you configure.' },
    { q: 'Is my data safe?', a: 'Yes. Payments are handled by Stripe — we never see card details. Invoice data is encrypted at rest and in transit. You can export everything as CSV anytime, and delete your account in one click.' },
    { q: 'Can I cancel anytime?', a: 'Yes. No contracts. Cancel in the app and you drop back to Free. Your invoices and client list stay available — you keep your own data.' },
  ]
  return (
    <section id="faq" style={{ padding: '90px 28px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Tag><span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />FAQ</Tag>
          <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 44px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '16px 0 0', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Things freelancers ask before signing up.</h2>
        </div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {items.map((it, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: '100%', textAlign: 'left', padding: '22px 4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{it.q}</span>
                  <span style={{ width: 28, height: 28, borderRadius: 99, background: isOpen ? 'var(--orange)' : 'var(--paper-2)', color: isOpen ? 'white' : 'var(--muted)', border: isOpen ? 'none' : '1px solid var(--line)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18, fontWeight: 300, transition: 'all 160ms ease' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p style={{ margin: '0 0 22px 4px', fontSize: 15, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 720 }}>{it.a}</p>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>More questions? </span>
          <Link href="/faq" style={{ fontSize: 15, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>See the full FAQ →</Link>
        </div>
      </div>
    </section>
  )
}

// ─── Main landing page ──────────────────────────────────────────────────────
export default function LandingClient() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pro')
  const [annual, setAnnual] = useState(true)

  return (
    <>
      <style>{`
        :root {
          --orange: ${ORANGE};
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
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: var(--paper); color: var(--text); -webkit-font-smoothing: antialiased; }
        @keyframes nvSlideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes nvFade    { from { opacity:0; } to { opacity:1; } }
        @keyframes nvSpin    { to { transform: rotate(360deg); } }
        @keyframes nvPulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes nvRing    { 0% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(1.8); } }
        @media (max-width: 880px) {
          .nv-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .nv-tri       { grid-template-columns: 1fr !important; }
          .nv-quad      { grid-template-columns: 1fr 1fr !important; }
          .nv-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .nv-quad         { grid-template-columns: 1fr !important; }
          .nv-footer-grid  { grid-template-columns: 1fr !important; }
          .nv-cta          { padding: 48px 28px !important; }
        }
      `}</style>

      {/* NAV */}
      <PublicNav />

      {/* HERO */}
      <section style={{ padding: '64px 28px 48px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }} className="nv-hero-grid">
            <div>
              <Tag>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />
                AI-powered · Invoices & Proposals
              </Tag>
              <h1 style={{ fontSize: 'clamp(38px, 7vw, 88px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, color: 'var(--ink)', margin: '22px 0 28px', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                We do the<br />hard stuff.<br /><span style={{ color: 'var(--orange)' }}>You get paid.</span>
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 520, margin: '0 0 32px' }}>
                Nvoyce turns a three-line brief into a ready-to-send invoice or proposal. Reminders send themselves. Payments land with a toast. Your job is the work — not the chasing.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start free — 3 docs on us</Link>
                <WatchDemoButton />
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, marginTop: 44, paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Brief to invoice', value: '60s', delta: 'start to send' },
                  { label: 'Client experience', value: '1 tap', delta: 'no login required' },
                  { label: 'Payments via', value: 'Stripe', delta: 'Apple Pay · Card · ACH' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{s.value}</div>
                    {s.delta && <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>{s.delta}</div>}
                  </div>
                ))}
              </div>
            </div>
            {/* Animated invoice demo */}
            <div style={{ position: 'relative' }}>
              <InvoiceGenDemo />
              <div style={{ position: 'absolute', top: -16, right: -8, background: 'var(--ink)', color: 'white', padding: '6px 10px', borderRadius: 8, transform: 'rotate(3deg)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>← AI-generated in 60s</div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ padding: '80px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Tag>However you work</Tag>
            <h2 style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '16px 0 0', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              Sound familiar?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="nv-tri">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'You just finished a job',
                sub: 'No proposal, no back-and-forth — just a client who owes you.',
                body: 'Open Nvoyce, fill in three fields — client name, project, amount. The invoice drafts itself, a Stripe pay link and QR code attach automatically, and it\'s in their inbox in under a minute.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.6"/>
                    <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'A client accepted your proposal',
                sub: 'They clicked Accept and now you need to get paid.',
                body: 'Nvoyce auto-generates and sends the invoice the moment they accept — no extra steps. The pay link and QR code are already there. You just watch the notification land.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 10a6 6 0 0 1 6-6 6 6 0 0 1 4.24 1.76L16 8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M16 4v4h-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 10a6 6 0 0 1-6 6 6 6 0 0 1-4.24-1.76L4 12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M4 16v-4h4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Same client, new month',
                sub: 'Ongoing work, regular billing, same drill every time.',
                body: 'Create a new invoice in seconds. Nvoyce\'s built-in assistant, Payme, watches every outstanding invoice and sends a polite nudge at 14 days and a firmer one at 30 — so you never have to chase a client yourself.',
              },
            ].map((uc) => (
              <div key={uc.title} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: ORANGE, display: 'grid', placeItems: 'center', marginBottom: 18 }}>
                  {uc.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px', fontFamily: 'var(--font-space-grotesk), sans-serif', letterSpacing: '-0.01em' }}>{uc.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600, margin: '0 0 14px', fontFamily: 'ui-monospace, monospace' }}>{uc.sub}</p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD DEMO */}
      <section style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="nv-hero-grid">
          <div>
            <Tag>Live dashboard</Tag>
            <h2 style={{ fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '18px 0 20px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              The moment a payment clears,<br />you'll know.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460 }}>
              Cash flow, outstanding, overdue, drafts — all in one tab.
            </p>
          </div>
          <DashboardDemo />
        </div>
      </section>

      {/* FEATURE TRIPTYCH */}
      <section style={{ padding: '80px 28px', background: 'var(--ink)', color: 'white' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 50, flexWrap: 'wrap', gap: 20 }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: 0, maxWidth: 600, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              Three things that used to eat your day.<br />Now they run themselves.
            </h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>01 · Draft · 02 · Send · 03 · Collect</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }} className="nv-tri">
            {[
              { n: '01', t: 'Drafts itself', d: 'Three fields in, one invoice out. Nvoyce writes the line items, the tone, and the closing. You review and approve.' },
              { n: '02', t: 'Sends to your client', d: 'One click and it\'s gone — pay link and QR code included. For proposals, clients accept without signing up and the invoice generates itself.' },
              { n: '03', t: 'Follows up for you', d: 'If they\'re slow to pay, Payme sends a nudge at 14 days and a firmer one at 30. You never have to ask twice.' },
            ].map(f => (
              <div key={f.n} style={{ padding: 26, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 11, color: 'var(--orange)', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>{f.n}</span>
                <h3 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 10px', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{f.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT + PAYME + PROPOSAL */}
      <section style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="nv-hero-grid">
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <PaymentPhoneDemo />
          </div>
          <div>
            <Tag>For your clients</Tag>
            <h2 style={{ fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '18px 0 20px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              A link.<br />A tap.<br />Paid.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460, marginBottom: 28 }}>
              Clients get a pay link and a QR code — whichever works for them. No login, no PDF wrangling, no wire instructions. One clean page with your brand, your amount, and a Stripe-powered pay button.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Apple Pay', 'Google Pay', 'Card', 'ACH', 'Bank transfer'].map(m => (
                <Tag key={m}>{m}</Tag>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAYME + PROPOSAL FLOW SIDE BY SIDE */}
      <section style={{ padding: '40px 28px 90px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <Tag>Introducing Payme</Tag>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '18px 0 12px', maxWidth: 760, fontFamily: 'var(--font-space-grotesk), sans-serif', color: 'var(--ink)' }}>
              Nvoyce features Payme — an AI-powered assistant that follows up on unpaid invoices so you never have to.
            </h2>
            <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
              Payme is an AI assistant that keeps you aware of recently paid invoices, outstanding payments, and stale proposals — so you stay in the driver's seat of your cash flow. Send your invoice once; Payme handles everything after that.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="nv-tri">
            <PaymeDemo />
            <ProposalFlowDemo />
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <ComparisonTable />

      {/* PRICING */}
      <section id="pricing" style={{ padding: '90px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
          <Tag>Simple pricing</Tag>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '22px 0 28px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
            Start free. Upgrade when it pays for itself.
          </h2>

          {/* Annual toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 99, background: 'white', border: '1px solid var(--line)', marginBottom: 40 }}>
            {([{ k: false, l: 'Monthly' }, { k: true, l: 'Annual', save: '−20%' }] as { k: boolean; l: string; save?: string }[]).map(o => {
              const on = annual === o.k
              return (
                <button key={String(o.k)} onClick={() => setAnnual(o.k)} style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 99, background: on ? 'var(--ink)' : 'transparent', color: on ? 'white' : 'var(--muted)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 160ms ease' }}>
                  {o.l}
                  {o.save && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: on ? 'var(--orange)' : 'var(--orange-soft)', color: on ? 'white' : 'var(--orange)', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{o.save}</span>}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto' }} className="nv-tri">
            {[
              { name: 'Free',     monthly: 0,     desc: 'To try the product',        features: ['3 documents/month', 'AI generation', 'Stripe payment links', 'Email delivery'] },
              { name: 'Pro',      monthly: 19.99, desc: 'For working freelancers',    features: ['Unlimited documents', 'Everything in Free', 'Payme smart reminders', 'Priority support'] },
              { name: 'Business', monthly: 39.99, desc: 'For small studios',          features: ['Everything in Pro',  'Team features',     'Custom branding',       'Early access'] },
            ].map(plan => {
              const active = selectedPlan === plan.name
              const displayPrice = plan.monthly === 0 ? '$0' : annual ? `$${(plan.monthly * 0.8).toFixed(2)}` : `$${plan.monthly}`
              return (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  style={{
                    padding: 28, borderRadius: 16, textAlign: 'left',
                    background: active ? 'var(--ink)' : 'white',
                    border: active ? '2px solid var(--ink)' : '2px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    transform: active ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: active ? '0 12px 32px rgba(13,27,42,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: 11, color: active ? 'var(--orange)' : 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.5)' : 'var(--muted)', marginBottom: 10 }}>{plan.desc}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: active ? 'white' : 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                    {displayPrice}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>{plan.monthly > 0 ? '/mo' : ''}</span>
                  </div>
                  {plan.monthly > 0 && annual && (
                    <div style={{ fontSize: 11, color: 'var(--orange)', fontFamily: 'ui-monospace, monospace', marginTop: 4 }}>billed annually</div>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: active ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}>
                        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up" style={{ display: 'block', padding: '12px', borderRadius: 10, textAlign: 'center', background: active ? 'var(--orange)' : 'transparent', border: active ? 'none' : '1px solid var(--line)', color: active ? 'white' : 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Get started</Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion />

      {/* TRUST + SECURITY */}
      <section style={{ padding: '80px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Tag>Security &amp; privacy</Tag>
            <h2 style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '16px 0 12px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              Your data and your clients' data are safe.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 520, margin: '0 auto' }}>
              We don't cut corners on infrastructure. Nvoyce is built on Stripe, Supabase, and Clerk — each independently SOC 2 Type II certified.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="nv-quad">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5l-6-3z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'End-to-end encryption',
                body: 'All data is encrypted at rest (AES-256) and in transit (TLS). Your invoice data and client details are never exposed.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="8" width="12" height="9" rx="2" stroke="white" strokeWidth="1.6"/>
                    <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="10" cy="12.5" r="1" fill="white"/>
                  </svg>
                ),
                title: 'We never see card details',
                body: 'All payments flow directly through Stripe — PCI DSS Level 1 compliant. Nvoyce never touches, stores, or sees your clients\' card information.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3.5" stroke="white" strokeWidth="1.6"/>
                    <path d="M4 17c0-3.31 2.686-6 6-6s6 2.69 6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Secure authentication',
                body: 'Sign-in is handled by Clerk — no passwords stored by Nvoyce. Supports Google OAuth and magic links out of the box.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 4h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="white" strokeWidth="1.6"/>
                    <path d="M7 8h6M7 11h4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M13 14l2 2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'You own your data',
                body: 'Export all your invoices and client data as CSV anytime. Delete your account in one click and everything goes with it — no questions asked.',
              },
            ].map((t) => (
              <div key={t.title} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: 26 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: ORANGE, display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                  {t.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'var(--font-space-grotesk), sans-serif', letterSpacing: '-0.01em' }}>{t.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>{t.body}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: 'var(--muted)' }}>
            Built on <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Stripe</span> · <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Supabase</span> · <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Clerk</span> — each SOC 2 Type II certified.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '20px 28px 100px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="nv-cta" style={{ background: 'var(--ink)', padding: '80px 48px', borderRadius: 20, textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(42px, 6vw, 78px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0, fontFamily: 'var(--font-space-grotesk), sans-serif', color: 'white' }}>
              Stop chasing.<br />Start getting paid.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '22px auto 32px' }}>Because no one started freelancing to chase invoices.</p>
            <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start your free trial →</Link>
              <WatchDemoButton dark />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 60px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40 }} className="nv-footer-grid">
          {/* Brand blurb */}
          <div>
            <NvoyceMark />
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>
              We do the hard stuff. You get paid. Invoices, proposals, reminders and payouts — from one quiet tab.
            </p>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 12, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Company</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([['About', '/about'], ['FAQ', '/faq'], ['Pricing', '/#pricing']] as [string, string][]).map(([label, href]) => (
                <li key={label}>
                  <a href={href} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 12, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Contact</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Customer Support</div>
                <a href="mailto:support@nvoyce.ai" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>support@nvoyce.ai</a>
              </li>
              <li>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Investors · Press · Partnerships</div>
                <a href="mailto:hello@nvoyce.ai" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>hello@nvoyce.ai</a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '40px auto 0', display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>© 2026 nvoyce · Stop chasing. Start getting paid.</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>The orange dots in the N are a nod to Braille — a reminder that every invoice is a declaration of work and worth.</span>
        </div>
      </footer>
    </>
  )
}
