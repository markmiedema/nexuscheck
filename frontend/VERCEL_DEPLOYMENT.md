# Vercel Deployment Guide - Nexus Check Frontend

This guide walks you through deploying the Nexus Check Next.js frontend to Vercel.

## Quick Start

Vercel will automatically detect and deploy your Next.js application using the configuration files in this directory:

- `vercel.json` - Vercel platform configuration
- `next.config.js` - Next.js build configuration
- `package.json` - Dependencies and build scripts
- `.vercelignore` - Files to exclude from deployment

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **Supabase Project**: Have your Supabase credentials ready
4. **Backend Deployed**: Deploy your Railway backend first to get the API URL

## Deployment Steps

### 1. Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account (if first time)
5. Select your repository: `nexuscheck`

### 2. Configure Root Directory

Since your frontend is in a subdirectory:

1. Vercel will auto-detect it's a monorepo
2. In the **"Configure Project"** screen:
   - **Framework Preset**: Next.js (auto-detected ✓)
   - **Root Directory**: Click "Edit" and set to `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 3. Set Environment Variables

In the **"Environment Variables"** section, add:

#### Required Variables:

```bash
# Supabase Configuration (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Backend API URL (from your Railway deployment)
NEXT_PUBLIC_API_URL=https://[your-railway-app].railway.app
```

**Important:** Make sure to:
- Set environment for: **Production**, **Preview**, and **Development**
- OR check "Apply to all environments" for simplicity

### 4. Deploy!

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run Next.js build
   - Deploy to global CDN
   - Generate a unique URL
3. Wait 2-3 minutes for build to complete

### 5. Get Your Vercel URL

After deployment:

1. You'll see: **"Congratulations! Your project has been deployed"**
2. Your URL will be like: `https://[your-app].vercel.app`
3. Also available: `https://[your-app]-[username].vercel.app`
4. **Save this URL** - you need it for Railway CORS configuration!

### 6. Update Railway CORS

Now that you have your Vercel URL:

1. Go to Railway dashboard
2. Open your backend service
3. Go to **Variables** tab
4. Update `ALLOWED_ORIGINS`:
   ```bash
   ALLOWED_ORIGINS=https://[your-vercel-app].vercel.app
   ```
5. Railway will automatically redeploy

### 7. Test Your Deployment

Visit your Vercel URL: `https://[your-app].vercel.app`

- Try logging in
- Create a test analysis
- Verify API calls work (check browser console)
- Test all major features

## Understanding the Configuration Files

### `next.config.js`

Next.js build configuration:

- **reactStrictMode**: Enables strict mode for better debugging
- **Image optimization**: AVIF/WebP formats for Supabase images
- **poweredByHeader: false**: Removes X-Powered-By header (security)
- **compress: true**: Enables gzip compression
- **Logging**: Shows fetch URLs in development mode
- **TypeScript/ESLint**: Type-checks and lints during build

### `vercel.json`

Vercel platform configuration:

- **Build/Install commands**: Specifies npm commands
- **Security headers**: Sets HTTP security headers automatically
  - `X-Content-Type-Options`: Prevents MIME-type sniffing
  - `X-Frame-Options`: Prevents clickjacking
  - `X-XSS-Protection`: Enables XSS filtering
  - `Referrer-Policy`: Controls referrer information
  - `Permissions-Policy`: Restricts browser features
- **Regions**: Deploys to iad1 (Washington DC) by default
- **GitHub integration**: Enables deployment comments on PRs

### `package.json`

Defines:
- **Dependencies**: All required packages
- **Scripts**: Build, dev, lint commands
- **Engines**: Node >= 18.17.0, npm >= 9.0.0

## Advanced Features

### Preview Deployments

Vercel automatically creates preview deployments for:
- Every push to non-production branches
- Every pull request

**Preview URLs** look like:
```
https://[your-app]-git-[branch-name]-[username].vercel.app
```

**To test previews:**
1. Create a new branch
2. Push changes
3. Vercel deploys automatically
4. Find URL in GitHub PR comments or Vercel dashboard

### Custom Domains

To use your own domain:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `nexuscheck.com`)
3. Follow Vercel's DNS configuration instructions
4. Update Railway CORS to include your custom domain

### Environment-Specific Variables

Set different values for Production vs Preview:

1. Go to Project Settings → Environment Variables
2. Click on a variable
3. Choose specific environments:
   - **Production**: Main branch deployments
   - **Preview**: PR and branch deployments
   - **Development**: Local development (optional)

Example:
```bash
# Production
NEXT_PUBLIC_API_URL=https://api.nexuscheck.com

# Preview
NEXT_PUBLIC_API_URL=https://api-staging.railway.app
```

## Common Issues & Solutions

### ❌ Build Fails: "Could not find package.json"

**Problem:** Vercel can't find your package.json

**Solution:**
1. Verify "Root Directory" is set to `frontend`
2. Check package.json exists in frontend folder
3. Retry deployment

### ❌ Build Fails: Type Errors

**Problem:** TypeScript compilation errors prevent build

**Solution:**
1. Fix type errors locally first: `npm run type-check`
2. OR temporarily allow errors by uncommenting in `next.config.js`:
   ```javascript
   typescript: {
     ignoreBuildErrors: true, // ⚠️ Not recommended for production
   }
   ```

### ❌ Environment Variables Not Working

**Problem:** App can't access environment variables

**Solution:**
1. Ensure variables start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding new environment variables
3. Check variable names match exactly (case-sensitive)
4. Verify variables are set for correct environment (Production/Preview)

### ❌ API Calls Fail / CORS Errors

**Problem:** Frontend can't communicate with backend

