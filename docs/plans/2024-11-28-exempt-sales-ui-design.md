# Exempt Sales UI Design

**Date:** 2024-11-28
**Status:** Draft for Review
**Goal:** Allow users to mark transactions as exempt and manage exemptions themselves

---

## Design Philosophy

Per your requirement: Users control exemptions, removing determination liability from NexusCheck. We provide the tools; they make the decisions.

**Key Principles:**
1. User-controlled - Users mark exempt, not the system
2. Transparent - Clear what's exempt and why (user's notes)
3. Reversible - Can un-exempt anything
4. Audit trail - Track what changed and when
5. Recalculates - Liability updates after exemption changes

---

## User Flow

### Flow 1: Mark Single Transaction as Exempt

1. User views Transaction Table on State Detail page
2. User clicks checkbox or "Mark Exempt" button on a row
3. Modal appears:
   - Exempt Amount: [defaults to full sales_amount, editable]
   - Reason (optional): [dropdown + free text]
     - Resale certificate
     - Government/nonprofit purchaser
     - Product exempt in this state
     - Other (specify)
   - Note (optional): [free text for user's records]
4. User clicks "Mark as Exempt"
5. Row updates to show exempt status
6. Toast: "Transaction marked as exempt. Recalculating..."
7. Liability recalculates automatically

### Flow 2: Bulk Mark Transactions as Exempt

1. User enables "Selection Mode" toggle
2. Checkboxes appear on each row
3. User selects multiple transactions
4. Clicks "Mark Selected as Exempt" button
5. Modal appears:
   - [N] transactions selected
   - Apply to: Full amount / Partial amount
   - Reason (optional): [same dropdown]
   - Note (optional): [free text]
6. User confirms
7. All selected rows update
8. Liability recalculates

### Flow 3: Remove Exemption

1. User clicks on exempt transaction (shown with visual indicator)
2. Clicks "Remove Exemption" or unchecks exempt checkbox
3. Confirmation: "This will make the transaction taxable again"
4. User confirms
5. Liability recalculates

### Flow 4: View/Manage All Exemptions

1. New filter in Transaction Table: "Exempt Status" dropdown
   - All Transactions
   - Exempt Only
   - Taxable Only
2. When "Exempt Only" selected, shows all exempt transactions
3. Each row shows: Exempt amount, Reason, Note, Date marked

---

## UI Components

### 1. Transaction Table Enhancements

```
+------------------+-------------+----------+--------+--------+----------+----------+-------------+
| Date             | Transaction | Gross    | Taxable| Exempt | Channel  | Running  | Actions     |
|                  | ID          | Sales    |        |        |          | Total    |             |
+------------------+-------------+----------+--------+--------+----------+----------+-------------+
| Jan 15, 2024     | TXN-001     | $1,500   | $1,500 | -      | Direct   | $1,500   | [...]       |
| Jan 16, 2024     | TXN-002     | $2,000   | $0     | $2,000 | Direct   | $3,500   | [...]  [E]  |
| Jan 17, 2024     | TXN-003     | $800     | $800   | -      | Market   | $4,300   | [...]       |
+------------------+-------------+----------+--------+--------+----------+----------+-------------+

[E] = Exempt indicator badge
[...] = Actions dropdown menu
```

**New Elements:**
- Exempt indicator badge (green "E" or "EXEMPT" badge)
- Actions column with dropdown:
  - View Details
  - Mark as Exempt (if not exempt)
  - Edit Exemption (if exempt)
  - Remove Exemption (if exempt)
- Selection checkboxes (when selection mode enabled)
- Bulk action bar (appears when items selected)

### 2. Exemption Modal

```
┌─────────────────────────────────────────────────────┐
│  Mark Transaction as Exempt                      [X]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  Transaction: TXN-002                               │
│  Gross Sales: $2,000.00                             │
│  Current Exempt: $0.00                              │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Exempt Amount                                 │  │
│  │ [$2,000.00        ] [Full Amount]             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Exemption Reason (optional)                   │  │
│  │ [Select reason...               ▼]            │  │
│  │                                               │  │
│  │   ○ Resale certificate on file               │  │
│  │   ○ Government/nonprofit purchaser           │  │
│  │   ○ Product exempt in this state             │  │
│  │   ○ Manufacturing exemption                  │  │
│  │   ○ Agricultural exemption                   │  │
│  │   ○ Other                                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Notes (for your records)                      │  │
│  │ [                                           ] │  │
│  │ [                                           ] │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ⚠️  You are responsible for verifying this         │
│     exemption is valid. NexusCheck does not        │
│     validate exemption eligibility.                │
│                                                     │
│            [Cancel]  [Mark as Exempt]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3. Bulk Selection Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ ✓ 15 transactions selected    [Mark Exempt] [Clear Selection]      │
│   Total value: $45,230.00                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Exemption Summary Card (State Detail Page)

```
┌─────────────────────────────────────────┐
│  Exemption Summary                      │
├─────────────────────────────────────────┤
│  Total Exempt Sales:     $125,000       │
│  Exempt Transactions:    47             │
│                                         │
│  By Reason:                             │
│    Resale certificates:  $80,000 (32)   │
│    Product exemptions:   $30,000 (10)   │
│    Other:                $15,000 (5)    │
│                                         │
│  [Manage Exemptions →]                  │
└─────────────────────────────────────────┘
```

---

## Data Model Changes

### Data Model: Hybrid Approach (Transactions + Audit Log)

**1. Add columns to `sales_transactions` for current state:**
```sql
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS
  exemption_reason VARCHAR(100),
  exemption_reason_other VARCHAR(255),  -- Custom reason when "other" selected
  exemption_note TEXT,
  exemption_marked_at TIMESTAMPTZ,
  exemption_marked_by UUID REFERENCES auth.users(id);
```

Existing columns already support exemptions:
- `exempt_amount` - Amount exempt (can be partial)
- `is_taxable` - Boolean flag (TRUE if any amount is taxable)

**2. Create audit history table for full tracking:**
```sql
CREATE TABLE exemption_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,  -- 'created', 'updated', 'removed'

  -- What changed
  exempt_amount_before DECIMAL(15,2),
  exempt_amount_after DECIMAL(15,2),
  reason_before VARCHAR(100),
  reason_after VARCHAR(100),
  reason_other_before VARCHAR(255),
  reason_other_after VARCHAR(255),
  note_before TEXT,
  note_after TEXT,

  -- Who and when
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT fk_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

CREATE INDEX idx_exemption_audit_analysis ON exemption_audit_log(analysis_id);
CREATE INDEX idx_exemption_audit_transaction ON exemption_audit_log(analysis_id, transaction_id);
```

**Rationale:**
- Current state on transactions = fast queries, simple updates
- Audit log = full history, compliance documentation, undo capability

---

## API Endpoints

### 1. Update Single Transaction Exemption

```
PATCH /api/v1/analyses/{analysis_id}/transactions/{transaction_id}/exemption

Request:
{
  "exempt_amount": 2000.00,
  "reason": "resale_certificate",
  "note": "Certificate #12345 on file"
}

Response:
{
  "success": true,
  "transaction_id": "TXN-002",
  "exempt_amount": 2000.00,
  "recalculation_triggered": true
}
```

### 2. Bulk Update Exemptions

```
PATCH /api/v1/analyses/{analysis_id}/transactions/bulk-exemption

Request:
{
  "transaction_ids": ["TXN-002", "TXN-005", "TXN-008"],
  "exempt_full_amount": true,  // or "exempt_amount": 500.00 for partial
  "reason": "government_purchaser",
  "note": "State agency purchase order"
}

Response:
{
  "success": true,
  "updated_count": 3,
  "recalculation_triggered": true
}
```

### 3. Remove Exemption

```
DELETE /api/v1/analyses/{analysis_id}/transactions/{transaction_id}/exemption

Response:
{
  "success": true,
  "transaction_id": "TXN-002",
  "recalculation_triggered": true
}
```

### 4. Get Exemption Summary

```
GET /api/v1/analyses/{analysis_id}/exemptions/summary

Response:
{
  "total_exempt_amount": 125000.00,
  "exempt_transaction_count": 47,
  "by_reason": {
    "resale_certificate": { "amount": 80000, "count": 32 },
    "government_purchaser": { "amount": 30000, "count": 10 },
    "other": { "amount": 15000, "count": 5 }
  }
}
```

---

## Implementation Phases

### Phase 1: Backend API (Day 1)
- [ ] Add exemption columns to sales_transactions (migration)
- [ ] Create PATCH endpoint for single transaction exemption
- [ ] Create PATCH endpoint for bulk exemption
- [ ] Create DELETE endpoint to remove exemption
- [ ] Trigger recalculation after exemption changes
- [ ] Add exemption summary endpoint

### Phase 2: Transaction Table UI (Day 2)
- [ ] Add "Exempt" badge to exempt transactions
- [ ] Add Actions dropdown with exemption options
- [ ] Create ExemptionModal component
- [ ] Wire up single transaction exemption flow
- [ ] Add exemption status filter

### Phase 3: Bulk Operations (Day 3)
- [ ] Add selection mode toggle
- [ ] Add row checkboxes
- [ ] Add bulk action bar
- [ ] Create BulkExemptionModal
- [ ] Wire up bulk exemption flow

### Phase 4: Exemption Summary (Day 4)
- [ ] Add ExemptionSummaryCard component
- [ ] Display on State Detail page
- [ ] Link to filtered transaction view

---

## Design Decisions (Confirmed)

1. **Partial exemptions**: YES - Users can mark partial amounts as exempt (e.g., $500 of a $2000 sale)

2. **Exemption reasons**: Predefined list + custom "Other" with free text input
   - Resale certificate
   - Government/nonprofit
   - Product exempt in this state
   - Manufacturing exemption
   - Agricultural exemption
   - Other: [user enters custom reason]

3. **Recalculation timing**: Batch changes with "Save & Recalculate" button
   - Rationale: Avoids multiple recalculations when marking many transactions
   - User makes changes → sees pending indicator → clicks "Save & Recalculate"
   - Better UX for bulk operations

4. **Audit history**: Full history tracking
   - Track every exemption change (add, modify, remove)
   - Store: who, when, what changed, previous value
   - Enables compliance documentation and undo capability

---

## Disclaimer Text

Display prominently when marking exemptions:

> **Important:** You are responsible for verifying that exemptions are valid and properly documented. NexusCheck does not validate exemption eligibility or certificates. Consult with a tax professional if you are unsure whether a sale qualifies for exemption.

---

*Ready for review. Please provide feedback on the design before implementation begins.*
