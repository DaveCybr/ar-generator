import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { compileMindFile } from '../lib/mindCompiler'
import { Layers, ArrowLeft, Upload, Image, Video, Box, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { ContentType } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Nama project wajib diisi').max(100),
})
type FormData = z.infer<typeof schema>

interface TargetPair {
  id: string
  markerFile: File | null
  markerPreview: string | null
  contentFile: File | null
  contentType: ContentType
}

function TargetCard({
  pair,
  index,
  total,
  onChange,
  onRemove,
}: {
  pair: TargetPair
  index: number
  total: number
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-300">Marker {index + 1}</span>
        {total > 1 && (
          <button type="button" onClick={() => onRemove(pair.id)} className="text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Marker image */}
        <div>
          <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Image className="w-3 h-3" /> Gambar Marker
          </label>
          <div
            onClick={() => markerRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-lg p-3 cursor-pointer transition-colors text-center h-24 flex items-center justify-center"
          >
            {pair.markerPreview
              ? <img src={pair.markerPreview} alt="marker" className="max-h-20 max-w-full object-contain rounded" />
              : <><Upload className="w-5 h-5 text-gray-600 mx-auto mb-1" /><p className="text-gray-600 text-xs">Upload</p></>
            }
          </div>
          {pair.markerFile && <p className="text-green-400 text-xs mt-1 truncate">{pair.markerFile.name}</p>}
          <input ref={markerRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMarker} className="hidden" />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Video className="w-3 h-3" /> Konten AR
          </label>
          <div className="flex gap-2 mb-2">
            {(['video', '3d'] as ContentType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onChange(pair.id, { contentType: t, contentFile: null })}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs transition-colors ${
                  pair.contentType === t
                    ? 'border-violet-500 bg-violet-500/10 text-white'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {t === 'video' ? <Video className="w-3 h-3" /> : <Box className="w-3 h-3" />}
                {t === 'video' ? 'Video' : '3D'}
              </button>
            ))}
          </div>
          <div
            onClick={() => contentRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-lg p-3 cursor-pointer transition-colors text-center h-16 flex items-center justify-center"
          >
            <Upload className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-gray-600 text-xs">{pair.contentType === 'video' ? 'MP4/WebM' : 'GLB/GLTF'}</p>
          </div>
          {pair.contentFile && <p className="text-green-400 text-xs mt-1 truncate">{pair.contentFile.name}</p>}
          <input
            ref={contentRef}
            type="file"
            accept={pair.contentType === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'}
            onChange={handleContent}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}

export default function Create() {
  const navigate = useNavigate()
  const [targets, setTargets] = useState<TargetPair[]>([
    { id: uuidv4(), markerFile: null, markerPreview: null, contentFile: null, contentType: 'video' },
  ])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [generatedSlug, setGeneratedSlug] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateTarget = (id: string, field: Partial<TargetPair>) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, ...field } : t))
  }

  const addTarget = () => {
    setTargets(prev => [...prev, {
      id: uuidv4(), markerFile: null, markerPreview: null, contentFile: null, contentType: 'video',
    }])
  }

  const removeTarget = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id))
  }

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

      const slug = uuidv4().split('-')[0] + '-' + uuidv4().split('-')[0]
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

      // Upload semua marker images dan content files
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

        targetData.push({
          target_index: i,
          marker_url: getUrl(`${basePath}/marker-${i}.${markerExt}`),
          content_type: t.contentType,
          content_url: getUrl(`${basePath}/content-${i}.${contentExt}`),
        })
      }

      setStatusMsg('Menyimpan data...')
      setProgress(95)

      const { data: project, error: dbErr } = await supabase
        .from('ar_projects')
        .insert({ user_id: user.id, name: data.name, slug, mind_file_url: mindFileUrl })
        .select()
        .single()
      if (dbErr) throw dbErr

      const { error: targetsErr } = await supabase
        .from('ar_targets')
        .insert(targetData.map(t => ({ ...t, project_id: project.id })))
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-violet-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">AR Project Berhasil Dibuat!</h2>
            <p className="text-gray-400 text-sm mb-2">{targets.length} marker siap digunakan</p>
            <p className="text-gray-400 text-sm mb-6">Bagikan link berikut untuk membuka AR viewer</p>
            <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Link AR Viewer</p>
              <p className="text-violet-400 text-sm break-all">{viewerUrl}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a href={viewerUrl} target="_blank" rel="noreferrer"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors block text-center">
                Buka AR Viewer
              </a>
              <button onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors">
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-white font-medium mb-1">{statusMsg}</p>
          <p className="text-gray-500 text-xs mb-5">Ini mungkin membutuhkan beberapa saat...</p>
          <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-500 text-xs mt-2">{progress}%</p>
        </div>
      </div>
    )
  }

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
        <h1 className="text-white text-2xl font-semibold mb-1">Buat AR Baru</h1>
        <p className="text-gray-400 text-sm mb-8">Tambahkan satu atau lebih pasangan marker + konten</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Nama Project</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Contoh: AR Undangan Pernikahan"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {targets.map((pair, i) => (
            <TargetCard
              key={pair.id}
              pair={pair}
              index={i}
              total={targets.length}
              onChange={updateTarget}
              onRemove={removeTarget}
            />
          ))}

          <button
            type="button"
            onClick={addTarget}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-violet-500 text-gray-500 hover:text-violet-400 py-3 rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Marker
          </button>

          {/* Preview summary */}
          {targets.some(t => t.markerFile) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3">Preview</p>
              <div className="flex gap-2 flex-wrap">
                {targets.map((t, i) => t.markerFile && (
                  <div key={t.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                    <img src={t.markerPreview!} alt="" className="w-8 h-8 object-cover rounded" />
                    <div>
                      <p className="text-xs text-white">Marker {i + 1}</p>
                      <p className="text-xs text-gray-500">{t.contentType === 'video' ? 'Video' : '3D'} {t.contentFile ? '✓' : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg text-sm transition-colors"
          >
            Generate AR ({targets.length} marker)
          </button>
        </form>
      </main>
    </div>
  )
}
