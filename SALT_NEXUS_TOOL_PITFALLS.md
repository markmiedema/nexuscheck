# Building a SALT Nexus Analysis Tool: Pitfalls & Hard-Won Lessons

This document captures domain-specific gotchas discovered while building a production SALT (State and Local Tax) nexus analysis tool. These aren't implementation suggestions — they're warnings about where the domain will bite you if you're not careful.

---

## 1. Nexus Determination != Liability Calculation

This is the single most important distinction in the entire domain.

**Gross sales** determine whether you've crossed a state's nexus threshold. **Taxable sales** determine your actual liability. These are different numbers and must be tracked separately from day one.

Example: A business has $151K total sales in Illinois ($73.7K direct + $77.5K marketplace). They've crossed the $100K threshold — nexus is established. But liability is only calculated on the $73.7K in direct sales, because marketplace platforms already collected tax on the rest.

If you use one number for both, you'll either miss nexus triggers or overstate liability. Neither is acceptable.

---

## 2. Marketplace Sales: Count for Threshold, Exclude from Liability

About 30 states count marketplace facilitator sales toward the economic nexus threshold, while ~14 states do not. This split must be tracked per-state.

But here's the trap: even in states where marketplace sales count toward the threshold, they are excluded from the liability calculation (because the marketplace already remits). You need to carry both `total_sales` and `direct_sales` through your entire pipeline.

---

## 3. Nexus Is "Sticky"

Once a business establishes nexus in a state in any year, they generally maintain nexus in all subsequent years — even if their sales drop to zero. This is not intuitive and many implementations miss it.

Practical impact: If you process Year 1 and find nexus in California, then Year 2 California obligation starts January 1 automatically, regardless of Year 2 sales volume.

You need to track `first_nexus_year` and `first_nexus_date` per state and check them before running any threshold calculation for subsequent years.

---

## 4. Lookback Period Strategies Are Not Uniform

States use at least five different strategies to measure whether a threshold has been crossed:

| Strategy | Example States | How It Works |
|----------|---------------|--------------|
| Previous Calendar Year | Florida | Only prior year's sales matter |
| Current or Previous Calendar Year | Texas | Either year crossing threshold triggers nexus |
| Rolling 12 Months | Several | Any trailing 12-month window |
| Preceding 4 Sales Tax Quarters | New York, Vermont | Quarters don't align to calendar quarters |
| Custom Measurement Period | Connecticut (Oct 1 - Sep 30) | Completely different fiscal window |

If you hardcode "calendar year" as the only lookback strategy, you'll be wrong for ~5-8 states. Store the strategy type per state and dispatch accordingly.

---

## 5. Obligation Start Date Rules Vary

When nexus is established mid-year, the obligation to collect tax doesn't necessarily start immediately. Most states use "first day of the following month," but:

- Some states use "first day of the following quarter"
- Connecticut uses October 1 (for its Sep 30 measurement period)
- A few states have specific statutory start dates

**Critical subtlety**: Transactions between the nexus-trigger date and the obligation start date count toward nexus determination but NOT toward liability. Your calculation pipeline needs to filter transactions differently for these two purposes.

---

## 6. Interest Calculation Methods Vary Dramatically

Don't assume simple interest. States use at least three methods:

- **Simple interest**: Rate × Principal × Time (California, most common)
- **Compound monthly**: Texas uses 1.5% per month, which is dramatically different from 18% annual simple interest when compounded
- **Compound daily**: New York (rare but it exists)

A 1.5% monthly compound rate on a 3-year liability is ~70% of principal. Simple 18% annual over 3 years is 54%. That's a material difference for your users.

---

## 7. Penalty Rules Are Recipes, Not Percentages

Penalties look simple on the surface ("10% late filing penalty") but in practice:

- Some states have minimum and maximum penalty amounts
- Some states use tiered penalties based on days late
- Some states have per-period penalties with caps
- Some combine multiple penalty types with an aggregate cap
- VDA (Voluntary Disclosure Agreement) waivers are usually 100% of penalties but NOT interest — though a few states waive both

A flat percentage penalty model will be wrong for roughly a third of states. Plan for a per-state penalty configuration that can handle these variations.

---

## 8. State Name Normalization Will Haunt You

Real-world data files contain state identifiers in every format imaginable:

