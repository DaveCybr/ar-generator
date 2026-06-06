import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject } from '../types'
import { Layers, ScanLine, Clock } from 'lucide-react'

export default function ARLanding() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<ARProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [showWatermark, setShowWatermark] = useState(true)

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return }
    supabase
      .from('ar_projects')
      .select('*, ar_targets(*)')
      .eq('slug', slug)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        document.title = `${data.name} — AR Generator`
        const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false
        setIsExpired(expired)
        setProject(data)

        const { data: planData } = await supabase.rpc('get_user_plan', { p_user_id: data.user_id })
        if (planData === 'pro' || planData === 'business') {
          setShowWatermark(false)
        }

        setLoading(false)
      })
  }, [slug])

  const handleOpen = () => {
    if (!project || !slug) return
    const targets = (project.ar_targets ?? [])
      .sort((a, b) => a.target_index - b.target_index)
      .map(t => ({ type: t.content_type, content: t.content_url }))
    const params = new URLSearchParams({
      mind: project.mind_file_url,
      targets: JSON.stringify(targets),
      slug,
      projectId: project.id,
      sbUrl: import.meta.env.VITE_SUPABASE_URL,
      sbKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    })
    window.location.replace(`/ar-viewer.html?${params.toString()}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-canvas)', fontFamily: 'var(--font-display)' }}>
        <style>{`@keyframes arlanding-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'arlanding-spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', marginTop: 16, marginBottom: 0, fontFamily: 'var(--font-display)' }}>Memuat project...</p>
        </div>
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-canvas)', fontFamily: 'var(--font-display)' }}>
        <div style={{ maxWidth: 320, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: 'var(--color-ink)', marginBottom: 8, marginTop: 0 }}>
            Project tidak ditemukan
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: 0 }}>
            Pastikan link yang kamu gunakan sudah benar
          </p>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <>
        <style>{`
          *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
          @media (max-width: 767px) {
            .arlanding-header { height: 56px !important; }
            .arlanding-main { padding-top: 56px !important; }
            .arlanding-icon { width: 16px !important; height: 16px !important; }
            .arlanding-wordmark { font-size: 14px !important; }
          }
        `}</style>
        <header className="arlanding-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 48, background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers className="arlanding-icon" style={{ color: 'var(--color-primary)', width: 14, height: 14 }} />
            <span className="arlanding-wordmark" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink-mute)', fontFamily: 'var(--font-display)' }}>AR Generator</span>
          </div>
        </header>
        <main className="arlanding-main" style={{ paddingTop: 48, paddingBottom: 48, minHeight: '100vh', background: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)' }}>
          <div style={{ maxWidth: 360, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} style={{ color: '#b91c1c' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: 0, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 8px' }}>
              AR ini sudah tidak aktif
            </h1>
            <p style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: 0 }}>
              Masa aktif AR viewer ini telah berakhir
            </p>
          </div>
        </main>
        {showWatermark && (
          <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 48, background: 'var(--color-canvas)', borderTop: '1px solid var(--color-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)' }}>Dibuat dengan AR Generator</span>
          </footer>
        )}
      </>
    )
  }

  const sortedTargets = (project.ar_targets ?? []).sort((a, b) => a.target_index - b.target_index)
  const firstMarker = sortedTargets[0]

  return (
    <>
      <style>{`
        @keyframes arlanding-spin { to { transform: rotate(360deg); } }
        *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        @media (max-width: 767px) {
          .arlanding-content { padding-left: 16px !important; padding-right: 16px !important; }
          .arlanding-header { height: 56px !important; }
          .arlanding-main { padding-top: 56px !important; }
          .arlanding-icon { width: 16px !important; height: 16px !important; }
          .arlanding-wordmark { font-size: 14px !important; }
        }
      `}</style>

      {/* Fixed Header */}
      <header className="arlanding-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 48,
        background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers className="arlanding-icon" style={{ color: 'var(--color-primary)', width: 14, height: 14 }} />
          <span className="arlanding-wordmark" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink-mute)', fontFamily: 'var(--font-display)' }}>
            AR Generator
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="arlanding-main" style={{ paddingTop: 48, background: 'var(--color-canvas)', minHeight: '100vh', fontFamily: 'var(--font-display)' }}>
        <div
          className="arlanding-content"
          style={{ maxWidth: 480, margin: '0 auto', padding: '64px 24px 96px 24px' }}
        >
          {/* Project Name */}
          <h1 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px',
            lineHeight: 1.2, color: 'var(--color-ink)', marginBottom: 8, marginTop: 0,
          }}>
            {project.name}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 16, fontWeight: 400, lineHeight: 1.5,
            color: 'var(--color-ink-mute)', marginBottom: 48, marginTop: 0,
          }}>
            Arahkan kamera ke gambar marker untuk memulai
          </p>

          {/* Marker Thumbnail */}
          <div style={{
            width: '100%', maxWidth: 240, aspectRatio: '1 / 1',
            margin: '0 auto 24px auto', display: 'block',
            border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
          }}>
            {firstMarker?.marker_url
              ? (
                <img
                  src={firstMarker.marker_url}
                  alt="Gambar marker AR"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', background: 'var(--color-canvas-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ScanLine style={{ width: 32, height: 32, color: 'var(--color-ink-faint)' }} />
                </div>
              )
            }
          </div>

          {/* Marker Count */}
          <span style={{
            display: 'block', textAlign: 'center', marginBottom: 32,
            fontSize: 12, color: 'var(--color-ink-mute)',
          }}>
            {sortedTargets.length} marker aktif
          </span>

          {/* CTA Button */}
          <button
            onClick={handleOpen}
            style={{
              width: '100%', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)',
              padding: '12px 32px', borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 500, lineHeight: 1,
              border: 'none', cursor: 'pointer', transition: 'background 0.15s ease',
              fontFamily: 'var(--font-display)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
            Buka AR Viewer
          </button>

          {/* Hint Text */}
          <span style={{
            marginTop: 16, display: 'block', textAlign: 'center',
            fontSize: 12, color: 'var(--color-ink-faint)',
          }}>
            Pastikan kamera sudah diizinkan di browser kamu
          </span>
        </div>
      </main>

      {/* Fixed Footer — watermark only for free plan owners */}
      {showWatermark && (
        <footer style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 48,
          background: 'var(--color-canvas)', borderTop: '1px solid var(--color-hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-display)' }}>
            Dibuat dengan AR Generator
          </span>
        </footer>
      )}
    </>
  )
}
