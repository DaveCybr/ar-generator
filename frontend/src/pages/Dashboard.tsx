import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject } from '../types'
import { Layers, Plus, QrCode, ExternalLink, Trash2, LogOut } from 'lucide-react'
import QRCode from 'qrcode'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ARProject[]>([])
  const [loading, setLoading] = useState(true)
  const [qrModal, setQrModal] = useState<{ project: ARProject; dataUrl: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('ar_projects')
      .select('*, ar_targets(*)')
      .order('created_at', { ascending: false })

    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const showQR = async (project: ARProject) => {
    const viewerUrl = `${window.location.origin}/ar/${project.slug}`
    const dataUrl = await QRCode.toDataURL(viewerUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
    setQrModal({ project, dataUrl })
  }

  const handleDelete = async (project: ARProject) => {
    if (!confirm(`Hapus project "${project.name}"?`)) return
    setDeletingId(project.id)

    // Hapus semua files di folder project
    const { data: files } = await supabase.storage.from('ar-files').list(`${project.user_id}/${project.slug}`)
    if (files?.length) {
      await supabase.storage.from('ar-files').remove(files.map(f => `${project.user_id}/${project.slug}/${f.name}`))
    }
    await supabase.from('ar_projects').delete().eq('id', project.id)

    setProjects((prev) => prev.filter((p) => p.id !== project.id))
    setDeletingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="text-violet-500 w-6 h-6" />
            <span className="text-white font-bold text-lg">AR Generator</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-semibold">Project AR Saya</h1>
            <p className="text-gray-400 text-sm mt-1">{projects.length} project dibuat</p>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat AR Baru
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-4">Belum ada project AR</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat AR Pertamamu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="h-36 bg-gray-800 relative overflow-hidden">
                  {project.ar_targets?.[0]?.marker_url && (
                    <img src={project.ar_targets[0].marker_url} alt="marker" className="w-full h-full object-cover opacity-60" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                      {project.ar_targets?.length ?? 0} marker
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mb-3 truncate">{project.name}</h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showQR(project)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Code
                    </button>
                    <a
                      href={`/ar/${project.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka
                    </a>
                    <button
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="ml-auto text-gray-600 hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setQrModal(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-1">{qrModal.project.name}</h3>
            <p className="text-gray-400 text-sm mb-4">Scan QR code untuk membuka AR viewer</p>
            <div className="flex justify-center mb-4">
              <img src={qrModal.dataUrl} alt="QR Code" className="rounded-lg" />
            </div>
            <div className="flex gap-2">
              <a
                href={qrModal.dataUrl}
                download={`${qrModal.project.slug}-qr.png`}
                className="flex-1 text-center bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Download QR
              </a>
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
