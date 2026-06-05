import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { compileMindFile } from '../lib/mindCompiler'
import type { ARProject, ARTarget } from '../types'
import { Layers, ArrowLeft, Upload, Save, Video, Box, RefreshCw } from 'lucide-react'

async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}

export default function Edit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ARProject | null>(null)
  const [name, setName] = useState('')
  const [contentReplacements, setContentReplacements] = useState<Record<string, File>>({})
  const [markerReplacements, setMarkerReplacements] = useState<Record<string, File>>({})
  const [markerPreviews, setMarkerPreviews] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [recompiling, setRecompiling] = useState(false)
  const [recompileProgress, setRecompileProgress] = useState(0)
  const [recompileMsg, setRecompileMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const contentRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const markerRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { document.title = 'Edit Project — AR Generator' }, [])

  useEffect(() => {
    if (!id) return
    supabase.from('ar_projects').select('*, ar_targets(*)').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) { setError('Project tidak ditemukan'); setLoading(false); return }
        setProject(data); setName(data.name); setLoading(false)
      })
  }, [id])

  const handleContentChange = (targetId: string, file: File) =>
    setContentReplacements(prev => ({ ...prev, [targetId]: file }))

  const handleMarkerChange = (targetId: string, file: File) => {
    setMarkerReplacements(prev => ({ ...prev, [targetId]: file }))
    setMarkerPreviews(prev => ({ ...prev, [targetId]: URL.createObjectURL(file) }))
  }

  const handleSave = async () => {
    if (!project) return
    const hasMarkerChanges = Object.keys(markerReplacements).length > 0
    setSaving(true); setError('')

    try {
      if (name !== project.name) {
        const { error } = await supabase.from('ar_projects').update({ name }).eq('id', project.id)
        if (error) throw error
      }

      const basePath = `${project.user_id}/${project.slug}`
      const sortedTargets = [...(project.ar_targets ?? [])].sort((a, b) => a.target_index - b.target_index)

      if (hasMarkerChanges) {
        setRecompiling(true)
        setRecompileMsg('Mempersiapkan marker...')
        setRecompileProgress(0)

        const markerFiles = await Promise.all(
          sortedTargets.map(async (target, i) => {
            if (markerReplacements[target.id]) return markerReplacements[target.id]
            return urlToFile(target.marker_url, `marker-${i}.jpg`)
          })
        )

        setRecompileMsg('Mengkompilasi ulang marker...')
        const mindBlob = await compileMindFile(markerFiles, (p) => {
          setRecompileProgress(Math.round(p * 0.6))
          setRecompileMsg(`Mengkompilasi marker... ${p}%`)
        })

        setRecompileMsg('Mengupload .mind file baru...')
        await supabase.storage.from('ar-files').remove([`${basePath}/marker.mind`])
        const { error: mindErr } = await supabase.storage.from('ar-files').upload(`${basePath}/marker.mind`, mindBlob)
        if (mindErr) throw mindErr
        setRecompileProgress(70)

        const newMindUrl = supabase.storage.from('ar-files').getPublicUrl(`${basePath}/marker.mind`).data.publicUrl
        await supabase.from('ar_projects').update({ mind_file_url: newMindUrl }).eq('id', project.id)

        for (let i = 0; i < sortedTargets.length; i++) {
          const target = sortedTargets[i]
          if (!markerReplacements[target.id]) continue
          setRecompileMsg(`Mengupload marker ${i + 1}...`)
          const file = markerReplacements[target.id]
          const ext = file.name.split('.').pop()
          const path = `${basePath}/marker-${i}.${ext}`
          const oldPath = target.marker_url.split('/ar-files/')[1]
          if (oldPath) await supabase.storage.from('ar-files').remove([oldPath])
          const { error: uploadErr } = await supabase.storage.from('ar-files').upload(path, file)
          if (uploadErr) throw uploadErr
          const newUrl = supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl
          await supabase.from('ar_targets').update({ marker_url: newUrl }).eq('id', target.id)
          setRecompileProgress(70 + Math.round((30 / sortedTargets.length) * (i + 1)))
        }
      }

      for (const [targetId, file] of Object.entries(contentReplacements)) {
        const target = project.ar_targets?.find(t => t.id === targetId)
        if (!target) continue
        const ext = file.name.split('.').pop()
        const path = `${basePath}/content-${target.target_index}.${ext}`
        const oldPath = target.content_url.split('/ar-files/')[1]
        if (oldPath) await supabase.storage.from('ar-files').remove([oldPath])
        const { error: uploadErr } = await supabase.storage.from('ar-files').upload(path, file)
        if (uploadErr) throw uploadErr
        const newUrl = supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl
        await supabase.from('ar_targets').update({ content_url: newUrl }).eq('id', targetId)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
      setSaving(false)
      setRecompiling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas-soft)' }}>
        <div className="w-8 h-8 animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)' }} />
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

  if (recompiling) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-canvas-soft)' }}>
        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div className="w-14 h-14 animate-spin mx-auto mb-5" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)' }} />
          <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: 'var(--color-ink)', margin: '0 0 4px' }}>{recompileMsg}</p>
          <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 20px' }}>Marker baru sedang dikompilasi ulang...</p>
          <div style={{ background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-full)', height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-primary)', height: 4, borderRadius: 'var(--radius-full)', width: `${recompileProgress}%`, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-mute)', marginTop: 8 }}>{recompileProgress}%</p>
        </div>
      </div>
    )
  }

  const sortedTargets = [...(project.ar_targets ?? [])].sort((a, b) => a.target_index - b.target_index)
  const hasChanges = name !== project.name || Object.keys(contentReplacements).length > 0 || Object.keys(markerReplacements).length > 0

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
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: '0 0 32px' }}>Ubah nama, ganti marker, atau perbarui konten AR</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 24 }}>{error}</div>
        )}

        <div className="space-y-4">
          <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <label style={{ display: 'block', fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', marginBottom: 8 }}>Nama Project</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
          </div>

          {sortedTargets.map((target: ARTarget, i) => (
            <div key={target.id} style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)', margin: 0 }}>Marker {i + 1}</p>
                {markerReplacements[target.id] && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)' }}>
                    <RefreshCw size={11} /> Akan dikompilasi ulang
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 8px' }}>Gambar Marker</p>
                  <div onClick={() => markerRefs.current[target.id]?.click()} className="upload-zone"
                    style={{ height: 96, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px dashed var(--color-hairline-strong)', cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-hairline-strong)')}>
                    <img
                      src={markerPreviews[target.id] ?? target.marker_url}
                      alt="marker"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      <Upload size={20} style={{ color: '#fff' }} />
                    </div>
                  </div>
                  {markerReplacements[target.id]
                    ? <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-success)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{markerReplacements[target.id].name}</p>
                    : <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-faint)', marginTop: 4 }}>Klik untuk ganti marker</p>
                  }
                  <input ref={el => { markerRefs.current[target.id] = el }} type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleMarkerChange(target.id, f) }}
                    className="hidden" />
                </div>

                <div>
                  <p className="flex items-center gap-1" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 8px' }}>
                    {target.content_type === 'video' ? <><Video size={12} /> Video</> : <><Box size={12} /> 3D Object</>}
                  </p>
                  <div onClick={() => contentRefs.current[target.id]?.click()} className="upload-zone"
                    style={{ height: 96, border: '2px dashed var(--color-hairline-strong)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-hairline-strong)')}>
                    <Upload size={18} style={{ color: 'var(--color-ink-faint)', marginBottom: 4 }} />
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: 0 }}>Ganti konten</p>
                  </div>
                  {contentReplacements[target.id] && (
                    <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-success)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contentReplacements[target.id].name}</p>
                  )}
                  <input ref={el => { contentRefs.current[target.id] = el }} type="file"
                    accept={target.content_type === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleContentChange(target.id, f) }}
                    className="hidden" />
                </div>
              </div>
            </div>
          ))}

          {Object.keys(markerReplacements).length > 0 && (
            <div style={{ background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--color-ink-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              {Object.keys(markerReplacements).length} marker diganti — file <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>.mind</span> akan dikompilasi ulang saat menyimpan
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !hasChanges}
            style={hasChanges && !saving ? {
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1,
              cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s ease',
            } : {
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--color-canvas)', color: 'var(--color-ink-mute)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1,
              cursor: 'not-allowed', fontFamily: 'var(--font-display)', opacity: 0.6,
            }}
            onMouseEnter={e => { if (hasChanges && !saving) e.currentTarget.style.background = 'var(--color-primary-deep)' }}
            onMouseLeave={e => { if (hasChanges && !saving) e.currentTarget.style.background = 'var(--color-primary)' }}>
            <Save size={14} />
            {saving ? 'Menyimpan...' : hasChanges ? 'Simpan Perubahan' : 'Tidak Ada Perubahan'}
          </button>
        </div>
      </main>
    </div>
  )
}
