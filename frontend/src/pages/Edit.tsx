import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject, ARTarget } from '../types'
import { Layers, ArrowLeft, Upload, Save, Video, Box } from 'lucide-react'

export default function Edit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ARProject | null>(null)
  const [name, setName] = useState('')
  const [replacements, setReplacements] = useState<Record<string, File>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!id) return
    supabase
      .from('ar_projects')
      .select('*, ar_targets(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Project tidak ditemukan'); setLoading(false); return }
        setProject(data)
        setName(data.name)
        setLoading(false)
      })
  }, [id])

  const handleFileChange = (targetId: string, file: File) => {
    setReplacements(prev => ({ ...prev, [targetId]: file }))
  }

  const handleSave = async () => {
    if (!project) return
    setSaving(true)
    setError('')

    try {
      // Update nama project
      if (name !== project.name) {
        const { error } = await supabase.from('ar_projects').update({ name }).eq('id', project.id)
        if (error) throw error
      }

      // Upload konten baru untuk target yang diganti
      const basePath = `${project.user_id}/${project.slug}`
      for (const [targetId, file] of Object.entries(replacements)) {
        const target = project.ar_targets?.find(t => t.id === targetId)
        if (!target) continue

        const ext = file.name.split('.').pop()
        const path = `${basePath}/content-${target.target_index}.${ext}`

        // Hapus file lama
        const oldPath = target.content_url.split('/ar-files/')[1]
        if (oldPath) await supabase.storage.from('ar-files').remove([oldPath])

        // Upload file baru
        const { error: uploadErr } = await supabase.storage.from('ar-files').upload(path, file)
        if (uploadErr) throw uploadErr

        const newUrl = supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl
        const { error: updateErr } = await supabase.from('ar_targets')
          .update({ content_url: newUrl })
          .eq('id', targetId)
        if (updateErr) throw updateErr
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{error || 'Project tidak ditemukan'}</p>
      </div>
    )
  }

  const sortedTargets = [...(project.ar_targets ?? [])].sort((a, b) => a.target_index - b.target_index)

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Layers className="text-violet-500 w-5 h-5" />
            <span className="text-white font-bold">AR Generator</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-white text-2xl font-semibold mb-1">Edit Project</h1>
        <p className="text-gray-400 text-sm mb-8">Ubah nama atau ganti konten marker</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
        )}

        <div className="space-y-4">
          {/* Nama project */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Nama Project</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Targets */}
          {sortedTargets.map((target: ARTarget, i) => (
            <div key={target.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-300 mb-4">Marker {i + 1}</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Marker preview (read-only) */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Gambar Marker</p>
                  <div className="h-24 bg-gray-800 rounded-lg overflow-hidden">
                    <img src={target.marker_url} alt="marker" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Tidak bisa diganti</p>
                </div>

                {/* Content replacement */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    {target.content_type === 'video'
                      ? <><Video className="w-3 h-3" /> Video</>
                      : <><Box className="w-3 h-3" /> 3D Object</>
                    }
                  </p>
                  <div
                    onClick={() => fileRefs.current[target.id]?.click()}
                    className="h-24 border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-600 mb-1" />
                    <p className="text-xs text-gray-600">
                      {replacements[target.id] ? replacements[target.id].name : 'Ganti konten'}
                    </p>
                  </div>
                  {replacements[target.id] && (
                    <p className="text-green-400 text-xs mt-1 truncate">{replacements[target.id].name}</p>
                  )}
                  <input
                    ref={el => { fileRefs.current[target.id] = el }}
                    type="file"
                    accept={target.content_type === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(target.id, f) }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </main>
    </div>
  )
}
