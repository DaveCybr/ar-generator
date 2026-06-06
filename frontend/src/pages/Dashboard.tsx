import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject } from '../types'
import { Layers, Plus, QrCode, ExternalLink, Trash2, LogOut, Pencil, ScanLine, Link2, BarChart2, Search, User, Calendar } from 'lucide-react'
import QRCode from 'qrcode'
import { usePlan } from '../hooks/usePlan'
import UpgradeModal from '../components/UpgradeModal'

const btnNav: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'none', color: 'var(--color-ink-mute)', border: 'none',
  borderRadius: 'var(--radius-sm)', padding: '6px 10px',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'var(--font-display)', textDecoration: 'none',
  transition: 'color 0.13s ease',
}

interface ScanLog { scanned_at: string }
interface AnalyticsData { project: ARProject; logs: ScanLog[] | null }

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

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
}

function formatExpiry(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { plan, limits } = usePlan()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)
  const [projects, setProjects] = useState<ARProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [qrModal, setQrModal] = useState<{ project: ARProject; dataUrl: string } | null>(null)
  const [analyticsModal, setAnalyticsModal] = useState<AnalyticsData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)

  useEffect(() => {
    document.title = 'Project Saya — AR Generator'
    fetchProjects()
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setShowUpgradeBanner(true)
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setShowUpgradeBanner(false), 5000)
    }
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('ar_projects').select('*, ar_targets(*)').order('created_at', { ascending: false })
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showQR = async (project: ARProject) => {
    const viewerUrl = `${window.location.origin}/ar/${project.slug}`
    const dataUrl = await QRCode.toDataURL(viewerUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
    setQrModal({ project, dataUrl })
  }

  const copyLink = async (project: ARProject) => {
    const url = `${window.location.origin}/ar/${project.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(project.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyQrUrl = async (slug: string) => {
    const url = `${window.location.origin}/ar/${slug}`
    await navigator.clipboard.writeText(url)
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const showAnalytics = async (project: ARProject) => {
    setAnalyticsModal({ project, logs: null })
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data, error } = await supabase
      .from('scan_logs')
      .select('scanned_at')
      .eq('project_id', project.id)
      .gte('scanned_at', sevenDaysAgo.toISOString())
      .order('scanned_at', { ascending: true })
    setAnalyticsModal({ project, logs: error ? null : (data ?? []) })
  }

  const handleDelete = async (project: ARProject) => {
    if (!confirm(`Hapus project "${project.name}"?`)) return
    setDeletingId(project.id)
    try {
      const { data: files } = await supabase.storage.from('ar-files').list(`${project.user_id}/${project.slug}`)
      if (files?.length) await supabase.storage.from('ar-files').remove(files.map(f => `${project.user_id}/${project.slug}/${f.name}`))
      await supabase.from('ar_projects').delete().eq('id', project.id)
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login') }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .project-card { transition: box-shadow 0.18s ease, transform 0.18s ease; }
        .project-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-2px); }
        *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

        .card-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          height: 30px; border-radius: var(--radius-sm);
          border: 1px solid var(--color-hairline); background: var(--color-canvas);
          color: var(--color-ink-mute); cursor: pointer;
          transition: background 0.13s ease, border-color 0.13s ease, color 0.13s ease;
          font-family: var(--font-display); font-size: 12px; font-weight: 500;
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
        }
        .card-btn-text { padding: 0 10px; }
        .card-btn-icon { width: 30px; }
        .card-btn:hover { background: var(--color-canvas-soft); border-color: var(--color-hairline-strong); color: var(--color-ink); }
        .card-btn-active { color: var(--color-primary) !important; border-color: rgba(62,207,142,0.5) !important; background: rgba(62,207,142,0.06) !important; }
        .card-btn-delete { border-color: transparent; background: none; color: var(--color-ink-faint); width: 30px; }
        .card-btn-delete:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
        .card-btn-delete:disabled { opacity: 0.35; cursor: not-allowed; }
        .scan-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          color: var(--color-ink-faint); font-size: 12px; font-weight: 400;
          font-family: var(--font-display); padding: 3px 6px;
          border-radius: var(--radius-xs); transition: all 0.13s ease; flex-shrink: 0;
        }
        .scan-badge:hover { color: var(--color-primary); background: rgba(62,207,142,0.08); }
      `}</style>

      <div className="min-h-screen" style={{ background: 'var(--color-canvas-soft)' }}>
        <header style={{ background: 'var(--color-canvas)', borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
              <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>AR Generator</span>
            </div>
            <div className="flex items-center gap-2">
              {plan !== 'free' && (
                <span style={{ background: 'rgba(62,207,142,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(62,207,142,0.3)', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  {plan === 'pro' ? 'Pro' : 'Business'}
                </span>
              )}
              <Link to="/profile" style={btnNav}>
                <User style={{ width: 14, height: 14 }} /> Akun
              </Link>
              <button onClick={handleLogout} style={btnNav}>
                <LogOut style={{ width: 14, height: 14 }} /> Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {showUpgradeBanner && (
            <div style={{ background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.3)', color: 'var(--color-ink)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: 14, fontFamily: 'var(--font-display)' }}>
              🎉 Upgrade berhasil! Selamat menikmati plan {plan === 'pro' ? 'Pro' : 'Business'}.
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Project AR Saya</h1>
              <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: 0 }}>{projects.length} project dibuat</p>
            </div>
            <button
              onClick={() => {
                if (limits.max_projects !== -1 && projects.length >= limits.max_projects) {
                  setUpgradeReason(`Kamu sudah mencapai batas ${limits.max_projects} project di plan ini.`)
                  setShowUpgradeModal(true)
                } else {
                  navigate('/create')
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
              <Plus style={{ width: 14, height: 14 }} /> Buat AR Baru
            </button>
          </div>

          {projects.length > 0 && (
            <div className="relative mb-6">
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--color-ink-faint)' }} />
              <input
                type="text"
                placeholder="Cari project..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', maxWidth: 320, background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px 8px 34px', fontSize: 14, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)' }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'}
              />
            </div>
          )}

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
              <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
                <Plus style={{ width: 14, height: 14 }} /> Buat AR Pertamamu
              </Link>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontSize: 16, color: 'var(--color-ink-mute)' }}>Tidak ada project yang cocok dengan "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <div key={project.id} className="project-card" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: 140, background: 'var(--color-canvas-soft)', position: 'relative', overflow: 'hidden' }}>
                    {project.ar_targets?.[0]?.marker_url && (
                      <img src={project.ar_targets[0].marker_url} alt="marker" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <span style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', fontSize: 12, lineHeight: 1.45, padding: '2px 8px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                        {project.ar_targets?.length ?? 0} marker
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px 16px' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: 'var(--color-ink)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{project.name}</h3>
                      <button onClick={() => showAnalytics(project)} title="Lihat analytics" className="scan-badge">
                        <ScanLine style={{ width: 11, height: 11 }} />
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{project.scan_count ?? 0}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => showQR(project)} className="card-btn card-btn-text">
                        <QrCode style={{ width: 13, height: 13 }} /> QR
                      </button>
                      <button onClick={() => copyLink(project)}
                        className={`card-btn card-btn-text${copied === project.id ? ' card-btn-active' : ''}`}>
                        <Link2 style={{ width: 13, height: 13 }} />
                        {copied === project.id ? 'Tersalin!' : 'Salin'}
                      </button>
                      <a href={`/ar/${project.slug}`} target="_blank" rel="noreferrer" className="card-btn card-btn-icon" title="Buka AR">
                        <ExternalLink style={{ width: 13, height: 13 }} />
                      </a>
                      <Link to={`/edit/${project.id}`} className="card-btn card-btn-icon" title="Edit">
                        <Pencil style={{ width: 13, height: 13 }} />
                      </Link>
                      <button onClick={() => handleDelete(project)} disabled={deletingId === project.id}
                        className="card-btn card-btn-delete" title="Hapus" style={{ marginLeft: 'auto' }}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>

                    {project.expires_at && (() => {
                      const expiresAt = project.expires_at!
                      const expired = new Date(expiresAt) < new Date()
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, color: expired ? '#b91c1c' : 'var(--color-ink-mute)' }}>
                          <Calendar style={{ width: 12, height: 12, flexShrink: 0 }} />
                          <span>{expired ? `Kedaluwarsa ${formatExpiry(expiresAt)}` : `Aktif hingga ${formatExpiry(expiresAt)}`}</span>
                        </div>
                      )
                    })()}
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
              <button onClick={() => copyQrUrl(qrModal.project.slug)}
                style={{ width: '100%', textAlign: 'center', background: 'var(--color-canvas-soft)', color: urlCopied ? 'var(--color-primary)' : 'var(--color-ink-mute)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13, marginBottom: 12, cursor: 'pointer', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {window.location.origin}/ar/{qrModal.project.slug}
                </span>
                <span style={{ flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-display)' }}>{urlCopied ? 'Tersalin!' : 'Salin'}</span>
              </button>
              <div className="flex gap-2">
                <a href={qrModal.dataUrl} download={`${qrModal.project.slug}-qr.png`}
                  style={{ flex: 1, textAlign: 'center', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)', display: 'block' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
                  Download QR
                </a>
                <button onClick={() => setQrModal(null)} className="btn-secondary" style={{ flex: 1, background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {analyticsModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={() => setAnalyticsModal(null)}>
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', margin: 0 }}>Analytics</h3>
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-ink-mute)', margin: '0 0 20px' }}>{analyticsModal.project.name}</p>

              <div className="flex gap-3 mb-6">
                <div style={{ flex: 1, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-hairline)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 4px' }}>Total Scan</p>
                  <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>{analyticsModal.project.scan_count ?? 0}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '1px solid var(--color-hairline)' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 4px' }}>7 Hari Terakhir</p>
                  <p style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: 0 }}>
                    {analyticsModal.logs === null ? '—' : analyticsModal.logs.length}
                  </p>
                </div>
              </div>

              {analyticsModal.logs === null ? (
                <div style={{ background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--color-hairline)', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-mute)', margin: '0 0 8px' }}>Grafik per hari belum tersedia.</p>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: 0 }}>Aktifkan dengan membuat tabel <span style={{ fontFamily: 'var(--font-mono)' }}>scan_logs</span> di Supabase.</p>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', margin: '0 0 12px' }}>Scan per hari (7 hari terakhir)</p>
                  {(() => {
                    const days = getLast7Days()
                    const counts = days.map(day => ({
                      day,
                      count: analyticsModal.logs!.filter(l => l.scanned_at.startsWith(day)).length,
                    }))
                    const max = Math.max(...counts.map(c => c.count), 1)
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                        {counts.map(({ day, count }) => (
                          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 10, color: 'var(--color-ink-faint)' }}>{count > 0 ? count : ''}</span>
                            <div style={{ width: '100%', background: count > 0 ? 'var(--color-primary)' : 'var(--color-hairline)', borderRadius: '3px 3px 0 0', height: `${Math.max((count / max) * 60, count > 0 ? 8 : 4)}px`, transition: 'height 0.3s' }} />
                            <span style={{ fontSize: 9, color: 'var(--color-ink-faint)', whiteSpace: 'nowrap' }}>{formatDay(day)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}

              <button onClick={() => setAnalyticsModal(null)} style={{ width: '100%', background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />
    </>
  )
}
