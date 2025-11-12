# User Flow Mapping - Definition of "Good"

**Created:** 2025-11-02  
**Purpose:** Define success criteria for Phase 2, Step 3 (User Flow Mapping)  
**Status:** Ready to execute  
**Framework Applied:** Definition Framework (clarity before execution)

---

## Applying the Definition Framework

Before starting Phase 2 wireframes, this document defines what "good" looks like.

**Framework Steps:**
1. âœ… Surface the request - What is being asked for?
2. âœ… Define success - What would make this excellent vs. mediocre?
3. âœ… Clarify constraints - What boundaries, tone, format matter?
4. âœ… Identify failure conditions - What would immediately make this wrong?
5. â†’ Execute - Now deliver based on clear definition

---

## 1. What We're Creating

**Phase 2, Step 3 Deliverables:**
- End-to-end user journey map (landing â†’ report download)
- Detailed flow diagrams for each major phase
- Low-fidelity wireframes for key screens
- Error state documentation
- Edge case handling

**Purpose:**
- Blueprint for development team
- Validate data model supports UX needs
- Identify any gaps in technical specs
- Get feedback from potential pilot partners

**Audience:**
- Development team (must understand what to build)
- Pilot partners (for UX feedback)
- Future team members (onboarding reference)

---

## 2. Definition of Success

### Excellent User Flow Mapping Looks Like:

**For Developers:**
- âœ… Can start building with zero questions about UX
- âœ… Every user action has clear system response
- âœ… Error states are completely defined
- âœ… Edge cases have solutions

**For Users (Pilot Partners):**
- âœ… Flow feels intuitive and professional
- âœ… Never confused about what to do next
- âœ… 10-15 minutes from upload to report
- âœ… Errors are helpful, not frustrating

**For Product Quality:**
- âœ… Validates data model supports UX (or reveals gaps)
- âœ… Retention choice is clear and non-intimidating
- âœ… Error recovery paths preserve work
- âœ… Professional enough to show clients

### Mediocre User Flow Mapping Looks Like:

- Developer asks "what happens if...?" during implementation
- Some states have unclear next actions
- Error messages not defined
- Happy path only, no edge cases

### Failed User Flow Mapping:

- Reveals data model gaps during development (too late)
- Flow requires 30+ minutes (too complex)
- Dead ends (user stuck with no action)
- Unprofessional appearance

---

## 3. Constraints & Requirements

### Format Constraints:

**Tool:** Whimsical, Figma, or similar (your choice)

**Fidelity:** Low-fidelity (boxes, labels, flows)
- Not pixel-perfect mockups
- Focus on information architecture, not visual design
- Annotations more important than aesthetics

**Platform:** Desktop web app only (no mobile for MVP)

**File Format:** 
- PNG/PDF for easy viewing
- Editable source file for iteration

### Content Constraints:

**Scope:**
- âœ… Happy path (successful analysis)
- âœ… Common error states (validation fails, processing errors)
- âœ… Edge cases (partial data, browser closed, incomplete analysis)
- âŒ Payment flow (not part of analysis tool for MVP)
- âŒ Account settings (separate from analysis flow)
- âŒ Admin views (not user-facing)

**Tone:**
- Professional but not intimidating
- Clear over clever
- Helpful over terse
- Conservative design (SALT professionals expect seriousness)

### Technical Constraints:

**Must Support:**
- Auto-save every 30 seconds
- Resume incomplete analyses
- User-controlled retention choice
- Validation before processing
- Error recovery without re-upload
- Graceful degradation (partial results)

**Must Integrate:**
- Data model from Phase 1
- State rules database schema
- Error handling strategy
- Retention policies

---

## 4. Failure Conditions

### Immediate Failures:

**Technical Gaps:**
- âŒ Data model doesn't support a required UX feature
- âŒ State rules schema missing needed information
- âŒ Error states don't have recovery paths
- âŒ User can lose work in any scenario

**UX Failures:**
- âŒ User confused about what action to take
- âŒ Professional users feel it looks "cheap"
- âŒ Retention choice intimidates or confuses
- âŒ Error messages are generic or unhelpful

**Process Failures:**
- âŒ Developer builds wrong thing (wireframes were unclear)
- âŒ Takes >3 hours to create flows (overthinking/overdesigning)
- âŒ So high-fidelity that feedback focuses on colors not flows

---

## 5. Deliverable Specifications

### A. User Journey Map (Single Page)

