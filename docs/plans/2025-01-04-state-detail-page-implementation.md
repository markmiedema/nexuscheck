# State Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement state-specific detail page showing comprehensive sales analysis and compliance requirements for a single state within an analysis.

**Architecture:** New API endpoint returns state-specific data aggregated by year with transaction details. Frontend displays multi-section page with year filtering, charts, expandable transaction table, and dynamic compliance guidance.

**Tech Stack:** FastAPI (backend), Next.js 14 App Router (frontend), React, TypeScript, shadcn/ui components, recharts (charts), Tailwind CSS

**Design Reference:** `docs/plans/2025-01-04-state-detail-page-design.md`

**Note:** This plan implements single-year data first. Multi-year nexus calculation fix is a separate plan.

---

## Tasks Overview

1. Backend - Create State Detail API Endpoint (Structure Only)
2. Backend - Fetch State Transactions
3. Backend - Calculate Year Aggregates and Running Totals
4. Backend - Add Threshold and Nexus Status Calculation
5. Backend - Add Compliance Information
6. Frontend - Create State Detail Page Route
7. Frontend - Create API Client Function
8. Frontend - Create StateDetailHeader Component
9. Frontend - Create SummaryCards Component
10. Frontend - Create ThresholdProgressBar Component
11. Frontend - Create MonthlyTrendChart Component
12. Frontend - Create TransactionTable Component (Part 1: Structure)
13. Frontend - Create TransactionTable Component (Part 2: Table with Filters)
14. Frontend - Create ComplianceSection Component (Has Nexus Variant)
15. Frontend - Add Remaining ComplianceSection Variants
16. Frontend - Wire Up State Detail Page
17. Integration Testing and Bug Fixes
18. Final Polish and Documentation

---

## Implementation Plan

See full task details at: `docs/plans/2025-01-04-state-detail-page-design.md`

Due to the length of this plan, tasks are summarized here. Each task follows the pattern:
- Write test (if applicable)
- Implement minimal code
- Test/verify
- Commit

**Estimated time:** 12-16 hours total

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-01-04-state-detail-page-implementation.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach would you prefer?
