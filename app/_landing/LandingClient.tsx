'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

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
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>Payme</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>Smart reminder assistant</div>
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
    { label: 'Payment link sent',       sub: 'via Stripe' },
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

// ─── Main landing page ──────────────────────────────────────────────────────
export default function LandingClient() {
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
          .nv-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .nv-nav-links   { display: none !important; }
          .nv-footer-grid { grid-template-columns: 1fr !important; }
          .nv-cta         { padding: 48px 28px !important; }
        }
      `}</style>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(251,250,247,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NvoyceMark />
          <nav style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
            <span className="nv-nav-links" style={{ display: 'flex', gap: 26 }}>
              {[['Pricing', '#pricing'], ['FAQ', '/faq'], ['About', '/about']].map(([label, href]) => (
                <Link key={label} href={href} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>{label}</Link>
              ))}
            </span>
            <Link href="/sign-in" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Start free</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: '64px 28px 48px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }} className="nv-hero-grid">
            <div>
              <Tag>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--orange)', display: 'inline-block' }} />
                AI-powered · Invoices & Proposals
              </Tag>
              <h1 style={{ fontSize: 'clamp(46px, 7vw, 88px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, color: 'var(--ink)', margin: '22px 0 28px', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                We do the<br />hard stuff.<br /><span style={{ color: 'var(--orange)' }}>You get paid.</span>
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 520, margin: '0 0 32px' }}>
                Nvoyce turns a three-line brief into a ready-to-send invoice or proposal. Reminders send themselves. Payments land with a toast. Your job is the work — not the chasing.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'var(--orange)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start free — 3 docs on us</Link>
                <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Sign in →</Link>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, marginTop: 44, paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Avg. time to first send', value: '38s' },
                  { label: 'Faster payouts', value: '2.4×', delta: 'vs. email-first workflows' },
                  { label: 'Paid in full', value: '94%', delta: 'within 14 days of send' },
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
              <div style={{ position: 'absolute', top: -16, right: -8, background: 'var(--ink)', color: 'white', padding: '6px 10px', borderRadius: 8, transform: 'rotate(3deg)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>← AI-generated in 38s</div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD DEMO */}
      <section style={{ padding: '90px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="nv-hero-grid">
          <div>
            <Tag>Live dashboard</Tag>
            <h2 style={{ fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '18px 0 20px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              The only number<br />you'll want to watch.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460 }}>
              Cash flow, outstanding, overdue, drafts — at a glance. When a client pays, a toast lands on your screen before their bank email does.
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
              Three small robots.<br />One quiet tab.
            </h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>01 · Draft · 02 · Send · 03 · Collect</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }} className="nv-tri">
            {[
              { n: '01', t: 'Drafts itself', d: 'Three fields in, one invoice out. Claude writes the line items, the tone, and the details. You approve.' },
              { n: '02', t: 'Sends and signs', d: 'Proposals get a link. Clients accept without signing up. The moment they do, an invoice is born and sent.' },
              { n: '03', t: 'Chases politely', d: "Payme remembers who owes you and when. Soft nudges at 14 and 30 days. You forget; we don't." },
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
              Clients get a link. No login, no PDF wrangling, no wire instructions. One clean page with your brand, your amount, and a Stripe-powered pay button.
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
            <Tag>The Braille tells the story</Tag>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '18px 0 0', maxWidth: 760, fontFamily: 'var(--font-space-grotesk), sans-serif', color: 'var(--ink)' }}>
              Every invoice is a freelancer's voice —<br />a declaration of work, worth, and the right to be paid.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="nv-tri">
            <PaymeDemo />
            <ProposalFlowDemo />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '90px 28px', background: 'var(--paper-2)', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
          <Tag>Simple pricing</Tag>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: '22px 0 48px', color: 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
            Start free. Upgrade when it pays for itself.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto' }} className="nv-tri">
            {[
              { name: 'Free',     price: '$0',     desc: '',    features: ['3 documents/month', 'AI generation', 'Stripe payment links', 'Email delivery'],   highlight: false },
              { name: 'Pro',      price: '$19.99', desc: '/mo', features: ['Unlimited documents', 'Everything in Free', 'Payme smart reminders', 'Priority support'], highlight: true  },
              { name: 'Business', price: '$39.99', desc: '/mo', features: ['Everything in Pro',  'Team features',     'Custom branding',       'Early access'],          highlight: false },
            ].map(plan => (
              <div key={plan.name} style={{ padding: 28, borderRadius: 16, background: plan.highlight ? 'var(--ink)' : 'white', border: plan.highlight ? 'none' : '1px solid var(--line)', textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: plan.highlight ? 'var(--orange)' : 'var(--muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: plan.highlight ? 'white' : 'var(--ink)', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
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

      {/* CTA */}
      <section style={{ padding: '20px 28px 100px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="nv-cta" style={{ background: 'var(--orange)', color: 'white', padding: '80px 48px', borderRadius: 20, textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(42px, 6vw, 78px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: 0, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
              Stop chasing.<br />Start getting paid.
            </h2>
            <p style={{ fontSize: 17, opacity: 0.9, maxWidth: 520, margin: '22px auto 32px' }}>Because no one started freelancing to chase invoices.</p>
            <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'var(--ink)', color: 'white', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Start your free trial →</Link>
              <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 26px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.24)', fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 28px 60px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }} className="nv-footer-grid">
          <div>
            <NvoyceMark />
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>
              We do the hard stuff. You get paid. Invoices, proposals, reminders and payouts — from one quiet tab.
            </p>
          </div>
          {([
            ['Product',  ['Invoices', 'Proposals', 'Payme', 'Pricing']],
            ['Company',  ['About', 'FAQ', 'Changelog']],
            ['Contact',  ['hello@nvoyce.ai', 'support@nvoyce.ai']],
          ] as [string, string[]][]).map(([t, items]) => (
            <div key={t}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 12, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{t}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(i => <li key={i}><a href={i.includes('@') ? `mailto:${i}` : '#'} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1240, margin: '40px auto 0', display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>© 2026 nvoyce · Stop chasing. Start getting paid.</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>The orange dots in the N spell "VOICE" in Braille.</span>
        </div>
      </footer>
    </>
  )
}
