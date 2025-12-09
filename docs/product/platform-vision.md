# NexusCheck Platform Vision

**Created:** 2025-12-09
**Status:** Strategic Planning Document
**Scope:** Long-term product direction and architecture

---

## Executive Summary

NexusCheck is evolving from a **nexus calculation tool** into a **complete practice management platform** for State and Local Sales Tax (SALT) agencies.

### The Strategic Shift

| From | To |
|------|-----|
| Nexus calculator | Practice management platform |
| Pay-per-use tool | Integrated business system |
| Single feature value | Workflow integration + compliance intelligence |
| Easy to replace | Deep value creation + ethical retention |

### Why This Matters

A standalone calculator is commoditizable - one price cut or feature copy away from losing customers. A practice management platform creates value through:

1. **Workflow integration** - Agency processes built around the system
2. **Compliance intelligence** - Maintained state data as a differentiator
3. **Client experience** - Portal creates expectations that are hard to unwind
4. **Team adoption** - Organizational knowledge lives in the system
5. **Ongoing value** - From project-based to continuous relationship

**The moat is built through genuine value, not lock-in.** Users can export all their data anytime - they stay because they want to, not because they're trapped.

---

## Target Market

### Primary Customer

**Boutique State and Local Sales Tax agencies** - typically 1-10 person firms specializing in:
- Nexus studies and analysis
- Voluntary Disclosure Agreement (VDA) representation
- State registrations
- Ongoing compliance and filing
- Audit defense support

### Their Clients

Small to mid-size e-commerce businesses, often:
- Multi-channel sellers (DTC, Amazon, wholesale)
- Growing past economic nexus thresholds
- Lacking internal tax expertise
- Expecting boutique, personalized service

### Key Insight

These agencies' clients are paying for an **intimate experience** with a boutique firm. Any client-facing features (portal, reports) must support that positioning - white-labeling and branding are important, not optional.

---

## User Model

### Three User Types

```
┌─────────────────────────────────────────────────────────────┐
│                        AGENCY                               │
│  (Organization - the tax practice using NexusCheck)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AGENCY TEAM MEMBERS                                        │
│  Users who access the full platform                         │
│  ├── Owner    : Full access + billing + delete agency       │
│  ├── Admin    : Full access + team management               │
│  ├── Staff    : Assigned clients/projects only              │
│  └── Viewer   : Read-only access                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLIENT PORTAL USERS                                        │
│  People at the businesses being served by the agency        │
│  ├── Primary  : Full portal access for their company        │
│  └── Member   : Limited portal access (invited by primary)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Permission Matrix - Agency Side

| Capability | Owner | Admin | Staff | Viewer |
|------------|-------|-------|-------|--------|
| View all clients | ✓ | ✓ | Assigned | ✓ |
| Edit clients | ✓ | ✓ | Assigned | ✗ |
| Create clients | ✓ | ✓ | ✓ | ✗ |
| Delete clients | ✓ | ✓ | ✗ | ✗ |
| Run analyses | ✓ | ✓ | Assigned | ✗ |
| View state compliance data | ✓ | ✓ | ✓ | ✓ |
| Manage team | ✓ | ✓ | ✗ | ✗ |
| Agency settings | ✓ | ✓ | ✗ | ✗ |
| Portal branding | ✓ | ✓ | ✗ | ✗ |
| Billing | ✓ | ✗ | ✗ | ✗ |
| Export all data | ✓ | ✓ | ✗ | ✗ |

### Client Portal Users

Portal users have a completely separate, simplified experience:

| Capability | Primary | Member |
|------------|---------|--------|
| View dashboard | ✓ | ✓ |
| Upload documents | ✓ | ✓ |
| View upload history | ✓ | Own only |
| View released reports | ✓ | ✓ |
| Message agency | ✓ | ✓ |
| Invite other users | ✓ | ✗ |
| Manage company profile | ✓ | ✗ |

---

## Information Architecture

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  NEXUS CHECK                    [Search]  [User] [Settings] │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│  📊 Dashboard   │   Main content area                       │
│                 │                                           │
│  👥 Clients     │                                           │
│     • Pipeline  │                                           │
│     • Active    │                                           │
│     • Archived  │                                           │
│                 │                                           │
│  📋 Projects    │                                           │
│     • Active    │                                           │
│     • Completed │                                           │
│                 │                                           │
│  📄 Documents   │   (document requests & uploads)           │
│                 │                                           │
│  🗺️ States      │                                           │
│     • Overview  │                                           │
│     • Directory │                                           │
│     • Calendar  │                                           │
│                 │                                           │
│  ⚙️ Settings    │                                           │
│     • Agency    │                                           │
│     • Team      │                                           │
│     • Billing   │                                           │
│     • Data      │   (export)                                │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### Route Structure

```
/dashboard                    # Practice overview - "what needs attention"

