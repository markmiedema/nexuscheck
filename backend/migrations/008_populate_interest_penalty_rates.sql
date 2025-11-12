-- Interest and Penalty Rates Population Script
-- Generated: 2025-11-02 (CORRECTED)
-- Covers: 47 jurisdictions (45 states + DC + PR with sales tax)
-- Excluded: AK, DE, MT, NH, OR (no sales tax)

-- DATA INTEGRITY APPROACH:
-- All research data preserved exactly as found
-- Schema adapted via migrations 006-007b to accommodate reality
--   * Migration 006: Added 'compound_annually' support for AZ/NJ
--   * Migration 007: Added late_payment_penalty_min/max fields
--   * Migration 007b: Added late_filing_penalty_min/max and interest_compounding_frequency

-- PREREQUISITES:
-- Run migrations 006, 007, and 007b BEFORE running this script

-- NOTE: Rates are stored as decimals (0.0800 = 8%), not percentages (8.00)

BEGIN;

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('CA', 0.0800, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, 500.00, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'CA offers penalty waiver for VDA. Interest accrues annually but applied to principal balance.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('TX', 0.0625, 'simple', NULL, NULL, 50.00, 50.00, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'TX offers penalty relief through VDA program. Late filing penalty is $50 flat fee (stored in min/max fields). Interest rate set by Comptroller quarterly.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('FL', 0.1200, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'FL waives penalties for VDA participants. Interest rate is statutory 12% per annum.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NY', 0.0750, 'compound_daily', 'daily', 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, 500.00, 500.00, FALSE, TRUE, 36, '2024-01-01', NULL, 'NY compounds interest daily. Late registration penalty is $500 flat fee (stored in min/max fields). VDA program offers penalty relief but not interest waiver.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('PA', 0.0300, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'PA has relatively low interest rate of 3%. VDA program offers penalty relief with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('IL', 0.0500, 'simple', NULL, 0.0200, NULL, NULL, 0.1500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'IL has low late filing penalty (2%) but high late payment penalty (15%). VDA offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('OH', 0.0500, 'simple', NULL, 0.1000, NULL, 5000.00, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'OH caps late filing penalty at $5,000. VDA program available with penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NC', 0.0500, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'NC has moderate penalty structure. VDA offers penalty waiver.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('GA', 0.0900, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'GA has high interest rate (9%) but moderate penalty rates. VDA program offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('WA', 0.1200, 'compound_monthly', 'monthly', 0.0500, NULL, NULL, 0.0900, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'WA has high interest rate (12%) compounded monthly. VDA program offers penalty relief with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NJ', 0.0625, 'compound_annually', 'annually', 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'NJ compounds interest annually. VDA offers penalty relief with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('VA', 0.0800, 'simple', NULL, 0.0600, NULL, NULL, 0.0600, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'VA has 8% simple interest. VDA program available with penalty waiver.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MA', 0.0700, 'compound_daily', 'daily', 0.0100, NULL, 0.2500, 0.0100, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'MA has low penalty rates (1% per month) but compounds interest daily. Late filing capped at 25%.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('AZ', 0.0300, 'compound_annually', 'annually', 0.1000, NULL, 0.2500, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'AZ compounds interest annually. Low interest rate (3%) but standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('TN', 0.0650, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'TN has moderate rates across the board. VDA program offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('IN', 0.1000, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'IN has uniform 10% rate for interest and penalties. VDA available with 3-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MI', 0.0885, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'MI interest rate is set by statute at 1% above prime (currently 8.85%). VDA offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MD', 0.1300, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'MD has highest interest rate (13%) among states surveyed. VDA program offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('WI', 0.1200, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'WI has high interest rate (12%) but moderate penalty rates. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MN', 0.0800, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'MN has standard rates. VDA program offers penalty relief with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('CO', 0.0600, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'CO has moderate rates. VDA program available with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MO', 0.0200, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'MO has lowest interest rate (2%) among all states. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('SC', 0.1400, 'simple', NULL, 0.0500, NULL, NULL, 0.0050, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'SC has very high interest rate (14%) but low late payment penalty (0.5% per month).');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('AL', 0.1200, 'simple', NULL, 0.1000, NULL, 0.5000, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'AL has high interest rate (12%). Late filing penalty capped at 50%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('LA', 0.1200, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'LA has high interest rate (12%) but moderate penalty rates. VDA offers penalty relief.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('KY', 0.0800, 'simple', NULL, 0.0200, NULL, 0.2000, 0.0200, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'KY has low penalty rates (2% per month) capped at 20% for filing. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('OK', 0.0675, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'OK has moderate rates. VDA program offers penalty relief with 4-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('CT', 0.1200, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'CT has high interest rate (12%) and standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('UT', 0.0800, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'UT has standard rates across the board. VDA program available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('IA', 0.0800, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'IA has standard moderate rates. VDA available with 3-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NV', 0.1800, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'NV has HIGHEST interest rate (18%) among all states. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('AR', 0.1000, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'AR has high interest rate (10%) and standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('KS', 0.0800, 'simple', NULL, 0.0100, NULL, 0.2400, 0.0100, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'KS has low penalty rate (1% per month) with filing capped at 24%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('MS', 0.1200, 'simple', NULL, 0.0500, NULL, NULL, 0.0050, NULL, 0.2500, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'MS has high interest (12%) but very low late payment penalty (0.5% per month) capped at 25%.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NM', 0.1500, 'simple', NULL, 0.0200, NULL, 0.2000, 0.0200, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'NM has very high interest rate (15%) but low penalty rates (2% per month). Filing capped at 20%.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('NE', 0.0600, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'NE has moderate interest (6%) and standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('WV', 0.0900, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'WV has high interest rate (9%) and moderate penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('ID', 0.0600, 'simple', NULL, 0.0500, NULL, NULL, 0.0100, NULL, 0.2500, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'ID has moderate interest and low late payment penalty (1% per month) capped at 25%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('HI', 0.0800, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'HI has standard rates. VDA program available with 3-year lookback.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('RI', 0.1800, 'simple', NULL, 0.0500, NULL, 0.2500, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'RI has HIGHEST interest rate (18%, tied with NV). Filing penalty capped at 25%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('ME', 0.0800, 'simple', NULL, 0.0100, NULL, 0.2500, 0.0100, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'ME has low penalty rates (1% per month) with filing capped at 25%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('SD', 0.1200, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'SD has high interest rate (12%) and standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('ND', 0.1200, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'ND has high interest rate (12%) but moderate penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('VT', 0.0800, 'simple', NULL, 0.0500, NULL, NULL, 0.0500, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'VT has standard moderate rates across all categories. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('WY', 0.1200, 'simple', NULL, 0.1000, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 48, '2024-01-01', NULL, 'WY has high interest rate (12%) and standard penalties. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('DC', 0.1000, 'simple', NULL, 0.0500, NULL, 0.2500, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 36, '2024-01-01', NULL, 'DC has high interest rate (10%). Filing penalty capped at 25%. VDA available.');

INSERT INTO interest_penalty_rates (state, annual_interest_rate, interest_calculation_method, interest_compounding_frequency, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max, late_payment_penalty_rate, late_payment_penalty_min, late_payment_penalty_max, late_registration_penalty_rate, late_registration_penalty_min, late_registration_penalty_max, vda_interest_waived, vda_penalties_waived, vda_lookback_period_months, effective_from, effective_to, notes)
VALUES ('PR', 0.1000, 'simple', NULL, 0.0500, NULL, NULL, 0.1000, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, 36, '2024-01-01', NULL, 'PR (territory) has standard rates. VDA penalty waiver availability not confirmed in research - stored as NULL for app to apply conservative default (FALSE).');

COMMIT;

-- VERIFICATION QUERIES:
-- 1. Count all rows:
--    SELECT COUNT(*) FROM interest_penalty_rates WHERE effective_to IS NULL;
--    Expected: 47

-- 2. Check compound_annually states:
--    SELECT state, annual_interest_rate, interest_calculation_method FROM interest_penalty_rates
--    WHERE interest_calculation_method = 'compound_annually';
--    Expected: AZ, NJ

-- 3. Check flat fee penalties:
--    SELECT state, late_filing_penalty_rate, late_filing_penalty_min, late_filing_penalty_max
--    FROM interest_penalty_rates
--    WHERE late_filing_penalty_rate IS NULL AND late_filing_penalty_min IS NOT NULL;
--    Expected: TX ($50 flat fee)

-- 4. Check NULL vda_penalties_waived:
--    SELECT state, vda_penalties_waived FROM interest_penalty_rates
--    WHERE vda_penalties_waived IS NULL;
--    Expected: PR (no data found in research)
