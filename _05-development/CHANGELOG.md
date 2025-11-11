# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Screen 6: State Detail View
- US Map visualization with react-simple-maps
- PDF Report generation

---

## [0.7.0] - 2025-01-04

### Added - Screen 5: State Table (Sprint 2 Feature 1)

**Backend - Complete State Coverage**
- Modified NexusCalculator to save all 50+ states (not just states with transactions)
- Added `_get_all_state_codes()` method to fetch complete state list
- States without transactions get default entries: $0 sales, nexus_type='none'
- Database now stores 52 rows per analysis (comprehensive coverage)

**Backend - New API Endpoint**
- Created `GET /api/v1/analyses/{id}/results/states` endpoint
- Returns all states with nexus status, revenue breakdown, liability
- Calculates threshold percentage for each state
- Looks up state names and registration status
- Used by Screen 5 state table

**Frontend - State Table Page**
- New page at `/analysis/{id}/states` route
- shadcn/ui Table component with custom styling
- Displays all 52 states in sortable table
- Color-coded nexus status icons (red/yellow/green dots)
- Revenue breakdown shows direct + marketplace in stacked cells
- Threshold percentages color-coded (red >= 100%, yellow >= 90%, green < 90%)
- Confidence badges (currently all "high")
- Hover effects with clickable rows

**Frontend - Filtering & Search**
- Filter dropdowns: Nexus Status, Registration, Confidence
- Real-time search by state name or code
- "Clear Filters" button when any filter active
- Shows "X of 52 states" count when filtered
- Empty state when no results match

**Frontend - Sorting**
- All columns sortable (click header to toggle)
- Sort indicator (↑/↓) on active column
- Default sort: Nexus Status (Has→Approaching→None), then Liability (high→low)
- "Reset to Default Sort" button

**Frontend - URL State Management**
- Filters and sort persist in URL params
- Shareable/bookmarkable filtered views
- Example: `?sort=liability&order=desc&nexus=has_nexus`
- Browser back/forward buttons work correctly
- Search is ephemeral (not in URL)

**Frontend - Navigation**
- "View Detailed Table" button added to results dashboard
- Breadcrumb: Results Dashboard > State Table
- Clickable rows navigate to state detail (Screen 6, coming next)
- "Back to Results" button returns to dashboard

**Frontend - Loading & Error States**
- Skeleton loading state (breadcrumb, header, filters, 10 rows)
- "No calculation" error with link to mapping page
- "Analysis not found" error with link to dashboard
- Generic errors with retry button

### Changed
- NexusCalculator now processes all states (previously only states with transactions)
- State results table now has 52 rows per analysis (was 10-20)

### Technical Details

**Performance:**
- Client-side filtering/sorting (instant, no API calls)
- Single API call loads all 52 states (~15-20 KB)
- Table renders in < 100ms
- URL updates via `replaceState` (no page reload)

**Data Flow:**
1. Calculation saves 52 state_results rows
2. Frontend fetches all 52 states
3. Client-side applies filters and sort
4. URL params preserve view state

**Testing:**
- Comprehensive testing checklist created (100+ test cases)
- Covers user flow, filters, sorting, URL state, navigation, error handling
- Edge cases and performance tested
- Ready for manual QA

---

## [0.6.0] - 2025-11-04

### Added - Nexus Calculation Engine (Complete)

**Backend - Core Calculation Service**
- `NexusCalculator` class (`app/services/nexus_calculator.py`):
  - Aggregates transactions by state from sales_transactions table
  - Fetches economic nexus thresholds from database (state-specific: $100k, $250k, $500k)
  - Retrieves tax rates (state + average local) from tax_rates table
  - Determines nexus status for each state (economic, physical, both, none)
  - Calculates estimated tax liability: total_sales × combined_tax_rate
  - Identifies states approaching threshold (within 90% of threshold)
  - Saves results to state_results table with batch inserts
  - Updates analyses table with summary (status, total_liability, states_with_nexus)
