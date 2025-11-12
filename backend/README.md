# Nexus Check - Backend

**Tech Stack:** FastAPI + Python 3.11 + Supabase PostgreSQL
**Last Updated:** 2025-11-11

---

## 🏗️ Project Structure

```
backend/
├── app/                          # Application code
│   ├── main.py                   # FastAPI app entry point
│   ├── config.py                 # Configuration from environment variables
│   ├── api/v1/                   # API endpoints (v1)
│   │   ├── __init__.py
│   │   └── analyses.py           # Analysis CRUD and calculation endpoints
│   ├── core/                     # Core functionality
│   │   ├── __init__.py
│   │   ├── auth.py               # JWT authentication
│   │   └── supabase.py           # Supabase database client
│   ├── schemas/                  # Pydantic models for validation
│   │   ├── __init__.py
│   │   └── analysis.py           # Analysis request/response schemas
│   └── services/                 # Business logic
│       ├── __init__.py
│       ├── column_detector.py     # CSV column mapping detection
│       ├── nexus_calculator_v2.py # Economic nexus calculation engine (V2)
│       └── interest_calculator.py # Interest/penalty calculation
│
├── migrations/                   # Database migrations (SQL)
│   ├── 001_initial_schema.sql
│   ├── 002_row_level_security.sql
│   ├── ...                       # 14 total migrations
│   ├── DEPLOYMENT_GUIDE.md       # Initial deployment guide (Nov 2)
│   └── MIGRATIONS_LOG.md         # Complete migration log
│
├── scripts/                      # Utility scripts
│   ├── README.md                     # Script documentation
│   └── import_state_nexus_rules.py   # Import state rules from JSON
│
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── test_analyses_api.py              # API endpoint tests
│   ├── test_analyses_integration.py      # Integration tests
│   ├── test_auto_detect_dates.py         # Date detection tests
│   ├── test_column_detector.py           # Column mapping tests
│   ├── test_nexus_calculator_v2_phase1a.py  # V2 calculator tests (calendar year)
│   ├── test_nexus_calculator_v2_phase1b.py  # V2 calculator tests (multi-year)
│   ├── test_interest_calculator_phase2.py   # Interest calculation tests
│   └── manual/                           # Manual test scripts (not pytest)
│       ├── README.md
│       ├── test_calculation.py           # Manual API test
│       ├── test_calculator_direct.py     # Direct calculator test
│       ├── test_endpoint_syntax.py       # Syntax check
│       ├── test_interest_manual.py       # Manual interest test
│       └── test_rolling_manual.py        # Manual rolling test
│
├── _archived_code/               # Archived obsolete code
│   ├── README.md                     # Archive documentation
│   ├── nexus_calculator_v1_2025-11-04.py  # V1 calculator (superseded by V2)
│   └── test_nexus_calculator_v1_2025-11-04.py  # V1 calculator tests
│
├── venv/                         # Python virtual environment (ignored by git)
├── .env                          # Environment variables (NOT in git)
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore rules
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# OR: source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. Start Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

Server will start at: http://localhost:8000

---

## 📚 API Documentation

Once the server is running, access:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🧪 Running Tests

### Automated Test Suite (pytest)

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_nexus_calculator_v2_phase1a.py

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=app
```

### Manual Test Scripts

See `tests/manual/README.md` for documentation on manual test scripts.

```bash
# Example: Test API endpoints manually
python tests/manual/test_calculation.py
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app entry point, CORS, middleware |
| `app/config.py` | Configuration from environment variables |
| `app/api/v1/analyses.py` | All API endpoints for analyses |
| `app/core/auth.py` | JWT authentication middleware |
| `app/core/supabase.py` | Supabase client initialization |
| `app/services/nexus_calculator_v2.py` | Economic nexus calculation logic (V2) |
| `app/services/column_detector.py` | CSV column mapping detection |
| `app/services/interest_calculator.py` | Interest/penalty calculations |
| `app/schemas/analysis.py` | Pydantic models for request/response |
| `requirements.txt` | Python package dependencies |

---

## 🗄️ Database

**Provider:** Supabase (Managed PostgreSQL)
**Migrations:** See `migrations/` folder

### Running Migrations

Migrations are SQL files that should be run in order in Supabase SQL Editor.

See:
- `migrations/DEPLOYMENT_GUIDE.md` - Initial deployment instructions (migrations 001-008)
- `migrations/MIGRATIONS_LOG.md` - Complete log of all migrations (001-012)

---

## 🔧 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
PORT=8000  # Server port (default: 8000)
```

