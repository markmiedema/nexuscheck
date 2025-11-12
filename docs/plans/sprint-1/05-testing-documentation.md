# Phase 5: Testing & Documentation (Days 11-12)

**Goal:** Comprehensive testing of all Sprint 1 features and complete user documentation.

**Why This Matters:** Testing catches bugs before users do. Documentation empowers users and reduces support burden.

---

## Day 11: Comprehensive Testing

### Test Data Preparation

Create test CSV files for various scenarios:

**File:** `test-data/sprint-1/test-scenarios.md`

```markdown
# Sprint 1 Test Scenarios

## 1. Baseline (All Taxable)
**File:** `test-all-taxable.csv`
```csv
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2024,CA,1250.00,direct
01/16/2024,NY,2100.00,direct
01/17/2024,TX,850.00,marketplace
01/18/2024,FL,1500.00,direct
```

**Expected:**
- All sales count toward nexus AND liability
- No exempt sales shown

---

## 2. Boolean Exempt (is_taxable)
**File:** `test-boolean-exempt.csv`
```csv
transaction_date,customer_state,revenue_amount,is_taxable,sales_channel
01/15/2024,CA,1250.00,Y,direct
01/16/2024,CA,2100.00,N,direct
01/17/2024,TX,850.00,Y,marketplace
01/18/2024,TX,1500.00,N,direct
```

**Expected:**
- CA: Gross $3350, Taxable $1250, Exempt $2100 (62.7%)
- TX: Gross $2350, Taxable $850, Exempt $1500 (63.8%)
- Nexus uses gross, liability uses taxable

---

## 3. Dollar Amount Exempt (exempt_amount)
**File:** `test-amount-exempt.csv`
```csv
transaction_date,customer_state,revenue_amount,exempt_amount,sales_channel
01/15/2024,CA,1250.00,0,direct
01/16/2024,CA,3000.00,500.00,direct
01/17/2024,TX,850.00,850.00,marketplace
```

**Expected:**
- CA: Gross $4250, Taxable $3750, Exempt $500 (11.8%)
- TX: Gross $850, Taxable $0, Exempt $850 (100%)

---

## 4. Hybrid (Both Columns)
**File:** `test-hybrid-exempt.csv`
```csv
transaction_date,customer_state,revenue_amount,is_taxable,exempt_amount,sales_channel
01/15/2024,CA,1250.00,Y,,direct
01/16/2024,CA,2100.00,N,,direct
01/17/2024,TX,3000.00,,500.00,marketplace
01/18/2024,FL,1500.00,,,direct
```

**Expected:**
- CA: Uses is_taxable (Taxable $1250)
- TX: Uses exempt_amount (Taxable $2500)
- FL: Default taxable (Taxable $1500)

---

## 5. Edge Cases
**File:** `test-edge-cases.csv`
```csv
transaction_date,customer_state,revenue_amount,exempt_amount,sales_channel
01/15/2024,CA,1000.00,1500.00,direct
01/16/2024,NY,-500.00,0,direct
01/17/2024,TX,0,0,marketplace
```

**Expected:**
- CA: Exempt > revenue (capped at $0 taxable)
- NY: Negative revenue (warning, should handle gracefully)
- TX: Zero amount (ignored or warning)

---

## 6. State Name Variations
**File:** `test-state-names.csv`
```csv
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2024,California,1250.00,direct
01/16/2024,NEW YORK,2100.00,direct
01/17/2024,tx,850.00,marketplace
01/18/2024,  FL  ,1500.00,direct
```

**Expected:**
- All normalized to uppercase 2-letter codes
- "California" → "CA"
- "NEW YORK" → "NY"
- "tx" → "TX"
- "  FL  " → "FL"

---

## 7. Date Format Variations
**File:** `test-date-formats.csv`
```csv
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2024,CA,1250.00,direct
2024-01-16,NY,2100.00,direct
01-17-2024,TX,850.00,marketplace
2024/01/18,FL,1500.00,direct
```

**Expected:**
- All dates parsed correctly
- Converted to consistent format

---

## 8. Sales Channel Variations
**File:** `test-channels.csv`
```csv
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2024,CA,1250.00,Amazon
01/16/2024,CA,2100.00,eBay
01/17/2024,TX,850.00,website
01/18/2024,TX,1500.00,DIRECT
```

**Expected:**
- "Amazon" → "marketplace"
- "eBay" → "marketplace"
- "website" → "direct"
- "DIRECT" → "direct"

---

## 9. Large Dataset (Performance)
**File:** `test-large-dataset.csv`
- 10,000+ transactions
- Multiple states
- Mix of taxable/exempt

**Expected:**
- Processing completes in < 60 seconds
- UI remains responsive
- No memory issues

---

## 10. Physical Nexus Integration
**Setup:**
- Upload test-all-taxable.csv
- Add physical nexus for CA (2020-01-01)
- Add physical nexus for NY (2021-06-15)

**Expected:**
- CA shows physical nexus date (2020-01-01)
- NY shows physical nexus date (2021-06-15)
- Physical nexus overrides economic nexus date
- Purple color on US map

---

## 11. VDA Mode
**Setup:**
- Use test with liability in CA, NY, TX, FL
- Enable VDA mode
- Select CA and TX

**Expected:**
- CA and TX show penalty waivers
- NY and FL unchanged
- Total savings calculated correctly
- Before/After comparison accurate
- Pie chart displays correctly

---

## 12. Multiple Calculation Methods (Future)
**Note:** Add when Sprint 2 implements multiple methods
```

