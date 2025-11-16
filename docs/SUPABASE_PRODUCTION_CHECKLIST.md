# Supabase Production Readiness Checklist

This document ensures your Supabase configuration is production-ready before deploying to live users.

## Executive Summary

Your Supabase database has **comprehensive security** already configured:

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Multi-tenant isolation** - users can only access their own data
✅ **Storage policies** - file uploads restricted to user folders
✅ **Read-only reference data** - state rules protected from user modification
✅ **Audit logging** - immutable logs for compliance

## Table of Contents

1. [Security Configuration](#security-configuration)
2. [Database Migrations](#database-migrations)
3. [Authentication Setup](#authentication-setup)
4. [Storage Configuration](#storage-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Backup & Recovery](#backup--recovery)
8. [Pre-Launch Verification](#pre-launch-verification)

---

## Security Configuration

### Row Level Security (RLS)

**Status:** ✅ Configured (via `002_row_level_security.sql`)

**Policies Implemented:**

#### User Data Tables (Multi-Tenant Isolation)
- **users**: Users can only view/update their own profile
- **analyses**: Users can only access their own analyses
- **sales_transactions**: Users can only access sales data for their analyses
- **physical_nexus**: Users can only access physical nexus for their analyses
- **state_results**: Users can only access results for their analyses
- **error_logs**: Users can only view their own error logs
- **audit_log**: Users can only view their own audit trail

#### Reference Data Tables (Read-Only)
- **states**: All authenticated users can read
- **economic_nexus_thresholds**: All authenticated users can read
- **marketplace_facilitator_rules**: All authenticated users can read
- **tax_rates**: All authenticated users can read
- **interest_penalty_rates**: All authenticated users can read

### Pre-Production Verification

Run these queries in Supabase SQL Editor to verify RLS:

```sql
-- 1. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: rowsecurity = true for ALL tables

-- 2. Count RLS policies (should have ~35+ policies)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- 3. List all policies by table
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Security Keys

**Critical:** Never expose these keys client-side!

| Key Type | Usage | Exposure |
|----------|-------|----------|
| **anon key** | Frontend (NEXT_PUBLIC_SUPABASE_ANON_KEY) | ✅ Safe - Public |
| **service_role key** | Backend (SUPABASE_SERVICE_ROLE_KEY) | ❌ **SECRET** - Server only! |
| **JWT secret** | Backend (SUPABASE_JWT_SECRET) | ❌ **SECRET** - Server only! |

**Action Items:**
- [ ] Verify service_role key is ONLY in Railway (never in frontend or git)
- [ ] Verify JWT secret is ONLY in Railway (never in frontend or git)
- [ ] Confirm anon key is used in frontend (it's safe - protected by RLS)

---

## Database Migrations

### Migration Status

Your database schema is defined across **24+ migrations**. Key migrations:

1. **001_initial_schema.sql** - All 12 core tables
2. **002_row_level_security.sql** - RLS policies
3. **002_create_storage_bucket.sql** - File upload bucket
4. **003_validation_checks.sql** - Data validation constraints
5. **005_populate_state_data.sql** - State metadata
6. **008_populate_interest_penalty_rates.sql** - Interest/penalty rates
7. And many more... (see `backend/migrations/MIGRATIONS_LOG.md`)

### Pre-Production Actions

**Development Database:**
- [ ] All migrations run successfully in development
- [ ] Test data created and validated
- [ ] No migration errors in logs

**Production Database:**
- [ ] Decide: Fresh production database OR migrate from development?
  - **Option A (Fresh):** Run all migrations in sequence on new production DB
  - **Option B (Migrate):** Use existing Supabase project, verify all migrations applied

**If Fresh Production DB:**

1. **Create Production Supabase Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project: `nexuscheck-production`
   - Choose region closest to users (e.g., US East for US customers)
   - Set strong database password (save in password manager)

2. **Run Migrations Sequentially:**
   ```bash
   # In Supabase SQL Editor, run these IN ORDER:
   001_initial_schema.sql
   002_row_level_security.sql
   002_create_storage_bucket.sql
   003_validation_checks.sql
   004b_allow_negative_local_rates.sql
   005_populate_state_data.sql
   006_add_compound_annually_support.sql
   006_add_taxable_sales_column.sql
   007_add_late_payment_penalty_bounds.sql
   007b_add_filing_penalty_bounds_and_compounding.sql
   008_populate_interest_penalty_rates.sql
   # ... and any additional migrations
   ```

3. **Verify Migration Success:**
   ```sql
   -- Check table count (should have 12 tables)
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check reference data populated
   SELECT COUNT(*) FROM states; -- Should have 50+ rows
   SELECT COUNT(*) FROM interest_penalty_rates; -- Should have data
   ```

**If Using Existing Database:**
- [ ] Export development data (if needed)
- [ ] Verify all migrations logged in `MIGRATIONS_LOG.md` are applied
- [ ] Run verification queries to ensure schema is up-to-date

---

## Authentication Setup

### Supabase Auth Configuration

**Email/Password Auth** (already configured):

1. **Go to:** Supabase Dashboard → Authentication → Providers
2. **Verify these settings:**

   **Email Provider:**
   - [ ] Email authentication: **Enabled**
   - [ ] Confirm email: **Enabled** (recommended for production)
   - [ ] Secure email change: **Enabled**

   **Email Templates:**
   - [ ] Confirm signup template customized (optional)
   - [ ] Reset password template customized (optional)
   - [ ] Magic link template (if using magic links)

3. **Site URL Configuration:**
   ```
   Site URL: https://[your-vercel-app].vercel.app
   Redirect URLs:
   - https://[your-vercel-app].vercel.app/**
   - http://localhost:3000/** (for development)
   ```

4. **Email Settings:**
   - [ ] SMTP configured (optional - Supabase provides default)
   - [ ] "From" email address set (optional)
   - [ ] Email rate limiting configured

### JWT Settings

**Go to:** Settings → API → JWT Settings

- [ ] JWT expiry: Default 3600 seconds (1 hour) is fine
- [ ] Refresh token rotation: **Enabled** (recommended)
- [ ] Reuse interval: 10 seconds (default is good)

**Important:** Your backend uses `SUPABASE_JWT_SECRET` to validate tokens from frontend.

---

## Storage Configuration

### File Upload Bucket

**Status:** ✅ Configured (via `002_create_storage_bucket.sql`)

**Bucket:** `analysis-uploads`

**Configuration:**
- **Public:** `false` (private bucket)
- **File size limit:** 50MB
- **Allowed MIME types:**
  - `text/csv`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Folder Structure:**
```
analysis-uploads/
  └── uploads/
      └── {user_id}/
          └── {filename}.csv
```

**RLS Policies:**
- Users can only upload/read/update/delete files in their own folder
- Path must be: `uploads/{user_id}/...`

### Pre-Production Verification

1. **Go to:** Storage → analysis-uploads
2. **Verify:**
   - [ ] Bucket exists
   - [ ] Public access: **Off**
   - [ ] File size limit: 50MB
   - [ ] Allowed MIME types configured

3. **Test Upload** (as authenticated user):
   ```javascript
   // In browser console on your deployed app
   const { data, error } = await supabase.storage
     .from('analysis-uploads')
     .upload(`uploads/${user.id}/test.csv`, file);

   if (error) console.error(error);
   else console.log('Upload successful:', data);
   ```

4. **Test Cross-User Protection:**
   - Try to access another user's file (should fail)
   - Try to upload to another user's folder (should fail)

---

## Performance Optimization

### Database Indexes

**Status:** ✅ Configured in `001_initial_schema.sql`

**Key indexes created:**

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Analyses table
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON analyses(status);

-- Sales transactions
CREATE INDEX idx_sales_analysis_id ON sales_transactions(analysis_id);
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date);

-- State results
CREATE INDEX idx_state_results_analysis ON state_results(analysis_id);
CREATE INDEX idx_state_results_state ON state_results(state_code);

-- And more...
```

### Verify Indexes

```sql
-- List all indexes in public schema
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Connection Pooling

Supabase provides connection pooling automatically:

- **Go to:** Settings → Database → Connection Pooling
- **Pooler Mode:** Transaction (default, recommended)
- **Pool Size:** Auto (Supabase manages this)

**For Railway Backend:**
- Use the **Transaction** pooler connection string (not Session)
- Supabase provides this in Settings → Database → Connection string

---

## Monitoring & Alerts

### Database Activity

**Go to:** Database → Logs

Monitor:
- SQL queries
- Connection errors
- Slow queries
- Failed authentication attempts

### Storage Usage

**Go to:** Storage → Usage

Monitor:
- Total storage used
- Bandwidth consumption
- Number of files

### API Analytics

**Go to:** Analytics

Track:
- API requests per day
- Active users
- Error rates
- Response times

### Set Up Alerts (Recommended)

**Go to:** Organization → Billing & Usage

Configure alerts for:
- [ ] Database size approaching limit
- [ ] Bandwidth approaching limit
- [ ] High error rate
- [ ] Unusual activity patterns

---

## Backup & Recovery

### Automatic Backups

Supabase provides automatic daily backups on paid plans:

- **Free Plan:** No automatic backups (manual exports only)
- **Pro Plan:** Daily backups, 7-day retention
- **Team/Enterprise:** Configurable retention

### Manual Backup (Free Plan)

If on free plan, set up manual backups:

1. **Export Database:**
   ```bash
   # Using Supabase CLI
   supabase db dump -f backup.sql

   # Or via pg_dump
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. **Schedule Regular Backups:**
   - Set calendar reminder (weekly)
   - Use GitHub Actions to automate
   - Store backups securely (encrypted cloud storage)

### Disaster Recovery Plan

**Restore Process:**

1. Create new Supabase project
2. Run backup SQL file
3. Verify data integrity
4. Update environment variables in Vercel/Railway
5. Test thoroughly before switching

**Recovery Time Objective (RTO):**
- Target: < 4 hours to restore service
- Depends on backup size and migration complexity

---

## Pre-Launch Verification

### Security Checklist

Run these verification steps before going live:

#### 1. RLS Verification

```sql
-- Test as authenticated user (use Supabase SQL Editor + auth token)

-- Should return ONLY your analyses
SELECT id, client_company_name, user_id FROM analyses;

-- Should return ONLY your profile
SELECT id, email FROM users WHERE id = auth.uid();

-- Should return ALL states (reference data)
SELECT code, name FROM states;

-- Try to insert analysis for different user (SHOULD FAIL)
INSERT INTO analyses (user_id, client_company_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Hacker Corp');
-- Expected: RLS policy violation error
```

#### 2. Storage Security Test

```javascript
// Try to access another user's file (should fail)
const { data, error } = await supabase.storage
  .from('analysis-uploads')
  .download('uploads/other-user-id/file.csv');

// Expected: Policy violation or 403 error
```

#### 3. Authentication Flow Test

- [ ] User signup works
- [ ] Email confirmation works (if enabled)
- [ ] Login works
- [ ] Password reset works
- [ ] Session persists across page refreshes
- [ ] Logout works
- [ ] Expired tokens refresh automatically

#### 4. Data Validation Test

```sql
-- Test data validation constraints (from 003_validation_checks.sql)

-- Should FAIL: Negative tax rate
INSERT INTO tax_rates (state_code, state_rate, effective_from)
VALUES ('CA', -5.0, '2024-01-01');

-- Should FAIL: Invalid state code
INSERT INTO analyses (user_id, client_company_name)
VALUES (auth.uid(), 'Test');
UPDATE state_results SET state_code = 'XX' WHERE id = 'some-id';

-- Should FAIL: Date range violations
INSERT INTO analyses (user_id, analysis_period_start, analysis_period_end)
VALUES (auth.uid(), '2024-12-31', '2024-01-01');
-- Expected: Constraint violation errors
```

### Performance Benchmarks

Before launch, establish baselines:

```sql
-- Query performance baselines
EXPLAIN ANALYZE
SELECT * FROM analyses WHERE user_id = 'test-user-id';

EXPLAIN ANALYZE
SELECT * FROM state_results WHERE analysis_id = 'test-analysis-id';

-- Target: < 100ms for common queries
```

### Load Testing

**Recommended before pilot:**

1. **Create Test Users:** 10-20 test accounts
2. **Create Test Data:** Multiple analyses per user
3. **Simulate Concurrent Access:** Use tools like Artillery or k6
4. **Monitor:** Watch Supabase dashboard during test
5. **Verify:** No errors, response times acceptable

---

## Production Configuration Summary

### Supabase Project Settings

**Before launch, verify these settings:**

- [ ] **Project Name:** Descriptive (e.g., "NexusCheck Production")
- [ ] **Region:** Closest to target users
- [ ] **Database Password:** Strong, stored securely
- [ ] **Paused Projects:** Disabled (Pro plan) or monitor closely (Free)

### API Keys & Secrets

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key] # Safe for public
```

**Backend (Railway):**
```bash
SUPABASE_URL=https://[prod-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key] # SECRET!
SUPABASE_JWT_SECRET=[jwt-secret] # SECRET!
```

### Auth Configuration

**Settings → Authentication → URL Configuration:**
```
Site URL: https://[your-app].vercel.app
Redirect URLs:
  - https://[your-app].vercel.app/**
  - https://[your-app]-*.vercel.app/** (for preview deployments)
```

### SMTP (Optional but Recommended)

For production email delivery:

**Settings → Authentication → SMTP:**
- [ ] Configure custom SMTP provider (SendGrid, Mailgun, etc.)
- [ ] Or use Supabase default (limited to 3 emails/hour on free plan)

---

## Cost Optimization

### Free Tier Limits (Supabase)

- **Database:** 500MB
- **Bandwidth:** 5GB/month
- **Storage:** 1GB
- **Auth users:** Unlimited
- **Active connections:** 60 (pooler)

### Monitoring Usage

**Go to:** Organization → Billing & Usage

Track:
- Database size
- Bandwidth consumption
- API requests
- Storage usage

### Upgrade Triggers

Consider upgrading to Pro ($25/month) when:
- Database approaches 400MB (80% of limit)
- Bandwidth > 4GB/month consistently
- Need point-in-time recovery (backups)
- Need custom domains
- Need dedicated resources

---

## Support & Resources

### Supabase Resources

- **Dashboard:** https://supabase.com/dashboard
- **Docs:** https://supabase.com/docs
- **Status Page:** https://status.supabase.com
- **Discord:** https://discord.supabase.com

### Emergency Contacts

- **Supabase Support:** support@supabase.io
- **Status Updates:** Twitter @supabase

### Documentation References

**In This Repo:**
- **Migrations:** `backend/migrations/`
- **Migration Log:** `backend/migrations/MIGRATIONS_LOG.md`
- **Deployment Guide:** `backend/migrations/DEPLOYMENT_GUIDE.md`
- **Schema Docs:** `_04-technical-specs/database-schema.md`

---

## Launch Day Checklist

### Final Verification (Do this right before launch!)

- [ ] RLS policies verified (run test queries)
- [ ] All migrations applied to production database
- [ ] Reference data populated (states, rates, thresholds)
- [ ] Storage bucket configured with correct policies
- [ ] Auth settings configured with production URLs
- [ ] API keys set correctly in Vercel and Railway
- [ ] JWT secret matches across all services
- [ ] Backup process in place (manual or automatic)
- [ ] Monitoring/alerts configured
- [ ] Performance baselines established
- [ ] Load testing completed (if applicable)
- [ ] Disaster recovery plan documented

### Post-Launch Monitoring

**First 24 Hours:**
- [ ] Monitor Supabase logs for errors
- [ ] Check auth flow works for real users
- [ ] Verify file uploads work
- [ ] Watch database size/bandwidth
- [ ] Monitor API error rates

**First Week:**
- [ ] Review analytics daily
- [ ] Check for slow queries
- [ ] Monitor storage growth
- [ ] Verify backups (if automatic)
- [ ] Gather user feedback on performance

---

## Troubleshooting

### Common Issues

**Issue: "new row violates row-level security policy"**

**Cause:** User trying to access data they don't own
**Solution:** Verify auth.uid() matches user_id in query

---

**Issue: "JWT expired"**

**Cause:** Access token expired (default 1 hour)
**Solution:** Frontend should automatically refresh using refresh token
**Check:** `frontend/lib/api/client.ts` has token refresh logic

---

**Issue: "could not connect to database"**

**Cause:** Connection limit reached or database paused
**Solution:**
- Check Supabase dashboard for database status
- Verify connection pooling enabled
- Check for connection leaks in backend code

---

**Issue: File upload fails with policy violation**

**Cause:** Incorrect file path (not in user's folder)
**Solution:** Ensure path is `uploads/{user_id}/{filename}`
**Check:** Frontend upload code uses correct path format

---

## Next Steps

After completing this checklist:

1. ✅ **Supabase production database ready**
2. → Deploy backend to Railway (if not done)
3. → Deploy frontend to Vercel (if not done)
4. → Update environment variables with production Supabase credentials
5. → Run end-to-end tests
6. → Share with pilot users!

---

**Questions?** Check Supabase documentation or reach out to their excellent support team via Discord!