**⚠️ Security:** Never commit `.env` file to git. Always use environment variables for credentials.

---

## 🛠️ Common Commands

```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code (if black is installed)
black app/

# Lint code (if ruff is installed)
ruff check app/

# Type check (if mypy is installed)
mypy app/
```

---

## 📦 Dependencies

Key Python packages (see `requirements.txt` for complete list):

- **fastapi** - Modern web framework
- **uvicorn** - ASGI server
- **supabase** - Supabase client
- **pandas** - Data processing
- **openpyxl** - Excel file support
- **pydantic** - Data validation
- **python-jose** - JWT handling
- **python-multipart** - File uploads

---

## 🔐 Authentication

The backend uses JWT (JSON Web Tokens) for authentication:

1. Frontend authenticates with Supabase Auth
2. Frontend sends JWT in `Authorization: Bearer <token>` header
3. Backend validates JWT using Supabase service role key
4. Backend enforces Row Level Security (RLS) policies

---

## 🧩 API Endpoints

### Analyses

- `POST /api/v1/analyses` - Create new analysis
- `GET /api/v1/analyses/{id}` - Get analysis details
- `GET /api/v1/analyses` - List user's analyses
- `DELETE /api/v1/analyses/{id}` - Delete analysis (soft delete)

### File Upload

- `POST /api/v1/analyses/{id}/upload` - Upload CSV/Excel file
- `GET /api/v1/analyses/{id}/columns` - Get detected columns

### Data Mapping

- `POST /api/v1/analyses/{id}/validate` - Validate column mappings

### Calculation

- `POST /api/v1/analyses/{id}/calculate` - Calculate nexus
- `GET /api/v1/analyses/{id}/results/summary` - Get results summary
- `GET /api/v1/analyses/{id}/results/states` - Get state-by-state results
- `GET /api/v1/analyses/{id}/results/states/{state_code}` - Get state detail

### Health Check

- `GET /health` - Server health check

---

## 📊 Database Schema

**User Tables:**
- `users` - User accounts
- `analyses` - Analysis metadata
- `transactions` - Uploaded transaction data
- `state_results` - Calculated nexus results

**State Rules Tables:**
- `states` - US states and territories
- `economic_nexus_thresholds` - Nexus thresholds by state
- `marketplace_facilitator_rules` - Marketplace rules
- `tax_rates` - State and local tax rates
- `interest_penalty_rates` - Interest/penalty calculation rules

See `_04-technical-specs/data-model-specification.md` and `state-rules-schema.md` in project root.

---

## 🐛 Troubleshooting

**Server won't start?**
- Check Python version: `python --version` (need 3.11+)
- Verify virtual environment is activated
- Check `.env` file exists and has valid credentials

**Database connection fails?**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase project is accessible
- Check Supabase dashboard to verify project status

**Tests failing?**
- Ensure test database has migrations applied
- Check test data exists in database
- Verify environment variables for tests

**Import errors?**
- Reinstall dependencies: `pip install -r requirements.txt`
- Check virtual environment is activated
- Verify Python path includes project root

---

## 📖 Related Documentation

- **API Specs:** `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md`
- **Database Schema:** `_04-technical-specs/data-model-specification.md`
- **Integration Guide:** `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md`
- **Current Status:** `_05-development/CURRENT_STATUS_2025-11-05.md`

---

## 🤝 Contributing

Before committing:
1. Run tests: `pytest`
2. Format code: `black app/`
3. Check types: `mypy app/`
4. Update this README if adding new files/folders

---

**Questions?** See project documentation in `_05-development/README_DEVELOPMENT.md`