- `CA`, `Ca`, `ca`
- `California`, `CALIFORNIA`, `california`
- `Calif`, `Calif.`
- `New York`, `NewYork`, `NEW YORK`, `NY`

Without a comprehensive alias map (50+ entries), roughly 15% of uploaded files will have unparseable state codes. Build the normalization layer early and make it extensive.

---

## 9. Excel/CSV Upload Edge Cases

Things that will break your upload pipeline:

- **Multiple sheets**: Transaction data might be on "Sheet2" or "Data" — don't assume Sheet 1
- **Mixed date formats**: A single file might contain "Jan 15, 2024" in one column and "2024-01-15" in another
- **Date format ambiguity**: Is "01/02/2024" January 2nd or February 1st? You need to try multiple formats and pick the most likely
- **Column naming chaos**: "Revenue", "Sales Amount", "Total", "Gross Sales", "Amount", "sale_amt" — all mean the same thing
- **Empty rows/headers**: Files often have title rows, blank rows, or summary rows mixed in with data

Column auto-detection needs confidence scoring. Show users what you matched and let them correct low-confidence mappings before processing.

---

## 10. Exemption Handling Is the Hardest Data Problem

Different industries track exemptions differently in their source data:

- **Manufacturing**: Dollar amount exemptions ("$500 exempt from this transaction")
- **Retail**: Boolean flags ("Taxable? Y/N")
- **Wholesale**: Percentage-based ("90% taxable")
- **Mixed**: Taxability codes (T=Taxable, NT=Non-Taxable, E=Exempt, EC=Exempt with Certificate, P=Partially Exempt)

A single uploaded file might contain more than one of these approaches. You need a priority hierarchy for which field to trust when multiple are present, and you should document that hierarchy clearly for users.

---

## 11. Historical Thresholds Change

States periodically change their nexus thresholds. New York's threshold dropped from $500K to $100K. If a user analyzes 2020-2024 data, you need to apply the 2020 threshold to 2020 data and the current threshold to 2024 data.

This means your state rules table needs `effective_from` and `effective_to` date fields, not just current values. Even if you only support current rules for an MVP, design your schema to accommodate historical lookups — retrofitting this is painful.

---

## 12. Physical + Economic Nexus Can Coexist

Nexus type isn't an either/or. A company can have physical nexus (warehouse, employees) AND economic nexus (sales over threshold) in the same state simultaneously. Your data model needs to support `physical`, `economic`, `both`, and `none` — not a boolean.

Watch for the aggregation bug: if Year 1 establishes economic nexus and Year 2 adds physical nexus, the state-level summary should show `both`, not just whichever was most recent.

---

## 13. Combined Tax Rates Are Estimates

State tax rates are straightforward. But actual sales tax often includes city, county, and special district rates. For an MVP, a "combined average rate" per state gives ~85% accuracy. But be transparent with users that this is an estimate — actual liability depends on the buyer's specific jurisdiction, often down to the ZIP+4 level.

Don't promise precision you can't deliver. Label estimates as estimates.

---

## 14. Multi-Year Processing Order Matters

Always process years chronologically. If you process years out of order, sticky nexus logic breaks — you might miss that Year 1 established nexus before evaluating Year 2.

Within each year, process transactions chronologically too. The obligation start date determines which transactions generate liability, and you need to know the exact trigger date.

---

## 15. Security Concerns Specific to This Domain

This tool handles sensitive financial data. Things that matter more than usual:

- **File upload validation**: Check MIME type, not just extension. Scan for malicious content. Users are uploading financial spreadsheets which are high-value targets
- **Error messages**: Never return raw exception details to the client. Financial data field names in error messages leak business information
- **CORS**: Whitelist specific origins, don't use wildcards
- **Query parameters**: Bound your limit/offset values and search string lengths. Unbounded queries on transaction tables can be used for data extraction
- **Data retention**: Users expect control over how long their financial data is kept. Implement configurable retention with soft-delete recovery windows

---

## Summary: The Three Things That Will Cost You the Most Time

1. **Separating nexus determination from liability calculation** — Get this architecture right in week one or refactor everything later
2. **Per-state rule configuration** — Don't hardcode anything. Every "universal" rule has 5-8 state exceptions
3. **Multi-year chronological processing with sticky nexus** — This is where the calculation logic gets genuinely complex and where most bugs will hide