**Purpose:** High-level overview of entire flow

**Format:**
```
[Landing] â†’ [Upload] â†’ [Validate] â†’ [Physical Nexus] â†’ 
[Processing] â†’ [Results Review] â†’ [Report Download] â†’ [Done]

With timing estimates under each phase
```

**Include:**
- Key decision points (retention choice, physical nexus)
- Where errors can occur
- Time estimate per phase
- Emotional journey (confident â†’ anxious â†’ relieved)

**Success:** Anyone can understand the flow in 30 seconds

---

### B. Detailed Flow Diagrams (5-7 Pages)

**Must Include:**

**1. Upload & Validation Flow**
```
Start â†’ Upload File â†’ Validate â†’ 
  Success? â†’ Physical Nexus Form
  Errors? â†’ Show Errors â†’ Fix â†’ Re-upload
```

**2. Physical Nexus Intake Flow**
```
Form â†’ State Selection â†’ Nexus Types â†’ Dates â†’
Review â†’ Save â†’ Processing
```

**3. Processing Flow**
```
Processing â†’ Progress Bar â†’ 
  Success? â†’ Results
  Error? â†’ Retry / Contact Support
  Partial? â†’ Results with Warnings
```

**4. Results Review Flow**
```
Results â†’ Review by State â†’ 
  Warnings? â†’ Flag for Review
  Good? â†’ Generate Report
```

**5. Report Generation & Download Flow**
```
Generate PDF â†’ 
  Success? â†’ Download
  Error? â†’ Retry / Export Excel
Delete Immediate? â†’ Delete Analysis
Keep? â†’ Save to Dashboard
```

**6. Error Recovery Flows**
```
Browser Closed â†’ Return â†’ Resume? â†’ Continue
Processing Failed â†’ Retry â†’ Success
Validation Failed â†’ Download Errors â†’ Fix â†’ Re-upload
```

**7. Dashboard & Saved Analyses**
```
Dashboard â†’ List Analyses â†’ 
  Resume Draft â†’ Continue
  View Complete â†’ Download Report
  Delete â†’ Confirm â†’ Remove
```

**Format:** Flowchart with decision diamonds, process boxes, annotations

---

### C. Wireframes (10-15 Screens)

**Low-Fidelity Requirements:**
- Boxes and labels (not styled)
- Annotations for interactions
- Show data, not lorem ipsum
- Desktop layout (1440px width reference)

**Key Screens:**