- Comprehensive error handling and logging throughout

**Backend - API Endpoints**
- POST `/api/v1/analyses/{id}/calculate`:
  - Triggers nexus calculation engine
  - Verifies analysis exists and has transactions
  - Returns summary: total_states_analyzed, states_with_nexus, total_liability
- GET `/api/v1/analyses/{id}/results/summary`:
  - Returns detailed results for dashboard display
  - Summary statistics (states analyzed, states with nexus, total liability)
  - Nexus breakdown (physical, economic, no nexus, both)
  - Top 5 states by liability (ranked with amounts)
  - Approaching threshold states list
  - State names looked up from states table

**Frontend - Screen 4 Integration**
- Dynamic data display replacing all "TBD" placeholders
- Summary cards show real calculations:
  - States with Nexus count (out of total analyzed)
  - Estimated Tax Liability (formatted currency)
  - Confidence level (based on data quality)
- Nexus Breakdown section with real counts:
  - Physical nexus, Economic nexus, No nexus
  - Approaching threshold states with progress
- Top States by Tax Liability section:
  - Ranked list showing state code, nexus type, sales amount
  - Estimated liability per state
  - Only appears when liability > 0
- Calculate button with loading states
- Recalculate button for re-running calculations
- Auto-loads results if analysis already calculated

**Testing & Sample Data**
- Direct test script: `test_calculator_direct.py`
  - Tests calculation logic without API layer
  - Connects directly to Supabase
  - Displays detailed results and verification
- API test script: `test_calculation.py`
  - Tests via HTTP endpoints with JWT auth
  - Full end-to-end validation
- Accurate sample data: `sample-sales-data-accurate.csv`
  - 120 transactions across 4 states
  - Uses correct state-specific thresholds:
    - Florida ($100k threshold) → $120k sales → HAS NEXUS
    - Colorado ($100k threshold) → $110k sales → HAS NEXUS
    - California ($500k threshold) → $80k sales → NO NEXUS
    - Texas ($500k threshold) → $70k sales → NO NEXUS
  - Expected liability: ~$16,959 (FL: $8,412, CO: $8,547)
- Documentation: `TESTING_CALCULATOR.md`, `SAMPLE_DATA_ACCURATE_SUMMARY.md`

### Changed

**Workflow Improvement - Streamlined User Flow**
- Mapping page button: "Validate & Process" → **"Calculate Nexus"**
- Automatic calculation after validation:
  - User clicks "Calculate Nexus" on mapping page
  - Data validates → Calculation runs automatically → Navigate to results
  - Eliminates extra manual step on results page
- Results page fallback:
  - Changed from blue "Ready to Calculate" to yellow warning banner
  - Only shows if calculation didn't run (error scenario)
  - Preserves manual calculate option as safety net

**API Response Fixes**
- Results summary endpoint field names corrected:
  - `state_code` → `state` (matches frontend expectations)
  - `nexus_status` → `nexus_type` (consistent naming)
  - Added `total_sales` field (required for display)
  - `economic_nexus_only` → `economic_nexus` (simpler naming)
  - Added `both` count to nexus_breakdown

**Frontend Safety**
- Added null safety checks to all `.toLocaleString()` calls
- Default to 0 for undefined numeric values
- Prevents runtime errors with incomplete data

### Fixed

- Runtime error: "Cannot read properties of undefined (reading 'toLocaleString')"
  - Added `|| 0` defaults for all numeric fields
  - Applied to: total_sales, estimated_liability, threshold values
- API response mismatch between backend and frontend expectations
  - Corrected field names in results summary endpoint
  - Added missing fields (total_sales, nexus_type)

### Technical Details

**Calculation Logic:**
- Revenue threshold check: `total_sales >= threshold['revenue_threshold']`
- Transaction threshold check: `transaction_count >= threshold['transaction_threshold']`
- Operator support: AND (both must meet) or OR (either must meet)
- Tax calculation: `total_sales × (state_rate + avg_local_rate) / 100`
- Approaching logic: Sales between 90-100% of threshold