---

### Testing Checklist

#### Backend API Tests

**Physical Nexus:**
- [ ] POST create physical nexus (valid data)
- [ ] POST create physical nexus (duplicate state) → 400 error
- [ ] POST create physical nexus (invalid state code) → 400 error
- [ ] GET list physical nexus (returns all for analysis)
- [ ] PATCH update physical nexus (valid update)
- [ ] DELETE delete physical nexus (removes successfully)
- [ ] POST import physical nexus (valid JSON)
- [ ] POST import physical nexus (invalid JSON) → 400 error
- [ ] GET export physical nexus (returns correct format)
- [ ] Verify RLS: User A cannot access User B's data

**VDA:**
- [ ] POST calculate VDA (valid state selection)
- [ ] POST calculate VDA (no states) → 400 error
- [ ] GET VDA status (returns correct state)
- [ ] DELETE disable VDA (clears settings)
- [ ] Verify calculations match expected savings
- [ ] Verify state_results updated with VDA data

**Column Detection:**
- [ ] Detect all variations of transaction_date
- [ ] Detect all variations of customer_state
- [ ] Detect all variations of revenue_amount
- [ ] Detect optional columns (is_taxable, exempt_amount)
- [ ] Normalize state names to codes
- [ ] Normalize date formats
- [ ] Normalize sales channels
- [ ] Calculate taxable_amount correctly (all 3 methods)

**Nexus Calculator:**
- [ ] Nexus uses gross sales
- [ ] Liability uses taxable sales
- [ ] Exempt sales tracked correctly
- [ ] Physical nexus overrides economic nexus date

---

#### Frontend Component Tests

**Physical Nexus Manager:**
- [ ] Displays list of physical nexus states
- [ ] Opens form modal on "Add State" click
- [ ] Form validation works (required fields)
- [ ] Creates new physical nexus successfully
- [ ] Edits existing physical nexus successfully
- [ ] Deletes physical nexus with confirmation
- [ ] Export downloads JSON file
- [ ] Import accepts valid JSON and updates list
- [ ] Shows empty state when no states configured

**VDA Mode Panel:**
- [ ] Loads VDA status on mount
- [ ] Toggle enables/disables VDA
- [ ] State selector shows all eligible states
- [ ] Preset buttons work (All, None, Top 3, Top 5)
- [ ] Calculate button triggers API call
- [ ] Shows loading state during calculation
- [ ] Displays results after calculation
- [ ] Shows before/after comparison
- [ ] Pie chart renders correctly
- [ ] Disable VDA clears all settings

**State Table:**
- [ ] Shows gross/taxable/exempt columns
- [ ] Exempt percentage badge displays correctly
- [ ] Tooltip explains gross vs taxable
- [ ] Sorting works on all columns
- [ ] Filtering works (nexus status, priority)
- [ ] Pagination works for 50+ states

**US Map:**
- [ ] Colors states correctly (physical/economic/approaching/none)
- [ ] Hover shows tooltip with data
- [ ] Click navigates to state detail
- [ ] Legend shows all color meanings
- [ ] Responsive on mobile/tablet/desktop

**State Detail Page:**
- [ ] Shows sales breakdown (gross/taxable/exempt)
- [ ] Explains how exempt affects calculations
- [ ] Shows liability breakdown
- [ ] Shows VDA savings if applicable
- [ ] Multi-year view works

---

#### Integration Tests

**End-to-End Flow 1: Basic Analysis**
1. [ ] Create analysis
2. [ ] Upload CSV (all taxable)
3. [ ] Verify column detection
4. [ ] Process analysis
5. [ ] View results
6. [ ] Click state on map → opens detail
7. [ ] Export results

