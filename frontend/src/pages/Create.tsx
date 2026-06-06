import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { compileMindFile } from '../lib/mindCompiler'
import { usePlan } from '../hooks/usePlan'
import { Layers, ArrowLeft, Upload, Image, Video, Box, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { ContentType } from '../types'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const schema = z.object({
  name: z.string().min(1, 'Nama project wajib diisi').max(100),
  customSlug: z.string()
    .max(50, 'Maksimal 50 karakter')
    .refine(v => v === '' || slugRegex.test(v), 'Hanya huruf kecil, angka, dan tanda hubung (-)')
    .optional(),
})
type FormData = z.infer<typeof schema>

interface TargetPair {
  id: string
  markerFile: File | null
  markerPreview: string | null
  contentFile: File | null
  contentType: ContentType
}

function TargetCard({ pair, index, total, onChange, onRemove }: {
  pair: TargetPair; index: number; total: number
  onChange: (id: string, field: Partial<TargetPair>) => void
  onRemove: (id: string) => void
}) {
  const markerRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLInputElement>(null)

  const handleMarker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange(pair.id, { markerFile: file, markerPreview: URL.createObjectURL(file) })
  }
  const handleContent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onChange(pair.id, { contentFile: file })
  }

  return (
    <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink-secondary)' }}>Marker {index + 1}</span>
        {total > 1 && (
          <button type="button" onClick={() => onRemove(pair.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-faint)', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-ink-faint)')}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1 mb-2" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)' }}>
            <Image size={12} /> Gambar Marker
          </label>
          <div onClick={() => markerRef.current?.click()}
            style={{ border: '2px dashed var(--color-hairline-strong)', borderRadius: 'var(--radius-md)', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s' }}
            className="upload-zone"
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-hairline-strong)')}>
            {pair.markerPreview
              ? <img src={pair.markerPreview} alt="marker" style={{ maxHeight: 88, maxWidth: '100%', objectFit: 'contain' }} />
              : <div className="text-center"><Upload size={18} style={{ color: 'var(--color-ink-faint)', margin: '0 auto 4px' }} /><p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: 0 }}>Upload</p></div>
            }
          </div>
          {pair.markerFile && <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-success)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.markerFile.name}</p>}
          <input ref={markerRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMarker} className="hidden" />
        </div>

        <div>
          <label className="flex items-center gap-1 mb-2" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)' }}>
            <Video size={12} /> Konten AR
          </label>
          <div className="flex gap-1.5 mb-2">
            {(['video', '3d'] as ContentType[]).map(t => (
              <button key={t} type="button" onClick={() => onChange(pair.id, { contentType: t, contentFile: null })}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 4px', borderRadius: 'var(--radius-sm)', border: pair.contentType === t ? '1px solid var(--color-primary)' : '1px solid var(--color-hairline)', background: pair.contentType === t ? 'rgba(62,207,142,0.08)' : 'var(--color-canvas)', color: pair.contentType === t ? 'var(--color-ink)' : 'var(--color-ink-mute)', fontSize: 12, lineHeight: 1.45, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                {t === 'video' ? <Video size={11} /> : <Box size={11} />}
                {t === 'video' ? 'Video' : '3D'}
              </button>
            ))}
          </div>
          <div onClick={() => contentRef.current?.click()}
            style={{ border: '2px dashed var(--color-hairline-strong)', borderRadius: 'var(--radius-md)', height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-hairline-strong)')}>
            <Upload size={16} style={{ color: 'var(--color-ink-faint)', marginBottom: 2 }} />
            <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: 0 }}>{pair.contentType === 'video' ? 'MP4/WebM' : 'GLB/GLTF'}</p>
          </div>
          {pair.contentFile && <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-success)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pair.contentFile.name}</p>}
          <input ref={contentRef} type="file" accept={pair.contentType === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'} onChange={handleContent} className="hidden" />
        </div>
      </div>
    </div>
  )
}

