# Revenue Stream Column Addition - Summary

**Date:** 2025-11-13
**Sprint:** Sprint 1, Days 6-8 Enhancement
**Status:** Implementation Ready

---

## Overview

Added support for a `revenue_stream` column to help users categorize sales by product/service type. This optional column provides:

1. **Better categorization** - Group sales by type for reporting and analysis
2. **Taxability guidance** - Links to typical taxability rules by category
3. **Future automation** - Foundation for automatic exempt sales suggestions

---

## What Changed

### 1. Backend: Column Detector Enhanced

**File:** `backend/app/services/column_detector.py`

**Added:**
- `revenue_stream` field to `COLUMN_PATTERNS` with 19 common aliases:
  - `revenue_stream`, `revenue stream`
  - `product_type`, `product_category`, `item_type`, `item_category`
  - `category`, `product_line`, `revenue_type`
  - `goods_type`, `service_type`, `line_of_business`, `sku_category`, `business_line`

- `normalize_revenue_stream()` static method:
  - Normalizes user input to standard categories
  - Handles 8 common categories: food_beverage, clothing, digital_goods, services, manufacturing_equipment, resale, medical, physical_products
  - Preserves original value if no match found

- `get_revenue_stream_taxability_guidance()` static method:
  - Provides taxability guidance for each category
  - Includes typical rules, notes, and examples
  - Emphasizes state-specific variation and professional consultation

### 2. Database: New Column Added

**File:** `backend/migrations/014_add_revenue_stream_and_exempt_columns.sql`

**Changes:**
- Added `revenue_stream VARCHAR(100)` to `sales_transactions` table
- Added exempt sales columns: `is_taxable`, `exempt_amount`, `taxable_amount`
- Added summary columns to `state_results`: `gross_sales`, `taxable_sales`, `exempt_sales`
- Created indexes for efficient filtering on `revenue_stream` and `is_taxable`
- Added comprehensive comments explaining usage

**Note:** This migration handles BOTH revenue streams AND the exempt sales columns needed for Day 8.

### 3. Documentation: Sprint 1 Plan Updated

**File:** `docs/plans/sprint-1/03-column-detection-exempt-sales.md`

**Updates:**
- Added "Revenue stream tracking" to overview
- Added `revenue_stream` to `COLUMN_PATTERNS` in documentation
- Updated CSV template to include `revenue_stream` column
- Added "Revenue Streams (Optional)" section with:
  - List of recognized categories
  - Example CSV usage
  - Normalization explanation
  - Clarification that it doesn't auto-determine taxability
- Updated all 3 examples to show revenue streams in action:
  - Example 1: Grocery store (food_beverage)
  - Example 2: Clothing with partial exemption (clothing)
  - Example 3: Wholesale vs. retail (resale + physical_products)

---

## Revenue Stream Categories

### Recognized & Normalized

| Category | Typical Taxability | Common Uses |
|----------|-------------------|-------------|
| `food_beverage` | Often exempt | Groceries, unprepared food (prepared usually taxable) |
| `clothing` | Varies by state | Some states exempt entirely, some have thresholds |
| `digital_goods` | Increasingly taxable | Software, SaaS, downloads, streaming |
| `services` | Often exempt | Consulting, professional services, labor |
| `manufacturing_equipment` | Often exempt | Industrial machinery, production equipment |
| `resale` | Exempt with cert | Wholesale purchases for resale |
| `medical` | Often exempt | Prescription drugs, some medical equipment |
| `physical_products` | Generally taxable | Tangible personal property, merchandise |

### Example Normalizations

The system automatically normalizes variants:
- "groceries", "food", "F&B" → `food_beverage`
- "apparel", "garments", "fashion" → `clothing`
- "software", "SaaS", "downloads" → `digital_goods`
- "consulting", "professional services" → `services`
- "wholesale", "for resale" → `resale`

---

## Integration with Exempt Sales

The `revenue_stream` column works **alongside** the exempt sales columns:

```csv
transaction_date,customer_state,revenue_amount,revenue_stream,is_taxable,exempt_amount
01/15/2024,CA,1250.00,physical_products,Y,
01/16/2024,NY,450.00,food_beverage,N,
01/17/2024,TX,3000.00,clothing,,500.00
```