/clients
├── /new
└── /[id]
    ├── /overview            # Summary, status, key metrics
    ├── /discovery           # Business profile questionnaire
    ├── /activity            # Notes, timeline
    ├── /documents           # Requests & uploads for this client
    ├── /portal              # Portal user management
    └── /edit

/projects
├── /new
└── /[id]
    ├── /setup               # Configuration, data sources
    ├── /mapping             # Column mapping
    ├── /results             # Analysis results
    ├── /present             # Presentation mode (client-facing view)
    └── /states/[code]

/documents                    # Cross-client document management
├── /requests                 # All outstanding requests
└── /uploads                  # Recent uploads needing review

/engagements
├── /new
└── /[id]

/states
├── /overview                 # US map, aggregate view across clients
├── /[stateCode]              # Individual state profile
├── /thresholds               # Master threshold table
└── /calendar                 # Filing deadlines

/portal                       # Client portal (separate experience)
├── /                         # Portal dashboard
├── /uploads
│   └── /new
├── /requests
├── /reports                  # Released deliverables
├── /messages
└── /settings

/settings
├── /agency                   # Agency profile, branding
├── /team                     # Team member management
├── /billing                  # Subscription management
└── /data                     # Export functionality
```

---

## Feature Areas

### 1. Dashboard

**Current State:** `/clients` serves as both client list and dashboard
**Problem:** No high-level "cockpit view" of the practice

**Proposed Dashboard Content:**

| Section | Content |
|---------|---------|
| Key Metrics | Active engagements, pipeline value, pending requests |
| Action Items | Incomplete discovery, unsigned engagements, uploads to review |
| Activity Feed | Recent activity across ALL clients |
| Proactive Alerts | Clients approaching thresholds |
| Upcoming Deadlines | Filing due dates, engagement milestones |

### 2. Client Lifecycle

**Explicit Stages:**

```
PROSPECT → DISCOVERY → PROPOSAL → ENGAGED → ONGOING → ARCHIVED
    │          │           │          │          │
    └─ Lead    └─ Profile  └─ Scope   └─ Active  └─ Recurring
       capture    complete    & Price    Projects    Compliance
```

**Per-Stage Actions:**

| Stage | Primary Action | Exit Criteria |
|-------|---------------|---------------|
| Prospect | Initial outreach | Agrees to discovery |
| Discovery | Complete profile | Discovery form filled |
| Proposal | Define engagement | Engagement signed |
| Engaged | Active project work | Project delivered |
| Ongoing | Recurring compliance | Client churns |

**Client Detail Tabs:**
- Overview (status, key info, next action CTA)
- Discovery (business profile questionnaire)
- Activity (notes, timeline)
- Documents (requests & uploads)
- Portal (manage portal users)

### 3. Document Collection System

**Replaces:** Current placeholder data checklist

**Core Flow:**

```
Agency creates request (from template or custom)
              ↓
Request appears in client portal
              ↓
Client uploads file(s)
              ↓
Agency notified
              ↓
Agency reviews
              ↓
Approved → Ready for use in analysis
   or