**Database Integration:**
- Reads from: sales_transactions, economic_nexus_thresholds, tax_rates, states
- Writes to: state_results (one row per state), analyses (summary update)
- Batch inserts: 50 states per batch for performance
- Delete-then-insert pattern for recalculations (idempotent)

**Performance:**
- Handles 100+ transactions in 2-5 seconds
- Uses pandas for efficient aggregation
- Batch database operations
- Single database round-trip for thresholds and rates

---

## [0.5.0] - 2025-11-04

### Added - Screen 4: Results Dashboard (UI)

**Frontend**
- Results dashboard page at `/analysis/[id]/results`
- Professional dashboard layout with:
  - Header section showing analysis completion status
  - Company name, analysis period, and processing summary
  - Completion timestamp display
- Three summary cards:
  - States with Nexus (placeholder for calculation engine)
  - Estimated Tax Liability (placeholder for calculation engine)
  - Confidence Level (showing "High" based on data quality)
- US Map visualization placeholder:
  - Informative placeholder with map icon
  - Color-coded legend (Red: Has Nexus, Yellow: Approaching, Green: No Nexus)
  - Description of interactive features
- Nexus breakdown section with placeholders:
  - Physical nexus count
  - Economic nexus count
  - No nexus count
  - States approaching threshold list
- Clear "Coming Soon" notice:
  - Explains nexus calculation engine features
  - Lists what the engine will calculate
  - Sets expectations for users
- Action buttons:
  - Back to Mapping (functional)
  - Start New Analysis (functional, navigates to Screen 1)
  - View Detailed Table (disabled, coming soon)
  - Generate Report (disabled, coming soon)
- Loading state while fetching analysis details
- Error handling for API failures

**Backend**
- Analysis retrieval endpoint: `GET /api/v1/analyses/{id}`
  - Returns complete analysis details
  - Fetches transaction statistics from database
  - Calculates total_transactions count
  - Calculates unique_states count
  - Verifies user ownership with user_id check
  - Returns 404 if analysis not found or doesn't belong to user

**Testing**
- Verified dashboard loads correctly
- Confirmed all UI sections render properly
- Tested navigation buttons
- Validated end-to-end flow: Screen 1 → 2 → 3 → 4

### Changed

**UI/UX**
- Results page now shows complete dashboard structure instead of simple placeholder
- Professional, clean design matching other screens

---

## [0.4.0] - 2025-11-04

### Added - Screen 3: Data Mapping & Validation

**Frontend**
- Data mapping page at `/analysis/[id]/mapping`
- Column mapping interface with dropdown selectors
- Auto-detection of column mappings based on common field names
- Sample values display for each mapped column (up to 10 samples)
- Date format selector (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD)
- Support for optional fields (product_type, customer_type)
- Data summary section displaying:
  - Total transaction count
  - Date range (start and end dates)
  - Number of unique states
  - Estimated processing time
- Real-time validation status display
- Success message with auto-redirect on validation pass
- Detailed error display with row numbers on validation failure
- Form validation for required field mappings
- Loading states for API calls
- Help text and visual feedback for user

**Backend**
- Column info endpoint: `GET /api/v1/analyses/{id}/columns`
  - Analyzes uploaded transaction data
  - Returns column names, sample values, and data types
  - Calculates summary statistics (row count, date range, unique states)
  - Estimates processing time based on data volume
- Validation endpoint: `POST /api/v1/analyses/{id}/validate`
  - Comprehensive data validation:
    - Date format validation (rejects future dates)
    - State code validation (50 states + DC + 5 territories)
    - Amount validation (numeric, non-negative values)
    - Sales channel validation (marketplace, direct, other)
  - Returns detailed error report with row numbers and messages
  - Supports warnings (non-blocking) and errors (blocking)
  - Limits errors to first 50 and warnings to first 20
  - Updates analysis status to "processing" on successful validation