**1. Landing/Dashboard**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ SALT Tax Tool              [Profile] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                         â”‚
â”‚ Your Analyses                           â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”           â”‚
â”‚ â”‚ ACME Corp (2021-2024)    â”‚ [Resume]  â”‚
â”‚ â”‚ Status: Draft            â”‚           â”‚
â”‚ â”‚ Last saved: 2 hrs ago    â”‚ [Delete]  â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â”‚
â”‚                                         â”‚
â”‚ [+ New Analysis]                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**2. New Analysis Setup**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ New Analysis                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Client Company: [____________]          â”‚
â”‚ Period: [2021] to [2024]                â”‚
â”‚                                         â”‚
â”‚ Data Retention:                         â”‚
â”‚ â—‹ Delete immediately                    â”‚
â”‚ â— Keep 90 days (Recommended)            â”‚
â”‚ â—‹ Keep 1 year                           â”‚
â”‚                                         â”‚
â”‚ â“˜ Why this matters: [explanation]       â”‚
â”‚                                         â”‚
â”‚ [Continue]                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**3. File Upload**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Upload Sales Data                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚  Drag and drop Excel file here      â”‚ â”‚
â”‚ â”‚  or [Browse Files]                  â”‚ â”‚
â”‚ â”‚                                     â”‚ â”‚
â”‚ â”‚  Accepted: .xlsx, .xls, .csv        â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                         â”‚
â”‚ Required columns:                       â”‚
â”‚ â€¢ transaction_date                      â”‚
â”‚ â€¢ customer_state                        â”‚
â”‚ â€¢ sales_amount                          â”‚
â”‚ â€¢ sales_channel                         â”‚
â”‚                                         â”‚
â”‚ [Download Template]                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**4. Validation Error**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš ï¸ Validation Failed                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ We found 3 issues in your data:         â”‚
â”‚                                         â”‚
â”‚ âŒ Row 45: Invalid state code "C"       â”‚
â”‚    Suggestion: Did you mean CA or CT?   â”‚
â”‚                                         â”‚
â”‚ âŒ Row 67: Missing sales amount         â”‚
â”‚                                         â”‚
â”‚ âŒ Row 103: Future date (2026-01-15)    â”‚
â”‚                                         â”‚
â”‚ [Download Error Report]                 â”‚
â”‚ [Upload Fixed File]                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**5. Physical Nexus Form**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Physical Nexus                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Do you have physical presence?          â”‚
â”‚ â—‹ Yes  â—‹ No                             â”‚
â”‚                                         â”‚
â”‚ If Yes:                                 â”‚
â”‚ State: [CA â–¼]                           â”‚
â”‚ Type: â˜‘ Office â˜ Warehouse â˜ Employees â”‚
â”‚ Established: [2020-06-01]               â”‚
â”‚ Still active? â— Yes â—‹ No                â”‚
â”‚                                         â”‚
â”‚ [+ Add Another State]                   â”‚
â”‚                                         â”‚
â”‚ [Continue to Processing]                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**6. Processing Screen**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â³ Processing Analysis...                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â–“â–“â–“â–“â–“â–“â–“â–“â–“â–“â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ 50%              â”‚
â”‚                                         â”‚
â”‚ âœ“ Data validated (10,245 transactions) â”‚
â”‚ âœ“ Physical nexus processed (3 states)  â”‚
â”‚ â³ Analyzing economic nexus...          â”‚
â”‚ â¸ Calculating liability...              â”‚
â”‚ â¸ Generating report...                  â”‚
â”‚                                         â”‚
â”‚ This may take 1-2 minutes...            â”‚
â”‚ Auto-saving progress...                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**7. Results Summary**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Analysis Complete                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Nexus Found: 15 states                  â”‚
â”‚ Total Estimated Liability: $241,397     â”‚
â”‚                                         â”‚
â”‚ Top States by Liability:                â”‚
â”‚ â€¢ CA: $161,695                          â”‚
â”‚ â€¢ FL: $58,456                           â”‚
â”‚ â€¢ NY: $12,345                           â”‚
â”‚                                         â”‚
â”‚ âš ï¸ 2 states require manual review       â”‚
â”‚                                         â”‚
â”‚ [View Detailed Results]                 â”‚
â”‚ [Generate Report]                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**8. State Detail View**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ California Analysis                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Nexus Status: âœ“ Physical & Economic    â”‚
â”‚ Nexus Date: June 1, 2020               â”‚
â”‚                                         â”‚
â”‚ Sales Breakdown:                        â”‚
â”‚ Total: $2,745,000                       â”‚
â”‚ Direct: $1,647,000 (taxable)            â”‚
â”‚ Marketplace: $1,098,000 (excluded)      â”‚
â”‚                                         â”‚
â”‚ Estimated Liability: $161,695           â”‚
â”‚ â€¢ Base Tax: $135,878                    â”‚
â”‚ â€¢ Interest: $12,229                     â”‚
â”‚ â€¢ Penalties: $13,588                    â”‚
â”‚                                         â”‚
â”‚ [Show Calculation Details]              â”‚
â”‚ [â† Back to Summary]                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**9. Report Generated**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âœ“ Report Generated                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Your nexus analysis report is ready.    â”‚
â”‚                                         â”‚
â”‚ [Download PDF Report]                   â”‚
â”‚ [View Online]                           â”‚
â”‚ [Export to Excel]                       â”‚
â”‚                                         â”‚
â”‚ This analysis will be stored until:     â”‚
â”‚ February 1, 2026 (90 days)              â”‚
â”‚                                         â”‚
â”‚ [Delete Now] [Extend Retention]         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**10. Error State (Processing Failed)**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ âš ï¸ Processing Error                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ We encountered an issue processing      â”‚
â”‚ your analysis.                          â”‚
â”‚                                         â”‚
â”‚ Your data has been saved.               â”‚
â”‚                                         â”‚
â”‚ [Try Again]                             â”‚
â”‚ [View Saved Data]                       â”‚
â”‚ [Contact Support]                       â”‚
â”‚                                         â”‚
â”‚ Error ID: abc-123-def                   â”‚
â”‚ (Include this if contacting support)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Additional Screens:**
- Partial results with warnings
- Resume incomplete analysis prompt
- Delete confirmation
- Extend retention dialog
- Help/documentation

---

## 6. Success Metrics

### Quantitative:

**Time to Complete:**
- User journey map: 30 minutes
- Flow diagrams: 1.5 hours
- Wireframes: 1.5 hours
- Total: ~3.5 hours (within 3-4 hour estimate)

**Coverage:**
- âœ… 100% of happy path defined
- âœ… Top 5 error scenarios covered
- âœ… All edge cases from data model spec included
- âœ… Every screen has defined next action

### Qualitative:

**Developer Validation:**
- Show to developer â†’ They can start coding without questions

**User Validation:**
- Show to 2-3 SALT professionals â†’ They say "yes, this makes sense"

**Technical Validation:**
- Review against data model â†’ No gaps found

---

## 7. Execution Plan

### Time Allocation:

**Phase 1: User Journey Map (30 min)**
- High-level flow from start to finish
- Key decision points
- Timing estimates

**Phase 2: Detailed Flows (1.5 hours)**
- 7 detailed flow diagrams
- Error paths
- Edge cases

**Phase 3: Wireframes (1.5 hours)**
- 10-15 key screens
- Low-fidelity boxes and labels
- Annotations for interactions

**Phase 4: Review & Document (30 min)**
- Add annotations
- Check for gaps
- Prepare for feedback

**Total: 3.5 hours**

### Output Files:

```
04-technical-specs/
â”œâ”€â”€ user-flows/
â”‚   â”œâ”€â”€ 01-user-journey-map.png
â”‚   â”œâ”€â”€ 02-upload-validation-flow.png
â”‚   â”œâ”€â”€ 03-physical-nexus-flow.png
â”‚   â”œâ”€â”€ 04-processing-flow.png
â”‚   â”œâ”€â”€ 05-results-review-flow.png
â”‚   â”œâ”€â”€ 06-report-generation-flow.png
â”‚   â”œâ”€â”€ 07-error-recovery-flows.png
â”‚   â””â”€â”€ 08-dashboard-flow.png
â”œâ”€â”€ wireframes/
â”‚   â”œâ”€â”€ wireframes-annotated.pdf (all screens)
â”‚   â””â”€â”€ wireframe-source.fig (editable)
â””â”€â”€ user-flow-summary.md (this document + findings)
```

---

## 8. Validation Checklist

Before considering Phase 2 complete:

### Technical Validation:
- [ ] Every wireframe maps to data model
- [ ] All status states from analyses table represented
- [ ] Error types from error_logs table covered
- [ ] Retention policies from schema implemented in UX
- [ ] Auto-save mechanism visible to user
- [ ] Resume flow uses analyses.status correctly

### User Validation:
- [ ] No dead ends (every state has next action)
- [ ] Errors are actionable (user knows what to do)
- [ ] Professional appearance (not "cheap")
- [ ] Clear retention choice (not intimidating)
- [ ] 10-15 minute flow validated with stakeholder

### Developer Validation:
- [ ] No ambiguous interactions
- [ ] All edge cases defined
- [ ] API endpoints implied by flows
- [ ] State management requirements clear

---

## 9. Known Gaps to Address

### Questions to Answer in Phase 2:

**Upload Flow:**
- Show file size limit in UI?
- Progress bar during upload?
- Can user cancel mid-upload?

**Processing:**
- Show detailed progress or just spinner?
- Estimate time remaining?
- What if it takes longer than expected?

**Results Review:**
- One page or multiple tabs?
- Can user export individual state results?
- How much detail before generating report?

**Error Recovery:**
- How prominent is "Resume" prompt?
- Where in UI is incomplete analysis shown?
- Can user see partial progress before resuming?

---

## 10. Success Statement

**Phase 2 is successful when:**

A developer can take these wireframes and flows and start building Sprint 1 (Data Upload & Validation) with:
- âœ… Zero questions about what to build
- âœ… Clear understanding of all states
- âœ… Defined error handling for every scenario
- âœ… Confidence that UX will work for target users

And a pilot partner can review and say:
- âœ… "Yes, this is how I'd want to use it"
- âœ… "I understand every step"
- âœ… "This looks professional enough to show clients"

---

## Next Steps After Phase 2:

1. **Get Feedback** - Show to 2-3 pilot partners, gather input
2. **Iterate** - Adjust flows based on feedback
3. **Phase 3** - Detailed technical architecture
4. **Phase 4** - Begin development Sprint 1

---

**Status:** Definition complete - Ready to execute  
**Estimated Time:** 3-4 hours  
**Output Location:** `04-technical-specs/user-flows/`  
**Success Criteria:** Clear, comprehensive, and validated
