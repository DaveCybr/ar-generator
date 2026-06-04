import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { compileMindFile } from '../lib/mindCompiler'
import { Layers, ArrowLeft, Upload, Image, Video, Box, CheckCircle2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const schema = z.object({
  name: z.string().min(1, 'Nama project wajib diisi').max(100),
})

type FormData = z.infer<typeof schema>
type ContentType = 'video' | '3d'

export default function Create() {
  const navigate = useNavigate()
  const [contentType, setContentType] = useState<ContentType>('video')
  const [markerFile, setMarkerFile] = useState<File | null>(null)
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [markerPreview, setMarkerPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const markerInputRef = useRef<HTMLInputElement>(null)
  const contentInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onMarkerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMarkerFile(file)
    setMarkerPreview(URL.createObjectURL(file))
  }

  const onContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setContentFile(file)
  }

  const onSubmit = async (data: FormData) => {
    if (!markerFile) return setError('Upload gambar marker terlebih dahulu')
    if (!contentFile) return setError('Upload konten AR terlebih dahulu')

    setError('')
    setProcessing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const slug = uuidv4().split('-')[0] + '-' + uuidv4().split('-')[0]
      const basePath = `${user.id}/${slug}`

      setStatusMsg('Mengkompilasi marker AR...')
      setProgress(0)
      const mindBlob = await compileMindFile(markerFile, (p) => {
        setProgress(p)
        setStatusMsg(`Mengkompilasi marker AR... ${p}%`)
      })

      setStatusMsg('Mengupload marker...')
      setProgress(0)
      const markerExt = markerFile.name.split('.').pop()
      const { error: markerErr } = await supabase.storage
        .from('ar-files')
        .upload(`${basePath}/marker.${markerExt}`, markerFile)
      if (markerErr) throw markerErr
      setProgress(33)

      setStatusMsg('Mengupload file .mind...')
      const { error: mindErr } = await supabase.storage
        .from('ar-files')
        .upload(`${basePath}/marker.mind`, mindBlob)
      if (mindErr) throw mindErr
      setProgress(66)

      setStatusMsg('Mengupload konten...')
      const contentExt = contentFile.name.split('.').pop()
      const { error: contentErr } = await supabase.storage
        .from('ar-files')
        .upload(`${basePath}/content.${contentExt}`, contentFile)
      if (contentErr) throw contentErr
      setProgress(90)

      const getUrl = (path: string) =>
        supabase.storage.from('ar-files').getPublicUrl(path).data.publicUrl

      setStatusMsg('Menyimpan data...')
      const { error: dbErr } = await supabase.from('ar_projects').insert({
        user_id: user.id,
        name: data.name,
        slug,
        marker_url: getUrl(`${basePath}/marker.${markerExt}`),
        mind_file_url: getUrl(`${basePath}/marker.mind`),
        content_type: contentType,
        content_url: getUrl(`${basePath}/content.${contentExt}`),
      })
      if (dbErr) throw dbErr

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
            <p className="text-gray-400 text-sm mb-6">Bagikan link berikut untuk membuka AR viewer</p>
            <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4 text-left">
              <p className="text-xs text-gray-500 mb-1">Link AR Viewer</p>
              <p className="text-violet-400 text-sm break-all">{viewerUrl}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors block text-center"
              >
                Buka AR Viewer
              </a>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
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
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
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
        <p className="text-gray-400 text-sm mb-8">Upload marker dan konten untuk AR experience kamu</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <Image className="w-4 h-4 inline mr-2" />
              Gambar Marker
            </label>
            <p className="text-gray-500 text-xs mb-3">Gunakan gambar dengan banyak detail dan kontras tinggi. Format: JPG, PNG</p>
            <div
              onClick={() => markerInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-lg p-6 cursor-pointer transition-colors text-center"
            >
              {markerPreview ? (
                <img src={markerPreview} alt="marker preview" className="max-h-32 mx-auto rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Klik untuk upload gambar marker</p>
                </>
              )}
            </div>
            {markerFile && <p className="text-green-400 text-xs mt-2">{markerFile.name}</p>}
            <input ref={markerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onMarkerChange} className="hidden" />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Tipe Konten AR</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['video', '3d'] as ContentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setContentType(type); setContentFile(null) }}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    contentType === type
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {type === 'video'
                    ? <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    : <Box className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-medium">{type === 'video' ? 'Video' : '3D Object'}</p>
                    <p className="text-xs text-gray-500">{type === 'video' ? 'MP4, WebM' : 'GLB, GLTF'}</p>
                  </div>
                </button>
              ))}
            </div>
            <div
              onClick={() => contentInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-lg p-6 cursor-pointer transition-colors text-center"
            >
              <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Upload {contentType === 'video' ? 'video (MP4, WebM)' : '3D object (GLB, GLTF)'}
              </p>
            </div>
            {contentFile && <p className="text-green-400 text-xs mt-2">{contentFile.name}</p>}
            <input
              ref={contentInputRef}
              type="file"
              accept={contentType === 'video' ? 'video/mp4,video/webm' : '.glb,.gltf'}
              onChange={onContentChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg text-sm transition-colors"
          >
            Generate AR
          </button>
        </form>
      </main>
    </div>
  )
}
