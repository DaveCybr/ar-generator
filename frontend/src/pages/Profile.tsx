import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlan } from '../hooks/usePlan'
import { Layers, ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { plan, limits, loading: planLoading } = usePlan()
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [projectCount, setProjectCount] = useState(0)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  useEffect(() => {
    document.title = 'Akun — AR Generator'
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setEmail(user.email ?? '')

      const [{ count }, { data: sub }] = await Promise.all([
        supabase.from('ar_projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('subscriptions').select('current_period_end').eq('user_id', user.id).single(),
      ])
      setProjectCount(count ?? 0)
      setPeriodEnd(sub?.current_period_end ?? null)
      setLoading(false)
    })
  }, [navigate])

  const handleBillingPortal = async () => {
    setPortalLoading(true)
    setPortalError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuka billing portal')
      window.location.href = data.url
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setPortalLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (newPassword.length < 6) return setError('Password baru minimal 6 karakter')
    if (newPassword !== confirmPassword) return setError('Konfirmasi password tidak cocok')

    setSaving(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInErr) { setError('Password saat ini salah'); setSaving(false); return }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    if (updateErr) { setError(updateErr.message); setSaving(false); return }

    setSuccess('Password berhasil diubah')
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas-soft)' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5,
    color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-canvas-soft)' }}>
      <style>{`*:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}`}</style>
      <header style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" style={{ color: 'var(--color-ink-mute)', display: 'flex' }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
            <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)' }}>AR Generator</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Akun</h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: '0 0 32px' }}>Kelola informasi dan keamanan akun</p>

        {/* Email */}
        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 8 }}>Email</label>
          <input type="email" value={email} readOnly
            style={{ ...inputStyle, background: 'var(--color-canvas-soft)', color: 'var(--color-ink-mute)', cursor: 'default' }} />
          <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 6 }}>Email tidak dapat diubah</p>
        </div>

        {/* Plan & Billing */}
        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 16px' }}>Plan & Billing</h2>

          {planLoading ? (
            <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
              <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                    fontSize: 12, fontWeight: 500,
                    background: plan === 'free' ? 'var(--color-canvas-soft)' : 'rgba(62,207,142,0.1)',
                    color: plan === 'free' ? 'var(--color-ink-mute)' : 'var(--color-primary)',
                    border: `1px solid ${plan === 'free' ? 'var(--color-hairline)' : 'rgba(62,207,142,0.3)'}`,
                    textTransform: 'capitalize',
                  }}>
                    {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Business'}
                  </span>
                  {periodEnd && plan !== 'free' && (
                    <span style={{ fontSize: 13, color: 'var(--color-ink-mute)' }}>
                      Aktif hingga {new Date(periodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', margin: '0 0 16px' }}>
                {projectCount} dari {limits.max_projects === -1 ? '∞' : limits.max_projects} project digunakan
              </p>

              {portalError && (
                <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>{portalError}</p>
              )}

              {plan === 'free' ? (
                <button type="button" onClick={() => navigate('/pricing')}
                  style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
                  Upgrade ke Pro
                </button>
              ) : (
                <button type="button" onClick={handleBillingPortal} disabled={portalLoading}
                  style={{ background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: portalLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s', opacity: portalLoading ? 0.7 : 1 }}>
                  {portalLoading ? 'Memuat...' : 'Kelola Billing'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Change password */}
        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 20px' }}>Ubah Password</h2>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}
          {success && (
            <div style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.3)', color: '#059669', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{success}</div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>Password Saat Ini</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', padding: 2 }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  placeholder="Minimal 6 karakter"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', padding: 2 }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 6 }}>Konfirmasi Password Baru</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
            </div>

            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? 'var(--color-hairline)' : 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary)' }}>
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
