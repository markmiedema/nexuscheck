# Nexus Check

**Status:** Active Development
**Last Updated:** November 10, 2025

---

## 📋 Overview

Nexus Check is a web application that helps tax professionals analyze state sales tax nexus obligations for their clients. Upload transaction data, and the tool automatically determines which states require sales tax registration and calculates estimated tax liabilities.

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python)
- Supabase (PostgreSQL database)
- pandas (data processing)
- JWT authentication

**Frontend:**
- Next.js 14 (App Router)
- React + TypeScript
- shadcn/ui components
- Recharts (data visualization)
- Tailwind CSS

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.17.0
- Python >= 3.9
- Supabase account

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run migrations
# (See migrations/ folder for SQL files to run in Supabase)

# Start server
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start dev server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 📊 Features

### ✅ Implemented

**Screen 1: Upload & Analysis Creation**
- CSV file upload with drag-and-drop
- Client information form
- Analysis period selection
- File validation and parsing

**Screen 2: Processing**
- Background nexus calculation
- Real-time progress updates
- Error handling and retry logic

**Screen 3: Dashboard**
- High-level nexus summary
- Total estimated liability
- States requiring registration
- Quick action buttons

**Screen 4: State Table**
- Sortable, filterable state results
- Nexus status indicators (has nexus, approaching, none)
- Sales breakdown by state
- Export to CSV functionality

**Screen 5: State Detail Page** *(NEW)*
- Comprehensive state-specific analysis
- Year-by-year filtering
- Monthly sales trend chart with threshold visualization
- Transaction table with search, filter, sort, and pagination
- Running totals showing exact threshold crossing point
- Compliance requirements based on nexus status:
  - Has Nexus: Registration requirements and tax rates
  - Approaching: Warning with threshold progress
  - No Nexus: Monitoring guidance
  - Zero Sales: Informational placeholder with state tax info
- Tax rate information (state, local, combined)
- Helpful resources (registration URLs, DOR websites)

### 🔄 In Progress

- Multi-year nexus calculation improvements
- "Sticky nexus" logic (once established, persists across years)

### 📋 Planned

- PDF report generation
- VDA (Voluntary Disclosure Agreement) scenarios
- Physical nexus tracking
- Multi-user support and team collaboration

---

## 📁 Project Structure

```
SALT-Tax-Tool-Clean/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Database, auth, config
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic (nexus calculator)
│   ├── migrations/         # Database migrations
│   └── requirements.txt
│
├── frontend/
│   ├── app/                # Next.js app router pages
│   │   ├── analysis/[id]/  # Analysis detail pages
│   │   │   └── states/[stateCode]/  # State detail page
│   │   ├── upload/         # Upload flow
│   │   └── page.tsx        # Dashboard
│   ├── components/
│   │   ├── analysis/       # State detail components
│   │   ├── dashboard/      # Dashboard widgets
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # API client, utilities
│   └── package.json
│
├── docs/
│   └── plans/              # Implementation plans and design docs
│
└── README.md
```

---

## 🗄️ Database Schema

**12 Tables:**

**Core Application Tables:**
1. `users` - User accounts and authentication
2. `analyses` - Each nexus analysis with metadata
3. `sales_transactions` - Transaction data per analysis
4. `physical_nexus` - Physical presence declarations
5. `state_results` - Calculated nexus results per state
6. `error_logs` - Error tracking
7. `audit_log` - Compliance and security audit trail

**State Reference Data Tables:**
8. `states` - State metadata (name, flags, URLs)
9. `economic_nexus_thresholds` - Revenue/transaction thresholds by state
10. `marketplace_facilitator_rules` - How each state treats marketplace sales
11. `tax_rates` - State and average local tax rates
12. `interest_penalty_rates` - Interest and penalty calculations

---

## 🔑 Key Business Logic

### Nexus Determination

The tool determines economic nexus using state-specific thresholds:

- **Revenue Threshold:** Typically $100,000 in sales
- **Transaction Threshold:** Typically 200 transactions
- **Operator Logic:** Most states use OR (either threshold triggers nexus), some use AND (both required)

### Threshold Status

- **Has Nexus:** Exceeded threshold (red)
- **Approaching:** 90-100% of threshold (yellow)
- **Safe:** Below 90% of threshold (green)
- **Zero Sales:** No transactions in state (blue informational)

### Multi-Year Analysis

- Transactions can span multiple calendar years
- Thresholds are evaluated **per calendar year**
- "Sticky nexus": Once established, persists until formally closed (not yet fully implemented)

---

## 📝 API Endpoints

**Authentication:**
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Get JWT token

**Analyses:**
- `POST /api/v1/analyses` - Create new analysis
- `POST /api/v1/analyses/{id}/upload` - Upload transaction CSV
- `GET /api/v1/analyses` - List user's analyses
- `GET /api/v1/analyses/{id}` - Get analysis summary
- `GET /api/v1/analyses/{id}/states/{code}` - Get state detail

**Processing:**
- `POST /api/v1/analyses/{id}/calculate` - Trigger nexus calculation
- `GET /api/v1/analyses/{id}/status` - Check calculation progress

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest
```

Run frontend type checking:
```bash
cd frontend
npm run type-check
```

---

## 🐛 Known Issues

1. **Multi-year nexus calculation:** Currently calculates per-year correctly, but doesn't track "sticky nexus" across years
2. **Helpful Resources:** URLs for state registration portals and DOR websites need to be populated in the database
3. **Mobile responsive:** Not yet optimized for mobile/tablet (desktop-first)

---

## 📚 Documentation

- **Implementation Plans:** See `docs/plans/` for detailed feature specs
- **Database Migrations:** See `migrations/` for schema evolution
- **API Documentation:** Run backend and visit `http://localhost:8000/docs`

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

**Last Updated:** November 10, 2025
**Version:** 0.1.0 (MVP in progress)
