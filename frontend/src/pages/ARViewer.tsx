import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ARProject } from '../types'

export default function ARViewer() {
  const { slug } = useParams<{ slug: string }>()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return

    supabase
      .from('ar_projects')
      .select('*, ar_targets(*)')
      .eq('slug', slug)
      .single()
      .then(({ data, error }: { data: ARProject | null; error: unknown }) => {
        if (error || !data) { setError('AR project tidak ditemukan'); return }

        const targets = (data.ar_targets ?? [])
          .sort((a, b) => a.target_index - b.target_index)
          .map(t => ({ type: t.content_type, content: t.content_url }))

        const params = new URLSearchParams({
          mind: data.mind_file_url,
          targets: JSON.stringify(targets),
        })
        window.location.replace(`/ar-viewer.html?${params.toString()}`)
      })
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-2">Cek kembali link yang kamu gunakan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
