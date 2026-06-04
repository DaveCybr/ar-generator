import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject } from '../types'
import { Layers, Plus, QrCode, ExternalLink, Trash2, LogOut, Pencil, ScanLine } from 'lucide-react'
import QRCode from 'qrcode'

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'var(--color-canvas)', color: 'var(--color-ink)',
  border: '1px solid var(--color-hairline-strong)',
  borderRadius: 'var(--radius-sm)', padding: '6px 12px',
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-display)', textDecoration: 'none',
  transition: 'all 0.15s ease',
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ height: 140, background: 'var(--color-canvas-soft)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 16, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', marginBottom: 12, width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 12, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', width: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ARProject[]>([])
  const [loading, setLoading] = useState(true)
  const [qrModal, setQrModal] = useState<{ project: ARProject; dataUrl: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Project Saya — AR Generator'
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('ar_projects').select('*, ar_targets(*)').order('created_at', { ascending: false })
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const showQR = async (project: ARProject) => {
    const viewerUrl = `${window.location.origin}/ar/${project.slug}`
    const dataUrl = await QRCode.toDataURL(viewerUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    setQrModal({ project, dataUrl })
  }

  const handleDelete = async (project: ARProject) => {
    if (!confirm(`Hapus project "${project.name}"?`)) return
    setDeletingId(project.id)
    const { data: files } = await supabase.storage.from('ar-files').list(`${project.user_id}/${project.slug}`)
    if (files?.length) await supabase.storage.from('ar-files').remove(files.map(f => `${project.user_id}/${project.slug}/${f.name}`))
    await supabase.from('ar_projects').delete().eq('id', project.id)
    setProjects(prev => prev.filter(p => p.id !== project.id))
    setDeletingId(null)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .project-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .project-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .btn-secondary:hover { background: var(--color-canvas-soft) !important; }
        .btn-icon:hover { color: #ef4444 !important; }
        .upload-zone:hover { border-color: var(--color-primary) !important; background: rgba(62,207,142,0.04) !important; }
        *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      `}</style>

      <div className="min-h-screen" style={{ background: 'var(--color-canvas-soft)' }}>
        {/* Header */}
        <header style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
              <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>AR Generator</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary" style={{ ...btnSecondary, border: 'none', background: 'none', color: 'var(--color-ink-mute)' }}>
              <LogOut style={{ width: 14, height: 14 }} /> Keluar
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Project AR Saya</h1>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: 0 }}>{projects.length} project dibuat</p>
            </div>
            <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)', transition: 'all 0.15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
              <Plus style={{ width: 14, height: 14 }} /> Buat AR Baru
            </Link>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)' }}>
                <Layers style={{ color: 'var(--color-ink-faint)', width: 32, height: 32 }} />
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', marginBottom: 16 }}>Belum ada project AR</p>
              <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)', transition: 'all 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
                <Plus style={{ width: 14, height: 14 }} /> Buat AR Pertamamu
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <div key={project.id} className="project-card" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  {/* Thumbnail */}
                  <div style={{ height: 140, background: 'var(--color-canvas-soft)', position: 'relative', overflow: 'hidden' }}>
                    {project.ar_targets?.[0]?.marker_url && (
                      <img src={project.ar_targets[0].marker_url} alt="marker" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <span style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', fontSize: 12, lineHeight: 1.45, padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
                        {project.ar_targets?.length ?? 0} marker
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: 16 }}>
                    <div className="flex items-start justify-between mb-12px">
                      <h3 style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: 'var(--color-ink)', margin: '0 0 12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</h3>
                      <span className="flex items-center gap-1 ml-8" style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-mute)', flexShrink: 0, marginLeft: 8, marginBottom: 12 }}>
                        <ScanLine style={{ width: 12, height: 12 }} /> {project.scan_count ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-8" style={{ gap: 8 }}>
                      <button onClick={() => showQR(project)} className="btn-secondary" style={btnSecondary}>
                        <QrCode style={{ width: 14, height: 14 }} /> QR
                      </button>
                      <a href={`/ar/${project.slug}`} target="_blank" rel="noreferrer" className="btn-secondary" style={btnSecondary}>
                        <ExternalLink style={{ width: 14, height: 14 }} /> Buka
                      </a>
                      <Link to={`/edit/${project.id}`} className="btn-secondary" style={btnSecondary}>
                        <Pencil style={{ width: 14, height: 14 }} /> Edit
                      </Link>
                      <button onClick={() => handleDelete(project)} disabled={deletingId === project.id} className="btn-icon"
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', padding: 4, opacity: deletingId === project.id ? 0.4 : 1, transition: 'color 0.15s ease' }}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* QR Modal */}
        {qrModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={() => setQrModal(null)}>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 360, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', margin: '0 0 4px' }}>{qrModal.project.name}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 16px' }}>Scan QR code untuk membuka AR viewer</p>
              <div className="flex justify-center mb-4">
                <img src={qrModal.dataUrl} alt="QR Code" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-hairline)' }} />
              </div>
              <div className="flex gap-2">
                <a href={qrModal.dataUrl} download={`${qrModal.project.slug}-qr.png`}
                  style={{ flex: 1, textAlign: 'center', background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)', display: 'block', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
                  Download QR
                </a>
                <button onClick={() => setQrModal(null)} className="btn-secondary" style={{ flex: 1, background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.15s ease' }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
