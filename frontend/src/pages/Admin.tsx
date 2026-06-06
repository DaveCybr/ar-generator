import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BarChart2, Users, DollarSign, ArrowLeft, Layers } from 'lucide-react'

type Section = 'overview' | 'users' | 'revenue'

interface AdminStats {
  total_users: number
  total_projects: number
  total_scans: number
  suspended_users: number
  new_users_7d: number
  new_users_30d: number
  plan_breakdown: Record<string, number>
}

interface AdminUserRow {
  user_id: string
  email: string
  joined_at: string
  last_sign_in_at: string | null
  plan: 'free' | 'pro' | 'business'
  subscription_status: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  is_suspended: boolean
  suspended_at: string | null
  suspended_reason: string | null
  project_count: number
  total_scans: number
}

interface PaidSubscription {
  user_id: string
  email: string | null
  plan: string
  status: string
  current_period_end: string | null
  created_at: string
}

const NAV_ITEMS: { key: Section; label: string; icon: typeof BarChart2 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart2 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
]

const SECTION_TITLES: Record<Section, string> = {
  overview: 'Overview',
  users: 'Users',
  revenue: 'Revenue',
}

export default function Admin() {
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('overview')
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.title = 'Admin — AR Generator'
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? ''))
  }, [])

  const callAdminAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Aksi gagal')
    return data
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-display)' }}>
      <style>{`*:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}`}</style>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, width: 220, height: '100vh',
        background: 'var(--color-canvas-night)', borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, paddingLeft: 8, flexWrap: 'wrap' }}>
          <Layers style={{ color: 'var(--color-primary)', width: 18, height: 18 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-on-dark, #ffffff)' }}>AR Generator</span>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 100,
            fontSize: 11, fontWeight: 500,
            background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)',
          }}>
            Admin
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = section === key
            return (
              <button key={key} type="button" onClick={() => setSection(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: active ? 'var(--color-on-dark, #ffffff)' : 'rgba(255,255,255,0.5)',
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                <Icon size={16} />
                {label}
              </button>
            )
          })}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 4px' }} />

          <button type="button" onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              border: 'none', textAlign: 'left', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            <ArrowLeft size={16} />
            Kembali ke App
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, background: 'var(--color-canvas-soft)', minHeight: '100vh', padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 24px' }}>
          {SECTION_TITLES[section]}
        </h1>

        {section === 'overview' && <OverviewSection />}
        {section === 'users' && <UsersSection callAdminAction={callAdminAction} />}
        {section === 'revenue' && <RevenueSection callAdminAction={callAdminAction} />}
      </main>
    </div>
  )
}

// ============================================================
// Overview
// ============================================================

function SectionSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
      <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>{value.toLocaleString('id-ID')}</p>
    </div>
  )
}

function OverviewSection() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('get_admin_stats').then(({ data, error }) => {
      if (error) { setError(error.message); setLoading(false); return }
      setStats(data as AdminStats)
      setLoading(false)
    })
  }, [])

  if (loading) return <SectionSpinner />
  if (error || !stats) {
    return <p style={{ fontSize: 14, color: 'var(--color-ink-mute)' }}>Gagal memuat statistik{error ? `: ${error}` : ''}</p>
  }

  const breakdown = stats.plan_breakdown ?? {}
  const planRows: { key: 'free' | 'pro' | 'business'; label: string; color: string }[] = [
    { key: 'free', label: 'Free', color: 'var(--color-hairline-strong)' },
    { key: 'pro', label: 'Pro', color: 'var(--color-primary)' },
    { key: 'business', label: 'Business', color: 'var(--color-canvas-night)' },
  ]
  const planTotal = planRows.reduce((sum, { key }) => sum + (breakdown[key] ?? 0), 0)

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--radius-lg)', padding: '20px 24px',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Total Projects" value={stats.total_projects} />
        <StatCard label="Total Scans" value={stats.total_scans} />
        <StatCard label="Suspended Users" value={stats.suspended_users} />
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 16px' }}>Distribusi Plan</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {planRows.map(({ key, label, color }) => {
            const count = breakdown[key] ?? 0
            const pct = planTotal > 0 ? Math.round((count / planTotal) * 100) : 0
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{label}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-ink-mute)' }}>{count} user</span>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{pct}%</span>
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--color-canvas-soft)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 12px' }}>User Baru</h2>
        <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', margin: '0 0 6px' }}>7 hari terakhir: {stats.new_users_7d} user baru</p>
        <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', margin: 0 }}>30 hari terakhir: {stats.new_users_30d} user baru</p>
      </div>
    </div>
  )
}

// ============================================================
// Users
// ============================================================

function planPillStyle(plan: string): React.CSSProperties {
  if (plan === 'pro') return { background: 'rgba(62,207,142,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(62,207,142,0.3)' }
  if (plan === 'business') return { background: 'var(--color-canvas-night)', color: 'var(--color-on-dark, #ffffff)', border: '1px solid var(--color-canvas-night)' }
  return { background: 'var(--color-canvas-soft)', color: 'var(--color-ink-mute)', border: '1px solid var(--color-hairline)' }
}

function statusInfo(user: AdminUserRow): { color: string; label: string } {
  if (user.is_suspended) return { color: '#ef4444', label: 'Suspended' }
  if (user.subscription_status === 'past_due') return { color: '#f59e0b', label: 'past_due' }
  return { color: '#059669', label: 'Aktif' }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const actionBtnStyle: React.CSSProperties = {
  background: 'var(--color-canvas)', color: 'var(--color-ink)',
  border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)',
  padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}

