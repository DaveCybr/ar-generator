-- Migration v2: Multiple markers per project

-- 1. Buat tabel ar_targets
CREATE TABLE ar_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES ar_projects(id) ON DELETE CASCADE NOT NULL,
  target_index INTEGER NOT NULL,
  marker_url TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('video', '3d')) NOT NULL,
  content_url TEXT NOT NULL
);

-- 2. RLS untuk ar_targets
ALTER TABLE ar_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own targets"
  ON ar_targets FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM ar_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view targets"
  ON ar_targets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own targets"
  ON ar_targets FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM ar_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own targets"
  ON ar_targets FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM ar_projects WHERE user_id = auth.uid()
    )
  );

-- 3. Hapus kolom single-target dari ar_projects
ALTER TABLE ar_projects
  DROP COLUMN IF EXISTS marker_url,
  DROP COLUMN IF EXISTS content_type,
  DROP COLUMN IF EXISTS content_url;
