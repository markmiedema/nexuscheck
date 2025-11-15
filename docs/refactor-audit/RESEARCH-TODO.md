# Research & Verification To-Do List

**Purpose**: Items that need manual research/verification before v2 or when time permits
**Created**: 2025-01-14
**Priority**: 🟡 Important but not blocking for v1

---

## Marketplace Facilitator Rules - 3 States Need Verification

### Issue
Conflicting information from different sources about whether these states exclude marketplace sales from economic nexus threshold.

### States to Research

#### 1. Massachusetts (MA)
**Question**: Do marketplace facilitator sales count toward economic nexus threshold for individual sellers?

**Conflicting Sources**:
- Avalara (2024/2025): Says MF sales are **INCLUDED** (count toward threshold)
- Sales Tax Institute: Says MF sales are **EXCLUDED** (don't count toward threshold)

**Where to Research**:
- Massachusetts DOR Website: https://www.mass.gov/orgs/massachusetts-department-of-revenue
- Search for: "marketplace facilitator economic nexus threshold"
- Look for official guidance or regulations

**Current Setting**: `count_toward_threshold = TRUE` (conservative - assumes they count)

**Impact**: If we're wrong, we might tell MA sellers they have nexus when they don't (by a small margin)

---

#### 2. Michigan (MI)
**Question**: Do marketplace facilitator sales count toward economic nexus threshold for individual sellers?

**Conflicting Sources**:
- Avalara (2024/2025): Says MF sales are **INCLUDED** (count toward threshold)
- Sales Tax Institute: Says MF sales are **EXCLUDED** (don't count toward threshold)

**Where to Research**:
- Michigan Department of Treasury: https://www.michigan.gov/treasury
- Search for: "marketplace facilitator economic nexus seller threshold"
- Look for Revenue Administrative Bulletins (RABs)

**Current Setting**: `count_toward_threshold = TRUE` (conservative)

**Impact**: Michigan is a medium-sized market - accuracy matters

---

#### 3. New Mexico (NM)
**Question**: Do marketplace facilitator sales count toward economic nexus threshold for individual sellers?

**Conflicting Sources**:
- Avalara (2024/2025): Says MF sales are **INCLUDED** (count toward threshold)
- Sales Tax Institute: Says MF sales are **EXCLUDED** (don't count toward threshold)

**Where to Research**:
- NM Taxation & Revenue Department: https://www.tax.newmexico.gov/
- Search for: "marketplace facilitator economic nexus gross receipts"
- Look for Information Documents or FYIs

**Current Setting**: `count_toward_threshold = TRUE` (conservative)

**Impact**: Small market, lower priority

---

### How to Verify

**Step 1**: Visit each state's DOR website
**Step 2**: Look for marketplace facilitator laws/guidance
**Step 3**: Find the specific language about economic nexus thresholds
**Step 4**: Look for phrases like:
- "Sellers may exclude marketplace sales when calculating..."
- "Marketplace sales are included in determining nexus..."
- "For purposes of economic nexus, marketplace facilitator sales are..."

**Step 5**: Update the migration
```sql
-- If research shows EXCLUDE:
UPDATE marketplace_facilitator_rules
SET count_toward_threshold = FALSE
WHERE state = 'MA' AND effective_to IS NULL;

-- If research confirms INCLUDE:
-- No change needed (already TRUE)
```

**Step 6**: Document your findings in the migration comment

---

### When to Do This

**For v1 (Current Version)**: Not critical
- Conservative approach (TRUE) is safer
- Might slightly over-estimate nexus in these 3 states
- Users doing $90k direct + $15k marketplace in MA still need to verify anyway

**For v2 (VDA Version)**: Important
- VDA requires precision
- Must be 100% accurate for filing
- Do this research before launching VDA features

**Estimated Time**: 30-45 minutes total (10-15 min per state)

---

## Other Research Items

### To be added as we find more questions during implementation...

<!-- Template for future items:
### [Topic Name]

**Question**: What needs to be researched?

**Why It Matters**: Impact on accuracy/functionality

**Where to Research**: Links or sources

**Current Approach**: What we're doing now

**Priority**: 🔴 Critical / 🟡 Important / 🟢 Nice to Have

**Estimated Time**: X hours/days

---
-->

---

## Completed Research

### ✅ Marketplace Facilitator Rules - 17 States Verified
**Date Completed**: 2025-01-14
**Result**: Identified 17 states that exclude MF sales (AL, AR, AZ, CO, FL, GA, IL, IN, LA, ME, MO, ND, OK, TN, UT, VA, WY)
**Sources**: Avalara State-by-State Guide, Tax Foundation
**Action Taken**: Migration 020b created

---

## Notes

- Keep this list updated as you implement fixes and find new questions
- Prioritize research items that affect major markets (NY, CA, TX, FL, etc.)
- Document sources when you complete research
- Move completed items to "Completed Research" section with dates

---

*This is a living document - add new research questions as they come up!*
