# NexusCheck Production Deployment Guide

**Complete guide for deploying NexusCheck to production using Vercel + Railway + Supabase**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

This guide walks you through deploying NexusCheck's full stack to production:

- **Frontend:** Next.js 14 → Vercel
- **Backend:** FastAPI (Python) → Railway
- **Database:** PostgreSQL → Supabase

**Estimated Time:** 1-2 hours for first deployment

---

## Prerequisites

### Required Accounts

- [ ] [GitHub](https://github.com) - Code repository
- [ ] [Vercel](https://vercel.com) - Frontend hosting
- [ ] [Railway](https://railway.app) - Backend hosting
- [ ] [Supabase](https://supabase.com) - Database & auth

### Required Access

- [ ] Repository admin access (to deploy from GitHub)
- [ ] Supabase project creator access
- [ ] Ability to create new projects in Vercel/Railway

### Local Setup (Optional but Recommended)

- [ ] Node.js 18.17+ installed
- [ ] Python 3.11+ installed
- [ ] Git configured
- [ ] Project cloned locally

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                          │
│  - Next.js 14 (App Router)                                  │
│  - React 18                                                 │
│  - Supabase Auth Client                                     │
│  - API Client (axios)                                       │
└────────────┬──────────────────────┬─────────────────────────┘
             │                      │
             │ API Calls            │ Auth
             ▼                      ▼
┌───────────────────────┐  ┌──────────────────────────────────┐
│ BACKEND (Railway)     │  │ DATABASE (Supabase)              │
│ - FastAPI             │  │ - PostgreSQL 15                  │
│ - Python 3.11         │  │ - Row Level Security (RLS)       │
│ - Supabase Client     │◄─┤ - Auth (Email/Password)          │
│ - JWT Validation      │  │ - Storage (File uploads)         │
└───────────────────────┘  └──────────────────────────────────┘
```

### Data Flow

1. **User Authentication:**
   - Frontend → Supabase Auth → Database
   - JWT token stored in browser
   - Token included in API requests

2. **API Requests:**
   - Frontend → Backend (with JWT)
   - Backend validates JWT with Supabase
   - Backend queries database using service_role key
   - Results filtered by RLS policies

3. **File Uploads:**
   - Frontend → Supabase Storage (direct upload)
   - Storage policies enforce user folder isolation
   - Backend can access files via service_role key

---

## Deployment Steps

### Step 1: Prepare Supabase Database (30-45 minutes)

**Goal:** Set up production database with schema, security, and reference data

#### 1.1 Create Production Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Configure:
   - **Organization:** Your organization
   - **Name:** `nexuscheck-production`
   - **Database Password:** Generate strong password (save in password manager!)
   - **Region:** Choose closest to your users (e.g., `us-east-1` for US)
   - **Pricing Plan:** Start with Free tier, upgrade as needed
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

#### 1.2 Get Supabase Credentials

Once project is ready:

1. Go to **Settings → API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://[your-project-ref].supabase.co
   anon/public key: eyJ... (starts with eyJ)
   service_role key: eyJ... (starts with eyJ, different from anon)
   ```
3. Go to **Settings → API → JWT Secret**
4. Copy the JWT Secret

**⚠️ SECURITY:**
- `anon key` → Safe for frontend (public)
- `service_role key` → NEVER expose! Backend only
- `JWT secret` → NEVER expose! Backend only

#### 1.3 Run Database Migrations

Run all migrations in the **SQL Editor**:

1. Go to **SQL Editor** in Supabase dashboard
2. Create a new query
3. Run migrations **in this exact order**:

```sql
-- Copy and paste contents of each file, run one at a time:

-- 1. Create all tables
backend/migrations/001_initial_schema.sql

-- 2. Enable Row Level Security
backend/migrations/002_row_level_security.sql

-- 3. Create storage bucket for file uploads
backend/migrations/002_create_storage_bucket.sql

-- 4. Add validation constraints
backend/migrations/003_validation_checks.sql

-- 5. Allow negative local tax rates (edge case)
backend/migrations/004b_allow_negative_local_rates.sql

-- 6. Populate state reference data
backend/migrations/005_populate_state_data.sql

-- 7. Add compound interest support
backend/migrations/006_add_compound_annually_support.sql

-- 8. Add taxable sales column
backend/migrations/006_add_taxable_sales_column.sql

-- 9. Add late payment penalty bounds
backend/migrations/007_add_late_payment_penalty_bounds.sql

-- 10. Add filing penalty bounds
backend/migrations/007b_add_filing_penalty_bounds_and_compounding.sql

-- 11. Populate interest and penalty rates (47 jurisdictions)
backend/migrations/008_populate_interest_penalty_rates.sql

-- Continue with remaining migrations as needed...
```

**After each migration:**
- Check for errors in the output
- If errors appear, don't proceed - troubleshoot first
- Some migrations may show "already exists" warnings - this is OK

#### 1.4 Verify Database Setup

Run verification queries:

```sql
-- Should return 12 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 'true' for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should have 50+ states
SELECT COUNT(*) FROM states;

-- Should have interest/penalty data
SELECT COUNT(*) FROM interest_penalty_rates;

-- Should have ~35+ RLS policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

**Expected Results:**
- 12 tables created
- RLS enabled on all tables
- Reference data populated
- 35+ security policies active

#### 1.5 Configure Supabase Authentication

1. Go to **Authentication → Providers**
2. **Email Provider:**
   - Enable: ✅ Email
   - Confirm email: ✅ Enabled (recommended)
   - Secure email change: ✅ Enabled

3. **URL Configuration:**
   - Go to **Authentication → URL Configuration**
   - Set **Site URL:** `https://[your-app].vercel.app` (you'll update this after deploying frontend)
   - Add **Redirect URLs:**
     - `https://[your-app].vercel.app/**`
     - `http://localhost:3000/**` (for development)

4. **Email Templates** (optional):
   - Go to **Authentication → Email Templates**
   - Customize confirmation, reset, invite emails

**🔒 For detailed security verification, see:** `docs/SUPABASE_PRODUCTION_CHECKLIST.md`

---

### Step 2: Deploy Backend to Railway (20-30 minutes)

**Goal:** Deploy FastAPI backend with environment variables and health monitoring

#### 2.1 Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access GitHub (if first time)
5. Select repository: `nexuscheck`
6. Railway starts deploying automatically

#### 2.2 Configure Root Directory

1. Click on your service in Railway dashboard
2. Go to **Settings** tab
3. Find **"Root Directory"**
4. Set to: `backend`
5. Save (Railway will redeploy automatically)

#### 2.3 Set Environment Variables

1. Go to **Variables** tab
2. Click **"New Variable"** for each:

```bash
# Supabase Configuration (from Step 1.2)
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]

# Application Settings
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# CORS - You'll update this after deploying frontend
ALLOWED_ORIGINS=http://localhost:3000

# Optional (defaults are fine)
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/tmp/uploads
API_V1_PREFIX=/api/v1
```

**⚠️ IMPORTANT:**
- `DEBUG` must be `False` (capital F), not `false`
- You'll update `ALLOWED_ORIGINS` after deploying frontend

#### 2.4 Generate Railway Domain

1. Go to **Settings** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway gives you: `https://[your-app].railway.app`
5. **Copy this URL** - you need it for frontend!

#### 2.5 Test Backend Deployment

```bash
# Test health check
curl https://[your-railway-app].railway.app/health

# Expected response:
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

If you get this response, backend is working! ✅

**If deployment fails, check:**
- Railway deployment logs (Deployments → Click deployment → View logs)
- Root directory is set to `backend`
- All environment variables are set correctly
- Python version (should use 3.11+)

**🔧 For detailed troubleshooting, see:** `backend/RAILWAY_DEPLOYMENT.md`

---

### Step 3: Deploy Frontend to Vercel (20-30 minutes)

**Goal:** Deploy Next.js frontend with Supabase auth and Railway API connection

#### 3.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Authorize Vercel to access GitHub (if first time)
5. Select repository: `nexuscheck`

#### 3.2 Configure Project Settings

In the **"Configure Project"** screen:

1. **Framework Preset:** Next.js (auto-detected ✓)
2. **Root Directory:** Click "Edit" → Set to `frontend`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

#### 3.3 Set Environment Variables

In **"Environment Variables"** section:

```bash
# Supabase (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Backend API (from Step 2.4)
NEXT_PUBLIC_API_URL=https://[your-railway-app].railway.app
```

**Environment Selection:**
- Check **"Production"**, **"Preview"**, and **"Development"**
- OR check **"Apply to all environments"**

#### 3.4 Deploy!

1. Click **"Deploy"**
2. Vercel will:
   - Install npm dependencies (~1 minute)
   - Build Next.js app (~2 minutes)
   - Deploy to global CDN (~30 seconds)
3. Wait for **"Congratulations! Your project has been deployed"**

#### 3.5 Get Vercel URL

After deployment:

1. Your URL: `https://[your-app].vercel.app`
2. Also available: `https://[your-app]-[username].vercel.app`
3. **Copy this URL** - you need it for Railway CORS!

#### 3.6 Test Frontend Deployment

Visit your Vercel URL in a browser:

- Should see NexusCheck homepage ✅
- Try navigating to login page
- Check browser console for errors (F12)

**If build fails:**
- Check Vercel build logs (Deployments → View logs)
- Verify root directory is `frontend`
- Check environment variables are set
- Look for TypeScript errors

**🚀 For detailed troubleshooting, see:** `frontend/VERCEL_DEPLOYMENT.md`

---

### Step 4: Connect Frontend & Backend (10 minutes)

**Goal:** Enable CORS so frontend can communicate with backend

#### 4.1 Update Railway CORS Settings

1. Go back to Railway dashboard
2. Open your backend service
3. Go to **Variables** tab
4. Find `ALLOWED_ORIGINS` variable
5. Update to your Vercel URL:

```bash
ALLOWED_ORIGINS=https://[your-vercel-app].vercel.app
```

**To support preview deployments too:**
```bash
ALLOWED_ORIGINS=https://[your-app].vercel.app,https://[your-app]-git-*.vercel.app
```

**OR use regex (less secure but convenient):**
```bash
ALLOWED_ORIGINS=https://[your-app].vercel.app
ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app$
```

6. Save - Railway will redeploy automatically (~1 minute)

#### 4.2 Update Supabase Redirect URLs

1. Go to Supabase dashboard
2. **Authentication → URL Configuration**
3. Update **Site URL:** `https://[your-vercel-app].vercel.app`
4. Verify **Redirect URLs** include:
   - `https://[your-vercel-app].vercel.app/**`
   - `http://localhost:3000/**` (for dev)

---

### Step 5: End-to-End Testing (15-20 minutes)

**Goal:** Verify all three services work together

#### 5.1 Test Authentication Flow

1. Visit your Vercel URL: `https://[your-app].vercel.app`
2. Click **"Sign Up"**
3. Create test account:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
4. Check email for confirmation (if enabled)
5. Log in with test credentials
6. Should see dashboard ✅

**If auth fails:**
- Check browser console for errors
- Verify Supabase Site URL matches Vercel URL
- Check Supabase logs: Dashboard → Logs

#### 5.2 Test API Connection

1. While logged in, try creating a new analysis
2. Open browser DevTools (F12) → Network tab
3. Should see requests to Railway backend
4. Requests should return 200 status
5. No CORS errors in console

**If API calls fail:**
- **CORS Error:** Update `ALLOWED_ORIGINS` in Railway
- **401 Unauthorized:** JWT validation issue - check `SUPABASE_JWT_SECRET`
- **Network Error:** Check Railway backend is running

#### 5.3 Test File Upload

1. Try uploading a CSV file
2. Should upload successfully
3. Verify in Supabase: Storage → analysis-uploads
4. File should be in `uploads/{user_id}/` folder

**If upload fails:**
- Check Supabase storage bucket exists
- Verify storage RLS policies
- Check browser console for policy violations

#### 5.4 Test Core Features

Go through your main user flows:
- [ ] Create analysis
- [ ] Upload transaction data
- [ ] Map columns
- [ ] Review results
- [ ] Generate report (if implemented)
- [ ] Log out and log back in

---

## Post-Deployment

### Update Documentation

- [ ] Update README.md with production URLs
- [ ] Document any deployment-specific quirks
- [ ] Add production credentials to password manager

### Team Access

**Vercel:**
- Project Settings → Members → Invite team members

**Railway:**
- Project Settings → Members → Invite team members

**Supabase:**
- Organization Settings → Team → Invite team members

### Set Up Monitoring

**Vercel:**
1. Go to Analytics tab
2. Enable Speed Insights (optional: `npm install @vercel/analytics`)
3. Set up deployment notifications: Settings → Git → Enable PR comments

**Railway:**
1. Go to Metrics tab
2. Monitor CPU, memory, network usage
3. Set up Discord/Slack webhooks: Settings → Webhooks

**Supabase:**
1. Go to Database → Logs
2. Monitor API usage: Dashboard → Project API
3. Set up usage alerts: Organization → Billing & Usage

### Backup Strategy

**Database Backups:**
- **Supabase Free:** Manual exports weekly (`supabase db dump`)
- **Supabase Pro:** Automatic daily backups
- Store backups in encrypted cloud storage

**Code Backups:**
- GitHub is your source of truth
- Tag production releases: `git tag v1.0.0 && git push --tags`
- Keep deployment branch: `production` or `main`

### Security Hardening

- [ ] Review Supabase RLS policies (run test queries)
- [ ] Verify no secrets in git history
- [ ] Enable 2FA on all accounts (Vercel, Railway, Supabase, GitHub)
- [ ] Set up rate limiting (if high traffic expected)
- [ ] Configure CSP headers (optional, advanced)

---

## Monitoring

### Daily Checks (First Week)

- [ ] Check Vercel analytics for errors
- [ ] Review Railway logs for backend errors
- [ ] Monitor Supabase database size/bandwidth
- [ ] Check auth success rate in Supabase logs
- [ ] Verify no unusual API usage patterns

### Weekly Checks (Ongoing)

- [ ] Review Vercel speed insights
- [ ] Check Railway resource usage (CPU/memory trends)
- [ ] Monitor Supabase storage growth
- [ ] Review error logs in all three platforms
- [ ] Check for failed deployments

### Key Metrics to Track

**Frontend (Vercel):**
- Page load time (target: < 3 seconds)
- Error rate (target: < 1%)
- Bandwidth usage

**Backend (Railway):**
- Response time (target: < 500ms for most endpoints)
- Error rate (target: < 1%)
- CPU/memory usage

**Database (Supabase):**
- Query performance (slow queries > 1s)
- Database size (free tier: 500MB limit)
- Active connections (free tier: 60 limit)

---

## Troubleshooting

### Frontend Issues

**Issue:** White screen / blank page

**Diagnosis:**
```bash
# Check browser console (F12)
# Look for JavaScript errors
```

**Solutions:**
- Verify environment variables in Vercel are set correctly
- Check Vercel deployment logs for build errors
- Clear browser cache and hard refresh (Ctrl+Shift+R)

---

**Issue:** "Failed to fetch" / Network errors

**Diagnosis:**
```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should show Railway URL
```

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches Railway domain
- Test Railway backend health endpoint directly
- Check for CORS errors in console

---

### Backend Issues

**Issue:** CORS errors in browser

**Symptoms:**
```
Access to XMLHttpRequest at 'https://[railway]' from origin 'https://[vercel]'
has been blocked by CORS policy
```

**Solutions:**
1. Update `ALLOWED_ORIGINS` in Railway to include Vercel URL
2. Verify no typos in URL (https://, no trailing slash)
3. Check Railway logs show correct CORS config on startup
4. Wait ~1 minute for Railway to redeploy after changing env vars

---

**Issue:** 401 Unauthorized on API requests

**Diagnosis:**
```bash
# Test with curl
curl -H "Authorization: Bearer invalid-token" \
  https://[your-railway-app].railway.app/api/v1/analyses
```

**Solutions:**
- Verify `SUPABASE_JWT_SECRET` in Railway matches Supabase
- Check JWT secret in Supabase: Settings → API → JWT Secret
- Ensure secret includes full value (starts with random chars, not "your-jwt-secret")
- Test login flow - ensure JWT is being sent from frontend

---

### Database Issues

**Issue:** RLS policy violations

**Symptoms:**
```
new row violates row-level security policy for table "analyses"
```

**Solutions:**
1. Verify user is authenticated (check Supabase Auth logs)
2. Check `auth.uid()` matches `user_id` in database
3. Review RLS policies in Supabase: Database → Policies
4. Test with service_role key (backend should bypass RLS)

---

**Issue:** Connection pool exhausted

**Symptoms:**
```
remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**
1. Use Supabase connection pooler (Transaction mode)
2. Verify Railway uses pooler connection string
3. Check for connection leaks in backend code
4. Upgrade Supabase plan if needed (more connections)

---

### General Debugging

**Check Service Status:**
- Vercel: https://vercel-status.com
- Railway: https://railway.app/legal/fair-use
- Supabase: https://status.supabase.com

**Useful Commands:**

```bash
# Test backend health
curl https://[your-railway-app].railway.app/health

# Test backend with auth
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://[your-railway-app].railway.app/api/v1/analyses

# Check CORS headers
curl -I -X OPTIONS \
  -H "Origin: https://[your-vercel-app].vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://[your-railway-app].railway.app/health

# Test Supabase connection from backend
# (Use Railway shell: Settings → Service → Open Shell)
python -c "from supabase import create_client; import os; \
  client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY')); \
  print(client.table('states').select('code').limit(1).execute())"
```

---

## Rollback Procedures

### Frontend Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find last known good deployment
3. Click **"..."** → **"Promote to Production"**
4. Verify rollback worked

**Rollback time:** < 1 minute

---

### Backend Rollback (Railway)

1. Go to Railway Dashboard → Deployments
2. Find last known good deployment
3. Click **"..."** → **"Redeploy"**
4. Wait for deployment (~2 minutes)
5. Test health endpoint

**Rollback time:** ~2-3 minutes

---

### Database Rollback (Supabase)

**⚠️ Database rollbacks are more complex!**

**Option 1: Restore from backup (Supabase Pro)**
1. Go to Database → Backups
2. Select restore point
3. Follow Supabase restore procedure
4. **Downtime:** 10-30 minutes depending on size

**Option 2: Manual restore (Free tier)**
1. Have backup SQL file ready (see Backup Strategy)
2. Create new Supabase project
3. Run backup SQL file
4. Update environment variables in Vercel & Railway
5. **Downtime:** 30-60 minutes

**Prevention:** Test migrations on staging database first!

---

## Deployment Checklist

Print this and check off as you go:

### Pre-Deployment
- [ ] All code committed and pushed to GitHub
- [ ] Production branch ready (e.g., `main`)
- [ ] Environment variables documented
- [ ] Team notified of deployment window

### Supabase Setup
- [ ] Production project created
- [ ] Credentials saved securely
- [ ] All migrations run successfully
- [ ] Verification queries passed
- [ ] RLS policies confirmed working
- [ ] Auth configured with placeholder URL
- [ ] Storage bucket created

### Railway Deployment
- [ ] Project created from GitHub
- [ ] Root directory set to `backend`
- [ ] Environment variables set
- [ ] Domain generated and copied
- [ ] Health check returns 200
- [ ] Logs show no errors

### Vercel Deployment
- [ ] Project created from GitHub
- [ ] Root directory set to `frontend`
- [ ] Environment variables set
- [ ] Build completed successfully
- [ ] Domain generated and copied
- [ ] Homepage loads without errors

### Integration
- [ ] CORS configured in Railway
- [ ] Supabase Site URL updated
- [ ] Frontend can reach backend (no CORS errors)
- [ ] Auth flow works end-to-end
- [ ] File upload works
- [ ] Core features tested

### Post-Deployment
- [ ] Monitoring set up (Vercel, Railway, Supabase)
- [ ] Team access configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Credentials stored in password manager
- [ ] Production URLs shared with team
- [ ] Launch announcement ready

---

## Cost Summary

### Development/Pilot Costs

**Estimated Monthly Cost: $5-15**

- **Vercel:** $0 (Free tier: 100GB bandwidth, unlimited projects)
- **Railway:** $5-10 (Starter: $5/month + usage)
- **Supabase:** $0 (Free tier: 500MB DB, 1GB storage, 2GB bandwidth)

**Total: ~$5-10/month** for pilot program

### Production Costs (Scaling Up)

When you outgrow free tiers:

- **Vercel Pro:** $20/month (1TB bandwidth, advanced features)
- **Railway Pro:** $20/month + usage-based pricing
- **Supabase Pro:** $25/month (8GB DB, 100GB storage, 250GB bandwidth)

**Total: ~$65-100/month** for production workload

---

## Additional Resources

### Documentation

- **Environment Variables:** `docs/DEPLOYMENT_ENV_VARS.md`
- **Railway Guide:** `backend/RAILWAY_DEPLOYMENT.md`
- **Vercel Guide:** `frontend/VERCEL_DEPLOYMENT.md`
- **Supabase Checklist:** `docs/SUPABASE_PRODUCTION_CHECKLIST.md`

### Platform Documentation

- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app
- **Supabase:** https://supabase.com/docs
- **Next.js:** https://nextjs.org/docs
- **FastAPI:** https://fastapi.tiangolo.com

### Support

- **Vercel Discord:** https://vercel.com/discord
- **Railway Discord:** https://discord.gg/railway
- **Supabase Discord:** https://discord.supabase.com

---

## Next Steps

After successful deployment:

1. **Share with pilot users** - Send them the Vercel URL
2. **Gather feedback** - Set up feedback channel (email, form, etc.)
3. **Monitor closely** - Daily checks for first week
4. **Iterate quickly** - Use preview deployments for testing fixes
5. **Plan for scale** - Monitor usage, upgrade tiers as needed

---

**🎉 Congratulations!** You've deployed NexusCheck to production!

If you run into issues, check the troubleshooting section or reach out to platform support.

**Good luck with your pilot program!** 🚀
