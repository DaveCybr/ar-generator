export type ContentType = 'video' | '3d'

export interface ARTarget {
  id: string
  project_id: string
  target_index: number
  marker_url: string
  content_type: ContentType
  content_url: string
}

export interface ARProject {
  id: string
  user_id: string
  name: string
  slug: string
  mind_file_url: string
  scan_count: number
  created_at: string
  expires_at: string | null
  ar_targets?: ARTarget[]
}
