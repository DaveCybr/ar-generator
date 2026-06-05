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

        supabase.from('ar_projects')
          .update({ scan_count: (data.scan_count ?? 0) + 1 })
          .eq('id', data.id)
          .then(() => {})

        supabase.from('scan_logs')
          .insert({ project_id: data.id })
          .then(() => {})

        const targets = (data.ar_targets ?? [])
          .sort((a, b) => a.target_index - b.target_index)
          .map(t => ({ type: t.content_type, content: t.content_url }))

        const params = new URLSearchParams({
          mind: data.mind_file_url,
          targets: JSON.stringify(targets),
          slug,
          sbUrl: import.meta.env.VITE_SUPABASE_URL,
          sbKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        })
        window.location.replace(`/ar-viewer.html?${params.toString()}`)
      })
  }, [slug])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#030712' }}>
        <div className="text-center">
          <p style={{ color: '#f87171', fontWeight: 500 }}>{error}</p>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>Cek kembali link yang kamu gunakan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#030712' }}>
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}
