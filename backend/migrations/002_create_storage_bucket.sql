-- ============================================================================
-- Create Storage Bucket for Analysis Uploads
-- ============================================================================
-- Purpose: Create the 'analysis-uploads' bucket for storing raw CSV files
--          during the smart column mapping workflow
-- ============================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'analysis-uploads',
    'analysis-uploads',
    false,  -- Private bucket (not publicly accessible)
    52428800,  -- 50MB in bytes
    ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]
)
ON CONFLICT (id) DO NOTHING;  -- Skip if bucket already exists

-- ============================================================================
-- Set up RLS (Row Level Security) policies for the bucket
-- ============================================================================
-- Allow authenticated users to upload files to their own user folder
-- ============================================================================

-- Policy: Users can upload files to their own folder (uploads/{user_id}/...)
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'analysis-uploads'
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can read files from their own folder
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'analysis-uploads'
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update files in their own folder
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'analysis-uploads'
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete files from their own folder
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'analysis-uploads'
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the bucket was created successfully:
--
-- SELECT * FROM storage.buckets WHERE id = 'analysis-uploads';
--
-- Expected result:
-- id: analysis-uploads
-- name: analysis-uploads
-- public: false
-- file_size_limit: 52428800
-- allowed_mime_types: {text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}
-- ============================================================================
