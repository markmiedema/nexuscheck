# NexusCheck Implementation Phases

**Created:** 2025-12-09
**Related:** [Platform Vision](./platform-vision.md)

---

## Overview

This document outlines the phased implementation of the NexusCheck platform vision. Each phase builds on the previous, creating incremental value while moving toward the complete practice management platform.

---

## Phase Summary

| Phase | Name | Focus | Key Deliverable |
|-------|------|-------|-----------------|
| 1 | Platform Foundation | Navigation, dashboard, multi-user basics | Professional app structure |
| 2 | Client Experience | Document workflow, client portal | Secure document collection |
| 3 | Compliance Intelligence | State data, compliance reference | Differentiated knowledge base |
| 4 | Integrations | E-commerce & accounting connections | Automated data collection |
| 5 | Filing Foundation | Filing calendar, return tracking | Compliance workflow |
| 6 | Filing Automation | Return calculation, form generation | End-to-end compliance |

---

## Phase 1: Platform Foundation

**Goal:** Transform from a tool to a professional platform with proper structure

### Features

#### 1.1 Sidebar Navigation
- [ ] Implement collapsible sidebar component
- [ ] Add navigation sections: Dashboard, Clients, Projects, Documents, States, Settings
- [ ] Mobile-responsive hamburger menu
- [ ] Active state indicators
- [ ] Keyboard navigation support

#### 1.2 Dashboard
- [ ] Create true dashboard page (not redirect to /clients)
- [ ] Key metrics cards (active clients, pipeline, pending requests)
- [ ] Action items list (incomplete discovery, documents to review)
- [ ] Recent activity feed (across all clients)
- [ ] Proactive alerts (approaching thresholds)

#### 1.3 Projects as First-Class Entity
- [ ] Promote projects/analyses to top-level navigation
- [ ] Project listing page with filters (active, completed, by client)
- [ ] Project status workflow (add presentation/delivery states)
- [ ] Presentation mode for client-facing view

#### 1.4 Multi-User Foundation
- [ ] Create organizations table
- [ ] Create organization_members table
- [ ] Auto-create organization for existing users (become owner)
- [ ] Add organization_id to existing tables
- [ ] Update queries to filter by organization
- [ ] Owner and Admin roles only (Staff/Viewer in later phase)

#### 1.5 Settings Structure
- [ ] Create /settings route structure
- [ ] Agency profile settings page
- [ ] Team management page (view members, invite)
- [ ] Placeholder for billing page

### Database Changes

```sql
-- New tables
CREATE TABLE organizations (...);
CREATE TABLE organization_members (...);

-- Add organization_id to existing tables
ALTER TABLE clients ADD COLUMN organization_id UUID;
ALTER TABLE analyses ADD COLUMN organization_id UUID;
-- etc.
```

### Success Criteria
- [ ] User lands on functional dashboard after login
- [ ] Navigation provides clear access to all sections
- [ ] Multiple team members can access same organization
- [ ] Existing single-user data migrated to organization model

---

## Phase 2: Client Experience

**Goal:** Secure document collection with client-facing portal

### Features

#### 2.1 Document Request System
- [ ] Create document_requests table
- [ ] Create client_uploads table
- [ ] Request creation UI (from client page)
- [ ] Request templates (Nexus Study Package, VDA Package, etc.)
- [ ] Custom request creation
- [ ] Due date and reminder system
- [ ] Status workflow (pending → uploaded → reviewed → approved)
- [ ] Version history for re-uploads

#### 2.2 Cross-Client Document View
- [ ] /documents route with all pending requests
- [ ] Filter by client, status, due date
- [ ] Quick actions (review, approve, request revision)
- [ ] Upload review workflow

#### 2.3 Client Portal - MVP
- [ ] Portal user authentication (magic links)
- [ ] portal_users table
- [ ] Invitation flow (agency invites contact)
- [ ] Portal dashboard (outstanding requests, upload history)
- [ ] File upload interface
- [ ] Upload confirmation and status tracking
- [ ] Security: encryption, virus scanning, signed URLs

#### 2.4 Portal Branding
- [ ] Add branding fields to organization settings
- [ ] Portal header with agency logo/name
- [ ] Color customization (primary color)
- [ ] Support contact info display
- [ ] "Powered by NexusCheck" footer (configurable later)

#### 2.5 File Storage Infrastructure
- [ ] Configure Supabase Storage (or S3)
- [ ] Private buckets with no public access
- [ ] Signed URL generation for downloads
- [ ] File type validation
- [ ] Size limits
- [ ] Virus scanning integration

### Database Changes

