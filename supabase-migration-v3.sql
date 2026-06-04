-- Migration v3: Analytics + Edit support

-- 1. Tambah scan_count ke ar_projects
ALTER TABLE ar_projects ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;

-- 2. Function untuk increment scan_count secara atomic
CREATE OR REPLACE FUNCTION increment_scan_count(project_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE ar_projects SET scan_count = scan_count + 1 WHERE slug = project_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Allow public (anon) to call the function
GRANT EXECUTE ON FUNCTION increment_scan_count(TEXT) TO anon, authenticated;

-- 4. Allow update content_url pada ar_targets (untuk edit konten)
CREATE POLICY "Users can update own targets"
  ON ar_targets FOR UPDATE
  USING (
    project_id IN (SELECT id FROM ar_projects WHERE user_id = auth.uid())
  );

-- 5. Allow update name pada ar_projects
CREATE POLICY "Users can update own projects"
  ON ar_projects FOR UPDATE
  USING (auth.uid() = user_id);
