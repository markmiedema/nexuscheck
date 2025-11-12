# Integration & Dependencies Guide

**Last Updated:** 2025-11-03
**Updated:** 2025-11-11 (status clarification)
**Document Type:** Technical Reference - Integration Guide
**Status:** Implemented - App deployed and operational

**Note:** This document was created during initial architecture planning (Nov 2025). The specifications described here have been implemented in the production application. Use as reference for dependency management and integration patterns.

---

## Table of Contents

1. [Complete Dependency Specifications](#complete-dependency-specifications)
2. [Integration Architecture](#integration-architecture)
3. [Environment Configuration](#environment-configuration)
4. [Setup Validation Checklist](#setup-validation-checklist)
5. [Integration Points & Testing](#integration-points--testing)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Development Workflow](#development-workflow)

---

## 1. Complete Dependency Specifications

### Frontend Dependencies (package.json)

```json
{
  "name": "salt-tax-tool-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "react-dom": "18.3.0",

    "// Supabase": "",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",

    "// State Management": "",
    "zustand": "^4.5.0",

    "// Forms & Validation": "",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",

    "// UI Components": "",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "lucide-react": "^0.344.0",

    "// Styling": "",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",

    "// Data Visualization": "",
    "recharts": "^2.12.0",
    "react-simple-maps": "^3.0.0",

    "// File Upload": "",
    "react-dropzone": "^14.2.3",

    "// HTTP Client": "",
    "axios": "^1.6.7",

    "// Date Handling": "",
    "date-fns": "^3.3.1",

    "// CSV Parsing (client-side preview)": "",
    "papaparse": "^5.4.1",
    "@types/papaparse": "^5.3.14"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.17",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.0",
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11"
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  }
}
```

**Key Version Constraints:**
- **Node.js:** >= 18.17.0 (Next.js 14 requirement)
- **React:** 18.3.x (must match with Next.js 14.2)
- **Next.js:** 14.2.x (App Router stable)
- **TypeScript:** 5.3.x (for latest features)

---

### Backend Dependencies (requirements.txt)

```txt
# FastAPI Framework
fastapi==0.110.0
uvicorn[standard]==0.27.1
python-multipart==0.0.9  # For file uploads

# Supabase Client
supabase==2.3.4
postgrest==0.13.2

# Database
asyncpg==0.29.0  # Async PostgreSQL driver
sqlalchemy==2.0.27  # ORM (if needed for complex queries)

# Data Processing
pandas==2.2.0
openpyxl==3.1.2  # Excel file support
python-dateutil==2.8.2

# PDF Generation
weasyprint==61.2
reportlab==4.1.0  # Alternative PDF library

# Authentication & Security
pyjwt==2.8.0
cryptography==42.0.2
python-jose[cryptography]==3.3.0

# Validation
pydantic==2.6.1
pydantic-settings==2.1.0
email-validator==2.1.0

# Environment Variables
python-dotenv==1.0.1

# HTTP Client (for Supabase)
httpx==0.26.0

# Testing
pytest==8.0.0
pytest-asyncio==0.23.4
pytest-cov==4.1.0
httpx==0.26.0  # For testing async HTTP

# Code Quality
ruff==0.2.1  # Fast Python linter
black==24.2.0  # Code formatter
mypy==1.8.0  # Type checker

# Logging
python-json-logger==2.0.7

# CORS
fastapi-cors==0.0.6
```

**Key Version Constraints:**
- **Python:** >= 3.11, < 3.13 (for best FastAPI performance)
- **FastAPI:** 0.110.x (latest stable)
- **Supabase:** 2.3.x (compatible with Supabase v2 API)
- **Pandas:** 2.2.x (for efficient CSV processing)

---

### Database (Supabase)

**Already Deployed:**
- PostgreSQL 15.x
- 12 tables with RLS policies
- 239 rows of state rules data

**No additional setup required** - using hosted Supabase.

---

## 2. Integration Architecture

### Component Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (Port 3000)                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. User Authentication                          │   │
│  │    → Supabase Auth Client                       │   │
│  │    → Stores JWT in httpOnly cookies            │   │
│  └─────────────────────────────────────────────────┘   │
│                    │                                     │
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 2. API Requests                                 │   │
│  │    → Axios client with JWT interceptor         │   │
│  │    → All requests include Authorization header │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP/HTTPS
                    ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI Backend (Port 8000)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 3. JWT Validation                               │   │
│  │    → Extract JWT from Authorization header     │   │
│  │    → Verify with Supabase JWT secret          │   │
│  │    → Extract user_id from claims              │   │
│  └─────────────────────────────────────────────────┘   │
│                    │                                     │
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 4. Business Logic                               │   │
│  │    → CSV processing (pandas)                    │   │
│  │    → Nexus calculations                         │   │
│  │    → PDF generation (WeasyPrint)               │   │
│  └─────────────────────────────────────────────────┘   │
│                    │                                     │
│                    ▼                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 5. Database Access                              │   │
│  │    → Supabase Python client                     │   │
│  │    → RLS policies enforce user_id               │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Storage)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 6. Data Storage                                 │   │
│  │    → PostgreSQL database (RLS enabled)         │   │
│  │    → File storage (CSV, PDFs)                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Critical Integration Points

#### Integration Point 1: Authentication (Frontend → Supabase)

**Frontend Implementation:**
```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

// Usage in login component
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // JWT tokens automatically stored in cookies
  // Access token available at: supabase.auth.getSession()
}
```

**Verification:**
```bash
# Test authentication works
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return: { "session": {...}, "user": {...} }
```

---

#### Integration Point 2: API Requests (Frontend → Backend)

**Frontend API Client:**
```typescript
// lib/api/client.ts
import axios from 'axios'
import { supabase } from '@/lib/supabase/client'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor to add JWT to all requests
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }

  return config
})

// Interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh
      const { data, error: refreshError } = await supabase.auth.refreshSession()

      if (!refreshError && data.session) {
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${data.session.access_token}`
        return apiClient.request(error.config)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

**Backend JWT Validation:**
```python
# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate JWT token and return user_id.
    """
    token = credentials.credentials

    try:
        # Verify JWT with Supabase secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# Usage in endpoint
@router.post("/analyses")
async def create_analysis(
    data: AnalysisCreate,
    user_id: str = Depends(get_current_user)
):
    # user_id is validated and extracted from JWT
    ...
```

**Verification:**
```bash
# Test API authentication
# 1. Get token from login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.session.access_token')

# 2. Make authenticated API call
curl -X GET http://localhost:8000/api/v1/analyses \
  -H "Authorization: Bearer $TOKEN"

# Should return: { "total_count": 0, "analyses": [] }
```

---

#### Integration Point 3: Database Access (Backend → Supabase)

**Backend Supabase Client:**
```python
# app/core/supabase.py
from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY  # Server-side key with full access
)

# Note: RLS policies still enforced even with service role key
# Always pass user_id in queries to ensure proper access control

# Usage in service
async def create_analysis(user_id: str, data: dict) -> dict:
    """
    Create analysis in database.
    RLS policy ensures user can only create for themselves.
    """
    result = supabase.table('analyses').insert({
        'user_id': user_id,  # CRITICAL: Always include user_id
        **data
    }).execute()

    return result.data[0]
```

**Verification:**
```python
# Test database connection
from app.core.supabase import supabase

# Should return list of states
states = supabase.table('states').select('*').execute()
print(f"Found {len(states.data)} states")  # Should print: Found 52 states
```

---

#### Integration Point 4: File Upload (Frontend → Backend → Storage)

**Frontend Upload:**
```typescript
// components/analyses/FileUpload.tsx
const handleFileUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(
    `/api/v1/analyses/${analysisId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        setUploadProgress(percentCompleted)
      },
    }
  )

  return response.data
}
```

**Backend Upload Handler:**
```python
# app/api/v1/upload.py
from fastapi import UploadFile, File
from app.core.supabase import supabase
import uuid

@router.post("/{analysis_id}/upload")
async def upload_csv(
    analysis_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    # Validate file
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(400, "Invalid file type")

    if file.size > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(413, "File too large")

    # Save to temporary location
    temp_path = f"/tmp/{uuid.uuid4()}-{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Upload to Supabase Storage
    storage_path = f"{user_id}/{analysis_id}/{file.filename}"
    with open(temp_path, "rb") as f:
        supabase.storage.from_("csv-uploads").upload(
            storage_path,
            f,
            file_options={"content-type": file.content_type}
        )

    # Update analysis record
    supabase.table('analyses').update({
        'upload_file_path': storage_path,
        'status': 'uploaded'
    }).eq('id', analysis_id).eq('user_id', user_id).execute()

    return {"upload_id": analysis_id, "status": "completed"}
```

**Verification:**
```bash
# Test file upload
curl -X POST http://localhost:8000/api/v1/analyses/{id}/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-data.csv"

# Should return: { "upload_id": "...", "status": "completed" }
```

---

## 3. Environment Configuration

### Frontend Environment (.env.local)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... # Anon/public key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000  # Development
# NEXT_PUBLIC_API_URL=https://api.salt-tool.railway.app  # Production

# Environment
NODE_ENV=development  # or production
```

**How to get values:**
1. Go to Supabase Dashboard → Settings → API
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Backend Environment (.env)

```bash
# Supabase Configuration
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Service role key (server-side only)
SUPABASE_JWT_SECRET=your-jwt-secret  # For JWT verification

# Application Settings
ENVIRONMENT=development  # or production
LOG_LEVEL=INFO
DEBUG=True  # Set to False in production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://salt-tool.vercel.app

# File Upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/tmp/uploads

# Database (optional - using Supabase client instead)
# DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# API Settings
API_V1_PREFIX=/api/v1
```

**How to get values:**
1. Go to Supabase Dashboard → Settings → API
2. Copy `Project URL` → `SUPABASE_URL`
3. Copy `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Never expose client-side!)
4. Go to Settings → API → JWT Settings
5. Copy `JWT Secret` → `SUPABASE_JWT_SECRET`

---

### Configuration File (Backend)

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    # Application
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "/tmp/uploads"

    # API
    API_V1_PREFIX: str = "/api/v1"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

---

## 4. Setup Validation Checklist

### Initial Setup

```bash
# ✅ 1. Clone repository
git clone <repo-url>
cd SALT-Tax-Tool-Clean

# ✅ 2. Frontend Setup
cd frontend
node --version  # Should be >= 18.17.0
npm install
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# ✅ 3. Backend Setup
cd ../backend
python --version  # Should be >= 3.11
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials

# ✅ 4. Verify Supabase Connection
# Run this Python script:
python -c "
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
states = supabase.table('states').select('*').execute()
print(f'✅ Connected to Supabase! Found {len(states.data)} states')
"
# Should print: ✅ Connected to Supabase! Found 52 states
```

---

### Integration Validation

Run these tests in order to validate all integration points:

#### Test 1: Database Connection

```bash
# Backend
cd backend
source venv/bin/activate

# Test Supabase connection
python -c "
from app.core.supabase import supabase
states = supabase.table('states').select('state_code, state_name').limit(5).execute()
for state in states.data:
    print(f'{state[\"state_code\"]}: {state[\"state_name\"]}')
"

# Expected output:
# AL: Alabama
# AK: Alaska
# AZ: Arizona
# AR: Arkansas
# CA: California
```

#### Test 2: JWT Validation

```bash
# Backend - Start server
uvicorn app.main:app --reload --port 8000

# In another terminal - Test JWT validation
curl -X GET http://localhost:8000/health
# Expected: {"status":"healthy"}

# Try protected endpoint without token
curl -X GET http://localhost:8000/api/v1/analyses
# Expected: {"detail":"Not authenticated"}
```

#### Test 3: Frontend → Backend Communication

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Test full flow
# 1. Open browser to http://localhost:3000
# 2. Open DevTools → Network tab
# 3. Try to make API call
# 4. Verify request goes to http://localhost:8000
# 5. Verify Authorization header present
```

#### Test 4: File Upload Flow

```bash
# Create test CSV
cat > test-data.csv << EOF
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2021,CA,1234.50,direct
01/16/2021,NY,567.00,direct
EOF

# Test upload endpoint (after getting auth token)
curl -X POST http://localhost:8000/api/v1/analyses/{analysis-id}/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-data.csv"

# Expected: {"upload_id":"...","status":"completed"}
```

---

## 5. Integration Points & Testing

### Integration Test Matrix

| Integration Point | Frontend Component | Backend Endpoint | Database Table | Test Status |
|-------------------|-------------------|------------------|----------------|-------------|
| User Login | `LoginForm.tsx` | Supabase Auth | `auth.users` | ⬜ |
| Create Analysis | `SetupForm.tsx` | `POST /api/v1/analyses` | `analyses` | ⬜ |
| Upload CSV | `FileUpload.tsx` | `POST /api/v1/analyses/{id}/upload` | `data_upload_log` | ⬜ |
| Validate Data | `DataMapping.tsx` | `POST /api/v1/analyses/{id}/validate` | `error_logs` | ⬜ |
| Process Analysis | N/A (background) | `POST /api/v1/analyses/{id}/process` | Multiple tables | ⬜ |
| View Results | `ResultsDashboard.tsx` | `GET /api/v1/analyses/{id}/results/summary` | `nexus_determination` | ⬜ |
| Generate Report | `ReportGenerator.tsx` | `POST /api/v1/analyses/{id}/reports/generate` | `analyses` | ⬜ |

---

### End-to-End Test Script

```bash
#!/bin/bash
# test-integration.sh

set -e  # Exit on error

echo "🧪 Starting Integration Tests..."

# 1. Test Database Connection
echo "1️⃣ Testing database connection..."
python -c "from app.core.supabase import supabase; states = supabase.table('states').select('*').execute(); assert len(states.data) == 52"
echo "✅ Database connected (52 states found)"

# 2. Test Backend Server
echo "2️⃣ Testing backend server..."
curl -f http://localhost:8000/health || (echo "❌ Backend not running" && exit 1)
echo "✅ Backend healthy"

# 3. Test Frontend Server
echo "3️⃣ Testing frontend server..."
curl -f http://localhost:3000 || (echo "❌ Frontend not running" && exit 1)
echo "✅ Frontend healthy"

# 4. Test CORS
echo "4️⃣ Testing CORS..."
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8000/api/v1/analyses \
     -v 2>&1 | grep "Access-Control-Allow-Origin"
echo "✅ CORS configured"

echo "🎉 All integration tests passed!"
```

---

## 6. Common Issues & Solutions

### Issue 1: Frontend Can't Connect to Backend

**Symptoms:**
- Network error in browser console
- CORS errors
- ERR_CONNECTION_REFUSED

**Solutions:**

```bash
# 1. Verify backend is running
curl http://localhost:8000/health

# 2. Check CORS configuration
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ✅ Correct
    # allow_origins=["localhost:3000"],  # ❌ Wrong - missing http://
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Check frontend API URL
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000  # ✅ Correct
# NEXT_PUBLIC_API_URL=localhost:8000  # ❌ Wrong - missing http://
```

---

### Issue 2: JWT Token Invalid

**Symptoms:**
- 401 Unauthorized errors
- "Invalid token" messages
- Token verification fails

**Solutions:**

```python
# 1. Verify JWT secret matches Supabase
# Get from: Supabase Dashboard → Settings → API → JWT Secret
# backend/.env
SUPABASE_JWT_SECRET=your-actual-jwt-secret

# 2. Check JWT decoding
# backend/app/core/auth.py
import jwt

# Make sure algorithm matches Supabase (HS256)
payload = jwt.decode(
    token,
    settings.SUPABASE_JWT_SECRET,
    algorithms=["HS256"],  # ✅ Correct for Supabase
    audience="authenticated"  # ✅ Required
)

# 3. Verify token is being sent from frontend
# frontend/lib/api/client.ts
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    // ✅ Correct format
    config.headers.Authorization = `Bearer ${session.access_token}`

    // ❌ Wrong formats:
    // config.headers.Authorization = session.access_token
    // config.headers.Authorization = `${session.access_token}`
  }

  return config
})
```

---

### Issue 3: Database RLS Blocking Queries

**Symptoms:**
- Empty results when data should exist
- Permission denied errors
- Different results in Supabase dashboard vs API

**Solutions:**

```python
# 1. Always include user_id in queries
# ✅ Correct - RLS policy enforces user_id match
result = supabase.table('analyses').insert({
    'user_id': user_id,  # From JWT
    'company_name': 'ACME Corp',
    ...
}).execute()

# ❌ Wrong - RLS will block
result = supabase.table('analyses').insert({
    'company_name': 'ACME Corp',  # Missing user_id
    ...
}).execute()

# 2. Use service role key server-side
# backend/.env
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Not anon key!

# 3. Verify RLS policies in Supabase
# Dashboard → Authentication → Policies
# Ensure policies like this exist:
CREATE POLICY "Users can view own analyses"
ON analyses FOR SELECT
USING (auth.uid() = user_id);
```

---

### Issue 4: File Upload Failing

**Symptoms:**
- 413 Payload Too Large
- File not appearing in Supabase Storage
- Upload hangs indefinitely

**Solutions:**

```python
# 1. Check file size limits
# backend/app/api/v1/upload.py
MAX_SIZE = 50 * 1024 * 1024  # 50MB in bytes

if file.size > MAX_SIZE:
    raise HTTPException(413, "File too large")

# 2. Verify Supabase Storage bucket exists
# Supabase Dashboard → Storage → Create bucket: "csv-uploads"
# Enable RLS: Yes
# Public: No

# 3. Check RLS policy for storage
# Dashboard → Storage → csv-uploads → Policies
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'csv-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

# 4. Frontend - handle large files
// components/analyses/FileUpload.tsx
const handleUpload = async (file: File) => {
  if (file.size > 50 * 1024 * 1024) {
    toast.error("File must be less than 50MB")
    return
  }

  // Upload with progress
  await apiClient.post(`/upload`, formData, {
    timeout: 120000,  // 2 minute timeout for large files
    onUploadProgress: (e) => {
      setProgress((e.loaded / e.total) * 100)
    }
  })
}
```

---

### Issue 5: Environment Variables Not Loading

**Symptoms:**
- `undefined` values in code
- "Missing required environment variable" errors
- Different behavior in dev vs production

**Solutions:**

```bash
# 1. Frontend - verify .env.local exists and has NEXT_PUBLIC_ prefix
# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_API_URL=http://localhost:8000

# ❌ Wrong - missing prefix (won't be exposed to browser)
SUPABASE_URL=https://...
API_URL=http://localhost:8000

# 2. Backend - verify .env file exists
# Load with python-dotenv
from dotenv import load_dotenv
load_dotenv()  # Must be called before accessing os.getenv()

# 3. Restart dev servers after changing .env
# Frontend: Ctrl+C and npm run dev again
# Backend: Ctrl+C and uvicorn app.main:app --reload again
```

---

## 7. Development Workflow

### Day 1: Project Setup

```bash
# Morning: Setup infrastructure
1. Create Supabase project (if not exists)
2. Run database migrations
3. Verify 239 rows of state rules data

# Afternoon: Setup local development
4. Clone repository
5. Install frontend dependencies
6. Install backend dependencies
7. Configure environment variables
8. Run integration tests
9. Start both servers
```

### Daily Development Workflow

```bash
# Start development session
cd SALT-Tax-Tool-Clean

# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Testing/Commands
# Run tests, make git commits, etc.

# During development:
# 1. Make changes to code
# 2. Servers auto-reload (hot reload enabled)
# 3. Test in browser (http://localhost:3000)
# 4. Check API in Postman or curl
# 5. Commit when feature works
```

### Pre-Commit Checklist

```bash
# Before committing code:

# 1. Run linters
cd frontend && npm run lint
cd backend && ruff check .

# 2. Run type checking
cd frontend && npm run type-check
cd backend && mypy app/

# 3. Run tests
cd frontend && npm test
cd backend && pytest

# 4. Verify integration still works
./test-integration.sh

# 5. Commit
git add .
git commit -m "feat: add CSV upload functionality"
```

---

## 8. Deployment Readiness Checklist

Before deploying to production:

### Frontend (Vercel)

- [ ] Environment variables configured in Vercel dashboard
- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] Build succeeds locally (`npm run build`)
- [ ] All pages render without errors
- [ ] API calls work with production backend

### Backend (Railway)

- [ ] Environment variables configured in Railway dashboard
- [ ] `ALLOWED_ORIGINS` includes production frontend URL
- [ ] Health check endpoint returns 200
- [ ] Can connect to Supabase from Railway
- [ ] File uploads work with production storage

### Database (Supabase)

- [ ] All 12 tables exist with RLS policies
- [ ] 239 rows of state rules data present
- [ ] Storage buckets created with RLS policies
- [ ] Production JWT secret configured in backend
- [ ] Database backups enabled

### Integration Tests

- [ ] Can login and get JWT token
- [ ] Can create analysis
- [ ] Can upload CSV file
- [ ] Can validate data
- [ ] Can process analysis
- [ ] Can view results
- [ ] Can generate PDF report

---

## Quick Reference: Key Files

| Purpose | Location | Description |
|---------|----------|-------------|
| Frontend API Client | `frontend/lib/api/client.ts` | Axios instance with JWT interceptor |
| Frontend Supabase Client | `frontend/lib/supabase/client.ts` | Supabase auth client |
| Backend Auth | `backend/app/core/auth.py` | JWT validation middleware |
| Backend Supabase | `backend/app/core/supabase.py` | Supabase Python client |
| Backend Config | `backend/app/config.py` | Environment variables |
| Frontend Env | `frontend/.env.local` | Frontend environment variables |
| Backend Env | `backend/.env` | Backend environment variables |

---

## Support & Troubleshooting

If you encounter issues not covered here:

1. **Check logs:**
   - Frontend: Browser console (F12)
   - Backend: Terminal output
   - Database: Supabase Dashboard → Logs

2. **Verify environment:**
   - Node version: `node --version` (>= 18.17.0)
   - Python version: `python --version` (>= 3.11)
   - Installed packages: Check package.json / requirements.txt

3. **Test connectivity:**
   - Database: Run Supabase connection test
   - Backend: `curl http://localhost:8000/health`
   - Frontend: Open http://localhost:3000

4. **Common fixes:**
   - Restart dev servers
   - Clear node_modules and reinstall
   - Clear Python venv and reinstall
   - Check firewall/antivirus blocking ports

---

## Document Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2025-11-03 | Initial creation - Complete integration guide | Project Team |

---

**Status:** ✅ Complete - Ready for Sprint 1 Development
