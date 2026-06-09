import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Layers } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Password tidak cocok', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => { document.title = 'Daftar — AR Generator' }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    const { error } = await supabase.auth.signUp({ email: data.email, password: data.password })
    if (error) setError(error.message)
    else { setSuccess(true); setTimeout(() => navigate('/login'), 3000) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-canvas-soft)' }}>
        <div className="w-full max-w-md text-center" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(62,207,142,0.1)', borderRadius: 'var(--radius-full)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-primary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: '0 0 8px' }}>Pendaftaran berhasil!</h2>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 20px' }}>Cek email kamu untuk konfirmasi. Mengalihkan ke login...</p>
          <button type="button" onClick={() => navigate('/login')}
            style={{ width: '100%', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-deep)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}>
            Lanjut ke Login
          </button>
        </div>
      </div>
    )
  }

  const inputStyle = { width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)' } as React.CSSProperties

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-canvas-soft)' }}>
      <style>{`*:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}input::placeholder{color:var(--color-ink-faint)}`}</style>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8" style={{ textDecoration: 'none' }}>
          <Layers style={{ color: 'var(--color-primary)', width: 24, height: 24 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--color-ink)' }}>AR Generator</span>
        </Link>

        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Daftar</h1>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 24px' }}>Buat akun baru</p>

          {error && (
            <div role="alert" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Email</label>
              <input id="reg-email" {...register('email')} type="email" autoComplete="email" placeholder="nama@email.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
              {errors.email && <p role="alert" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-danger-text)', marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="reg-password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                  style={{ ...inputStyle, padding: '8px 40px 8px 12px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p role="alert" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-danger-text)', marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', marginBottom: 6 }}>Konfirmasi Password</label>
              <input id="reg-confirm-password" {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
              {errors.confirmPassword && <p role="alert" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-danger-text)', marginTop: 4 }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              style={{ width: '100%', background: isSubmitting ? 'var(--color-hairline)' : 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', marginTop: 8, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
            onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--color-primary)' }}>
              {isSubmitting ? 'Mendaftar...' : 'Daftar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', marginTop: 24 }}>
            Sudah punya akun?{' '}
            <Link to="/login" style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