**How they work together:**
1. **revenue_stream** = Categorization (what type of sale?)
2. **is_taxable** = Binary taxability (yes/no)
3. **exempt_amount** = Partial exemption (dollar amount)

**Important:** Revenue stream does NOT automatically determine taxability. Users must still explicitly mark exempt sales using `is_taxable` or `exempt_amount`.

**Future Enhancement Possibility:** Could use revenue stream + state to suggest default taxability (e.g., "food_beverage in CA → likely exempt"), but always allow user override.

---

## Example Use Cases

### Use Case 1: Multi-Category Retailer

A retailer selling both clothing and general merchandise:

```csv
transaction_date,customer_state,revenue_amount,revenue_stream,exempt_amount
01/15/2024,NY,150.00,clothing,110.00
01/15/2024,NY,200.00,physical_products,0
```

- Clothing: Partial exemption (NY exempts first $110)
- Physical products: Fully taxable
- Revenue stream helps separate the two categories in reporting

### Use Case 2: Wholesale + Retail Business

A business with both wholesale and retail channels:

```csv
transaction_date,customer_state,revenue_amount,revenue_stream,is_taxable
01/15/2024,TX,5000.00,resale,N
01/16/2024,TX,2000.00,physical_products,Y
```

- Resale: Exempt (customer has resale certificate)
- Retail: Taxable
- Revenue stream helps track wholesale vs. retail performance

### Use Case 3: SaaS Company

A software company with different product types:

```csv
transaction_date,customer_state,revenue_amount,revenue_stream
01/15/2024,CA,1250.00,digital_goods
01/16/2024,NY,2500.00,services
```

- Digital goods: Software subscriptions (taxability varies by state)
- Services: Consulting/support (often exempt)
- Revenue stream helps categorize different offerings

---

## Files Modified

### Backend
1. ✅ `backend/app/services/column_detector.py` - Added revenue_stream detection and normalization
2. ✅ `backend/migrations/014_add_revenue_stream_and_exempt_columns.sql` - Database schema changes

### Documentation
3. ✅ `docs/plans/sprint-1/03-column-detection-exempt-sales.md` - Updated plan with revenue streams
4. ✅ `docs/plans/sprint-1/REVENUE_STREAM_ADDITION.md` - This summary document

### Future Files (To Be Created/Updated During Days 6-8 Implementation)
- `backend/templates/csv_template.csv` - Add revenue_stream column
- `frontend/components/analysis/CSVPreview.tsx` - Show revenue stream in preview
- `frontend/components/analysis/StateTable.tsx` - Option to filter by revenue stream
- Frontend type definitions for revenue stream field

---

## Testing Checklist

When implementing Days 6-8, test:

- [ ] CSV with revenue_stream column uploads successfully
- [ ] Various revenue_stream values normalize correctly:
  - [ ] "groceries" → "food_beverage"
  - [ ] "software" → "digital_goods"
  - [ ] "apparel" → "clothing"
  - [ ] "consulting" → "services"
  - [ ] "wholesale" → "resale"
- [ ] Unknown values preserved as-is
- [ ] Revenue stream appears in transaction data
- [ ] Revenue stream can be used for filtering/grouping
- [ ] Taxability guidance API returns correct information
- [ ] CSV without revenue_stream still works (backward compatible)

---

## API Endpoints (Future Enhancement)

Could add an endpoint to get taxability guidance:

```
GET /api/v1/revenue-streams/guidance?stream=food_beverage

Response:
{
  "revenue_stream": "food_beverage",
  "typically_taxable": false,
  "notes": "Often exempt for unprepared food; prepared food usually taxable...",
  "examples": "Groceries (exempt in most states), Restaurant meals (taxable...)"
}
```

This could power tooltips or help text in the UI.

---

## Notes

**Why this matters:**
1. Provides better insights into sales mix
2. Foundation for future automation/suggestions
3. Helps users organize complex product catalogs
4. Links naturally to taxability rules

**Key principles:**
1. **Optional** - Users not required to provide it
2. **Non-deterministic** - Doesn't auto-set taxability (user control)
3. **Flexible** - Preserves user's values if not matching standards
4. **Informative** - Provides guidance without being prescriptive

---

**Status:** ✅ Ready for Days 6-8 implementation
**Next Steps:** Implement remaining Days 6-8 tasks (normalization logic, frontend updates, testing)
