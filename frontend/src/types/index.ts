export type ContentType = 'video' | '3d'

export interface ARProject {
  id: string
  user_id: string
  name: string
  marker_url: string
  mind_file_url: string
  content_type: ContentType
  content_url: string
  slug: string
  created_at: string
}