```sql
CREATE TABLE portal_users (...);
CREATE TABLE document_requests (...);
CREATE TABLE client_uploads (...);

-- Add to organizations
ALTER TABLE organizations ADD COLUMN settings JSONB;
```

### Success Criteria
- [ ] Agency can create document requests from client page
- [ ] Client receives invitation email, can log into portal
- [ ] Client can upload files securely
- [ ] Agency receives notification, can review and approve
- [ ] Portal displays agency branding

---

## Phase 3: Compliance Intelligence

**Goal:** Surface state compliance data as a differentiated feature

### Features

#### 3.1 State Data Import
- [ ] Define comprehensive state data schema
- [ ] Import existing research data into database
- [ ] Verification workflow (last_verified_at, verification_notes)
- [ ] Admin interface for updating state data

#### 3.2 States Section UI
- [ ] /states/overview - US map with aggregate client data
- [ ] /states/[code] - Individual state detail page
  - [ ] Threshold information
  - [ ] Filing requirements
  - [ ] VDA program details
  - [ ] Registration process
  - [ ] Local tax info
  - [ ] "Your clients in this state" cross-reference
- [ ] /states/thresholds - Master threshold table
- [ ] /states/calendar - Filing deadlines and changes

#### 3.3 Threshold Monitoring
- [ ] Calculate client proximity to thresholds
- [ ] Dashboard alerts for approaching thresholds
- [ ] Email notifications (optional)

#### 3.4 State Data Automation (Foundation)
- [ ] last_verified_at tracking
- [ ] Change detection framework
- [ ] Manual verification workflow
- [ ] (Future: automated scraping, AI extraction)

### Database Changes

```sql
-- Expand states table
ALTER TABLE states ADD COLUMN threshold_period VARCHAR;
ALTER TABLE states ADD COLUMN sourcing_rule VARCHAR;
ALTER TABLE states ADD COLUMN filing_frequencies TEXT[];
ALTER TABLE states ADD COLUMN vda_lookback_years INT;
ALTER TABLE states ADD COLUMN vda_penalty_waiver_percent INT;
ALTER TABLE states ADD COLUMN last_verified_at TIMESTAMPTZ;
ALTER TABLE states ADD COLUMN verification_notes TEXT;
-- ... additional fields
```

### Success Criteria
- [ ] All state compliance data imported and verified
- [ ] Users can browse state information without going through a client
- [ ] Cross-client state view shows which clients have nexus where
- [ ] Dashboard shows proactive threshold alerts

---

## Phase 4: Integrations

**Goal:** Automated data collection from e-commerce and accounting platforms

### Features

#### 4.1 Integration Framework
- [ ] client_integrations table
- [ ] integration_syncs table (sync history)
- [ ] OAuth flow infrastructure
- [ ] Credential encryption
- [ ] Background sync job system
- [ ] Error handling and notifications

#### 4.2 Shopify Integration
- [ ] OAuth app registration
- [ ] Connection flow UI
- [ ] Sales data extraction (orders, refunds)
- [ ] Periodic sync (daily/weekly)
- [ ] Data transformation to standard format

#### 4.3 QuickBooks Online Integration
- [ ] OAuth app registration
- [ ] Connection flow UI
- [ ] Sales data extraction
- [ ] Customer data extraction
- [ ] Periodic sync

#### 4.4 Amazon Seller Central Integration
- [ ] API/MWS registration
- [ ] Report-based data extraction
- [ ] Settlement report parsing
- [ ] Periodic sync

#### 4.5 Integration Management UI
- [ ] Client integrations page
- [ ] Connection status display
- [ ] Manual sync trigger
- [ ] Sync history and errors
- [ ] Disconnect flow

#### 4.6 Portal Integration (Optional)
- [ ] Allow clients to connect their own stores from portal
- [ ] Agency approval workflow for client-initiated connections

### Database Changes

```sql
CREATE TABLE client_integrations (...);
CREATE TABLE integration_syncs (...);
```

### Success Criteria
- [ ] Agency can connect client's Shopify store
- [ ] Transaction data syncs automatically
- [ ] Analysis can use integrated data instead of CSV upload
- [ ] Sync errors surface clearly with resolution guidance

---

## Phase 5: Filing Foundation

**Goal:** Compliance workflow without full automation

### Features

#### 5.1 Filing Calendar
- [ ] filing_periods table
- [ ] Calendar view of upcoming deadlines
- [ ] Per-client filing schedule
- [ ] Deadline notifications

#### 5.2 Registration Tracking
- [ ] Enhanced state registration management
- [ ] Registration status per state per client
- [ ] Permit numbers, effective dates
- [ ] Renewal tracking

