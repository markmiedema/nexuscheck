# SALT Professional Task Breakdown

**Last Updated:** 2025-11-11 (header clarification added)
**Originally Created:** 2025-11-01
**Document Type:** Reference - Historical planning artifact
**Purpose:** Documents the tasks that Nexus Check was designed to automate

**Note:** This document was created during initial planning (Nov 2025) to identify automation opportunities. Many of these tasks are now automated in the production application. See `_05-development/CURRENT_STATUS_2025-11-05.md` for current feature status.

---

## Overview

This document catalogs all typical tasks a SALT tax professional at a boutique agency performs, organized by workflow phase. Each task is assessed for automation potential.

**Key:**
- *** = MVP target (highest value)
- ** = High automation potential
- * = Medium automation potential
- [ ] = Low automation potential (human expertise required)

---

## Phase 1: Client Acquisition & Scoping

### Tasks:
1. **Initial client consultation** - Assess needs, explain services
2. **Scope definition** - Determine what analysis is needed
3. **Writing engagement letters** - Legal agreement outlining scope, fees, terms
4. **Proposal creation** - Detailed SOW and pricing
5. **Fee estimation** - Calculate hours and pricing
6. **Contract negotiation** - Discuss terms with client

**Automation Potential:** * Medium
- Templates + AI can speed up engagement letter/proposal creation
- Fee estimation could be guided by complexity analysis
- Initial consultation requires human touch

**Time Investment:** 2-4 hours per engagement

---

## Phase 2: Data Collection & Preparation

### Tasks:
1. **Requesting sales data from clients** - Email templates, data specifications
2. **Data cleaning** - Fix formatting, remove duplicates, handle missing values
3. **Data standardization** - Convert to consistent format
4. **Validating data completeness** - Ensure all required fields present
5. **Organizing multi-year records** - Structure chronologically, by state
6. **Identifying data gaps** - Find missing periods or states
7. **Converting formats** - From various systems to workable Excel

**Automation Potential:** ** High
- Data validation and cleaning highly automatable
- Format conversion can be systematized
- Request templates can be standardized

**Time Investment:** 2-4 hours per engagement (often underestimated)

---

## Phase 3: Nexus Analysis *** MVP TARGET

### Tasks:
1. **Economic nexus determination** - Check revenue/transaction thresholds by state
2. **Physical nexus evaluation** - Document physical presence by state
3. **Affiliate nexus analysis** - Evaluate related entity presence
4. **Marketplace facilitator analysis** - Determine which sales were facilitated
5. **Threshold tracking** - Revenue and transaction count by state
6. **Historical nexus determination** - When did nexus begin in each state?
7. **Multi-state nexus summary** - Create comprehensive state-by-state report

**Automation Potential:** *** VERY HIGH
- Most time-consuming manual task (12-20 hours)
- Highly systematic process
- Perfect for automation

**Time Investment:** 12-20 hours per engagement (CURRENT)
**Time Investment with Tool:** <1 hour (TARGET)

---

## Phase 4: Liability Estimation *** MVP TARGET

### Tasks:
1. **Tax rate research** - State + average local rates
2. **Calculating uncollected tax** - By state and period
3. **Interest calculation** - State-specific interest rates on unpaid liabilities
4. **Penalty estimation** - Basic penalty calculation
5. **Liability summary by state** - Total exposure per state
6. **Multi-year lookback calculation** - Historical liability across years
7. **Exposure analysis report** - Total risk quantification

**Automation Potential:** *** VERY HIGH
- Systematic calculation process
- Natural pairing with nexus analysis
- Clear rules-based logic

**Time Investment:** 4-6 hours (included in 12-20 hour nexus analysis time)

---

## Phase 5: Compliance Assessment

### Tasks:
1. **Reviewing existing registrations** - Where is client currently registered?
2. **Identifying missing registrations** - Gap analysis
3. **Assessing current filing status** - Are they filing where they should?
4. **Gap analysis** - Should be vs. are registered
5. **Compliance risk assessment** - Prioritize states by risk

**Automation Potential:** ** High
- Flows naturally from nexus analysis
- Can be systematized once nexus is determined

**Time Investment:** 2-3 hours per engagement

---

## Phase 6: VDA (Voluntary Disclosure Agreement) Process

### Tasks:
1. **Determining VDA eligibility** - Which states accept VDA?
2. **Preparing VDA applications** - State-specific forms and letters
3. **Calculating limited lookback exposure** - Reduced liability under VDA
4. **Drafting VDA correspondence** - Letters to revenue departments
5. **Negotiating with states** - Back-and-forth on terms
6. **Managing VDA timeline** - Track deadlines and responses

