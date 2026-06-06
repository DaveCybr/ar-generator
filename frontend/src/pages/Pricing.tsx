import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Layers } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { STRIPE_PRICES } from '../lib/stripePrices'
import type { BillingInterval, PlanType } from '../lib/stripePrices'

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function FeatureRow({ included, text, dark }: { included: boolean; text: string; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 500,
        color: included
          ? 'var(--color-primary)'
          : (dark ? 'rgba(255,255,255,0.25)' : 'var(--color-ink-faint)'),
        marginTop: 2,
        lineHeight: 1,
      }}>
        {included ? '✓' : '✗'}
      </span>
      <span style={{
        fontSize: 14,
        lineHeight: 1.5,
        color: included
          ? (dark ? 'var(--color-on-dark, #ffffff)' : 'var(--color-ink)')
          : (dark ? 'rgba(255,255,255,0.4)' : 'var(--color-ink-faint)'),
      }}>
        {text}
      </span>
    </div>
  )
}

const btnBase: React.CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-sm)',
  padding: '9px 16px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  border: 'none',
  transition: 'background 0.15s ease',
  display: 'block',
  textAlign: 'center',
  textDecoration: 'none',
}

export default function Pricing() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutErrorPriceId, setCheckoutErrorPriceId] = useState<string | null>(null)
  const { plan: userPlan } = usePlan()

  useEffect(() => {
    document.title = 'Pricing — AR Generator'
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
  }, [])

  // Show "Plan Aktif" only when user is authenticated
  const activePlan: PlanType | null = session ? userPlan : null

  const handleCheckout = async (priceId: string) => {
    if (!session) {
      navigate('/register?redirect=pricing')
      return
    }
    setCheckoutLoading(priceId)
    setCheckoutError('')
    setCheckoutErrorPriceId(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')
      window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
      setCheckoutErrorPriceId(priceId)
      setCheckoutLoading(null)
    }
  }

  const proPriceId = STRIPE_PRICES.pro[interval]
  const bizPriceId = STRIPE_PRICES.business[interval]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', fontFamily: 'var(--font-display)' }}>
      <style>{`
        *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        .nav-btn-outline:hover { border-color: var(--color-ink) !important; color: var(--color-ink) !important; }
        .pricing-card { transition: box-shadow 0.18s ease; }
        .pricing-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        @media (max-width: 767px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-hero { padding: 40px 24px 32px !important; }
          .pricing-section { padding: 0 16px 48px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
            <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)' }}>AR Generator</span>
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Link to="/dashboard"
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline-strong)', color: 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
                className="nav-btn-outline">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login"
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline-strong)', color: 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
                  className="nav-btn-outline">
                  Masuk
                </Link>
                <Link to="/register"
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}>
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pricing-hero" style={{ padding: '56px 24px 40px', textAlign: 'center' }}>
        <div className="max-w-xl mx-auto">
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 10px' }}>
            Pilih plan yang sesuai
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 28px' }}>
            Mulai gratis, upgrade kapan saja
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-full)', padding: 3 }}>
              {(['monthly', 'yearly'] as BillingInterval[]).map(i => (
                <button
                  key={i}
                  onClick={() => setInterval(i)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: interval === i ? 'var(--color-primary)' : 'transparent',
                    color: interval === i ? 'var(--color-on-primary, #171717)' : 'var(--color-ink-mute)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    fontFamily: 'var(--font-display)',
                  }}>
                  {i === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </button>
              ))}
            </div>
            {interval === 'yearly' && (
              <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>Hemat ~25%</span>
            )}
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="pricing-section" style={{ padding: '0 24px 64px' }}>
        <div
          className="pricing-grid max-w-5xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}
        >

          {/* FREE */}
          <div className="pricing-card" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 6px' }}>Free</p>
            <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 2px' }}>Rp 0</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: '0 0 24px' }}>Untuk mencoba</p>
            <div style={{ marginBottom: 24 }}>
              <FeatureRow included text="3 project aktif" />
              <FeatureRow included text="2 marker per project" />
              <FeatureRow included text="QR code & shareable link" />
              <FeatureRow included text="Analytics 7 hari" />
              <FeatureRow included={false} text="Custom slug" />
              <FeatureRow included={false} text="Tanpa watermark" />
              <FeatureRow included={false} text="Custom expiry date" />
            </div>
            {activePlan === 'free' ? (
              <button disabled style={{ ...btnBase, background: 'var(--color-canvas-soft)', color: 'var(--color-ink-faint)', border: '1px solid var(--color-hairline)', cursor: 'default' }}>
                Plan Aktif
              </button>
            ) : (
              <Link
                to={session ? '/dashboard' : '/register'}
                style={{ ...btnBase, background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)' }}>
                Mulai Gratis
              </Link>
            )}
          </div>

          {/* PRO */}
          <div className="pricing-card" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: 0 }}>Pro</p>
              <span style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                Populer
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 2px' }}>
              {interval === 'monthly' ? formatRp(99000) : formatRp(899000)}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-faint)', marginLeft: 4 }}>
                /{interval === 'monthly' ? 'bln' : 'thn'}
              </span>
            </p>
            {interval === 'yearly' && (
              <p style={{ fontSize: 12, color: 'var(--color-ink-mute)', marginTop: 4, marginBottom: 0 }}>≈ Rp 74.917/bln</p>
            )}
            <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: '4px 0 24px' }}>Untuk kreator aktif</p>
            <div style={{ marginBottom: 24 }}>
              <FeatureRow included text="20 project aktif" />
              <FeatureRow included text="10 marker per project" />
              <FeatureRow included text="QR code & shareable link" />
              <FeatureRow included text="Analytics 30 hari" />
              <FeatureRow included text="Custom slug" />
              <FeatureRow included text="Tanpa watermark" />
              <FeatureRow included text="Custom expiry date" />
            </div>
            {activePlan === 'pro' ? (
              <button disabled style={{ ...btnBase, background: 'var(--color-canvas-soft)', color: 'var(--color-ink-faint)', border: '1px solid var(--color-hairline)', cursor: 'default' }}>
                Plan Aktif
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(proPriceId)}
                disabled={checkoutLoading !== null}
                style={{ ...btnBase, background: checkoutLoading === proPriceId ? 'var(--color-primary-deep)' : 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', opacity: checkoutLoading !== null && checkoutLoading !== proPriceId ? 0.6 : 1 }}
                onMouseEnter={e => { if (!checkoutLoading) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
                onMouseLeave={e => { if (!checkoutLoading) e.currentTarget.style.background = 'var(--color-primary)' }}>
                {checkoutLoading === proPriceId ? 'Memproses...' : 'Pilih Pro'}
              </button>
            )}
            {checkoutErrorPriceId === proPriceId && checkoutError && (
              <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 8, marginBottom: 0, textAlign: 'center' }}>{checkoutError}</p>
            )}
          </div>

          {/* BUSINESS */}
          <div className="pricing-card" style={{ background: 'var(--color-canvas-night)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid transparent' }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-on-dark, #ffffff)', margin: '0 0 6px' }}>Business</p>
            <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', lineHeight: 1.2, color: 'var(--color-on-dark, #ffffff)', margin: '0 0 2px' }}>
              {interval === 'monthly' ? formatRp(299000) : formatRp(2499000)}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>
                /{interval === 'monthly' ? 'bln' : 'thn'}
              </span>
            </p>
            {interval === 'yearly' && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, marginBottom: 0 }}>≈ Rp 208.250/bln</p>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 24px' }}>Untuk agensi & tim</p>
            <div style={{ marginBottom: 24 }}>
              <FeatureRow included text="Unlimited project" dark />
              <FeatureRow included text="Unlimited marker" dark />
              <FeatureRow included text="Semua fitur Pro" dark />
              <FeatureRow included text="Analytics unlimited" dark />
            </div>
            {activePlan === 'business' ? (
              <button disabled style={{ ...btnBase, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'default' }}>
                Plan Aktif
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(bizPriceId)}
                disabled={checkoutLoading !== null}
                style={{ ...btnBase, background: 'transparent', color: 'var(--color-on-dark, #ffffff)', border: '1px solid rgba(255,255,255,0.3)', opacity: checkoutLoading !== null && checkoutLoading !== bizPriceId ? 0.6 : 1 }}
                onMouseEnter={e => { if (!checkoutLoading) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' } }}
                onMouseLeave={e => { if (!checkoutLoading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' } }}>
                {checkoutLoading === bizPriceId ? 'Memproses...' : 'Pilih Business'}
              </button>
            )}
            {checkoutErrorPriceId === bizPriceId && checkoutError && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 8, marginBottom: 0, textAlign: 'center' }}>{checkoutError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-hairline)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>© {new Date().getFullYear()} AR Generator</p>
      </footer>
    </div>
  )
}