function UsersSection({ callAdminAction }: { callAdminAction: (action: string, payload?: Record<string, unknown>) => Promise<{ users?: AdminUserRow[] }> }) {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await callAdminAction('get_users')
      setUsers(data.users ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => u.email?.toLowerCase().includes(q))
  }, [users, search])

  const runAction = async (action: string, user: AdminUserRow, extra: Record<string, unknown> = {}, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setActingId(user.user_id)
    try {
      await callAdminAction(action, { target_user_id: user.user_id, ...extra })
      await fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Aksi gagal')
    } finally {
      setActingId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 14,
    color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)',
    width: 280,
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Cari email..." value={search} onChange={e => setSearch(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-hairline)')} />
      </div>

      <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <p style={{ padding: 24, fontSize: 14, color: '#b91c1c', margin: 0 }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 24, fontSize: 14, color: 'var(--color-ink-mute)', margin: 0 }}>Tidak ada user ditemukan.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                {['Email', 'Plan', 'Status', 'Projects', 'Scans', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 500, color: 'var(--color-ink-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const status = statusInfo(user)
                const isActing = actingId === user.user_id
                return (
                  <tr key={user.user_id} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 500, textTransform: 'capitalize', ...planPillStyle(user.plan) }}>
                        {user.plan}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-ink-mute)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, display: 'inline-block' }} />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{user.project_count}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{user.total_scans}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink-mute)' }}>{formatDate(user.joined_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {user.plan !== 'pro' && (
                          <button type="button" disabled={isActing} style={{ ...actionBtnStyle, opacity: isActing ? 0.6 : 1 }}
                            onClick={() => runAction('manual_upgrade', user, { plan: 'pro' })}>
                            Upgrade ke Pro
                          </button>
                        )}
                        {user.plan !== 'business' && (
                          <button type="button" disabled={isActing} style={{ ...actionBtnStyle, opacity: isActing ? 0.6 : 1 }}
                            onClick={() => runAction('manual_upgrade', user, { plan: 'business' })}>
                            Upgrade ke Business
                          </button>
                        )}
                        {user.plan !== 'free' && (
                          <button type="button" disabled={isActing} style={{ ...actionBtnStyle, opacity: isActing ? 0.6 : 1 }}
                            onClick={() => runAction('manual_downgrade', user, { plan: 'free' }, `Downgrade ${user.email} ke Free?`)}>
                            Downgrade ke Free
                          </button>
                        )}
                        {user.is_suspended ? (
                          <button type="button" disabled={isActing} style={{ ...actionBtnStyle, opacity: isActing ? 0.6 : 1 }}
                            onClick={() => runAction('unsuspend_user', user)}>
                            Unsuspend
                          </button>
                        ) : (
                          <button type="button" disabled={isActing}
                            style={{ ...actionBtnStyle, opacity: isActing ? 0.6 : 1, borderColor: '#ef4444', color: '#ef4444' }}
                            onClick={() => runAction('suspend_user', user, {}, `Suspend ${user.email}?`)}>
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Revenue
// ============================================================

const PRO_MONTHLY_IDR = 99000
const BUSINESS_MONTHLY_IDR = 299000

function RevenueSection({ callAdminAction }: { callAdminAction: (action: string, payload?: Record<string, unknown>) => Promise<{ subscriptions?: PaidSubscription[] }> }) {
  const [subs, setSubs] = useState<PaidSubscription[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    callAdminAction('get_revenue_subscriptions')
      .then(data => {
        setSubs(data.subscriptions ?? [])
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Gagal memuat data revenue')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <SectionSpinner />
  if (error || !subs) {
    return <p style={{ fontSize: 14, color: 'var(--color-ink-mute)' }}>Gagal memuat data revenue{error ? `: ${error}` : ''}</p>
  }

  const activePro = subs.filter(s => s.plan === 'pro' && s.status === 'active').length
  const activeBusiness = subs.filter(s => s.plan === 'business' && s.status === 'active').length
  const mrr = activePro * PRO_MONTHLY_IDR + activeBusiness * BUSINESS_MONTHLY_IDR
  const recent = subs.slice(0, 20)

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--radius-lg)', padding: '20px 24px',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 8 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>Active Pro Subscriptions</p>
          <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>{activePro}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>Active Business Subscriptions</p>
          <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>{activeBusiness}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>Estimasi MRR</p>
          <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>
            Rp {mrr.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-ink-faint)', margin: '0 0 24px' }}>
        Estimasi MRR dari langganan aktif (tidak termasuk tahunan)
      </p>

      <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {recent.length === 0 ? (
          <p style={{ padding: 24, fontSize: 14, color: 'var(--color-ink-mute)', margin: 0 }}>Belum ada langganan berbayar.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                {['Email', 'Plan', 'Status', 'Period End'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 500, color: 'var(--color-ink-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(sub => (
                <tr key={`${sub.user_id}-${sub.created_at}`} style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink)' }}>{sub.email ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink)', textTransform: 'capitalize' }}>{sub.plan}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink-mute)' }}>{sub.status}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-ink-mute)' }}>{formatDate(sub.current_period_end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
