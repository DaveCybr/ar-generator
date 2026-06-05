-- Run this for a fresh install. For existing databases, run supabase-migration-v2.sql and supabase-migration-v3.sql

-- 1. Buat tabel ar_projects
CREATE TABLE ar_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  mind_file_url TEXT NOT NULL,
  scan_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE ar_projects ENABLE ROW LEVEL SECURITY;

-- User hanya bisa baca/tulis project miliknya sendiri
CREATE POLICY "Users can view own projects"
  ON ar_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON ar_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON ar_projects FOR DELETE
  USING (auth.uid() = user_id);

-- AR viewer bisa dibaca siapa saja (public)
CREATE POLICY "Anyone can view project by slug"
  ON ar_projects FOR SELECT
  USING (true);

-- 3. Buat Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ar-files', 'ar-files', true);

-- 4. Storage Policies
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ar-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read ar-files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ar-files');

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ar-files' AND (storage.foldername(name))[1] = auth.uid()::text);