Needs Revision → Client re-uploads
```

**Request Templates:**
- "Nexus Study Package" - sales data, prior returns, questionnaire
- "VDA Package" - historical data, registration history
- "Monthly Compliance" - period sales data
- Custom requests

**Request Features:**
- Due dates with reminders
- Instructions per request (e.g., "Export from Shopify → Reports → Sales by Region")
- Expected format specification
- Version history for re-uploads
- Status workflow: Requested → Uploaded → Under Review → Approved/Needs Revision

### 4. Client Portal

**Purpose:** Secure document upload and communication channel

**Design Principles:**
- Minimal, non-intimidating UI
- Mobile-friendly
- Trust signals (security badges, encryption messaging)
- Agency branding (logo, colors, contact info)
- No tax jargon

**Portal Features:**

| Feature | Description |
|---------|-------------|
| Dashboard | Outstanding requests, recent activity, status overview |
| Upload Files | Drag-drop upload, progress indication, confirmation |
| Upload History | What they've sent, when, status of each |
| Reports | Deliverables released by agency |
| Messages | Simple thread with agency contact |
| Profile | Contact info, notification preferences |

**Authentication:**
- Magic link login (no passwords to manage)
- Invitation-based (agency invites contacts)
- Reasonable session expiry

**Security:**
- Files encrypted at rest (AES-256)
- Encrypted in transit (TLS)
- Private storage (no public URLs)
- Signed URLs with short expiration for downloads
- Virus/malware scanning on upload

### 5. Project Delivery Workflow

**Current State:** Analysis complete → results visible → ???
**Problem:** No workflow for presenting to client, controlling release

**Proposed Status Flow:**

```
DRAFT → CONFIGURING → CALCULATING → COMPLETE →
READY_FOR_REVIEW → SCHEDULED → PRESENTED → DELIVERED
```

| Status | Meaning | Actions |
|--------|---------|---------|
| Complete | Calculation finished | Internal review |
| Ready for Review | Approved internally | Schedule presentation |
| Scheduled | Meeting booked | Use presentation mode |
| Presented | Client has seen it | Release to portal |
| Delivered | Available in portal | — |

**Presentation Mode:**
- Clean, client-facing view of results
- Hides internal notes/admin UI
- Optimized for screen sharing
- Larger typography, focused layout

**Why Present First?**
- Context prevents panic ("$47K liability" needs explanation)
- Opportunity to explain nuance (VDA reduces this significantly)
- Demonstrates expertise and builds relationship
- Prevents misinterpretation

### 6. States / Compliance Intelligence

**Purpose:** Surface compliance research as a product feature

**Current State:** Substantial research exists in separate workflow, not fully in database

**State Directory (`/states/[code]`):**
- Economic nexus threshold (sales $, transactions)
- Threshold measurement period (current year, previous year, rolling 12-month)
- Effective date
- Sourcing rules (origin vs destination)
- Filing frequencies and thresholds
- Local tax complexity (home rule, districts)
- VDA program details (lookback period, penalty waiver %)
- Registration process & timeline
- Key contacts / URLs
- Cross-reference: "Your clients in this state"

**Threshold Table (`/states/thresholds`):**
- Sortable/filterable master list
- All 50 states at a glance
- Export to CSV/PDF

**Compliance Calendar (`/states/calendar`):**
- Filing deadlines by state
- Threshold effective date changes
- Integration with project timelines

**Data Maintenance Strategy:**

| Approach | Description |
|----------|-------------|
| Monitoring | Google Alerts, legislative tracking for threshold changes |
| Scraping | Automated extraction from state websites where feasible |
| AI-Assisted | LLM extraction from state tax pages, flagged for verification |
| Manual Review | `last_verified_at` field, periodic human verification |

### 7. Integrations

**Purpose:** Auto-pull transaction data instead of CSV uploads

**Priority Tiers:**

| Tier | Platform | Rationale |
|------|----------|-----------|
| **Tier 1** | Shopify | Huge in e-commerce, definite user overlap |
| **Tier 1** | QuickBooks Online | Near-universal in small business |
| **Tier 1** | Amazon Seller Central | High value, pain point (clunky exports) |
| **Tier 2** | Xero | Popular accounting alternative |
| **Tier 2** | WooCommerce | Common e-commerce platform |
| **Tier 2** | Square | POS + e-commerce |
| **Tier 3** | NetSuite | Enterprise, lower priority |
| **Tier 3** | BigCommerce | Lower market share |

**Integration Features:**
- OAuth connection flow
- Periodic or on-demand sync
- Sync status and history
- Error handling and notifications
- Data transformation to standard format

**Portal Enhancement:**
With integrations, clients could connect their own stores:
> "Connect your Shopify and we'll automatically pull sales data monthly"

### 8. Filing & Remittance (Long-Term)

**Goal:** Expand beyond analysis into actual compliance filing

**The Full Lifecycle:**

```
NEXUS DETERMINATION          (exists)
        ↓
STATE REGISTRATION           (partially manual)
        ↓
ONGOING CALCULATION          (extension of current)
        ↓
RETURN PREPARATION           (new)
        ↓
FILING                       (new)
        ↓
REMITTANCE                   (new)
        ↓