**Automation Potential:** * Medium (preparation) / [ ] Low (negotiation)
- Form preparation can be automated
- Calculation systematic
- Negotiation requires human expertise

**Time Investment:** 8-15 hours per VDA (varies by complexity)

---

## Phase 7: Registration

### Tasks:
1. **Preparing registration applications** - State-specific forms
2. **Gathering business information** - EIN, officers, business structure
3. **Completing state-specific forms** - Each state has unique requirements
4. **Tracking registration status** - Follow up with states
5. **Managing credentials** - Store login info and certificates

**Automation Potential:** * Medium
- Form-filling can be automated
- State-specific variations are tricky
- Follow-up tracking can be systematized

**Time Investment:** 1-2 hours per state

---

## Phase 8: Return Preparation & Filing

### Tasks:
1. **Preparing sales tax returns** - Monthly, quarterly, or annual
2. **Calculating tax due** - By jurisdiction
3. **Managing filing deadlines** - Track due dates by state
4. **E-filing submissions** - Submit through state portals
5. **Payment processing** - Arrange payment of tax due
6. **Reconciling returns** - Match to liability estimates

**Automation Potential:** ** High
- Repetitive calculation and form completion
- Filing can be systematized
- Payment requires client approval

**Time Investment:** 2-4 hours per filing cycle (per state)

---

## Phase 9: Audit Support

### Tasks:
1. **Responding to audit notices** - Initial response letters
2. **Preparing audit documentation** - Transaction records, exemption certificates
3. **Transaction-level analysis** - Detailed review of questioned items
4. **Preparing audit defense materials** - Position papers, case law
5. **Negotiating audit findings** - Dispute assessments
6. **Managing audit timelines** - Meet deadlines, coordinate meetings

**Automation Potential:** * Medium (document prep) / [ ] Low (strategy)
- Document organization can be automated
- Analysis tools can help find patterns
- Strategy and negotiation require expertise

**Time Investment:** 20-60 hours per audit (highly variable)

---

## Phase 10: Ongoing Monitoring & Updates

### Tasks:
1. **Monitoring nexus threshold changes** - Track legislative changes
2. **Tracking new legislation** - Stay current on rule changes
3. **Alerting clients to new nexus** - When thresholds are crossed
4. **Quarterly/annual data review** - Check for new nexus triggers
5. **Economic nexus recalculation** - Update as sales change

**Automation Potential:** ** High
- Perfect for automation with periodic data uploads
- Threshold monitoring is systematic
- Alerts can be automatically generated

**Time Investment:** 1-2 hours per client per quarter

---

## Phase 11: Research & Analysis

### Tasks:
1. **State-specific tax law research** - Statutes, regulations, guidance
2. **Product taxability research** - Is product X taxable in state Y?
3. **Exemption certificate validation** - Verify certificates are valid
4. **Use tax analysis** - Determine use tax obligations
5. **Sourcing rule determination** - Origin vs. destination sourcing

**Automation Potential:** ** Medium-High
- Database + AI can handle much of this
- Nuanced questions require human judgment
- Common questions can be systematized

**Time Investment:** 1-4 hours per specific research question

---

## Phase 12: Client Communication & Reporting

### Tasks:
1. **Creating executive summaries** - High-level findings for management
2. **Generating detailed technical reports** - Full analysis documentation
3. **Preparing presentation decks** - Client meeting materials
4. **Sending status updates** - Regular communication
5. **Answering client questions** - Ongoing support
6. **Documentation and record keeping** - File management

**Automation Potential:** ** High
- Report generation highly automatable
- Templates can standardize outputs
- Q&A requires human touch

**Time Investment:** 3-6 hours per engagement for deliverables

---

## Summary: Automation Opportunity

### Highest Value (MVP):
- **Nexus Analysis** (12-20 hours -> <1 hour)
- **Liability Estimation** (included in above)
- **Report Generation** (3-4 hours -> minutes)

**Total MVP Time Savings: 15-23 hours per engagement**

### High Value (Next Phases):
- Data preparation (2-4 hours saved)
- Compliance gap analysis (2-3 hours saved)
- Ongoing monitoring (1-2 hours saved per quarter)
- Return preparation (2-4 hours saved per filing)

### Medium Value (Future):
- VDA preparation (4-6 hours saved)
- Registration applications (1-2 hours saved per state)
- Research assistance (varies)

### Low Value (Not Worth Automating):
- Client consultation (requires human touch)
- Negotiation (requires expertise)
- Audit strategy (requires judgment)