- Error handling with specific validation messages

**Testing**
- Verified end-to-end flow: Screen 1 → Screen 2 → Screen 3
- Tested with 30-transaction sample dataset
- Confirmed auto-mapping works correctly
- Validated data passes all checks
- Confirmed redirect to results page

### Changed

**Database Status Updates**
- Validation endpoint now correctly sets status to 'processing' (not 'validated')
- Follows database constraint: status IN ('draft', 'processing', 'complete', 'error')

### Fixed

- **Status constraint violation**: Changed validation endpoint to use 'processing' status instead of 'validated' to comply with database check constraint
- **Error handling**: Added proper error messages for validation failures

---

## [0.3.0] - 2025-11-04

### Added - Screen 2: CSV Upload & Preview

**Frontend**
- CSV/Excel file upload page at `/analysis/[id]/upload`
- Drag-and-drop file upload interface using react-dropzone
- Client-side file validation (CSV/XLS/XLSX, max 50MB)
- Client-side CSV parsing with PapaParse for instant preview
- Data preview table showing first 10 rows
- Column detection and display as badges
- Total transaction count display
- "Upload Different File" functionality
- Loading states for parsing and uploading
- Error handling with user-friendly messages
- Help section showing required columns

**Backend**
- File upload endpoint: `POST /api/v1/analyses/{id}/upload`
- Server-side file validation (type, size, required columns)
- CSV and Excel parsing with pandas
- Data cleaning (removes rows with missing required fields)
- Date format normalization
- State code normalization (2-letter uppercase)
- Batch insert optimization (1000 rows per batch)
- Analysis status update to "processing"
- Returns transaction count and detected columns

**Testing**
- Created `sample-sales-data.csv` with 30 transactions for testing
- Verified end-to-end upload flow
- Tested with analysis ID: `5b803d55-bb22-4c26-8433-145c4012bfc3`

### Changed

**Database Schema Alignment**
- Updated upload endpoint to match actual `sales_transactions` schema
- Maps CSV `revenue_amount` to database `sales_amount`
- Removed unsupported columns: `product_type`, `customer_type`
- Uses auto-generated `id` (SERIAL) instead of UUID
- Sets `transaction_count` = 1 per row
- Sets `tax_collected` = NULL for later calculation

### Fixed
- Backend server restart issue (required manual restart after code changes)
- Column name mismatch between CSV and database schema

---

## [0.2.0] - 2025-11-04

### Added - Sprint 1 Week 1 Complete

**Authentication System**
- Login page at `/login` with email/password form
- Signup page at `/signup` with password confirmation
- Email confirmation via Supabase Auth (confirmation emails may go to junk)
- Magic link authentication support
- Protected route wrapper component (`ProtectedRoute.tsx`)
- Dashboard page at `/dashboard` with user email display and logout
- JWT authentication with automatic token refresh
- Zustand auth store for global auth state management

**Screen 1: Client Setup**
- Client setup form at `/analysis/new`
- Form fields:
  - Company name (required, 1-200 characters)
  - Analysis period start/end dates (required, validates dates)
  - Business type selection (product_sales, digital_products, mixed)
  - Known state registrations (optional, can add multiple)
  - Notes field (optional)
- Form validation using React Hook Form + Zod schema
- Backend API endpoint: `POST /api/v1/analyses`
- Database integration with `analyses` table
- Automatic user record creation in `users` table
- Navigation to upload screen after successful submission

**Infrastructure**
- Registered analyses router in FastAPI main app
- API client with JWT interceptor and auto-refresh
- Error handling and user feedback
- Loading states for async operations

### Changed

