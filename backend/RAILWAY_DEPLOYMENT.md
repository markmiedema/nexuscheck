# Railway Deployment Guide - Nexus Check Backend

This guide walks you through deploying the Nexus Check FastAPI backend to Railway.

## Quick Start

Railway will automatically detect and deploy your Python application using the configuration files in this directory:

- `nixpacks.toml` - Railway's Nixpacks build configuration
- `railway.json` - Railway service configuration
- `Procfile` - Process startup command
- `.python-version` - Python version specification
- `requirements.txt` - Python dependencies

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **Supabase Project**: Have your Supabase credentials ready

## Deployment Steps

### 1. Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account (if first time)
5. Select your repository: `nexuscheck`

### 2. Configure Root Directory

Since your backend is in a subdirectory:

1. After selecting the repo, Railway will start deploying
2. Click on your service in the Railway dashboard
3. Go to **Settings** tab
4. Find **"Root Directory"** setting
5. Set it to: `backend`
6. Railway will redeploy automatically

### 3. Set Environment Variables

In your Railway service dashboard:

1. Go to **Variables** tab
2. Click **"New Variable"** and add each of these:

#### Required Variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]

# Application Settings
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# CORS (update with your Vercel URL after frontend deployment)
ALLOWED_ORIGINS=https://[your-app].vercel.app

# Optional: Support Vercel preview deployments
# ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app$
```

#### Optional Variables (defaults shown):

```bash
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/tmp/uploads
API_V1_PREFIX=/api/v1
```

### 4. Deploy!

1. Railway will automatically deploy after you save environment variables
2. Wait for build to complete (usually 2-3 minutes)
3. Once deployed, you'll see a **"Deployment successful"** message

### 5. Get Your Railway URL

1. In your service dashboard, go to **Settings** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway will give you a URL like: `https://[your-app].railway.app`
5. **Save this URL** - you'll need it for your frontend configuration!

### 6. Test Your Deployment

Test the health check endpoint:

```bash
curl https://[your-railway-app].railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

## Understanding the Configuration Files

### `nixpacks.toml`

Railway's modern build system configuration:

- **Phases**: Defines build stages (setup, install, build, start)
- **nixPkgs**: System packages (Python 3.11, GCC for dependencies)
- **Install commands**: Upgrade pip and install requirements
- **Start command**: How to run your application

### `railway.json`

Railway service configuration:

- **Build settings**: Builder type and build command
- **Deploy settings**: Start command and health check
- **Health check**: Monitors `/health` endpoint
- **Restart policy**: Automatically restarts on failure (max 10 retries)

### `Procfile`

Traditional process file (fallback if nixpacks.toml isn't used):

- Defines the `web` process type
- Uses uvicorn to run FastAPI
- Binds to `0.0.0.0:$PORT` (Railway provides PORT variable)

### `.python-version`

Specifies Python 3.11 for consistency across environments.

## Common Issues & Solutions

### ❌ Build Fails: "Could not find requirements.txt"

**Problem:** Railway can't find your requirements.txt

**Solution:**
1. Check "Root Directory" is set to `backend`
2. Verify `requirements.txt` exists in backend folder
3. Redeploy

### ❌ Application Crashes on Startup

**Problem:** Missing environment variables or configuration error

**Solution:**
1. Check Railway logs: Service → Deployments → View Logs
2. Verify all required environment variables are set
3. Check for typos in variable names (they're case-sensitive!)
4. Ensure `DEBUG=False` (not `debug` or `false`)

### ❌ Health Check Failing

**Problem:** Railway can't reach `/health` endpoint

**Solution:**
1. Verify your app is binding to `0.0.0.0:$PORT` (not `127.0.0.1`)
2. Check logs for startup errors
3. Ensure no firewall/network issues

### ❌ CORS Errors from Frontend

**Problem:** Frontend requests blocked by CORS

**Solution:**
1. Update `ALLOWED_ORIGINS` in Railway to include your Vercel URL
2. Ensure URL format is exact (https://, no trailing slash)
3. Check Railway logs for CORS configuration on startup

### ❌ Port Already in Use

**Problem:** Application tries to use hardcoded port

**Solution:**
- Ensure start command uses `$PORT` variable
- Railway automatically assigns a port
- Our configuration already handles this correctly

## Monitoring & Logs

### View Logs

1. Go to your service in Railway dashboard
2. Click **Deployments** tab
3. Click on a deployment
4. View real-time logs

Logs will show:
- Startup messages
- CORS configuration
- Environment mode
- Request logs
- Errors and exceptions

### View Metrics

1. Go to **Metrics** tab in your service
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request rates

## Updating Your Deployment

### Automatic Deployments

Railway automatically redeploys when you push to your main branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Railway detects the push and redeploys
4. No manual intervention needed!

### Manual Redeploy

To force a redeploy:

1. Go to Deployments tab
2. Click **"Deploy"** button
3. Select **"Redeploy"**

### Rollback

If something goes wrong:

1. Go to Deployments tab
2. Find a previous successful deployment
3. Click **"Rollback to this deployment"**

## Environment-Specific Configurations

### Development Environment Variables

For a staging/dev Railway instance:

```bash
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=DEBUG
ALLOWED_ORIGINS=http://localhost:3000,https://[staging-frontend].vercel.app
```

### Production Environment Variables

For production Railway instance:

```bash
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://[production-frontend].vercel.app
```

## Cost Optimization

Railway pricing:
- **Starter Plan**: $5/month
- **Usage-based**: ~$0.000231/GB-hour for resources

### Tips to reduce costs:

1. **Set auto-sleep** (if not production):
   - Settings → Enable "Auto Sleep"
   - App sleeps after inactivity, wakes on request

2. **Monitor resource usage**:
   - Check Metrics tab regularly
   - Optimize code if CPU/memory is high

3. **Use appropriate plan**:
   - Development: Starter plan is fine
   - Production with high traffic: Consider Pro plan

## Security Checklist

Before going live:

- [ ] `DEBUG=False` in Railway
- [ ] `ENVIRONMENT=production` set
- [ ] `ALLOWED_ORIGINS` only includes your actual frontend URL(s)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (only in Railway, never in code)
- [ ] All Supabase credentials are from production project
- [ ] Health check endpoint is responding
- [ ] Logs don't expose sensitive information
- [ ] HTTPS is enforced (Railway does this automatically)

## Next Steps

After deploying your backend:

1. **Update Frontend**: Set `NEXT_PUBLIC_API_URL` in Vercel to your Railway URL
2. **Update CORS**: Come back and update `ALLOWED_ORIGINS` with your Vercel URL
3. **Test Integration**: Verify frontend can communicate with backend
4. **Monitor**: Check logs and metrics regularly
5. **Set up alerts**: Configure Railway notifications for deployment failures

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Nixpacks Docs**: https://nixpacks.com/docs

## Troubleshooting Command Reference

```bash
# Test health endpoint
curl https://[your-app].railway.app/health

# Test API root
curl https://[your-app].railway.app/

# Test with authentication (replace with real token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://[your-app].railway.app/api/v1/analyses

# Check CORS headers
curl -I -X OPTIONS \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://[your-app].railway.app/health
```

---

**Questions?** Check Railway logs first - they usually tell you exactly what went wrong!
