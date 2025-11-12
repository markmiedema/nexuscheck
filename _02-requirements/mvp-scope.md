# MVP Scope Definition

**Last Updated:** 2025-11-11
**Location:** Save as `02-requirements/mvp-scope.md`

---

## MVP: 3-4 Year Lookback Analysis Tool

### Core Functionality

**What the MVP Does:**
Automates the most time-consuming part of a SALT engagement - the initial nexus determination and liability estimation for a 3-4 year historical period.

**Target Time Savings:**
- Current manual process: 12-20 hours
- With MVP: Minutes of processing + <1 hour review
- **Net savings: 11-19 hours per engagement**

---

## Included Features

### 1. Data Upload & Validation
- Accept Excel file uploads with sales transaction data
- Enhanced column detection with automatic normalization
- Validate data format and completeness
- Flag missing or problematic data
- Support multiple date formats with auto-detection
- State name normalization (e.g., "California" -> "CA")

**Required Excel columns:**
- Transaction Date
- State (destination state for sales tax purposes)
- Sales Amount
- Sales Channel (Marketplace/Direct)

**Optional columns (auto-detected):**
- is_taxable (Y/N for exempt vs. taxable sales)
- exempt_amount (dollar value of exempt portion)

### 2. Physical Nexus Management
- Capture physical presence by state (office, warehouse, employees, inventory)
- Record when physical nexus was established
- In-app CRUD interface (add, edit, delete states)
- Import/Export configuration as JSON
- Enable corrections/updates without re-uploading full dataset

**MVP Input Method:**
- Manual entry via in-app form after data upload
- Import/Export JSON for reuse across analyses
- CSV column support deferred to Phase 2

### 3. Economic Nexus Analysis
- Analyze sales by state against economic nexus thresholds
- Apply state-specific rules (revenue vs. transaction count)
- Account for marketplace facilitator rules by state
- Determine when economic nexus was triggered (historical lookback)
- Generate state-by-state nexus timeline

**Key intelligence:**
- Some states count marketplace sales toward thresholds, others don't
- Thresholds vary by state ($100k revenue, 200 transactions, or combination)
- Must track when thresholds were crossed, not just if they were crossed

### 4. Exempt Sales Handling
- Support both boolean (taxable Y/N) and dollar amount (exempt $) approaches
- Use **gross sales** (total revenue) for nexus threshold determination
- Use **taxable sales** (revenue minus exemptions) for liability calculation
- Clearly distinguish between sales for nexus vs. sales for liability
- Hybrid approach handles multiple industry data formats

**Why This Matters:**
- Prevents over-estimation of tax liability
- Critical for manufacturing, grocery, clothing industries with exemptions
- Nexus thresholds based on total sales, liability based on taxable sales

### 5. VDA Mode (Voluntary Disclosure Agreement)
- Model penalty/interest savings from VDA participation
- State selection UI (All states, None, Top N by liability/penalty)
- Before/after comparison (with VDA vs. without)
- Savings breakdown by state
- Pie chart visualization of exposure
- Binary waiver approach (penalty waived or not)

**Why This Matters:**
- VDA can save $50k+ in penalties on average
- Helps clients understand value of voluntary disclosure
- Critical for scoping VDA engagements

### 6. Liability Estimation
- Calculate estimated tax liability by state
- Use state rate + average local rate (not exact local rates - acceptable for estimates)
- Exclude marketplace-facilitated sales (marketplace collected tax)
- Calculate interest on unpaid liabilities (state-specific rates)
- Estimate penalties (basic calculation, not full VDA-level precision)
- Generate multi-year liability summary by state

**Accuracy target:** 90-95% (sufficient for initial estimates, VDA scoping)

### 7. Report Generation
- Professional nexus analysis report
- State-by-state nexus determination with dates
- Liability summary by state and year
- Total exposure estimate
- Executive summary for client presentation
- Export to PDF

**Report must be:**
- Professional enough for client delivery
- Require <1 hour of touch-up/review
- Include clear flagging of assumptions or edge cases

---

## Explicitly Out of Scope for MVP

### Not Included (Future Phases):
- âŒ Exact local tax rate lookups (use average local rates)
- âŒ Affiliate nexus analysis (flag for manual review if detected)
- âŒ Product taxability analysis
- âŒ Exemption certificate management
- âŒ VDA application preparation
- âŒ Registration form automation
- âŒ Return filing
- âŒ Ongoing monitoring/alerts
- âŒ Audit support
- âŒ Multi-user/team features
- âŒ Client portal
- âŒ API integrations with accounting systems

**Why exclude these:**
Focus on the highest-ROI feature first. These can be added once core nexus analysis is proven and adopted.

---

## Technical Constraints

### Data Handling:
- Excel-based input (no API integrations initially)
- Support .xlsx, .xls, .csv formats
- Handle files up to 100k transactions (typical for 3-4 year lookback)
- Process within 2-3 minutes max

### Accuracy Requirements:
- 90-95% accuracy on nexus determinations
- Clear flagging of edge cases requiring human review
- Conservative estimates (prefer slight overestimation of liability to underestimation)

### User Experience:
- No technical setup required
- Works in web browser
- Simple 3-step workflow: Upload â†' Review â†' Generate Report
- Minimal learning curve (5 minutes to first use)

### Reliability:
- Must handle messy real-world data (inconsistent formatting, missing values)
- Graceful error handling with clear messages
- Allow users to correct issues without starting over

---

## Success Criteria

### MVP is successful if:
1. **Time savings validated:** Users confirm 11+ hour savings per engagement
2. **Accuracy validated:** 90%+ accuracy on nexus determinations in real engagements
3. **Adoption:** Users willing to pay for the tool after trial
4. **Output quality:** Reports require minimal editing before client delivery
5. **Reliability:** Tool works consistently with various data formats

### MVP fails if:
1. Users still spend 8+ hours per engagement
2. Accuracy below 85% (too many corrections needed)
3. Reports require extensive rework
4. Tool can't handle real-world messy data
5. Users revert to manual processes

---

## Design Principles

### Keep It Simple:
- Don't add features users didn't ask for
- Prefer fewer features done well over many features done poorly
- Hide complexity behind simple interface

### Human in the Loop:
- Tool assists, doesn't replace professional judgment
- Always provide ability to review and adjust
- Flag confidence levels and assumptions
- Make it easy to override automated decisions

### Professional Output:
- Reports must look like they came from a tax professional
- No "generated by software" feel
- Appropriate level of detail and formatting

### Real-World Ready:
- Handle imperfect data
- Graceful degradation (work with incomplete data, note limitations)
- Clear error messages that help user fix issues

---

## Open Questions

[QUESTION] Should we support historical threshold changes? (e.g., state changed threshold from $500k to $100k in 2022)
- **Impact:** More accurate historical nexus determination
- **Complexity:** Requires tracking threshold history by state
- **Decision needed:** Yes for V1.1, not MVP

[QUESTION] How do we handle states with transaction-based thresholds when user only has revenue data?
- **Approach:** Flag for manual review or estimate average transaction value
- **Decision needed:** Before technical design

[RESOLVED 2025-11-11] Should physical nexus intake happen before or after data upload?
- **Decision:** After data upload
- **Rationale:** Physical nexus changes infrequently, manual entry acceptable, import/export enables reuse
- **Implementation:** Sprint 1, Days 1-2