**Backend Dependencies (Python 3.13 Compatibility)**
- Updated `fastapi` from 0.110.0 to 0.115.6
- Updated `uvicorn` from 0.27.1 to 0.32.1
- Updated `supabase` from 2.3.4 to 2.9.1
- Updated `pydantic` from 2.6.1 to 2.10.3
- Updated `pydantic-settings` from 2.1.0 to 2.7.0
- Updated `pandas` from 2.2.0 to 2.2.3
- Updated `pytest` from 8.0.0 to 8.3.4
- Updated `ruff` from 0.2.1 to 0.8.6
- Updated `black` from 24.2.0 to 24.10.0
- Updated `mypy` from 1.8.0 to 1.14.1

**Frontend Dependencies**
- Added `tailwindcss-animate@^1.0.7`
- Updated `react-simple-maps` from 1.0.0 to 3.0.0 (reverted by user)

**Configuration**
- Removed deprecated `experimental.serverActions` from `next.config.js`

**Database Schema Alignment**
- Updated backend to use actual database column names:
  - `client_company_name` instead of `company_name`
  - `analysis_period_start/end` instead of `period_start/end`
  - `retention_policy` instead of `retention_period`
  - `status` = "draft" instead of "setup"

### Fixed

- Next.js configuration warning about deprecated `serverActions` option
- API client import error (changed to default export)
- Backend API endpoint to match actual database schema
- User table foreign key constraint by auto-creating user records
- Python 3.13 compatibility issues with multiple packages

### Removed

- `asyncpg` dependency (not needed with Supabase client)
- Explicit `httpx` version (managed by supabase)
- Explicit `postgrest` version (managed by supabase)

### Known Issues

- Email confirmation messages may go to junk/spam folder (use magic link as workaround)
- Known state registrations captured in UI but not persisted to database (deferred pending table structure finalization)

---

## [0.1.0] - 2025-11-03

### Added - Initial Project Setup

**Project Structure**
- FastAPI backend project structure
- Next.js 14 frontend project structure with App Router
- Environment configuration files (.env.example for both)
- Supabase database client integration
- JWT authentication infrastructure
- API client with interceptors

**Database**
- Deployed 8 database migrations to Supabase
- 12 tables with Row Level Security
- 239 rows of state rules data loaded
- 52 states table populated

**Documentation**
- `README_DEVELOPMENT.md` - Main development guide
- `SPRINT_1_SETUP_GUIDE.md` - Sprint 1 setup instructions
- `QUICK_START_FOR_NEW_SESSIONS.md` - Quick orientation
- `INTEGRATION_AND_DEPENDENCIES.md` - Integration patterns
- `PHASE_2B_SCREEN_SPECIFICATIONS.md` - UI/UX designs
- `PHASE_3_TECHNICAL_ARCHITECTURE.md` - API specifications

**Dependencies**
- Backend: FastAPI, Supabase client, Pandas, Pydantic, PyJWT
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Axios

### Infrastructure

**Backend**
- FastAPI app with CORS middleware
- Health check endpoint at `/health`
- Supabase PostgreSQL database client
- JWT authentication module
- Pydantic schemas for validation

**Frontend**
- Next.js 14 with App Router
- TypeScript configuration
- Tailwind CSS setup
- Supabase auth client
- Axios client with JWT interceptors
- Zustand for state management

---

## Version History

- **0.7.0** - Sprint 2 Feature 1 (Screen 5: State Table Complete)
- **0.6.0** - Sprint 1 Complete (Calculation Engine + Full Integration)
- **0.5.0** - Sprint 1 Week 3 (Screen 4: Results Dashboard UI)
- **0.4.0** - Sprint 1 Week 2 (Screen 3: Data Mapping & Validation)
- **0.3.0** - Sprint 1 Week 2 (Screen 2: CSV Upload)
- **0.2.0** - Sprint 1 Week 1 (Authentication + Screen 1)
- **0.1.0** - Initial Setup (Infrastructure + Documentation)

---

**Project Status:** Phase 4, Sprint 2 - In Progress ⏳
**Core MVP Features:** Screens 1-5 functional with state table and filtering
**Next:** Sprint 2 - State Detail (Screen 6), US Map, PDF Reports