RECORD KEEPING               (partially exists)
```

**Phased Approach:**

| Phase | Scope |
|-------|-------|
| **A: Workflow** | Filing calendar, manual tracking, deadline reminders |
| **B: Calculation** | Generate return amounts from data, pre-fill worksheets |
| **C: Forms** | Generate state-specific return forms (PDF) |
| **D: E-Filing** | Direct submission where APIs exist, or partnership |

**Build vs Partner Consideration:**
- Building: Full control, full margin, massive undertaking
- Partner: Use Avalara/TaxJar infrastructure, faster to market
- Hybrid: Build workflow/UX, use APIs for forms/submission

### 9. Agency Analytics

**Purpose:** Help agencies run their practice, not just serve clients

**Practice Metrics:**
- Active client count + trend
- Pipeline value (prospects × estimated engagement)
- Revenue by service type
- Client retention / churn rate
- Average engagement value

**Compliance Coverage:**
- States covered across all clients (map view)
- Upcoming filing deadlines
- Overdue items
- Clients approaching thresholds

**Team Metrics (when multi-user):**
- Clients per team member
- Projects completed by person
- Portal response time (upload → review)

### 10. Audit Support

**Role:** Supportive documentation, not handling audits directly

**Features:**
- Audit case tracking (client, state, period, status)
- Document assembly (pull relevant data for audit period)
- Correspondence log
- Exposure calculator (estimate worst-case)
- Resolution tracking

**Implementation:** Another engagement type with specific fields, links to existing data

### 11. Data Export

**Philosophy:** Users can leave anytime - retention through value, not lock-in

**Export Contents:**
- Clients & contacts (CSV)
- Discovery profiles (JSON)
- Activity log (CSV)
- Projects & results (CSV + PDF reports)
- Engagements (CSV)
- Uploaded documents (original files)
- State registrations (CSV)

**Format:**
```
agency-export-YYYY-MM-DD/
├── manifest.json
├── clients.csv
├── contacts.csv
├── discovery-profiles.json
├── activity-log.csv
├── projects/
│   ├── index.csv
│   └── [project-id]-report.pdf
├── engagements.csv
├── registrations.csv
└── documents/
    └── [client-name]/
        └── [files...]
```

**Implementation:** Start with manual (request via support), build self-service when volume justifies.

---

## Data Model Changes

### New Tables

```sql
-- Organizations (multi-tenancy)
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  owner_user_id UUID REFERENCES auth.users,
  billing_email VARCHAR,
  subscription_tier VARCHAR,
  settings JSONB,  -- branding, preferences
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Team members
organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  user_id UUID REFERENCES auth.users,
  role VARCHAR NOT NULL,  -- 'owner', 'admin', 'staff', 'viewer'
  invited_by_user_id UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ
)

-- Portal users (separate from agency users)
portal_users (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  email VARCHAR NOT NULL,
  name VARCHAR,
  role VARCHAR NOT NULL,  -- 'primary', 'member'
  invited_by_user_id UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)