**End-to-End Flow 2: With Physical Nexus**
1. [ ] Create analysis
2. [ ] Upload CSV
3. [ ] Add physical nexus for 2 states
4. [ ] Process analysis
5. [ ] Verify physical nexus shows in results
6. [ ] Verify purple color on map
7. [ ] Export physical nexus config

**End-to-End Flow 3: With Exempt Sales**
1. [ ] Create analysis
2. [ ] Upload CSV with is_taxable column
3. [ ] Verify preview shows exempt indicator
4. [ ] Process analysis
5. [ ] Verify gross vs taxable distinction
6. [ ] Verify nexus uses gross
7. [ ] Verify liability uses taxable

**End-to-End Flow 4: With VDA**
1. [ ] Create analysis
2. [ ] Upload CSV
3. [ ] Process analysis
4. [ ] Enable VDA mode
5. [ ] Select top 3 states
6. [ ] Calculate VDA
7. [ ] Verify savings shown
8. [ ] Export PDF with VDA (future)

---

#### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

#### Performance Tests

- [ ] Upload 10,000 row CSV → completes in < 60s
- [ ] Calculate nexus for 50 states → < 2s per state
- [ ] VDA calculation with 10 states → < 3s
- [ ] Page load times < 2s
- [ ] No memory leaks in long sessions
- [ ] UI remains responsive during calculations

---

#### Accessibility Tests

- [ ] Lighthouse score 90+ (accessibility)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces states correctly
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators visible
- [ ] ARIA labels present where needed
- [ ] Form errors announced

---

## Day 12: Documentation

### User Documentation

**File:** `docs/user-guide/README.md` (UPDATE)

```markdown
# Nexus Check User Guide

Welcome to Nexus Check! This guide will help you analyze your sales tax nexus and estimate your tax liability.

## Quick Start

1. [Create an Analysis](./01-create-analysis.md)
2. [Upload Your Data](./02-upload-data.md)
3. [Add Physical Nexus](./03-physical-nexus.md) (optional)
4. [Review Results](./04-review-results.md)
5. [Model VDA Scenarios](./05-vda-mode.md) (optional)
6. [Export Reports](./06-export-reports.md)

## Key Concepts

### Nexus
"Nexus" means you have a connection to a state requiring you to collect and remit sales tax.

**Types of Nexus:**
- **Physical Nexus:** Physical presence (office, warehouse, employees)
- **Economic Nexus:** Sales exceed state threshold (typically $100k-$500k)

### Exempt Sales
Some sales are not subject to sales tax (groceries, clothing exemptions, resale certificates).

**Important:** Exempt sales COUNT toward nexus thresholds but DON'T generate tax liability.

### VDA (Voluntary Disclosure Agreement)
Program allowing businesses to voluntarily report past-due taxes with:
- Reduced/waived penalties
- Limited lookback (3-4 years vs unlimited)
- No criminal liability

## Detailed Guides

- [Preparing Your CSV](./preparing-csv.md)
- [Handling Exempt Sales](./exempt-sales.md)
- [Physical Nexus Management](./physical-nexus.md)
- [Using VDA Mode](./vda-mode.md)
- [Understanding Results](./understanding-results.md)
- [Troubleshooting](./troubleshooting.md)
- [FAQ](./faq.md)
```

---

**File:** `docs/user-guide/02-upload-data.md` (NEW)

