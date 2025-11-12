# Physical Nexus Feature - Setup Required

## 🚨 Issue
The Physical Nexus feature isn't saving because the database table schema doesn't match what the API expects.

---

## ✅ Solution: Run Database Migration

You need to run a database migration to update the `physical_nexus` table schema.

### Quick Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New query"

3. **Run Migration**
   - Open file: `backend/migrations/013_update_physical_nexus_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - You should see message: "Physical nexus table migration successful"
   - Refresh your browser
   - Try adding a state again

---

## 📋 What the Migration Does

**Schema Updates:**
- Changes column names to match API expectations
- Adds missing fields (`registration_date`, `permit_number`)
- Removes unused fields (`ended_date`, `still_active`)

**Security:**
- Enables Row Level Security (RLS)
- Ensures users can only see their own data
- Prevents cross-user access

**Performance:**
- Adds database indexes
- Adds unique constraint (one state per analysis)

---

## 📖 Detailed Instructions

For complete step-by-step instructions with troubleshooting:
- See: `backend/migrations/RUN_MIGRATION_013.md`

---

## ✅ After Running Migration

1. Refresh your browser (clear any cached errors)
2. Go to your analysis results page
3. Click "Add State" in Physical Nexus Configuration
4. Fill out the form:
   - State: Select from dropdown
   - Nexus Date: When you established presence
   - Reason: Why (e.g., "Office in Los Angeles")
   - Registration Date: (optional) When you registered
   - Permit Number: (optional) State tax permit
5. Click "Add State"

**Expected:** State should save and appear in the table!

---

## 🐛 Still Having Issues?

If it still doesn't work after running the migration:

1. Open browser DevTools (press F12)
2. Go to "Console" tab
3. Try adding a state
4. Look for red error messages
5. Copy the error and let me know

Common errors:
- "401 Unauthorized" → Check if you're logged in
- "403 Forbidden" → RLS policies might not have updated (refresh Supabase Dashboard)
- "Network error" → Backend might not be running

---

## 🔍 Check Browser Console

To see what error is actually happening:

1. Open your browser
2. Press F12 (or right-click → Inspect)
3. Click "Console" tab
4. Try adding a state
5. Look for error messages in red

The error message will tell us exactly what's wrong!

---

**Need Help?** Share the browser console error and I can help debug further!