export default function Create() {
  const navigate = useNavigate()
  const { limits } = usePlan()
  const [targets, setTargets] = useState<TargetPair[]>([
    { id: uuidv4(), markerFile: null, markerPreview: null, contentFile: null, contentType: 'video' },
  ])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [generatedSlug, setGeneratedSlug] = useState('')

  useEffect(() => { document.title = 'Buat AR Baru — AR Generator' }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const updateTarget = (id: string, field: Partial<TargetPair>) =>
    setTargets(prev => prev.map(t => t.id === id ? { ...t, ...field } : t))

  const addTarget = () =>
    setTargets(prev => [...prev, { id: uuidv4(), markerFile: null, markerPreview: null, contentFile: null, contentType: 'video' }])

  const removeTarget = (id: string) =>
    setTargets(prev => prev.filter(t => t.id !== id))

  const onSubmit = async (data: FormData) => {
    for (let i = 0; i < targets.length; i++) {
      if (!targets[i].markerFile) return setError(`Upload gambar marker untuk Marker ${i + 1}`)
      if (!targets[i].contentFile) return setError(`Upload konten untuk Marker ${i + 1}`)
    }
    setError('')
    setProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let slug = data.customSlug?.trim() || (uuidv4().split('-')[0] + '-' + uuidv4().split('-')[0])

      if (data.customSlug?.trim()) {
        const { data: existing } = await supabase.from('ar_projects').select('id').eq('slug', slug).single()
        if (existing) { setError('Slug sudah digunakan, pilih yang lain'); setProcessing(false); return }
      }

      const basePath = `${user.id}/${slug}`
      setStatusMsg(`Mengkompilasi ${targets.length} marker...`)
      setProgress(0)
      const mindBlob = await compileMindFile(
        targets.map(t => t.markerFile!),
        (p) => { setProgress(Math.round(p * 0.5)); setStatusMsg(`Mengkompilasi marker... ${p}%`) }
      )
      setStatusMsg('Mengupload .mind file...')
      const { error: mindErr } = await supabase.storage.from('ar-files').upload(`${basePath}/marker.mind`, mindBlob)
      if (mindErr) throw mindErr
      setProgress(55)
      const getUrl = (path: string) => supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl
      const mindFileUrl = getUrl(`${basePath}/marker.mind`)
      const targetData = []
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i]
        const step = 45 / targets.length
        setStatusMsg(`Mengupload marker ${i + 1}/${targets.length}...`)
        const markerExt = t.markerFile!.name.split('.').pop()
        const { error: mErr } = await supabase.storage.from('ar-files').upload(`${basePath}/marker-${i}.${markerExt}`, t.markerFile!)
        if (mErr) throw mErr
        setStatusMsg(`Mengupload konten ${i + 1}/${targets.length}...`)
        const contentExt = t.contentFile!.name.split('.').pop()
        const { error: cErr } = await supabase.storage.from('ar-files').upload(`${basePath}/content-${i}.${contentExt}`, t.contentFile!)
        if (cErr) throw cErr
        setProgress(55 + Math.round(step * (i + 1)))
        targetData.push({ target_index: i, marker_url: getUrl(`${basePath}/marker-${i}.${markerExt}`), content_type: t.contentType, content_url: getUrl(`${basePath}/content-${i}.${contentExt}`) })
      }
      setStatusMsg('Menyimpan data...')
      setProgress(95)
      const { data: project, error: dbErr } = await supabase.from('ar_projects').insert({ user_id: user.id, name: data.name, slug, mind_file_url: mindFileUrl }).select().single()
      if (dbErr) throw dbErr
      const { error: targetsErr } = await supabase.from('ar_targets').insert(targetData.map(t => ({ ...t, project_id: project.id })))
      if (targetsErr) throw targetsErr
      setProgress(100)
      setGeneratedSlug(slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setProcessing(false)
    }
  }

  if (generatedSlug) {
    const viewerUrl = `${window.location.origin}/ar/${generatedSlug}`
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-canvas-soft)' }}>
        <div className="w-full max-w-md text-center" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(62,207,142,0.1)', borderRadius: 'var(--radius-full)' }}>
            <CheckCircle2 style={{ color: 'var(--color-primary)', width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: '0 0 8px' }}>AR Project Berhasil Dibuat!</h2>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 4px' }}>{targets.length} marker siap digunakan</p>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink-mute)', margin: '0 0 20px' }}>Bagikan link berikut untuk membuka AR viewer</p>
          <div style={{ background: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
            <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: '0 0 4px' }}>Link AR Viewer</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.5, color: 'var(--color-primary)', margin: 0, wordBreak: 'break-all' }}>{viewerUrl}</p>
          </div>
          <div className="flex flex-col gap-2">
            <a href={viewerUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
              Buka AR Viewer
            </a>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-canvas-soft)' }}>
        <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div className="w-14 h-14 animate-spin mx-auto mb-5" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)' }} />
          <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, color: 'var(--color-ink)', margin: '0 0 4px' }}>{statusMsg}</p>
          <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-mute)', margin: '0 0 20px' }}>Ini mungkin membutuhkan beberapa saat...</p>
          <div style={{ background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-full)', height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-primary)', height: 4, borderRadius: 'var(--radius-full)', width: `${progress}%`, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-mute)', marginTop: 8 }}>{progress}%</p>
        </div>
      </div>
    )
  }

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
        <h1 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 4px' }}>Buat AR Baru</h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: '0 0 32px' }}>Tambahkan satu atau lebih pasangan marker + konten</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, lineHeight: 1.45, marginBottom: 24 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <label style={{ display: 'block', fontSize: 18, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', marginBottom: 8 }}>Nama Project</label>
            <input {...register('name')} type="text" placeholder="Contoh: AR Undangan Pernikahan"
              style={{ width: '100%', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 16, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-display)', marginBottom: errors.name ? 4 : 16 }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-hairline)'} />
            {errors.name && <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 16px' }}>{errors.name.message}</p>}

            {limits.can_custom_slug && (
              <>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-ink)', marginBottom: 4 }}>
                  Slug URL <span style={{ fontWeight: 400, color: 'var(--color-ink-mute)', fontSize: 13 }}>(opsional)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}
                  onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--color-hairline)')}>
                  <span style={{ padding: '8px 10px', background: 'var(--color-canvas-soft)', color: 'var(--color-ink-faint)', fontSize: 13, borderRight: '1px solid var(--color-hairline)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>/ar/</span>
                  <input {...register('customSlug')} type="text" placeholder="nama-project-kamu"
                    style={{ flex: 1, background: 'var(--color-canvas)', border: 'none', padding: '8px 12px', fontSize: 14, lineHeight: 1.5, color: 'var(--color-ink)', outline: 'none', fontFamily: 'var(--font-mono)' }} />
                </div>
                {errors.customSlug
                  ? <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>{errors.customSlug.message}</p>
                  : <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 4 }}>Kosongkan untuk slug otomatis. Gunakan huruf kecil, angka, dan tanda hubung.</p>
                }
              </>
            )}
          </div>

          {targets.map((pair, i) => (
            <TargetCard key={pair.id} pair={pair} index={i} total={targets.length} onChange={updateTarget} onRemove={removeTarget} />
          ))}

          {(() => {
            const atMarkerLimit = limits.max_markers !== -1 && targets.length >= limits.max_markers
            return (
              <>
                <button type="button" onClick={addTarget} disabled={atMarkerLimit}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed var(--color-hairline-strong)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', background: 'none', color: atMarkerLimit ? 'var(--color-ink-faint)' : 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, lineHeight: 1.0, cursor: atMarkerLimit ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', transition: 'border-color 0.15s', opacity: atMarkerLimit ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!atMarkerLimit) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' } }}
                  onMouseLeave={e => { if (!atMarkerLimit) { e.currentTarget.style.borderColor = 'var(--color-hairline-strong)'; e.currentTarget.style.color = 'var(--color-ink-mute)' } }}>
                  <Plus size={15} /> Tambah Marker
                </button>
                {atMarkerLimit && (
                  <p style={{ fontSize: 12, color: 'var(--color-ink-mute)', marginTop: 6, textAlign: 'center' }}>
                    Maksimal {limits.max_markers} marker di plan kamu.{' '}
                    <Link to="/pricing" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Upgrade untuk lebih banyak marker.</Link>
                  </p>
                )}
              </>
            )
          })()}

          {targets.some(t => t.markerFile) && (
            <div style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: '0 0 12px' }}>Preview</p>
              <div className="flex gap-2 flex-wrap">
                {targets.map((t, i) => t.markerFile && (
                  <div key={t.id} className="flex items-center gap-2" style={{ background: 'var(--color-canvas-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                    <img src={t.markerPreview!} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: 'var(--color-ink)', margin: 0 }}>Marker {i + 1}</p>
                      <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--color-ink-faint)', margin: 0 }}>{t.contentType === 'video' ? 'Video' : '3D'} {t.contentFile ? '✓' : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit"
            style={{ width: '100%', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 14, fontWeight: 500, lineHeight: 1, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
            Generate AR ({targets.length} marker)
          </button>
        </form>
      </main>
    </div>
  )
}
