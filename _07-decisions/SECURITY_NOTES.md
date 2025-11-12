# Security Notes

**Last Updated:** 2025-11-11
**Purpose:** Document security audit findings and best practices for the Nexus Check project

---

## 🔒 Security Audit Summary (Nov 11, 2025)

### Exposed Credentials Found

**Status:** ⚠️ Mitigated (archived, requires key rotation)

**Finding:**
- **File:** `backend/scripts/test_supabase_connection.py` (now archived)
- **Issue:** Hardcoded Supabase service role key
- **Key Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key was visible)
- **Date Archived:** 2025-11-11 (Phase 2 cleanup)
- **New Location:** `_archives/task-reports-2025-11/test_supabase_connection.py`

**Action Required:**
- [ ] Rotate Supabase service role key in Supabase dashboard
- [ ] Update `backend/.env` with new key
- [ ] Verify old key is revoked

**Why This Matters:**
Service role keys bypass Row Level Security (RLS) and have full database access. Even though the file is archived, if the key was ever committed to version control history, it should be rotated.

---

## ✅ Security Controls Verified

### 1. Environment Variable Protection
- [x] Root `.gitignore` properly excludes `.env` files
- [x] Backend `.env` excluded via `.gitignore`
- [x] Frontend `.env.local` excluded via `.gitignore`
- [x] No `.env` files found in git status (untracked/modified)

### 2. Environment Variable Documentation
- [x] `backend/.env.example` - All 11 variables documented
- [x] `frontend/.env.example` - All 3 variables documented
- [x] Backend `config.py` uses only documented variables
- [x] Frontend uses only documented variables (NEXT_PUBLIC_API_URL, NODE_ENV)

### 3. Code Scan Results
**Scanned for:**
- API keys (`api_key`, `apikey`)
- Passwords (`password`, `passwd`)
- JWT secrets
- Supabase keys
- Database credentials

**Result:** No active credential exposures in codebase

---

## 🛡️ Security Best Practices

### Environment Variables
1. **Never commit `.env` files** - Always use `.env.example` templates
2. **Rotate keys regularly** - Especially after team changes
3. **Use least privilege** - Frontend uses public `anon` key, backend uses `service_role` key only when needed
4. **Separate environments** - Use different keys for dev/staging/production

### Supabase Security
1. **Row Level Security (RLS)** - Enabled on all tables
2. **Service role key** - Only used server-side (FastAPI backend)
3. **Anon key** - Safe for client-side (Next.js frontend)
4. **JWT verification** - Backend validates JWT signatures using `SUPABASE_JWT_SECRET`

### File Upload Security
- **Max file size:** 50MB (configurable via `MAX_FILE_SIZE_MB`)
- **Upload directory:** `/tmp/uploads` (temporary storage)
- **CSV parsing:** Uses pandas with strict error handling
- **File validation:** Type checking before processing

### API Security
- **CORS:** Configured in `backend/app/config.py` via `ALLOWED_ORIGINS`
- **Authentication:** JWT-based via Supabase Auth
- **Rate limiting:** Consider adding for production (not implemented yet)

---

## 📋 Security Checklist for Production

Before deploying to production:

- [ ] Rotate all Supabase keys (especially service role key)
- [ ] Verify `.env` files are never committed
- [ ] Set `DEBUG=False` in production backend config
- [ ] Configure production CORS origins (no wildcards)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring for failed auth attempts
- [ ] Review and test all RLS policies
- [ ] Set up automated security scanning (Dependabot, etc.)
- [ ] Implement API request logging (without logging sensitive data)
- [ ] Set up alerts for suspicious activity

---

## 🔍 Regular Security Maintenance

### Monthly
- [ ] Review dependency updates for security patches
- [ ] Check for new CVEs affecting stack (FastAPI, Next.js, Supabase)
- [ ] Review access logs for anomalies

### Quarterly
- [ ] Rotate API keys and service role keys
- [ ] Review and update RLS policies
- [ ] Audit user permissions and roles
- [ ] Update security documentation

### Annually
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update incident response plan

---

## 📚 Related Documentation

- **Environment Setup:** `_05-development/README_DEVELOPMENT.md`
- **Backend Config:** `backend/app/config.py`
- **Decision Log:** `_07-decisions/decision-log.md`
- **Supabase RLS:** See database migration files in `backend/migrations/`

---

**Last Updated:** 2025-11-11