-- Document requests
document_requests (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  created_by_user_id UUID,
  template_id UUID,  -- optional link to template
  title VARCHAR NOT NULL,
  description TEXT,
  expected_format VARCHAR,
  due_date DATE,
  status VARCHAR NOT NULL,  -- 'pending', 'uploaded', 'under_review', 'approved', 'needs_revision'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Client uploads
client_uploads (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  request_id UUID REFERENCES document_requests,  -- optional
  uploaded_by_portal_user_id UUID REFERENCES portal_users,
  uploaded_by_user_id UUID,  -- if agency uploaded
  file_name VARCHAR NOT NULL,
  file_type VARCHAR,
  file_size_bytes BIGINT,
  storage_path VARCHAR NOT NULL,
  status VARCHAR NOT NULL,  -- 'pending_review', 'approved', 'rejected'
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ
)

-- Integration connections
client_integrations (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  platform VARCHAR NOT NULL,  -- 'shopify', 'amazon', 'quickbooks', etc.
  credentials_encrypted TEXT,
  status VARCHAR NOT NULL,  -- 'active', 'error', 'disconnected'
  last_sync_at TIMESTAMPTZ,
  sync_frequency VARCHAR,  -- 'manual', 'daily', 'weekly'
  settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Filing periods (for future filing features)
filing_periods (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  state_code CHAR(2) REFERENCES states,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  frequency VARCHAR NOT NULL,  -- 'monthly', 'quarterly', 'annual'
  due_date DATE NOT NULL,
  extended_due_date DATE,
  status VARCHAR NOT NULL,  -- 'upcoming', 'preparing', 'ready', 'filed', 'paid'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Exemption certificates
exemption_certificates (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients,
  customer_name VARCHAR NOT NULL,
  customer_external_id VARCHAR,  -- ID in client's system
  states TEXT[],  -- array of state codes
  exemption_type VARCHAR NOT NULL,  -- 'resale', 'manufacturing', 'nonprofit', etc.
  certificate_number VARCHAR,
  effective_date DATE,
  expiration_date DATE,
  document_path VARCHAR,
  verified_at TIMESTAMPTZ,
  status VARCHAR NOT NULL,  -- 'active', 'expired', 'pending_verification'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Modifications to Existing Tables

```sql
-- Add organization_id to existing tables
ALTER TABLE clients ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE analyses ADD COLUMN organization_id UUID REFERENCES organizations;
ALTER TABLE engagements ADD COLUMN organization_id UUID REFERENCES organizations;

-- Add delivery workflow to analyses
ALTER TABLE analyses ADD COLUMN delivery_status VARCHAR;
-- 'complete', 'ready_for_review', 'scheduled', 'presented', 'delivered'
ALTER TABLE analyses ADD COLUMN presented_at TIMESTAMPTZ;
ALTER TABLE analyses ADD COLUMN delivered_at TIMESTAMPTZ;

-- Expand states table for compliance intelligence
ALTER TABLE states ADD COLUMN threshold_period VARCHAR;
-- 'current_year', 'previous_year', 'rolling_12_month'
ALTER TABLE states ADD COLUMN sourcing_rule VARCHAR;
-- 'origin', 'destination', 'mixed'
ALTER TABLE states ADD COLUMN filing_frequencies TEXT[];
ALTER TABLE states ADD COLUMN vda_lookback_years INT;
ALTER TABLE states ADD COLUMN vda_penalty_waiver_percent INT;
ALTER TABLE states ADD COLUMN last_verified_at TIMESTAMPTZ;
ALTER TABLE states ADD COLUMN verification_notes TEXT;
```

---

## Branding & White-Label

### Configuration Structure

```typescript
interface OrganizationSettings {
  portal_branding: {
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    company_name: string;
    tagline: string | null;
    support_email: string;
    support_phone: string | null;
    custom_domain: string | null;  // Future: portal.smithtax.com
  };
  report_branding: {
    logo_url: string | null;
    company_name: string;
    address_block: string;
    footer_text: string;
  };
}
```

### "Powered by" Decision

Options:
1. **Hidden entirely** - Full white-label
2. **Subtle footer** - "Powered by NexusCheck"
3. **Configurable** - Agency chooses

Recommendation: Start with subtle footer, make configurable by plan tier later.

---

## Compliance Scenarios

Edge cases the platform should handle:

| Scenario | Consideration |
|----------|---------------|
| **Marketplace facilitator** | Amazon/Etsy collect on behalf - exclude from liability |
| **Drop shipping** | Complex nexus implications, special handling |
| **SaaS / Digital goods** | Different taxability by state |
| **Services** | Often exempt, varies by state and type |
| **Origin vs destination** | TX, AZ, etc. are origin-based |
| **Local/district taxes** | Home rule cities, special districts |
| **Exemption handling** | Resale, manufacturing, nonprofit certificates |
| **Use tax** | Purchases where vendor didn't collect |

---

## Pricing Considerations

The platform architecture supports multiple models:

| Model | What It Rewards | Pros | Cons |
|-------|-----------------|------|------|
| Per-analysis | Usage | Simple, low barrier | Commoditizable |
| Per-client/month | Relationship depth | Predictable | May limit adoption |
| Per-seat/month | Team adoption | Scales with agency | Complex for small firms |
| Platform + usage | Both | Balanced | Harder to explain |

**Recommendation:** Platform fee (per-seat or flat) + client tiers, with analysis usage as secondary metric.

---

## Open Questions

1. **State data automation** - What level of investment in automated monitoring vs. manual maintenance?

2. **Filing partnerships** - Build filing infrastructure or partner with Avalara/TaxJar?

3. **Custom domains** - How important is `portal.clientfirm.com` vs. `portal.nexuscheck.com/clientfirm`?

4. **Mobile app** - Is a native mobile app ever needed, or is responsive web sufficient?

5. **API access** - Should agencies be able to build their own integrations via API?

---

## Success Metrics

### Agency Adoption
- Monthly active agencies
- Team members per agency (multi-user adoption)
- Clients per agency (depth of use)

### Feature Engagement
- Portal adoption rate (% of clients with portal users)
- Document request completion rate
- Integration connection rate

### Retention
- Agency churn rate
- Net revenue retention
- Feature usage correlation with retention

### Efficiency
- Time from document request to upload
- Time from analysis to delivery
- Support ticket volume

---

## Related Documents

- [Implementation Phases](./roadmap-phases.md) - Phased implementation plan
- [Sprint Roadmap](../plans/ROADMAP.md) - Near-term technical sprints
- [State Compliance Data](./state-compliance-data.md) - State data structure (TBD)

---

*This is a living document. Update as product direction evolves.*
