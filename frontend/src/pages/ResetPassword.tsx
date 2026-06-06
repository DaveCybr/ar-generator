import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Layers } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)',
  borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5,
  color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)',
}

const primaryButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', background: disabled ? 'var(--color-hairline)' : 'var(--color-primary)',
  color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)',
  padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0,
  cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)',
  marginTop: 8, transition: 'all 0.15s ease',
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'request' | 'confirm'>('request')

  // Request state
  const [email, setEmail] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')

  // Confirm state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [confirmSuccess, setConfirmSuccess] = useState(false)

  useEffect(() => {
    document.title = 'Reset Password — AR Generator'
    if (window.location.hash.includes('access_token')) setMode('confirm')
  }, [])

  useEffect(() => {
    if (!confirmSuccess) return
    const timeout = setTimeout(() => navigate('/login'), 2000)
    return () => clearTimeout(timeout)
  }, [confirmSuccess, navigate])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestError('')
    if (!email.trim()) return setRequestError('Email tidak boleh kosong')

    setRequestLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://ar.nano.co.id/reset-password',
    })
    setRequestLoading(false)
    if (error) { setRequestError(error.message); return }
    setRequestSent(true)
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmError('')
    if (newPassword.length < 6) return setConfirmError('Password baru minimal 6 karakter')
    if (newPassword !== confirmPassword) return setConfirmError('Konfirmasi password tidak cocok')

    setConfirmLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setConfirmLoading(false)
    if (error) { setConfirmError(error.message); return }
    setConfirmSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-canvas-soft)' }}>
      <style>{`*:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}input::placeholder{color:var(--color-ink-faint)}`}</style>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8" style={{ textDecoration: 'none' }}>
          <Layers style={{ color: 'var(--color-primary)', width: 24, height: 24 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--color-ink)' }}>AR Generator</span>
        </Link>

        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
          {mode === 'request' ? (
            requestSent ? (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Cek email kamu</h1>
                <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 24px' }}>
                  Link reset telah dikirim ke {email.trim()}. Cek inbox atau folder spam kamu.
                </p>
                <Link to="/login" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--color-ink-mute)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink-mute)'}>
                  ← Kembali ke Login
                </Link>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Reset Password</h1>
                <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 24px' }}>
                  Masukkan email kamu, kami akan kirim link untuk reset password
                </p>

                {requestError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 20 }}>
                    {requestError}
                  </div>
                )}

                <form onSubmit={handleRequest} className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="nama@email.com"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'}
                    />
                  </div>

                  <button type="submit" disabled={requestLoading} style={primaryButtonStyle(requestLoading)}
                    onMouseEnter={e => { if (!requestLoading) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
                    onMouseLeave={e => { if (!requestLoading) e.currentTarget.style.background = 'var(--color-primary)' }}>
                    {requestLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', marginTop: 24 }}>
                  <Link to="/login" style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                    ← Kembali ke Login
                  </Link>
                </p>
              </>
            )
          ) : (
            confirmSuccess ? (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Berhasil</h1>
                <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: 0 }}>
                  Password berhasil diubah. Mengarahkan ke halaman login...
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Buat Password Baru</h1>
                <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 24px' }}>
                  Masukkan password baru untuk akun kamu
                </p>

                {confirmError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 20 }}>
                    {confirmError}
                  </div>
                )}

                <form onSubmit={handleConfirm} className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Minimal 6 karakter"
                        style={{ ...inputStyle, padding: '8px 40px 8px 12px' }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'}
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', padding: 0 }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Konfirmasi Password Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'}
                    />
                  </div>

                  <button type="submit" disabled={confirmLoading} style={primaryButtonStyle(confirmLoading)}
                    onMouseEnter={e => { if (!confirmLoading) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
                    onMouseLeave={e => { if (!confirmLoading) e.currentTarget.style.background = 'var(--color-primary)' }}>
                    {confirmLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </button>
                </form>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}