```markdown
# Uploading Your Data

## Required Columns

Your CSV must include these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `transaction_date` | Date of transaction | `01/15/2024` |
| `customer_state` | State shipped to | `CA` or `California` |
| `revenue_amount` | Sale amount | `1250.00` |

## Optional Columns

| Column | Description | Example |
|--------|-------------|---------|
| `sales_channel` | Marketplace or direct | `amazon` or `direct` |
| `is_taxable` | Is transaction taxable? | `Y` or `N` |
| `exempt_amount` | Dollar amount exempt | `500.00` |

## Column Name Flexibility

The system recognizes many column name variations:

**For transaction date:**
- `transaction_date`, `date`, `order_date`, `sale_date`, `invoice_date`

**For customer state:**
- `customer_state`, `state`, `ship_to_state`, `shipping_state`, `destination_state`

**For revenue:**
- `revenue_amount`, `amount`, `sales_amount`, `total`, `price`

**Case and spacing don't matter:**
- `transaction_date` = `Transaction Date` = `TRANSACTION_DATE`

## Supported Date Formats

The system auto-detects these formats:
- `01/15/2024` (MM/DD/YYYY)
- `2024-01-15` (YYYY-MM-DD)
- `01-15-2024` (MM-DD-YYYY)
- `2024/01/15` (YYYY/MM/DD)

## State Name Handling

You can use either:
- **State codes:** `CA`, `NY`, `TX`
- **Full names:** `California`, `New York`, `Texas`

The system automatically converts names to codes.

## Example CSV

Download our template: [CSV Template](../templates/csv_template.csv)

```csv
transaction_date,customer_state,revenue_amount,sales_channel,is_taxable
01/15/2024,CA,1250.00,direct,Y
01/16/2024,New York,2100.00,amazon,Y
01/17/2024,TX,850.00,direct,N
```

## Upload Process

1. **Click "Upload CSV"**
2. **Select your file** (drag-and-drop also works)
3. **Review preview** - System shows first 10 rows
4. **Confirm column detection** - Verify mappings are correct
5. **Click "Process"** - Analysis begins

## Common Issues

**Issue:** "Column not detected"
- **Solution:** Check your column names match supported variations

**Issue:** "Invalid state code"
- **Solution:** Verify state codes are valid US states

**Issue:** "Date parsing failed"
- **Solution:** Check date format consistency

**Issue:** "Too many errors"
- **Solution:** Fix errors in Excel and re-upload

## Best Practices

✅ **Use consistent date formatting**
✅ **Include all transactions** (even exempt ones)
✅ **Use state codes or full names** (not abbreviations like "Calif.")
✅ **Remove header/footer text** (CSV should only have data)
✅ **Test with small file first** (verify format before uploading thousands of rows)

## File Size Limits

- **Maximum size:** 50 MB
- **Maximum rows:** No hard limit, but 10,000+ may take 60+ seconds to process
- **Recommended:** One file per analysis period

## Need Help?

Check our [Troubleshooting Guide](./troubleshooting.md) or contact support.
```

---

### Update CSV Template

**File:** `backend/templates/csv_template.csv` (UPDATE)

```csv
transaction_date,customer_state,revenue_amount,sales_channel,is_taxable,exempt_amount
01/15/2024,CA,1250.00,direct,Y,
01/16/2024,NY,2100.00,amazon,Y,
01/17/2024,TX,850.00,direct,N,
01/18/2024,FL,3000.00,direct,,500.00
01/19/2024,GA,875.00,direct,,

# Instructions:
# 1. transaction_date: Date of sale (MM/DD/YYYY, YYYY-MM-DD, or other common formats)
# 2. customer_state: State code (CA, NY) or full name (California, New York)
# 3. revenue_amount: Sale amount in dollars
# 4. sales_channel: "direct" or "marketplace" (optional, helps with marketplace facilitator rules)
# 5. is_taxable: Y/N - Is this transaction taxable? (optional)
# 6. exempt_amount: Dollar amount exempt from tax (optional)
#
# Notes:
# - is_taxable and exempt_amount are OPTIONAL
# - If neither is provided, all sales are treated as taxable
# - Exempt sales count toward nexus but not liability
# - Use either is_taxable OR exempt_amount, or both
```

---

### API Documentation

**File:** `docs/api/README.md` (UPDATE)

Add documentation for new endpoints:
- Physical Nexus CRUD
- VDA calculation
- VDA status

(FastAPI auto-generates Swagger docs at `/docs`)

---

### Day 12 Tasks Checklist

**Testing:**
- [ ] Run all test scenarios (1-12)
- [ ] Document any bugs found
- [ ] Fix critical bugs
- [ ] Create issues for non-critical bugs
- [ ] Verify all checklists completed

**Documentation:**
- [ ] Update main README
- [ ] Create/update user guide sections
- [ ] Update CSV template with examples
- [ ] Add inline help text to UI
- [ ] Create FAQ document
- [ ] Update API documentation (Swagger)

**Final Review:**
- [ ] Code review (if team member available)
- [ ] Security review (check for vulnerabilities)
- [ ] Performance review (check slow queries)
- [ ] UX review (check for confusing flows)

---

## Summary: Days 11-12 Complete

At the end of this phase, you'll have:

✅ **Comprehensive Testing:**
- 12+ test scenarios created
- All features tested (backend + frontend)
- Integration tests passed
- Browser compatibility verified
- Performance benchmarked
- Accessibility validated

✅ **Complete Documentation:**
- User guide (all features)
- CSV template with examples
- API documentation
- Troubleshooting guide
- FAQ document
- Inline help text

✅ **Quality Assurance:**
- Zero critical bugs
- < 3 high-priority bugs
- All success criteria met
- Ready for production use

✅ **Sprint 1 Complete!**
- All features implemented
- All features tested
- All features documented
- Ready to ship! 🚀

---

**Next:** Proceed to **06-deliverables-next-steps.md** for wrap-up and Sprint 2 preview.
