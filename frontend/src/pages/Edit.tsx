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

  useEffect(() => { document.title = 'Edit Project — AR Generator' }, [])

  useEffect(() => {
    if (!id) return
    supabase.from('ar_projects').select('*, ar_targets(*)').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Project tidak ditemukan'); setLoading(false); return }
        setProject(data); setName(data.name); setLoading(false)
      })
  }, [id])

  const handleFileChange = (targetId: string, file: File) =>
    setReplacements(prev => ({ ...prev, [targetId]: file }))

  const handleSave = async () => {
    if (!project) return
    setSaving(true); setError('')
    try {
      if (name !== project.name) {
        const { error } = await supabase.from('ar_projects').update({ name }).eq('id', project.id)
        if (error) throw error
      }
      const basePath = `${project.user_id}/${project.slug}`
      for (const [targetId, file] of Object.entries(replacements)) {
        const target = project.ar_targets?.find(t => t.id === targetId)
        if (!target) continue
        const ext = file.name.split('.').pop()
        const path = `${basePath}/content-${target.target_index}.${ext}`
        const oldPath = target.content_url.split('/ar-files/')[1]
        if (oldPath) await supabase.storage.from('ar-files').remove([oldPath])
        const { error: uploadErr } = await supabase.storage.from('ar-files').upload(path, file)
        if (uploadErr) throw uploadErr
        const newUrl = supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl
        const { error: updateErr } = await supabase.from('ar_targets').update({ content_url: newUrl }).eq('id', targetId)
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas-soft)' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas-soft)' }}>
        <p style={{ color: '#b91c1c' }}>{error || 'Project tidak ditemukan'}</p>
      </div>
    )
  }

  const sortedTargets = [...(project.ar_targets ?? [])].sort((a, b) => a.target_index - b.target_index)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-canvas-soft)' }}>
      <style>{`*:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px} .upload-zone:hover{border-color:var(--color-primary)!important;background:rgba(62,207,142,0.04)!important}`}</style>
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
        <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Edit Project</h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: '0 0 32px' }}>Ubah nama atau ganti konten marker</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 24 }}>{error}</div>
        )}

        <div className="space-y-4">
          {/* Nama project */}
          <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <label style={{ display: 'block', fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', marginBottom: 8 }}>Nama Project</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
          </div>

          {/* Targets */}
          {sortedTargets.map((target: ARTarget, i) => (
            <div key={target.id} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', margin: '0 0 16px' }}>Marker {i + 1}</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Marker preview */}
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 8px' }}>Gambar Marker</p>
                  <div style={{ height: 96, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-hairline)' }}>
                    <img src={target.marker_url} alt="marker" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-faint)', marginTop: 4 }}>Tidak bisa diganti</p>
                </div>

                {/* Content replacement */}
                <div>
                  <p className="flex items-center gap-1" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 8px' }}>
                    {target.content_type === 'video' ? <><Video size={12} /> Video</> : <><Box size={12} /> 3D Object</>}
                  </p>
                  <div onClick={() => fileRefs.current[target.id]?.click()} className="upload-zone"
                    style={{ height: 96, border: '2px dashed var(--color-hairline-strong)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-hairline-strong)')}>
                    <Upload size={18} style={{ color: 'var(--color-ink-faint)', marginBottom: 4 }} />
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: 0 }}>
                      {replacements[target.id] ? replacements[target.id].name : 'Ganti konten'}
                    </p>
                  </div>
                  {replacements[target.id] && (
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: '#059669', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replacements[target.id].name}</p>
                  )}
                  <input ref={el => { fileRefs.current[target.id] = el }} type="file"
                    accept={target.content_type === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(target.id, f) }}
                    className="hidden" />
                </div>
              </div>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: saving ? 'var(--color-hairline)' : 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-primary)' }}>
            <Save size={14} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </main>
    </div>
  )
}
