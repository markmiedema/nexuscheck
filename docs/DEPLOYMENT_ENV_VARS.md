# Deployment Environment Variables Guide

This guide shows you exactly which environment variables to set for each deployment platform.

## Quick Reference

| Variable | Frontend (Vercel) | Backend (Railway) | Where to Get It |
|----------|-------------------|-------------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Required | ❌ No | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Required | ❌ No | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_API_URL` | ✅ Required | ❌ No | Your Railway backend URL |
| `SUPABASE_URL` | ❌ No | ✅ Required | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | ✅ Required | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | ❌ No | ✅ Required | Supabase Dashboard → Settings → API |
| `ENVIRONMENT` | ❌ No | ✅ Recommended | Set to `production` |
| `DEBUG` | ❌ No | ✅ Required | Set to `False` |
| `ALLOWED_ORIGINS` | ❌ No | ✅ Required | Your Vercel domain |
| `ALLOWED_ORIGIN_REGEX` | ❌ No | 🔵 Optional | Regex for Vercel previews |

---

## Step-by-Step Setup

### 1️⃣ Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. You'll find:
   - **Project URL** → Use for `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)
5. Navigate to **Settings → API → JWT Secret**
   - Copy the JWT Secret → Use for `SUPABASE_JWT_SECRET`

---

### 2️⃣ Deploy Backend to Railway (Do This First!)

#### Why First?
You need the Railway URL to configure your frontend.

#### Steps:

1. **Connect Your Repository**
   - Go to [Railway](https://railway.app)
   - Create new project → Deploy from GitHub repo
   - Select your repository
   - Choose the `backend` folder as root directory

2. **Set Environment Variables in Railway:**

   ```bash
   # Required
   SUPABASE_URL=https://[your-project-ref].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   SUPABASE_JWT_SECRET=[your-jwt-secret]

   # Application Settings
   ENVIRONMENT=production
   DEBUG=False
   LOG_LEVEL=INFO

   # CORS - Update after deploying frontend!
   ALLOWED_ORIGINS=https://[your-app].vercel.app

   # Optional (defaults are fine)
   MAX_FILE_SIZE_MB=50
   UPLOAD_DIR=/tmp/uploads
   API_V1_PREFIX=/api/v1
   ```

3. **Note Your Railway URL**
   - After deployment, Railway will give you a URL like:
   - `https://[your-app].railway.app`
   - You'll need this for the frontend!

4. **Update CORS Later**
   - After deploying frontend, come back and update `ALLOWED_ORIGINS`

---

### 3️⃣ Deploy Frontend to Vercel

#### Steps:

1. **Connect Your Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Set **Root Directory** to `frontend`

2. **Set Environment Variables in Vercel:**

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

   # Backend API URL (use your Railway URL from step 2)
   NEXT_PUBLIC_API_URL=https://[your-railway-app].railway.app
   ```

3. **Deploy!**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Note your Vercel URL: `https://[your-app].vercel.app`

---

### 4️⃣ Update Backend CORS Settings

Now that you have your Vercel URL, update Railway:

1. Go back to Railway dashboard
2. Update `ALLOWED_ORIGINS` environment variable:
   ```bash
   ALLOWED_ORIGINS=https://[your-vercel-app].vercel.app
   ```
3. **Option A: Support specific preview deployments:**
   ```bash
   ALLOWED_ORIGINS=https://[your-app].vercel.app,https://[your-app]-git-feature.vercel.app
   ```

4. **Option B: Support all Vercel preview deployments (using regex):**
   ```bash
   ALLOWED_ORIGINS=https://[your-app].vercel.app
   ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app$
   ```
   ⚠️ **Note:** Regex patterns are convenient but less secure. Use explicit origins when possible.

5. Railway will automatically redeploy with new settings

---

## Testing Your Deployment

1. **Test Backend Health Check**
   ```bash
   curl https://[your-railway-app].railway.app/health
   ```
   Should return: `{"status":"healthy","environment":"production","version":"1.0.0"}`

2. **Test Frontend**
   - Visit `https://[your-vercel-app].vercel.app`
   - Try logging in
   - Check browser console for any CORS errors

3. **Test API Connection**
   - Open browser dev tools (F12)
   - Go to Network tab
   - Perform an action that calls the backend
   - Verify requests go to Railway URL and return successfully

---

## Common Issues & Solutions

### ❌ CORS Error in Browser Console

**Problem:** `Access to XMLHttpRequest at 'https://[railway-url]' from origin 'https://[vercel-url]' has been blocked by CORS policy`

**Solution:** Update `ALLOWED_ORIGINS` in Railway to include your Vercel URL

---

### ❌ Frontend Shows "Network Error" or "Failed to Fetch"

**Possible Causes:**
1. `NEXT_PUBLIC_API_URL` in Vercel doesn't match your Railway URL
2. Railway backend is not running (check Railway logs)
3. Railway URL is incorrect

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` in Vercel settings
- Check Railway deployment logs
- Test backend health endpoint

---

### ❌ Authentication Not Working

**Possible Causes:**
1. Supabase credentials mismatch between frontend and backend
2. `SUPABASE_JWT_SECRET` is incorrect in Railway

**Solution:**
- Verify all three services use the SAME Supabase project
- Double-check JWT secret in Railway matches Supabase

---

### ❌ Railway Build Fails

**Possible Causes:**
1. Missing `requirements.txt` or dependencies
2. Python version mismatch

**Solution:**
- Check Railway build logs
- Verify `requirements.txt` is in backend folder
- Railway uses Python 3.11+ by default (check compatibility)

---

## Security Checklist

Before going live, verify:

- [ ] `DEBUG=False` in Railway
- [ ] `ENVIRONMENT=production` in Railway
- [ ] No hardcoded secrets in your codebase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in Railway (never in frontend!)
- [ ] Row Level Security (RLS) is enabled in Supabase
- [ ] CORS origins only include your actual domains (no wildcards in production)
- [ ] `.env` files are in `.gitignore` (never committed)

---

## Need Help?

1. Check deployment logs:
   - **Vercel:** Project → Deployments → Click deployment → View logs
   - **Railway:** Project → Deployments → Click deployment → View logs

2. Test each service independently:
   - Backend: `/health` endpoint
   - Frontend: Check browser console
   - Supabase: Test in Supabase SQL Editor

3. Verify environment variables are set correctly in dashboards