#### 5.3 Return Tracking (Manual)
- [ ] Mark returns as prepared/filed/paid
- [ ] Payment confirmation tracking
- [ ] Document storage for filed returns
- [ ] Amendment tracking

#### 5.4 Exemption Certificate Management
- [ ] exemption_certificates table
- [ ] Certificate upload and storage
- [ ] Expiration tracking
- [ ] Per-customer exemption records
- [ ] Verification workflow

#### 5.5 Audit Support
- [ ] Audit case tracking (as engagement type)
- [ ] Document assembly for audit periods
- [ ] Correspondence log
- [ ] Exposure calculator
- [ ] Resolution tracking

### Database Changes

```sql
CREATE TABLE filing_periods (...);
CREATE TABLE exemption_certificates (...);

-- Enhance registrations
ALTER TABLE state_registrations ADD COLUMN renewal_date DATE;
ALTER TABLE state_registrations ADD COLUMN permit_number VARCHAR;
```

### Success Criteria
- [ ] Agency can see all filing deadlines in one view
- [ ] Return filing status tracked per state per client
- [ ] Exemption certificates managed with expiration alerts
- [ ] Audit cases can be tracked with supporting documentation

---

## Phase 6: Filing Automation

**Goal:** End-to-end compliance from calculation to filing

### Features

#### 6.1 Return Calculation
- [ ] Calculate return amounts from transaction data
- [ ] Apply exemptions correctly
- [ ] Handle multi-jurisdiction (locals)
- [ ] Pre-fill return worksheets
- [ ] Adjustment handling

#### 6.2 Form Generation
- [ ] State-specific return form templates
- [ ] PDF generation with calculated values
- [ ] Print-ready formatting
- [ ] Form version management (states update forms)

#### 6.3 E-Filing (or Partnership)
- [ ] Evaluate build vs. partner
- [ ] If build: implement state e-file APIs where available
- [ ] If partner: integrate with Avalara/TaxJar filing APIs
- [ ] Confirmation tracking
- [ ] Error handling and retry

#### 6.4 Payment Tracking
- [ ] Payment amount calculation
- [ ] Payment method tracking
- [ ] Confirmation number logging
- [ ] Payment reconciliation

### Considerations

This phase has significant complexity and regulatory implications:
- May need to register as tax preparer in some states
- Form accuracy is critical (liability concerns)
- Partnership with established provider may be more practical
- Evaluate based on market demand and competitive landscape

### Success Criteria
- [ ] Returns can be calculated automatically from data
- [ ] State forms can be generated (PDF at minimum)
- [ ] Filing status tracked through confirmation
- [ ] Payment tracking complete

---

## Cross-Phase Items

### Security & Compliance
- [ ] SOC 2 preparation
- [ ] Penetration testing
- [ ] Data encryption audit
- [ ] Access logging
- [ ] GDPR/privacy compliance

### Performance & Scale
- [ ] Database optimization
- [ ] Query performance monitoring
- [ ] Caching strategy
- [ ] Background job scaling

### Analytics & Monitoring
- [ ] Agency analytics dashboard
- [ ] Usage metrics
- [ ] Error monitoring
- [ ] Performance tracking

### Data Export
- [ ] Self-service export (Phase 2 or 3)
- [ ] All data formats defined
- [ ] ZIP generation
- [ ] Secure delivery

---

## MVP Definition

**Minimum Viable Platform = Phase 1 + Phase 2**

At MVP completion, users have:
- Professional navigation and dashboard
- Multi-user support (owner/admin)
- Document request and collection workflow
- Client portal with branding
- Secure file upload and storage

This represents a significant upgrade from "nexus calculator" to "practice management platform."

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Portal security concerns | Third-party security audit, penetration testing |
| Integration API changes | Version monitoring, abstraction layer |
| State data accuracy | Verification workflow, multiple sources |
| Filing liability | Legal review, E&O insurance, consider partnership |
| Multi-tenant migration | Careful migration plan, rollback capability |

---

## Resource Considerations

| Phase | Backend | Frontend | External |
|-------|---------|----------|----------|
| 1 | Database, API updates | New components, navigation | - |
| 2 | Storage, portal auth | Portal app, upload UI | File scanning service |
| 3 | Data import, automation | States UI | Data sources |
| 4 | OAuth, background jobs | Integration UI | Platform APIs |
| 5 | Filing data model | Calendar, tracking UI | - |
| 6 | Calculation engine, forms | Filing UI | E-file APIs or partner |

---

## Related Documents

- [Platform Vision](./platform-vision.md) - Strategic direction and feature details
- [Sprint Roadmap](../plans/ROADMAP.md) - Near-term technical sprints

---

*This document will be updated as phases are completed and priorities evolve.*
