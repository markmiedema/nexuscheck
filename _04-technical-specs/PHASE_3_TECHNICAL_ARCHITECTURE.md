# Technical Architecture Specification (AS-BUILT)

**Originally Created:** 2025-11-03 (as planning document)
**Updated:** 2025-11-11 (status clarification)
**Document Type:** Technical Reference - Architecture Documentation
**Status:** IMPLEMENTED - Production application matches these specifications

**Note:** This document was created during architecture planning (Nov 2025) and describes the planned technical architecture. The application has been built according to these specifications and is now deployed and operational. Use as reference documentation for the production architecture.

---

## Executive Summary

This document defines the complete technical architecture for the Nexus Check MVP, including API endpoints, authentication strategy, frontend/backend integration patterns, and deployment infrastructure.

**Tech Stack (Confirmed):**
- **Frontend:** Next.js 14 (App Router) + React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python 3.11+)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Hosting:** Vercel (frontend) + Railway (backend)

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [API Endpoints Specification](#api-endpoints-specification)
3. [Authentication & Authorization](#authentication--authorization)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Performance Requirements](#performance-requirements)
9. [Security Considerations](#security-considerations)
10. [Deployment Architecture](#deployment-architecture)
11. [Development Workflow](#development-workflow)

---

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Next.js 14 Frontend (Vercel)              │    │
│  │  • React Components (shadcn/ui + Tailwind)         │    │
│  │  • Client-side State (Zustand)                     │    │
│  │  • Form Validation (Zod)                           │    │
│  │  • API Client (Axios)                              │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTPS
                        │
        ┌───────────────┴──────────────┐
        │                              │
        ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Supabase Auth   │          │   FastAPI        │
│                  │          │   Backend        │
│  • JWT Tokens    │◄────────►│   (Railway)      │
│  • User Sessions │          │                  │
└──────────────────┘          │  • CSV Processing│
        │                     │  • Nexus Calc    │
        │                     │  • PDF Generation│
        │                     │  • Business Logic│
        │                     └────────┬─────────┘
        │                              │
        │                              │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Supabase PostgreSQL        │
        │   • 12 Tables (RLS Enabled)  │
        │   • 239 Rows State Rules     │
        │   • Row Level Security       │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Supabase Storage           │
        │   • CSV Files                │
        │   • Generated PDFs           │
        │   • Encrypted at Rest        │
        └──────────────────────────────┘
```

### Component Responsibilities

**Frontend (Next.js):**
- UI rendering and user interactions
- Form validation and user input handling
- Client-side state management
- Authentication state management
- API request orchestration
- File upload handling
- CSV preview rendering

**Backend (FastAPI):**
- Business logic processing
- CSV parsing and validation
- Nexus determination calculations
- Tax liability estimations
- PDF report generation
- Database query orchestration
- File management

**Database (Supabase):**
- Data persistence
- Row-level security enforcement
- State rules repository
- User analysis storage
- Audit logging

**Storage (Supabase Storage):**
- CSV file storage
- Generated report storage
- Secure file access with signed URLs

---

## 2. API Endpoints Specification

### Base URLs

- **Frontend:** `https://salt-tool.vercel.app`
- **Backend API:** `https://api.salt-tool.railway.app`
- **Supabase:** `https://[project-ref].supabase.co`

### Authentication Headers

All API requests (except public endpoints) require:
```
Authorization: Bearer <supabase_jwt_token>
```

---

### 2.1 Screen 1: Client Setup Endpoints

#### POST `/api/v1/analyses`
Create a new analysis project.

**Request:**
```json
{
  "company_name": "ACME Corporation",
  "period_start": "2021-01-01",
  "period_end": "2024-12-31",
  "business_type": "product_sales",
  "known_registrations": [
    {
      "state_code": "CA",
      "registration_date": "2020-06-01",
      "permit_number": "SR-CA-123456"
    }
  ],
  "notes": "Optional internal notes",
  "retention_period": "90_days"
}
```

**Response (201 Created):**
```json
{
  "analysis_id": "uuid-here",
  "company_name": "ACME Corporation",
  "status": "setup",
  "created_at": "2025-11-03T10:00:00Z",
  "retention_period": "90_days",
  "auto_delete_at": "2026-02-01T10:00:00Z"
}
```

**Errors:**
- `400` - Validation error (invalid dates, missing required fields)
- `401` - Unauthorized (invalid/missing token)
- `422` - Unprocessable entity (business logic error)

---

#### PATCH `/api/v1/analyses/{analysis_id}`
Update analysis metadata (auto-save).

**Request:**
```json
{
  "company_name": "ACME Corp Updated",
  "notes": "Updated notes"
}
```

**Response (200 OK):**
```json
{
  "analysis_id": "uuid-here",
  "updated_at": "2025-11-03T10:05:00Z"
}
```

---

#### GET `/api/v1/analyses/{analysis_id}`
Retrieve analysis details.

**Response (200 OK):**
```json
{
  "analysis_id": "uuid-here",
  "company_name": "ACME Corporation",
  "period_start": "2021-01-01",
  "period_end": "2024-12-31",
  "business_type": "product_sales",
  "status": "setup",
  "created_at": "2025-11-03T10:00:00Z",
  "updated_at": "2025-11-03T10:05:00Z",
  "retention_period": "90_days",
  "auto_delete_at": "2026-02-01T10:00:00Z",
  "known_registrations": [...]
}
```

---

### 2.2 Screen 2: CSV Upload Endpoints

#### POST `/api/v1/analyses/{analysis_id}/upload`
Upload CSV file.

**Request (multipart/form-data):**
```
file: <binary-csv-data>
```

**Response (202 Accepted):**
```json
{
  "upload_id": "uuid-here",
  "file_name": "transactions-2024.csv",
  "file_size_bytes": 15728640,
  "status": "processing",
  "preview_url": null,
  "estimated_processing_seconds": 5
}
```

**Errors:**
- `400` - Invalid file format
- `413` - File too large (>50MB)
- `422` - File contains no valid data

---

#### GET `/api/v1/analyses/{analysis_id}/upload/{upload_id}`
Get upload status and preview.

**Response (200 OK):**
```json
{
  "upload_id": "uuid-here",
  "status": "completed",
  "file_name": "transactions-2024.csv",
  "file_size_bytes": 15728640,
  "row_count": 10245,
  "detected_columns": [
    {
      "csv_column": "transaction_date",
      "suggested_mapping": "transaction_date",
      "sample_values": ["01/15/2021", "01/16/2021", "01/17/2021"],
      "data_type": "date",
      "confidence": 0.98
    },
    {
      "csv_column": "customer_state",
      "suggested_mapping": "customer_state",
      "sample_values": ["CA", "NY", "TX"],
      "data_type": "string",
      "confidence": 1.0
    }
  ],
  "preview_data": [
    {
      "transaction_date": "01/15/2021",
      "customer_state": "CA",
      "revenue_amount": 1234.50,
      "sales_channel": "direct"
    }
  ],
  "validation_warnings": [
    {
      "type": "missing_values",
      "column": "customer_state",
      "count": 15,
      "severity": "warning"
    }
  ]
}
```

---

#### GET `/api/v1/templates/csv`
Download CSV template.

**Response (200 OK):**
Returns CSV file with headers and example rows.

---

### 2.3 Screen 3: Data Mapping Endpoints

#### POST `/api/v1/analyses/{analysis_id}/validate`
Validate data with column mappings.

**Request:**
```json
{
  "upload_id": "uuid-here",
  "column_mappings": {
    "transaction_date": {
      "source_column": "transaction_date",
      "date_format": "MM/DD/YYYY"
    },
    "customer_state": {
      "source_column": "customer_state"
    },
    "revenue_amount": {
      "source_column": "revenue_amount"
    },
    "sales_channel": {
      "source_column": "sales_channel",
      "value_mappings": {
        "amazon": "marketplace",
        "ebay": "marketplace",
        "website": "direct"
      }
    }
  },
  "validation_options": {
    "exclude_invalid_rows": false,
    "strict_mode": true
  }
}
```

**Response (200 OK - Validation Passed):**
```json
{
  "validation_id": "uuid-here",
  "status": "passed",
  "valid_rows": 10200,
  "invalid_rows": 45,
  "errors": [],
  "warnings": [
    {
      "row": 156,
      "column": "customer_state",
      "value": "California",
      "message": "State name detected, converting to 'CA'",
      "severity": "info"
    }
  ],
  "ready_to_process": true
}
```

**Response (200 OK - Validation Failed):**
```json
{
  "validation_id": "uuid-here",
  "status": "failed",
  "valid_rows": 10198,
  "invalid_rows": 47,
  "errors": [
    {
      "row": 23,
      "column": "customer_state",
      "value": "C",
      "message": "Invalid state code. Did you mean CA or CT?",
      "severity": "error"
    },
    {
      "row": 67,
      "column": "transaction_date",
      "value": "13/45/2021",
      "message": "Invalid date format",
      "severity": "error"
    }
  ],
  "error_report_url": "https://storage.supabase.co/signed-url-here",
  "ready_to_process": false
}
```

---

#### POST `/api/v1/analyses/{analysis_id}/process`
Start analysis processing.

**Request:**
```json
{
  "validation_id": "uuid-here",
  "exclude_invalid_rows": true
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "uuid-here",
  "status": "processing",
  "estimated_duration_seconds": 45,
  "progress_url": "/api/v1/analyses/{analysis_id}/progress/{job_id}"
}
```

---

#### GET `/api/v1/analyses/{analysis_id}/progress/{job_id}`
Get processing progress (Server-Sent Events or polling).

**Response (200 OK):**
```json
{
  "job_id": "uuid-here",
  "status": "processing",
  "progress_percent": 50,
  "current_step": "analyzing_economic_nexus",
  "steps_completed": [
    "data_validated",
    "physical_nexus_processed"
  ],
  "steps_remaining": [
    "analyzing_economic_nexus",
    "calculating_liability",
    "generating_report"
  ],
  "estimated_seconds_remaining": 20
}
```

**Status values:**
- `queued` - In queue, not started
- `processing` - Currently running
- `completed` - Successfully finished
- `failed` - Error occurred
- `partial` - Completed with warnings

---

### 2.4 Screen 4: Results Dashboard Endpoints

#### GET `/api/v1/analyses/{analysis_id}/results/summary`
Get high-level summary for dashboard.

**Response (200 OK):**
```json
{
  "analysis_id": "uuid-here",
  "company_name": "ACME Corporation",
  "period_start": "2021-01-01",
  "period_end": "2024-12-31",
  "status": "completed",
  "completed_at": "2025-11-03T10:15:00Z",
  "summary": {
    "total_states_analyzed": 50,
    "states_with_nexus": 15,
    "states_approaching_threshold": 3,
    "states_no_nexus": 32,
    "total_estimated_liability": 241397.00,
    "total_revenue": 15234567.89,
    "confidence_level": "high",
    "manual_review_required": 2
  },
  "nexus_breakdown": {
    "physical_nexus": 3,
    "economic_nexus_only": 12,
    "no_nexus": 35
  },
  "top_states_by_liability": [
    {
      "state_code": "CA",
      "state_name": "California",
      "estimated_liability": 161695.00,
      "nexus_status": "has_nexus"
    },
    {
      "state_code": "FL",
      "state_name": "Florida",
      "estimated_liability": 58456.00,
      "nexus_status": "has_nexus"
    }
  ],
  "approaching_threshold": [
    {
      "state_code": "GA",
      "state_name": "Georgia",
      "revenue": 98450.00,
      "threshold": 100000.00,
      "percent_of_threshold": 98.45
    }
  ]
}
```

---

#### GET `/api/v1/analyses/{analysis_id}/results/map`
Get data for US map visualization.

**Response (200 OK):**
```json
{
  "states": [
    {
      "state_code": "CA",
      "nexus_status": "has_nexus",
      "nexus_type": "physical_and_economic",
      "revenue": 2745000.00,
      "threshold": 500000.00,
      "liability": 161695.00,
      "confidence": "high",
      "color": "red"
    },
    {
      "state_code": "GA",
      "nexus_status": "approaching",
      "revenue": 98450.00,
      "threshold": 100000.00,
      "liability": 0,
      "confidence": "high",
      "color": "yellow"
    }
  ]
}
```

---

### 2.5 Screen 5: State-by-State Table Endpoints

#### GET `/api/v1/analyses/{analysis_id}/results/states`
Get detailed state-by-state results.

**Query Parameters:**
- `filter_nexus_status` (optional): `has_nexus`, `approaching`, `no_nexus`
- `filter_confidence` (optional): `high`, `medium`, `low`
- `sort_by` (optional): `state`, `liability`, `revenue`, `confidence`
- `sort_order` (optional): `asc`, `desc`
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 50)

**Response (200 OK):**
```json
{
  "total_count": 50,
  "page": 1,
  "per_page": 50,
  "states": [
    {
      "state_code": "CA",
      "state_name": "California",
      "nexus_status": "has_nexus",
      "nexus_type": "physical_and_economic",
      "nexus_date": "2020-06-01",
      "revenue_total": 2745000.00,
      "revenue_direct": 1647000.00,
      "revenue_marketplace": 1098000.00,
      "threshold": 500000.00,
      "threshold_percent": 549.0,
      "estimated_liability": 161695.00,
      "confidence_level": "high",
      "flags": [],
      "registration_status": "registered",
      "registration_date": "2020-06-01"
    }
  ]
}
```

---

### 2.6 Screen 6: State Detail Endpoints

#### GET `/api/v1/analyses/{analysis_id}/results/states/{state_code}`
Get complete detail for a single state.

**Response (200 OK):**
```json
{
  "state_code": "CA",
  "state_name": "California",
  "nexus_determination": {
    "status": "has_nexus",
    "nexus_types": ["physical", "economic"],
    "nexus_date": "2020-06-01",
    "physical_nexus": {
      "has_physical_presence": true,
      "types": ["office"],
      "established_date": "2020-06-01",
      "still_active": true
    },
    "economic_nexus": {
      "threshold_type": "revenue",
      "threshold_amount": 500000.00,
      "actual_revenue": 2745000.00,
      "threshold_percent": 549.0,
      "date_triggered": "2020-03-15"
    },
    "marketplace_impact": {
      "marketplace_sales": 1098000.00,
      "counts_toward_nexus": true,
      "excluded_from_liability": true,
      "reason": "CA requires marketplace facilitators to collect tax"
    }
  },
  "sales_breakdown": {
    "total_sales": 2745000.00,
    "direct_sales": 1647000.00,
    "marketplace_sales": 1098000.00,
    "by_year": [
      {"year": 2021, "sales": 645000.00},
      {"year": 2022, "sales": 712000.00},
      {"year": 2023, "sales": 689000.00},
      {"year": 2024, "sales": 699000.00}
    ],
    "taxable_sales": 1647000.00
  },
  "tax_rates": {
    "state_rate": 7.25,
    "average_local_rate": 1.73,
    "combined_rate": 8.98,
    "note": "Actual local rates vary by destination. This is statewide average."
  },
  "liability_estimate": {
    "base_tax": 147901.00,
    "interest": 11093.00,
    "penalties": 2701.00,
    "total_liability": 161695.00,
    "interest_details": {
      "rate_percent": 7.5,
      "method": "simple",
      "years_calculated": 3
    },
    "penalty_details": {
      "late_filing_percent": 10.0,
      "late_filing_amount": 1479.00,
      "late_payment_percent": negligence",
      "late_payment_amount": 1022.00
    },
    "calculation_breakdown": [
      {
        "year": 2021,
        "sales": 645000.00,
        "tax": 57921.00,
        "interest_years": 4,
        "interest": 17376.00
      }
    ]
  },
  "compliance": {
    "registration_required": true,
    "registration_status": "registered",
    "registration_date": "2020-06-01",
    "permit_number": "SR-CA-123456",
    "filing_frequency": "quarterly",
    "next_filing_due": "2026-01-31",
    "vda_opportunity": {
      "available": true,
      "potential_penalty_reduction": "significant",
      "note": "VDA may reduce penalties to 0-5%"
    }
  },
  "confidence_assessment": {
    "overall_confidence": "high",
    "factors": [
      {"factor": "Clear economic nexus rules", "status": "positive"},
      {"factor": "Physical presence confirmed", "status": "positive"},
      {"factor": "Marketplace rules straightforward", "status": "positive"},
      {"factor": "No special product categories", "status": "positive"},
      {"factor": "Registration date confirmed", "status": "positive"}
    ],
    "manual_review_required": false,
    "flags": []
  }
}
```

---

### 2.7 Screen 7: Export & Report Endpoints

#### POST `/api/v1/analyses/{analysis_id}/reports/generate`
Generate PDF report.

**Request:**
```json
{
  "report_type": "executive_summary",
  "states_to_include": "nexus_only",
  "sections": [
    "executive_summary",
    "nexus_determination",
    "liability_estimates",
    "calculation_methodology",
    "compliance_recommendations"
  ],
  "branding": {
    "firm_name": "Smith & Associates CPA",
    "logo_url": "https://storage.supabase.co/logo.png"
  }
}
```

**Response (202 Accepted):**
```json
{
  "report_id": "uuid-here",
  "status": "generating",
  "estimated_seconds": 10,
  "progress_url": "/api/v1/analyses/{analysis_id}/reports/{report_id}/progress"
}
```

---

#### GET `/api/v1/analyses/{analysis_id}/reports/{report_id}`
Get report status and download URL.

**Response (200 OK):**
```json
{
  "report_id": "uuid-here",
  "status": "completed",
  "file_name": "ACME-Corporation-Nexus-Analysis-2021-2024.pdf",
  "file_size_bytes": 2621440,
  "page_count": 7,
  "download_url": "https://storage.supabase.co/signed-url-here",
  "download_expires_at": "2025-11-04T10:00:00Z",
  "generated_at": "2025-11-03T10:30:00Z"
}
```

---

#### GET `/api/v1/analyses/{analysis_id}/export/excel`
Export results to Excel.

**Response (200 OK):**
Returns Excel file (.xlsx) with multiple worksheets:
- Summary
- State-by-State Results
- Detailed Calculations
- Raw Transaction Data (optional)

---

#### GET `/api/v1/analyses/{analysis_id}/export/csv`
Export results to CSV.

**Response (200 OK):**
Returns flattened CSV of all state results.

---

#### GET `/api/v1/analyses/{analysis_id}/export/json`
Export results as JSON for API integrations.

**Response (200 OK):**
Returns complete JSON structure of all results.

---

### 2.8 Dashboard & Analysis Management Endpoints

#### GET `/api/v1/analyses`
List all analyses for current user.

**Query Parameters:**
- `status` (optional): Filter by status
- `sort_by` (optional): `created_at`, `updated_at`, `company_name`
- `sort_order` (optional): `asc`, `desc`
- `page`, `per_page` (pagination)

**Response (200 OK):**
```json
{
  "total_count": 15,
  "page": 1,
  "per_page": 10,
  "analyses": [
    {
      "analysis_id": "uuid-here",
      "company_name": "ACME Corporation",
      "status": "completed",
      "created_at": "2025-11-03T10:00:00Z",
      "updated_at": "2025-11-03T10:30:00Z",
      "completed_at": "2025-11-03T10:15:00Z",
      "retention_period": "90_days",
      "auto_delete_at": "2026-02-01T10:00:00Z",
      "states_with_nexus": 15,
      "total_liability": 241397.00
    }
  ]
}
```

---

#### DELETE `/api/v1/analyses/{analysis_id}`
Delete analysis and all associated data.

**Response (204 No Content)**

---

#### PATCH `/api/v1/analyses/{analysis_id}/retention`
Update retention period.

**Request:**
```json
{
  "retention_period": "1_year"
}
```

**Response (200 OK):**
```json
{
  "analysis_id": "uuid-here",
  "retention_period": "1_year",
  "auto_delete_at": "2026-11-03T10:00:00Z"
}
```

---

### 2.9 User & Settings Endpoints

#### GET `/api/v1/user/profile`
Get current user profile.

**Response (200 OK):**
```json
{
  "user_id": "uuid-here",
  "email": "user@example.com",
  "firm_name": "Smith & Associates CPA",
  "created_at": "2025-01-15T10:00:00Z",
  "subscription_status": "active",
  "analyses_count": 15,
  "storage_used_mb": 245
}
```

---

#### PATCH `/api/v1/user/settings`
Update user settings.

**Request:**
```json
{
  "firm_name": "Smith & Associates CPA",
  "default_retention_period": "90_days",
  "email_notifications": true
}
```

**Response (200 OK):**
```json
{
  "updated_at": "2025-11-03T10:00:00Z"
}
```

---

## 3. Authentication & Authorization

### 3.1 Authentication Flow

**Technology:** Supabase Auth (JWT-based)

**Supported Methods (MVP):**
- Email + Password
- Magic Link (email)
- (Future: Google OAuth, Microsoft OAuth)

**Authentication Flow:**

```
1. User submits email/password to Supabase Auth
   ↓
2. Supabase returns JWT access token + refresh token
   ↓
3. Frontend stores tokens in httpOnly cookies (via Next.js API routes)
   ↓
4. All API requests include JWT in Authorization header
   ↓
5. FastAPI validates JWT with Supabase public key
   ↓
6. Extract user_id from JWT claims
   ↓
7. Database RLS policies enforce data access
```

---

### 3.2 Token Management

**Access Token:**
- **Lifetime:** 1 hour
- **Storage:** httpOnly cookie (secure, sameSite)
- **Renewal:** Automatic via refresh token

**Refresh Token:**
- **Lifetime:** 30 days
- **Storage:** httpOnly cookie (secure, sameSite)
- **Usage:** Refresh access token when expired

**Implementation (Next.js Middleware):**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')

  if (!token || isTokenExpired(token)) {
    const refreshToken = request.cookies.get('sb-refresh-token')
    if (refreshToken) {
      const newTokens = await refreshAccessToken(refreshToken)
      // Set new cookies and continue
    } else {
      // Redirect to login
      return NextResponse.redirect('/login')
    }
  }

  return NextResponse.next()
}
```

---

### 3.3 Authorization Strategy

**Row Level Security (RLS):**
All database access controlled by Supabase RLS policies (already defined in migrations).

**Policy Enforcement:**
```sql
-- Example: User can only see their own analyses
CREATE POLICY "Users can view own analyses"
ON analyses
FOR SELECT
USING (auth.uid() = user_id);
```

**Authorization Levels:**
- **User:** Can create/view/edit/delete their own analyses
- **Admin (Future):** Can view all analyses for monitoring/support

**FastAPI Authorization Middleware:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Validate JWT token and return user_id.
    """
    token = credentials.credentials
    try:
        payload = verify_jwt(token)  # Validate with Supabase public key
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

---

### 3.4 Session Management

**Session Duration:** 30 days (refresh token lifetime)

**Logout:**
- Clear cookies
- Revoke refresh token in Supabase
- Redirect to login

**Session Persistence:**
- Auto-refresh on page load if token expired
- Silent refresh in background before expiration
- Warn user before session expires (29 days)

---

## 4. Frontend Architecture

### 4.1 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3
- **Component Library:** shadcn/ui
- **State Management:** Zustand
- **Form Handling:** React Hook Form + Zod validation
- **API Client:** Axios with interceptors
- **File Upload:** React Dropzone
- **Data Visualization:** Recharts (for charts), react-simple-maps (for US map)

---

### 4.2 Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── analyses/
│   │   │   ├── page.tsx                    # Analysis list
│   │   │   ├── [id]/
│   │   │   │   ├── setup/page.tsx          # Screen 1
│   │   │   │   ├── upload/page.tsx         # Screen 2
│   │   │   │   ├── mapping/page.tsx        # Screen 3
│   │   │   │   ├── results/page.tsx        # Screen 4
│   │   │   │   ├── states/page.tsx         # Screen 5
│   │   │   │   ├── states/[state]/page.tsx # Screen 6
│   │   │   │   └── export/page.tsx         # Screen 7
│   │   │   └── new/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── refresh/route.ts
│   │   └── [...all proxy routes to backend]
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                                  # shadcn/ui components
│   ├── analyses/
│   │   ├── SetupForm.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DataMapping.tsx
│   │   ├── ResultsDashboard.tsx
│   │   ├── StateTable.tsx
│   │   ├── StateDetail.tsx
│   │   └── ReportGenerator.tsx
│   ├── charts/
│   │   ├── USMap.tsx
│   │   ├── SummaryCards.tsx
│   │   └── LiabilityChart.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts                        # Axios instance with interceptors
│   │   ├── analyses.ts                      # API functions for analyses
│   │   └── auth.ts                          # Auth-related API calls
│   ├── stores/
│   │   ├── authStore.ts                     # Zustand store for auth state
│   │   └── analysisStore.ts                 # Zustand store for current analysis
│   ├── utils/
│   │   ├── validation.ts                    # Zod schemas
│   │   └── formatting.ts                    # Number/date formatting
│   └── hooks/
│       ├── useAuth.ts
│       ├── useAnalysis.ts
│       └── useUpload.ts
└── public/
    ├── templates/
    │   └── csv-template.csv
    └── images/
```

---

### 4.3 State Management Strategy

**Global State (Zustand):**

```typescript
// lib/stores/authStore.ts
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

// lib/stores/analysisStore.ts
interface AnalysisState {
  currentAnalysis: Analysis | null
  uploadProgress: number
  processingStatus: ProcessingStatus | null
  results: AnalysisResults | null

  setCurrentAnalysis: (analysis: Analysis) => void
  updateUploadProgress: (progress: number) => void
  setProcessingStatus: (status: ProcessingStatus) => void
  loadResults: (analysisId: string) => Promise<void>
}
```

**Local State:**
- Form state: React Hook Form
- Component UI state: useState
- Derived/computed values: useMemo

---

### 4.4 Routing Strategy

**Protected Routes:**
All routes under `/analyses` require authentication.

**Middleware Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return NextResponse.next()
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

**Navigation Flow:**
```
Login → Dashboard (Analysis List) → New Analysis →
Screen 1 (Setup) → Screen 2 (Upload) → Screen 3 (Mapping) →
Screen 4 (Results) → Screen 5 (State Table) → Screen 6 (State Detail) →
Screen 7 (Export)
```

---

### 4.5 Form Validation

**Technology:** Zod schemas + React Hook Form

**Example Schema:**
```typescript
// lib/utils/validation.ts
import { z } from 'zod'

export const setupFormSchema = z.object({
  company_name: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name too long"),
  period_start: z.string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  period_end: z.string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  business_type: z.enum(['product_sales', 'digital_products', 'mixed']),
  retention_period: z.enum(['delete_immediate', '90_days', '1_year']),
  notes: z.string().optional()
}).refine((data) => {
  const start = new Date(data.period_start)
  const end = new Date(data.period_end)
  return start < end
}, {
  message: "End date must be after start date",
  path: ["period_end"]
})

// Usage in component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(setupFormSchema)
})
```

---

### 4.6 Error Handling

**Error Boundary:**
Catch React errors and display fallback UI.

**API Error Handling:**
```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      return refreshTokenAndRetry(error)
    }

    // Show user-friendly error message
    const message = error.response?.data?.detail || 'An error occurred'
    toast.error(message)

    return Promise.reject(error)
  }
)
```

**User-Facing Error Messages:**
- **400:** "Please check your input and try again"
- **401:** "Your session has expired. Please log in again"
- **403:** "You don't have permission to access this resource"
- **404:** "The requested resource was not found"
- **422:** Specific validation errors from backend
- **500:** "Something went wrong on our end. Please try again later"

---

## 5. Backend Architecture

### 5.1 Technology Stack

- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy (with asyncio support)
- **Database Driver:** asyncpg (PostgreSQL async driver)
- **CSV Processing:** pandas + openpyxl
- **PDF Generation:** WeasyPrint or ReportLab
- **Task Queue:** FastAPI Background Tasks (MVP) → Celery (future)
- **Validation:** Pydantic models
- **Testing:** pytest + pytest-asyncio

---

### 5.2 Project Structure

```
backend/
├── app/
│   ├── main.py                              # FastAPI app initialization
│   ├── config.py                            # Settings (env vars)
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── analyses.py                  # Analyses endpoints
│   │   │   ├── upload.py                    # File upload endpoints
│   │   │   ├── validation.py                # Data validation endpoints
│   │   │   ├── processing.py                # Processing job endpoints
│   │   │   ├── results.py                   # Results endpoints
│   │   │   ├── reports.py                   # Report generation endpoints
│   │   │   └── users.py                     # User endpoints
│   │   └── deps.py                          # Dependency injection
│   ├── core/
│   │   ├── auth.py                          # JWT validation
│   │   ├── security.py                      # Security utilities
│   │   └── supabase.py                      # Supabase client
│   ├── models/
│   │   ├── analysis.py                      # SQLAlchemy models
│   │   ├── nexus.py
│   │   ├── state_rules.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── analysis.py                      # Pydantic schemas for API
│   │   ├── upload.py
│   │   ├── validation.py
│   │   └── results.py
│   ├── services/
│   │   ├── csv_processor.py                 # CSV parsing & validation
│   │   ├── nexus_calculator.py              # Nexus determination logic
│   │   ├── liability_calculator.py          # Tax liability calculations
│   │   ├── report_generator.py              # PDF generation
│   │   └── state_rules_service.py           # State rules queries
│   ├── tasks/
│   │   ├── processing.py                    # Background processing tasks
│   │   └── cleanup.py                       # Auto-delete expired analyses
│   └── utils/
│       ├── date_parser.py
│       ├── state_validator.py
│       └── currency_formatter.py
├── tests/
│   ├── api/
│   ├── services/
│   └── conftest.py
├── alembic/                                 # Database migrations (if needed)
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

### 5.3 API Router Organization

```python
# app/main.py
from fastapi import FastAPI
from app.api.v1 import analyses, upload, validation, processing, results, reports, users

app = FastAPI(title="Nexus Check API", version="1.0.0")

# Include routers
app.include_router(analyses.router, prefix="/api/v1/analyses", tags=["analyses"])
app.include_router(upload.router, prefix="/api/v1/analyses", tags=["upload"])
app.include_router(validation.router, prefix="/api/v1/analyses", tags=["validation"])
app.include_router(processing.router, prefix="/api/v1/analyses", tags=["processing"])
app.include_router(results.router, prefix="/api/v1/analyses", tags=["results"])
app.include_router(reports.router, prefix="/api/v1/analyses", tags=["reports"])
app.include_router(users.router, prefix="/api/v1/user", tags=["users"])

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

### 5.4 Database Access Pattern

**Use Supabase Client (not direct SQL):**

```python
# app/core/supabase.py
from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY  # Server-side only
)

# app/services/analysis_service.py
async def create_analysis(user_id: str, data: AnalysisCreate) -> Analysis:
    """
    Create new analysis in database.
    RLS policies automatically enforce user access.
    """
    result = supabase.table('analyses').insert({
        'user_id': user_id,
        'company_name': data.company_name,
        'period_start': data.period_start,
        'period_end': data.period_end,
        'business_type': data.business_type,
        'retention_period': data.retention_period,
        'status': 'setup'
    }).execute()

    return Analysis(**result.data[0])
```

**Why Supabase Client:**
- RLS policies automatically enforced
- No need to manage database connections
- Built-in retry logic
- Real-time subscriptions (future feature)

---

### 5.5 Business Logic Services

#### CSV Processing Service

```python
# app/services/csv_processor.py
import pandas as pd
from typing import Dict, List, Tuple

class CSVProcessor:
    def parse_and_validate(
        self,
        file_path: str,
        column_mappings: Dict[str, str],
        date_format: str
    ) -> Tuple[pd.DataFrame, List[Dict]]:
        """
        Parse CSV, apply mappings, validate data.
        Returns: (valid_df, errors_list)
        """
        df = pd.read_csv(file_path)

        # Apply column mappings
        df = df.rename(columns=column_mappings)

        # Validate required columns
        required = ['transaction_date', 'customer_state', 'revenue_amount', 'sales_channel']
        missing = [col for col in required if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        # Parse dates
        df['transaction_date'] = pd.to_datetime(
            df['transaction_date'],
            format=date_format,
            errors='coerce'
        )

        # Validate state codes
        valid_states = self._get_valid_state_codes()
        invalid_states = df[~df['customer_state'].isin(valid_states)]

        # Collect errors
        errors = []
        for idx, row in invalid_states.iterrows():
            errors.append({
                'row': int(idx) + 2,  # +2 for header and 0-index
                'column': 'customer_state',
                'value': row['customer_state'],
                'message': f"Invalid state code"
            })

        # Remove invalid rows
        df_valid = df[df['customer_state'].isin(valid_states)]

        return df_valid, errors
```

---

#### Nexus Calculation Service

```python
# app/services/nexus_calculator.py
from datetime import date
from typing import Dict, List

class NexusCalculator:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def determine_nexus(
        self,
        state_code: str,
        sales_by_channel: Dict[str, float],
        physical_presence: bool,
        period_start: date,
        period_end: date
    ) -> Dict:
        """
        Determine if nexus exists for a state.
        """
        # Get state rules
        rules = self._get_state_rules(state_code)

        # Check physical nexus
        has_physical = physical_presence

        # Check economic nexus
        economic_threshold = rules['economic_nexus_threshold']
        marketplace_rules = rules['marketplace_facilitator_rules']

        # Calculate revenue that counts toward threshold
        revenue_toward_threshold = sales_by_channel['direct']
        if marketplace_rules['counts_toward_nexus']:
            revenue_toward_threshold += sales_by_channel['marketplace']

        has_economic = revenue_toward_threshold >= economic_threshold

        # Determine nexus date
        nexus_date = None
        if has_physical:
            nexus_date = period_start  # Simplified, should check actual date
        elif has_economic:
            nexus_date = self._calculate_economic_nexus_date(
                state_code, sales_by_channel, economic_threshold
            )

        return {
            'state_code': state_code,
            'has_nexus': has_physical or has_economic,
            'nexus_type': self._get_nexus_type(has_physical, has_economic),
            'nexus_date': nexus_date,
            'threshold': economic_threshold,
            'revenue_toward_threshold': revenue_toward_threshold,
            'threshold_percent': (revenue_toward_threshold / economic_threshold) * 100
        }
```

---

#### Liability Calculation Service

```python
# app/services/liability_calculator.py
from decimal import Decimal
from datetime import date

class LiabilityCalculator:
    def calculate_liability(
        self,
        state_code: str,
        taxable_sales: Decimal,
        nexus_date: date,
        current_date: date
    ) -> Dict:
        """
        Calculate estimated tax liability.
        """
        # Get tax rates
        rates = self._get_tax_rates(state_code)
        state_rate = Decimal(rates['state_rate']) / 100
        local_rate = Decimal(rates['avg_local_rate']) / 100
        combined_rate = state_rate + local_rate

        # Calculate base tax
        base_tax = taxable_sales * combined_rate

        # Calculate interest
        interest_rate = self._get_interest_rate(state_code)
        years_since_nexus = (current_date - nexus_date).days / 365.25
        interest = base_tax * (Decimal(interest_rate) / 100) * Decimal(years_since_nexus)

        # Calculate penalties
        penalties = self._calculate_penalties(state_code, base_tax)

        # Total liability
        total_liability = base_tax + interest + penalties['total']

        return {
            'state_code': state_code,
            'taxable_sales': float(taxable_sales),
            'tax_rates': {
                'state_rate': float(state_rate * 100),
                'avg_local_rate': float(local_rate * 100),
                'combined_rate': float(combined_rate * 100)
            },
            'base_tax': float(base_tax),
            'interest': {
                'amount': float(interest),
                'rate': interest_rate,
                'years': float(years_since_nexus)
            },
            'penalties': penalties,
            'total_liability': float(total_liability)
        }
```

---

### 5.6 Background Processing

**MVP Approach:** FastAPI Background Tasks (simple, no external dependencies)

```python
# app/api/v1/processing.py
from fastapi import BackgroundTasks
from app.services.nexus_calculator import NexusCalculator

@router.post("/{analysis_id}/process")
async def process_analysis(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Start background processing of analysis.
    """
    # Validate ownership
    analysis = await get_analysis(analysis_id, user_id)

    # Queue background task
    background_tasks.add_task(
        process_analysis_task,
        analysis_id=analysis_id,
        user_id=user_id
    )

    return {
        "job_id": analysis_id,
        "status": "processing"
    }

# app/tasks/processing.py
async def process_analysis_task(analysis_id: str, user_id: str):
    """
    Background task to process analysis.
    """
    try:
        # Update status
        await update_analysis_status(analysis_id, 'processing')

        # Load CSV data
        transactions = await load_transactions(analysis_id)

        # Process each state
        for state_code in get_states_with_activity(transactions):
            # Determine nexus
            nexus_result = calculate_nexus(state_code, transactions)
            await save_nexus_determination(analysis_id, nexus_result)

            # Calculate liability if nexus exists
            if nexus_result['has_nexus']:
                liability = calculate_liability(state_code, nexus_result)
                await save_liability_estimate(analysis_id, liability)

        # Mark complete
        await update_analysis_status(analysis_id, 'completed')

    except Exception as e:
        # Mark failed, log error
        await update_analysis_status(analysis_id, 'failed')
        await log_error(analysis_id, str(e))
```

**Future Enhancement:** Celery + Redis for production-scale processing

---

### 5.7 PDF Report Generation

**Technology:** WeasyPrint (HTML to PDF)

```python
# app/services/report_generator.py
from weasyprint import HTML
from jinja2 import Template
from pathlib import Path

class ReportGenerator:
    def generate_pdf(
        self,
        analysis_id: str,
        report_type: str,
        data: Dict
    ) -> str:
        """
        Generate PDF report from template.
        Returns: file_path to generated PDF
        """
        # Load template
        template_path = Path(f"templates/reports/{report_type}.html")
        with open(template_path) as f:
            template = Template(f.read())

        # Render HTML
        html_content = template.render(data=data)

        # Generate PDF
        output_path = f"/tmp/{analysis_id}-report.pdf"
        HTML(string=html_content).write_pdf(output_path)

        # Upload to Supabase Storage
        storage_path = await self._upload_to_storage(output_path, analysis_id)

        return storage_path
```

**Report Template Structure:**
```html
<!-- templates/reports/executive_summary.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Professional styling for PDF */
        @page { size: A4; margin: 1in; }
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 2em; }
        .summary-table { width: 100%; border-collapse: collapse; }
        /* ... more styles */
    </style>
</head>
<body>
    <div class="header">
        <h1>Nexus Analysis Report</h1>
        <p>{{ data.company_name }}</p>
        <p>{{ data.period_start }} - {{ data.period_end }}</p>
    </div>

    <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>States with Nexus: {{ data.states_with_nexus }}</p>
        <p>Total Estimated Liability: ${{ data.total_liability }}</p>
        <!-- ... more content -->
    </div>

    <!-- State-by-state details -->
    {% for state in data.states %}
    <div class="state-detail">
        <h3>{{ state.name }}</h3>
        <!-- ... state details -->
    </div>
    {% endfor %}
</body>
</html>
```

---

## 6. Data Flow Patterns

### 6.1 Analysis Creation Flow

```
User (Frontend)
    |
    | POST /api/v1/analyses
    |
    v
Next.js API Route (Auth Check)
    |
    | Forward with validated JWT
    |
    v
FastAPI Backend
    |
    | Validate JWT, extract user_id
    | Validate request body (Pydantic)
    |
    v
Supabase Database
    |
    | INSERT into analyses table
    | RLS policy enforces user_id match
    |
    v
Response
    |
    | 201 Created + analysis object
    |
    v
Frontend
    |
    | Store analysis_id in state
    | Navigate to upload screen
```

---

### 6.2 File Upload Flow

```
User (Frontend)
    |
    | Select CSV file
    |
    v
React Dropzone Component
    |
    | Validate file type/size
    | Show preview
    |
    v
POST /api/v1/analyses/{id}/upload
    |
    | multipart/form-data
    |
    v
FastAPI Backend
    |
    | Validate file
    | Save to temp directory
    | Parse CSV (pandas)
    | Detect columns
    | Generate preview
    | Upload to Supabase Storage
    |
    v
Supabase Storage
    |
    | Store file with RLS policies
    | Return signed URL
    |
    v
Database
    |
    | Save upload metadata
    |
    v
Response
    |
    | 202 Accepted + preview data
    |
    v
Frontend
    |
    | Display preview
    | Navigate to mapping screen
```

---

### 6.3 Processing Flow

```
User triggers processing
    |
    v
POST /api/v1/analyses/{id}/process
    |
    v
FastAPI Background Task
    |
    | Update status: 'processing'
    |
    +--> Load CSV from storage
    |
    +--> For each state:
         |
         +--> Aggregate transactions
         |
         +--> Call nexus_calculator
         |    |
         |    +--> Query state rules
         |    +--> Apply marketplace rules
         |    +--> Determine nexus
         |    +--> Save to nexus_determination table
         |
         +--> If nexus exists:
              |
              +--> Call liability_calculator
                   |
                   +--> Query tax rates
                   +--> Query interest/penalty rates
                   +--> Calculate liability
                   +--> Save to tax_liability_estimate table
    |
    +--> Update status: 'completed'
    |
    v
Frontend (polling or SSE)
    |
    | GET /api/v1/analyses/{id}/progress
    |
    v
Display results
```

---

## 7. Error Handling Strategy

### 7.1 Error Types & HTTP Status Codes

**Client Errors (4xx):**
- `400 Bad Request` - Malformed request, invalid data format
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Validation failed (business logic)
- `429 Too Many Requests` - Rate limit exceeded

**Server Errors (5xx):**
- `500 Internal Server Error` - Unexpected error
- `502 Bad Gateway` - Upstream service (Supabase) unavailable
- `503 Service Unavailable` - Service temporarily down
- `504 Gateway Timeout` - Upstream timeout

---

### 7.2 Error Response Format

**Standard Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid state code",
    "details": {
      "field": "customer_state",
      "value": "XX",
      "suggestion": "Use 2-letter state codes (e.g., CA, NY)"
    },
    "timestamp": "2025-11-03T10:00:00Z",
    "request_id": "req-uuid-here"
  }
}
```

**Validation Error (422):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data validation failed",
    "details": [
      {
        "row": 23,
        "column": "customer_state",
        "value": "XX",
        "message": "Invalid state code"
      },
      {
        "row": 45,
        "column": "revenue_amount",
        "value": "-100",
        "message": "Revenue cannot be negative"
      }
    ],
    "timestamp": "2025-11-03T10:00:00Z",
    "request_id": "req-uuid-here"
  }
}
```

---

### 7.3 Frontend Error Handling

**Toast Notifications:**
For non-critical errors (auto-dismiss after 5 seconds).

**Error Modals:**
For critical errors requiring user action.

**Inline Form Errors:**
For validation errors on form fields.

**Error Recovery Actions:**
- **Upload failed:** Retry upload or select different file
- **Processing failed:** Retry processing or contact support
- **Network error:** Retry request automatically (with exponential backoff)
- **Token expired:** Refresh token automatically and retry

**Example Error Handler:**
```typescript
// lib/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const errorCode = error.response?.data?.error?.code

    // Token expired - refresh and retry
    if (status === 401 && errorCode === 'TOKEN_EXPIRED') {
      try {
        await refreshToken()
        return apiClient.request(error.config)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        router.push('/login')
      }
    }

    // Network error - retry with exponential backoff
    if (!error.response) {
      return retryWithBackoff(error.config)
    }

    // Show user-friendly error
    const message = error.response?.data?.error?.message || 'An error occurred'
    toast.error(message)

    return Promise.reject(error)
  }
)
```

---

## 8. Performance Requirements

### 8.1 Response Time Targets

| Endpoint | Target (p95) | Max Acceptable |
|----------|--------------|----------------|
| Authentication | < 500ms | 1s |
| Create analysis | < 300ms | 1s |
| Upload CSV (50MB) | < 30s | 60s |
| Validate data | < 5s | 15s |
| Process analysis (10k txns) | < 60s | 120s |
| Get results summary | < 500ms | 2s |
| Get state detail | < 300ms | 1s |
| Generate PDF | < 10s | 30s |
| Download file | < 5s | 15s |

---

### 8.2 Optimization Strategies

**Database:**
- Use indexes on frequently queried columns (already defined in schema)
- Minimize joins (denormalize where appropriate)
- Use database views for complex queries
- Cache state rules in memory (rarely change)

**API:**
- Compress responses (gzip)
- Implement pagination for large result sets
- Use ETags for caching
- CDN for static assets (Vercel Edge Network)

**File Processing:**
- Stream large CSV files (don't load entirely in memory)
- Process in chunks (10,000 rows at a time)
- Use efficient data structures (pandas DataFrames)
- Parallel processing for multiple states

**Frontend:**
- Code splitting (Next.js automatic)
- Image optimization (Next.js Image component)
- Lazy loading for large tables
- Virtual scrolling for long lists
- Debounce search inputs

---

### 8.3 Scalability Considerations

**Current MVP (10-50 users):**
- Single FastAPI instance on Railway
- Supabase free tier (500MB database, 1GB storage)
- No caching layer needed

**Growth Phase (50-500 users):**
- Scale to 2-3 FastAPI instances (Railway horizontal scaling)
- Supabase Pro tier (8GB database, 100GB storage)
- Redis cache for state rules and frequent queries
- Upgrade to Celery for background processing

**Scale Phase (500+ users):**
- Auto-scaling FastAPI instances (Kubernetes)
- Database read replicas for query optimization
- Separate file processing service
- CDN for file downloads
- Rate limiting and request throttling

---

## 9. Security Considerations

### 9.1 Authentication Security

**Token Security:**
- JWT tokens stored in httpOnly cookies (not localStorage)
- Secure flag enabled (HTTPS only)
- SameSite=Strict to prevent CSRF
- Short-lived access tokens (1 hour)
- Refresh tokens rotated on use

**Password Requirements:**
- Minimum 12 characters
- Must include uppercase, lowercase, number, special char
- Password strength indicator
- Compromised password detection (HaveIBeenPwned API)

**Brute Force Protection:**
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Account lockout after 10 failed attempts
- CAPTCHA after 3 failed attempts

---

### 9.2 Data Security

**Encryption:**
- **At Rest:** AES-256 encryption (Supabase default)
- **In Transit:** TLS 1.3 for all connections
- **Backups:** Encrypted with separate keys

**Row Level Security:**
- All tables use RLS policies (already implemented)
- Users can only access their own data
- No data leakage between users

**File Security:**
- Uploaded files stored with RLS policies
- Signed URLs with expiration (15 minutes)
- No direct file access
- Virus scanning (future enhancement)

**PII Handling:**
- No SSN, credit cards, or sensitive PII stored
- Company names and financial data encrypted at rest
- Auto-deletion based on retention policy
- GDPR compliance ready (user-controlled deletion)

---

### 9.3 API Security

**Input Validation:**
- All inputs validated with Pydantic models
- SQL injection prevention (parameterized queries via Supabase client)
- XSS prevention (sanitize user inputs)
- File upload validation (type, size, content)

**Rate Limiting:**
```python
# Future implementation with slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/analyses")
@limiter.limit("10/minute")  # 10 requests per minute
async def create_analysis(...):
    ...
```

**CORS Configuration:**
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://salt-tool.vercel.app",  # Production frontend
        "http://localhost:3000"  # Development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

---

### 9.4 Monitoring & Logging

**Application Logging:**
```python
# app/core/logging.py
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Analysis created", extra={
    "user_id": user_id,
    "analysis_id": analysis_id,
    "company_name": company_name
})
```

**Security Event Logging:**
- Failed login attempts
- Invalid token usage
- Unauthorized access attempts
- Data export events
- Account deletions

**Error Tracking:**
- Sentry for error monitoring (future)
- Log aggregation with Datadog or LogRocket (future)

---

## 10. Deployment Architecture

### 10.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Vercel)                                      │
│  ├─ Next.js App                                         │
│  ├─ CDN: Vercel Edge Network                           │
│  ├─ Auto-scaling                                        │
│  └─ SSL: Auto (Let's Encrypt)                          │
│                                                          │
│  Backend (Railway)                                      │
│  ├─ FastAPI App (Docker container)                     │
│  ├─ Auto-deploy from main branch                       │
│  ├─ Health checks                                       │
│  └─ SSL: Auto                                           │
│                                                          │
│  Database (Supabase)                                    │
│  ├─ PostgreSQL 15                                       │
│  ├─ Daily backups                                       │
│  ├─ Point-in-time recovery (7 days)                    │
│  └─ Connection pooling                                  │
│                                                          │
│  Storage (Supabase Storage)                             │
│  ├─ CSV files                                           │
│  ├─ Generated PDFs                                      │
│  ├─ RLS policies enforced                              │
│  └─ CDN: Supabase CDN                                   │
└─────────────────────────────────────────────────────────┘
```

---

### 10.2 Environment Configuration

**Frontend (.env.local):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_API_URL=https://api.salt-tool.railway.app

# Environment
NODE_ENV=production
```

**Backend (.env):**
```bash
# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS
ALLOWED_ORIGINS=https://salt-tool.vercel.app

# File Upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/tmp/uploads
```

---

### 10.3 CI/CD Pipeline

**Frontend (Vercel):**
```yaml
# Automatic deployment on push to main
# .vercel/project.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

**Backend (Railway):**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# railway.json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

---

### 10.4 Monitoring & Alerts

**Health Checks:**
- Frontend: Vercel automatic health monitoring
- Backend: Railway health check on `/health` endpoint every 60s
- Database: Supabase dashboard monitoring

**Uptime Monitoring:**
- UptimeRobot (free tier) - check every 5 minutes
- Alert via email/Slack on downtime

**Performance Monitoring (Future):**
- Vercel Analytics for frontend performance
- Railway metrics for backend
- Supabase monitoring dashboard

**Alerts (Future):**
- API error rate > 5%
- Response time p95 > 2s
- Database connections > 80%
- Storage > 80% capacity

---

### 10.5 Backup & Disaster Recovery

**Database Backups:**
- Automatic daily backups (Supabase)
- Point-in-time recovery up to 7 days
- Manual backup before major migrations

**Code Backups:**
- Git repository on GitHub (primary)
- Automatic deployment branches preserved

**Recovery Procedures:**
1. **Database corruption:** Restore from latest backup
2. **API downtime:** Railway auto-restarts on failure, manual rollback if needed
3. **Frontend issues:** Vercel instant rollback to previous deployment
4. **Data loss:** Restore from Supabase backup (RTO: < 1 hour)

---

### 10.6 Deployment Checklist

**Pre-Launch:**
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] State rules data populated (239 rows)
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Backup strategy tested
- [ ] Health checks passing
- [ ] Load testing completed (simulate 100 concurrent users)

**Launch Day:**
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Verify all integrations working
- [ ] Monitor error rates
- [ ] Test end-to-end flow

**Post-Launch:**
- [ ] Monitor performance metrics
- [ ] Set up alerts
- [ ] Document any issues
- [ ] Plan sprint 1 improvements

---

## 11. Development Workflow

### 11.1 Local Development Setup

**Prerequisites:**
- Node.js 18+
- Python 3.11+
- Git

**Frontend Setup:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with local API URL
npm run dev  # Runs on http://localhost:3000
```

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
uvicorn app.main:app --reload  # Runs on http://localhost:8000
```

**Database:**
Use hosted Supabase (dev project) - no local database needed.

---

### 11.2 Development Workflow

**Feature Development:**
1. Create feature branch from `main`
2. Develop locally with hot reload
3. Write tests
4. Run linters/formatters
5. Commit with conventional commits
6. Push and create PR
7. Review and merge to `main`
8. Auto-deploy to production

**Git Workflow:**
```bash
# Create feature branch
git checkout -b feature/state-detail-view

# Make changes, commit
git add .
git commit -m "feat: add state detail view with liability breakdown"

# Push and create PR
git push origin feature/state-detail-view
```

**Conventional Commits:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

### 11.3 Testing Strategy

**Frontend Testing:**
```bash
# Unit tests (Jest + React Testing Library)
npm run test

# E2E tests (Playwright) - future
npm run test:e2e
```

**Backend Testing:**
```bash
# Unit tests (pytest)
pytest tests/

# With coverage
pytest --cov=app tests/
```

**Test Coverage Goals:**
- Backend: > 80% code coverage
- Frontend: > 70% component coverage
- Critical paths: 100% (auth, payment, calculations)

---

### 11.4 Code Quality Tools

**Frontend:**
- **Linter:** ESLint
- **Formatter:** Prettier
- **Type Checker:** TypeScript strict mode

**Backend:**
- **Linter:** Ruff (fast Python linter)
- **Formatter:** Black
- **Type Checker:** mypy

**Pre-commit Hooks:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black

  - repo: local
    hooks:
      - id: eslint
        name: eslint
        entry: npm run lint
        language: system
        pass_filenames: false
```

---

## 12. Next Steps & Implementation Plan

### Phase 3 Complete - Ready for Phase 4: Development

**With this technical architecture defined, you're ready to start building:**

**Sprint 1: Data Upload & Validation (2-3 weeks)**
- Set up Next.js + FastAPI projects
- Implement authentication (Supabase Auth)
- Build Screens 1-3 (Setup, Upload, Mapping)
- CSV processing service
- Data validation engine

**Sprint 2: Physical Nexus & Processing (1-2 weeks)**
- Physical nexus form/import
- Background processing task
- Progress tracking

**Sprint 3: Calculation Engine (3-4 weeks)**
- Nexus determination logic
- Marketplace facilitator rules
- State rules integration
- Results storage

**Sprint 4: Liability Estimation (2-3 weeks)**
- Tax rate lookup
- Interest calculation
- Penalty estimation
- Multi-year aggregation

**Sprint 5: Results & Reports (2-3 weeks)**
- Screens 4-7 (Dashboard, Table, Detail, Export)
- US map visualization
- PDF generation
- Excel export

**Sprint 6: Polish & Testing (2-3 weeks)**
- Bug fixes
- Performance optimization
- User acceptance testing
- Documentation
- Deployment

---

## Appendix A: API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/analyses` | Create new analysis |
| GET | `/api/v1/analyses` | List all analyses |
| GET | `/api/v1/analyses/{id}` | Get analysis details |
| PATCH | `/api/v1/analyses/{id}` | Update analysis |
| DELETE | `/api/v1/analyses/{id}` | Delete analysis |
| POST | `/api/v1/analyses/{id}/upload` | Upload CSV |
| GET | `/api/v1/analyses/{id}/upload/{upload_id}` | Get upload status |
| POST | `/api/v1/analyses/{id}/validate` | Validate data |
| POST | `/api/v1/analyses/{id}/process` | Start processing |
| GET | `/api/v1/analyses/{id}/progress/{job_id}` | Get processing progress |
| GET | `/api/v1/analyses/{id}/results/summary` | Get results summary |
| GET | `/api/v1/analyses/{id}/results/map` | Get map data |
| GET | `/api/v1/analyses/{id}/results/states` | Get state table |
| GET | `/api/v1/analyses/{id}/results/states/{state}` | Get state detail |
| POST | `/api/v1/analyses/{id}/reports/generate` | Generate PDF |
| GET | `/api/v1/analyses/{id}/reports/{report_id}` | Get report status |
| GET | `/api/v1/analyses/{id}/export/excel` | Export Excel |
| GET | `/api/v1/analyses/{id}/export/csv` | Export CSV |
| GET | `/api/v1/analyses/{id}/export/json` | Export JSON |
| PATCH | `/api/v1/analyses/{id}/retention` | Update retention |
| GET | `/api/v1/user/profile` | Get user profile |
| PATCH | `/api/v1/user/settings` | Update settings |
| GET | `/api/v1/templates/csv` | Download template |
| GET | `/health` | Health check |

---

## Document Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2025-11-03 | Initial creation - Phase 3 architecture complete | Project Team |

---

**Status:** ✅ Phase 3 Complete - Ready for Phase 4 (Development)
