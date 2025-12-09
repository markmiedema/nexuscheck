-- ============================================================================
-- Create Organization Assets Storage Bucket
-- ============================================================================
-- Created: 2025-12-09
-- Purpose: Storage bucket for organization logos and branding assets
-- ============================================================================

-- Create the storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,  -- Public bucket so logos can be displayed
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];

-- Allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
);

-- Allow anyone to view organization assets (public logos)
CREATE POLICY "Anyone can view organization assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

-- Allow admins to update/delete their organization's assets
CREATE POLICY "Admins can update organization assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
);

CREATE POLICY "Admins can delete organization assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
--
-- WHAT THIS MIGRATION DOES:
-- 1. Creates a public storage bucket for organization logos/assets
-- 2. Sets up RLS policies so only org admins can upload/modify
-- 3. Allows public read access for displaying logos
--
-- ROLLBACK (if needed):
-- DROP POLICY IF EXISTS "Users can upload organization assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view organization assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can update organization assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can delete organization assets" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'organization-assets';
--
-- ============================================================================
