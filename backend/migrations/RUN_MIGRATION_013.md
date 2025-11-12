# How to Run Migration 013 - Physical Nexus Schema Update

## Problem
The Physical Nexus feature isn't saving because the database table schema doesn't match what the API expects.

## Solution
Run migration 013 to update the `physical_nexus` table schema.

---

## Steps to Run Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in to your account
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run Migration**
   - Open `backend/migrations/013_update_physical_nexus_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see: `Physical nexus table migration successful. All columns present.`
   - Check the "Table Editor" → Find `physical_nexus` table
   - Verify columns: `state_code`, `nexus_date`, `reason`, `registration_date`, `permit_number`, `notes`

---

### Option 2: Local SQL File Upload

1. Open Supabase Dashboard → SQL Editor
2. Click "+ New query"
3. Click the "..." menu → "Upload SQL file"
4. Select `backend/migrations/013_update_physical_nexus_schema.sql`
5. Click "Run"

---

## What This Migration Does

### Schema Changes:
- ✅ Renames `state` → `state_code` (matches API)
- ✅ Renames `nexus_type` → `reason` (text field for description)
- ✅ Renames `established_date` → `nexus_date` (matches API)
- ✅ Removes `ended_date` and `still_active` (not needed for MVP)
- ✅ Adds `registration_date` (optional field)
- ✅ Adds `permit_number` (optional, max 50 characters)
- ✅ Keeps `notes` field for additional info

### Security:
- ✅ Enables Row Level Security (RLS)
- ✅ Users can only see their own physical nexus records
- ✅ Users can only modify their own records
- ✅ Prevents cross-user data access

### Performance:
- ✅ Adds indexes on `analysis_id`, `state_code`, `created_at`
- ✅ Adds unique constraint (one physical nexus per state per analysis)

---

## After Running Migration

### Test Physical Nexus Feature:

1. **Refresh Your Browser**
   - Clear any cached errors
   - Reload the analysis results page

2. **Try Adding a State**
   - Click "Add State" button
   - Select a state (e.g., California)
   - Enter nexus date (e.g., 2020-01-15)
   - Enter reason (e.g., "Office in Los Angeles")
   - Click "Add State"

3. **Expected Result**
   - State should appear in table
   - Success notification should show
   - Recalculation should trigger automatically

---

## Troubleshooting

### If You See Errors:

**Error: "relation 'physical_nexus' does not exist"**
- Solution: Run the migration - the table will be created

**Error: "permission denied for table physical_nexus"**
- Solution: The RLS policies will be created by the migration

**Error: "duplicate key value violates unique constraint"**
- Cause: Trying to add the same state twice
- Solution: This is expected - use the Edit button to update existing states

**Frontend Still Not Working After Migration:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try adding a state again
4. Copy any error messages
5. Check Network tab for failed API requests

---

## Verification Queries

After running the migration, you can verify it worked:

```sql
-- Check table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'physical_nexus'
ORDER BY ordinal_position;

-- Check RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'physical_nexus';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'physical_nexus';
```

Expected columns:
- `id` (integer)
- `analysis_id` (uuid)
- `state_code` (character, length 2)
- `nexus_date` (date)
- `reason` (character varying, length 255)
- `registration_date` (date, nullable)
- `permit_number` (character varying, length 50, nullable)
- `notes` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Rollback (If Needed)

If something goes wrong, you can rollback by running:

```sql
-- This will restore the original schema
-- WARNING: This drops all physical nexus data

DROP TABLE IF EXISTS physical_nexus CASCADE;

-- Then re-run migration 001_initial_schema.sql lines 176-186
```

---

## Next Steps After Successful Migration

1. ✅ Test adding a physical nexus state
2. ✅ Test editing an existing state
3. ✅ Test deleting a state
4. ✅ Test import/export functionality
5. ✅ Verify recalculation works

---

**Questions?** Check the browser console (F12 → Console) for any JavaScript errors if the frontend still doesn't work after running the migration.