**Symptoms:**
- CORS errors in browser console
- "Network Error" or "Failed to fetch"

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL exactly
2. Update `ALLOWED_ORIGINS` in Railway to include Vercel URL
3. Check Railway backend is running (test `/health` endpoint)
4. Ensure no trailing slashes in URLs

### ❌ Images Not Loading

**Problem:** Supabase images fail to load

**Solution:**
1. Check `next.config.js` has Supabase hostname in `remotePatterns`
2. Verify images exist in Supabase storage
3. Check Supabase storage bucket is public (if needed)

### ❌ Deployment Succeeds but Shows 404

**Problem:** Routes return 404 errors

**Solution:**
1. Ensure you're using Next.js App Router correctly
2. Check file naming: `page.tsx` not `index.tsx`
3. Verify folder structure in `app/` directory
4. Clear Vercel build cache: Settings → Clear Build Cache

## Monitoring & Analytics

### View Deployment Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click on a deployment
4. View **Build Logs** and **Function Logs**

### Analytics

Vercel provides built-in analytics:

1. Go to **Analytics** tab
2. View:
   - Page views
   - Top pages
   - Top referrers
   - User location
   - Device breakdown

### Speed Insights

Enable Speed Insights for performance monitoring:

1. Go to **Speed Insights** tab
2. Click **Enable Speed Insights**
3. Add the Vercel Analytics package (optional):
   ```bash
   npm install @vercel/analytics
   ```

## Updating Your Deployment

### Automatic Deployments

Vercel automatically redeploys when you push to GitHub:

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel detects the push and redeploys
4. Get notification when deployment completes

### Manual Redeploy

To force a redeploy:

1. Go to Deployments tab
2. Click on latest deployment
3. Click **"..."** → **"Redeploy"**
4. Choose "Use existing Build Cache" or "Rebuild"

### Rollback

If something goes wrong:

1. Go to Deployments tab
2. Find a previous successful deployment
3. Click **"..."** → **"Promote to Production"**

## Performance Optimization

### Image Optimization

Vercel automatically optimizes images:

- Converts to AVIF/WebP when supported
- Resizes based on device
- Lazy loads images
- Serves from global CDN

**Best practices:**
```jsx
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>
```

### Edge Caching

Vercel caches at the edge for fast loading:

- Static pages: Cached indefinitely
- API routes: Configure with headers
- Images: Cached for 1 year

### Bundle Size

Monitor bundle size in build logs:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    1.2 kB    85.3 kB
└ ○ /analysis/new                        2.5 kB    86.6 kB
```

**To reduce:**
- Use dynamic imports for large components
- Remove unused dependencies
- Enable tree-shaking

## Security Best Practices

### Environment Variables

- ✅ **DO**: Use `NEXT_PUBLIC_` prefix for client-side vars only
- ✅ **DO**: Keep secrets in Vercel dashboard, never commit them
- ❌ **DON'T**: Expose API keys or secrets client-side

### Headers

Security headers are configured in `vercel.json`:

- **X-Frame-Options**: Prevents clickjacking
- **Content-Security-Policy**: (Add if needed for strict CSP)
- **X-Content-Type-Options**: Prevents MIME sniffing

### Authentication

- Use Supabase Auth (already configured)
- Validate JWT tokens server-side when possible
- Implement Row Level Security (RLS) in Supabase

## Cost Management

Vercel pricing:
- **Hobby (Free)**: 100GB bandwidth, unlimited personal projects
- **Pro ($20/month)**: 1TB bandwidth, advanced features
- **Enterprise**: Custom pricing

### Free Tier Limits:

- 100GB bandwidth/month
- Unlimited deployments
- Unlimited preview deployments
- 100 hours serverless function execution

### Tips to Stay in Free Tier:

1. **Optimize images**: Reduces bandwidth usage
2. **Monitor analytics**: Track bandwidth consumption
3. **Use edge caching**: Reduces origin requests
4. **Compress assets**: Smaller files = less bandwidth

## Pre-Launch Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Railway backend URL configured
- [ ] CORS properly configured in Railway
- [ ] Test login/signup flows
- [ ] Test main application features
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Verify no console errors
- [ ] Test error pages (404, 500)
- [ ] Analytics/monitoring set up
- [ ] Custom domain configured (if applicable)

## Collaboration

### Adding Team Members

1. Go to Project Settings → Members
2. Click **"Invite"**
3. Enter email address
4. Set role (Viewer/Developer/Admin)

### GitHub Integration

Vercel comments on PRs with:
- Preview deployment URL
- Build status
- Deployment logs
- Visual comparison (if enabled)

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Discord**: https://vercel.com/discord
- **Status Page**: https://vercel-status.com

## Troubleshooting Command Reference

```bash
# Test API endpoint from deployed frontend
# Open browser console on your Vercel URL, then:
fetch(process.env.NEXT_PUBLIC_API_URL + '/health')
  .then(r => r.json())
  .then(console.log)

# Check environment variables are set
console.log({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

# Test Railway backend from command line
curl https://[your-railway-app].railway.app/health

# Check CORS from deployed frontend origin
curl -I -X OPTIONS \
  -H "Origin: https://[your-vercel-app].vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://[your-railway-app].railway.app/api/v1/analyses
```

## Next Steps

After deploying your frontend:

1. **Test thoroughly**: All features, all pages, all user flows
2. **Monitor metrics**: Check analytics and speed insights
3. **Set up notifications**: Enable Vercel GitHub notifications
4. **Share with team**: Send URL to your friend for testing
5. **Gather feedback**: Prepare for pilot program
6. **Iterate**: Use preview deployments for testing new features

---

**Questions?** Check Vercel deployment logs - they're very detailed and helpful!
