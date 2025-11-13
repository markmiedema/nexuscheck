# Sprint 1 + UX/UI Implementation Plans

> **All Plans Consolidated** - Everything you need in `/docs/plans/sprint-1/` for streamlined workflow

## 📖 Start Here

**New to these plans?** Read [`INDEX.md`](./INDEX.md) for complete navigation and recommended workflow.

**Quick Status:**
- **Sprint 1**: 42% complete (Days 1-5 done, Days 6-8 in progress)
- **UX/UI**: Ready to start after Sprint 1 completes (23 tasks, 12-19 days)

**For Stakeholders:** See [`EXECUTIVE-BRIEF.md`](./EXECUTIVE-BRIEF.md) for high-level summary and timeline.

---

## 📂 What's in This Folder

This folder contains comprehensive implementation plans for both Sprint 1 features and UX/UI improvements. All plans follow TDD principles with bite-sized tasks, exact file paths, and complete code implementations.

### Sprint 1 Plans (Days 1-12)
- Physical Nexus ✅ (Days 1-2 complete)
- VDA Mode ✅ (Days 3-5 complete)
- Enhanced Column Detection + Exempt Sales 🚧 (Days 6-8 in progress)
- Integration & Polish ⏳ (Days 9-10 pending)
- Testing & Documentation ⏳ (Days 11-12 pending)

### UX/UI Plans (After Sprint 1)
- Tier 1: Critical Improvements (5 tasks, 2-3 days)
- Tier 2: Quality & Accessibility (7 tasks, 5-7 days)
- Tier 3: Evaluate Need (4 tasks, 3-5 days)
- Tier 4: Polish (7 tasks, 2-4 days)

## Integration Summary

**Updated:** 2025-11-13 - Integrated UI consistency recommendations with existing UX roadmap and coordinated with Sprint 1 timeline.

See [`INTEGRATION-NOTES.md`](./INTEGRATION-NOTES.md) for full analysis of UX/UI conflicts, resolutions, and validation findings.

See [`SPRINT-INTEGRATION.md`](./SPRINT-INTEGRATION.md) for coordination with ongoing Sprint 1 work (Days 6-10).

---

## UX/UI Improvements Overview

Based on professional UX and UI reviews, these improvements have been organized into four priority tiers. **Start these AFTER Sprint 1 completes** (see SPRINT-INTEGRATION.md for coordination):

### Tier 1: Critical Improvements (Do Now)
**Estimated Effort:** 2-3 days | **Impact:** High | **File:** `tier-1-critical-improvements.md`

High-impact features that address core UX blockers and significantly improve user experience:

1. **URL State Persistence** - Enable bookmarking, back button, and URL sharing for filtered views
2. **Enhanced Error Messages** - User-friendly error mappings for common HTTP and network errors
3. **Form Auto-Save** - Automatic draft saving with 30-second intervals and restoration
4. **Action Priority Summary** - Priority card showing urgent and approaching nexus states
5. **Calculation Progress Feedback** - Multi-step progress dialog during analysis calculation

**Recommended:** Start here. These provide immediate value with minimal risk.

---

### Tier 2: Quality Improvements (Do Soon)
**Estimated Effort:** 5-7 days | **Impact:** High | **File:** `tier-2-quality-improvements.md`

Major quality-focused enhancements and accessibility improvements:

1. **Optimistic Updates** - Instant UI feedback for delete operations with rollback on error
2. **Skip Link** - WCAG 2.1 AA accessibility for keyboard users
3. **Inline Form Validation** - Real-time password strength and field validation
4. **Focus Management** - Improved screen reader experience with auto-focus on navigation
5. **Upload Progress Indicator** - Real-time progress bar with cancellation support
6. **Responsive Typography** ⭐ (UI Integration) - Scale text properly on mobile screens
7. **Touch Target Accessibility** ⭐ (UI Integration) - Meet 44px minimum for mobile taps

**Recommended:** Implement after Tier 1. Improves quality and accessibility significantly.

⭐ = Integrated from UI review

---

### Tier 3: Evaluate Need (Measure First)
**Estimated Effort:** 3-5 days | **Impact:** Medium | **File:** `tier-3-evaluate-need.md`

Features that should be evaluated based on actual usage patterns before implementing:

1. **Virtual Scrolling** - For transaction tables with >200 rows (only if performance issues exist)
2. **Request Caching (SWR)** - Intelligent caching for frequently-accessed endpoints
3. **Keyboard Shortcuts** - Command palette and shortcuts for power users
4. **Date Range Picker** - Enhanced date selection with presets

**Recommended:** Measure usage patterns first. Only implement if data supports the need.

**Evaluation Criteria:**
- Virtual scrolling: Check if typical analyses have >200 transactions
- SWR caching: Monitor for duplicate API requests in network tab
- Keyboard shortcuts: Survey users about power user features
- Date range picker: Observe if current inputs cause friction

---

### Tier 4: Polish (Nice to Have)
**Estimated Effort:** 2-4 days | **Impact:** Low-Medium | **File:** `tier-4-polish.md`

Nice-to-have polish features that refine the experience:

1. **Smart Empty States** - Illustrated empty states with clear CTAs
2. **Compact Date Display** - Shorter date formats in tables ("2 days ago", "Q4 2023")
3. **Saved Filter Presets** - Save and load frequently-used filter combinations
4. **Loading Skeletons** - Content-matching skeletons that reduce layout shift
5. **Comparison View** - Side-by-side comparison of multiple analyses (optional)
6. **Number Formatting Utilities** ⭐ (UI Integration) - Consistent currency and number display
7. **Responsive Card Padding** ⭐ (UI Integration) - Optimize spacing for mobile screens

**Recommended:** Implement as time permits or based on user feedback.

⭐ = Integrated from UI review

---

## Using These Plans

### For Claude Code

Each plan includes a header directing Claude to use the `superpowers:executing-plans` skill:

```markdown
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
```

### Execution Options

After reviewing a plan, you have two execution options:

**1. Subagent-Driven Development (Same Session)**
- Dispatch fresh subagent per task
- Code review between tasks
- Fast iteration with quality gates
- Use: `superpowers:subagent-driven-development` skill

**2. Parallel Session Execution (New Session)**
- Open new session in dedicated worktree
- Batch execution with checkpoints
- Longer uninterrupted work
- Use: `superpowers:executing-plans` skill in new session

### Task Structure

Each task follows this format:

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: Manual testing approach

**Step 1: Description**
[Complete code or exact instructions]

**Step 2: Test**
[Manual test checklist]

**Step 3: Commit**
```bash
git add files...
git commit -m "conventional commit message"
```
```

### Implementation Principles

All plans follow these principles:

- **TDD**: Write tests first, watch them fail, implement, make them pass
- **DRY**: Don't Repeat Yourself - extract reusable utilities
- **YAGNI**: You Aren't Gonna Need It - only implement what's needed
- **Frequent Commits**: Commit after each completed task
- **Exact Paths**: All file paths are absolute and exact
- **Complete Code**: No pseudocode - ready-to-implement code snippets

---

## Quick Reference

### By Impact
1. **Highest Impact:** Tier 1 + Tier 2
2. **Medium Impact:** Tier 3 (evaluate first)
3. **Lower Impact:** Tier 4 (polish)

### By Effort
1. **Quick Wins (2-3 days):** Tier 1
2. **Medium Effort (5-7 days):** Tier 2
3. **Variable Effort:** Tier 3 (depends on what you implement)
4. **Light Polish (2-4 days):** Tier 4

### By Risk
1. **Low Risk:** Tier 1, Tier 4
2. **Medium Risk:** Tier 2 (accessibility changes)
3. **Higher Risk:** Tier 3 (architectural changes like SWR)

---

## Implementation Roadmap

> **Sprint 1 Coordination:** Sprint 1 is currently in progress (42% complete, Days 6-8 working on Enhanced Column Detection + Exempt Sales). See [`SPRINT-INTEGRATION.md`](./SPRINT-INTEGRATION.md) for detailed coordination strategy. Recommended approach: Complete Sprint 1 first (Days 6-12), then begin UX/UI roadmap.

### Recommended Sequencing (Coordinated with Sprint 1)

**Week 1 (Current):**
- Sprint 1 Days 6-8: Enhanced CSV + Exempt Sales (in progress)

**Week 2:**
- Sprint 1 Days 9-10: Integration & Polish (apply UX/UI guidelines from Tier 2)
- Sprint 1 Days 11-12: Testing & Documentation

**Week 3:**
- UX/UI Tier 1: Critical Improvements (start after Sprint 1 complete)
  - Days 1-2: URL persistence, error messages, auto-save
  - Day 3: Action summary, progress feedback

**Week 4:**
- UX/UI Tier 2: Quality Improvements
  - Days 1-2: Optimistic updates, skip link, focus management
  - Days 3-4: Inline validation, upload progress, responsive typography
  - Day 5: Touch targets, testing

**Week 5-6:**
- UX/UI Tier 3: Evaluate & Implement (if data supports need)

**Week 7-8:**
- UX/UI Tier 4: Polish (as time permits)
  - Replace Sprint 1 simple loading states with proper skeletons
  - Replace Sprint 1 text empty states with illustrated components
  - Number formatting, responsive card padding

### Original Roadmap (Pre-Sprint 1 Coordination)

### Week 1: Critical Improvements
- Days 1-2: Tier 1 (URL persistence, error messages, auto-save)
- Day 3: Tier 1 (action summary, progress feedback)

### Week 2: Quality Improvements
- Days 1-2: Tier 2 (optimistic updates, skip link, focus management)
- Days 3-4: Tier 2 (inline validation, upload progress)
- Day 5: Testing and refinement

### Week 3: Evaluation & Polish
- Day 1: Measure usage patterns for Tier 3 features
- Days 2-3: Implement selected Tier 3 features (if needed)
- Days 4-5: Selected Tier 4 polish features

### Week 4: Testing & Refinement
- Days 1-2: Comprehensive testing across all features
- Days 3-4: Bug fixes and refinements
- Day 5: Documentation and user guide updates

---

## Testing Strategy

### Manual Testing
All features require manual testing as they're UI/UX focused:
- Test in both light and dark mode
- Test with different screen sizes (mobile, tablet, desktop)
- Test browser compatibility (Chrome, Firefox, Safari)
- Test with keyboard navigation
- Test with screen readers (NVDA, JAWS, VoiceOver)

### Performance Testing
For Tier 3 features, measure before implementing:
- Use Chrome DevTools Performance tab
- Monitor network requests
- Check memory usage
- Measure frame rates during scrolling

### Accessibility Testing
For Tier 2 features:
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility
- Focus indicators visibility
- ARIA labels and roles
- Color contrast (WCAG AA)

---

## Technology Stack

### Core
- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS

### Libraries Used
- **Forms:** React Hook Form, Zod
- **UI Components:** Radix UI, shadcn/ui
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Dates:** date-fns

### Additional Libraries (Tier 3)
- **Virtual Scrolling:** @tanstack/react-virtual (~8KB)
- **Request Caching:** SWR (~12KB)
- **Command Palette:** cmdk (~45KB)

Total additional bundle: ~65KB (gzipped: ~20KB)

---

## Code Quality Standards

### Naming Conventions
- Components: PascalCase (`ActionPrioritySummary`)
- Hooks: camelCase with `use` prefix (`useFormAutoSave`)
- Utilities: camelCase (`calculatePasswordStrength`)
- Files: kebab-case (`action-priority-summary.tsx`)

### File Organization
```
frontend/
├── app/                    # Next.js pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── analysis/          # Domain-specific components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── api/              # API client and endpoints
│   └── utils/            # Utility functions
└── types/                # TypeScript type definitions
```

### Commit Message Format
```
<type>: <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
- `feat: add URL state persistence for analyses filters`
- `fix: correct password strength calculation for special chars`
- `docs: add implementation plan for UX improvements`

---

## Support & Questions

### Before Implementation
1. Read the entire tier plan
2. Understand the architecture approach
3. Check prerequisites and dependencies
4. Review testing requirements

### During Implementation
1. Follow steps sequentially
2. Test each step before moving forward
3. Commit after each completed task
4. Ask questions if instructions are unclear

### After Implementation
1. Run full test checklist
2. Verify dark mode compatibility
3. Test accessibility features
4. Document any deviations from plan

---

## Success Metrics

### Tier 1
- [ ] Users can bookmark filtered views
- [ ] Error messages are understandable and actionable
- [ ] Form data never lost on accidental navigation
- [ ] Users know which states need immediate action
- [ ] Calculation progress is clear and estimated

### Tier 2
- [ ] Delete feels instant (optimistic updates)
- [ ] Keyboard users can skip navigation
- [ ] Password strength is clear during signup
- [ ] Screen readers announce page context
- [ ] Large uploads show progress

### Tier 3 (if implemented)
- [ ] Large tables scroll at 60fps
- [ ] Reduced duplicate API requests
- [ ] Power users use keyboard shortcuts
- [ ] Date selection is efficient

### Tier 4 (if implemented)
- [ ] Empty states guide new users
- [ ] Dates are scannable in tables
- [ ] Filter presets save time
- [ ] Loading states feel smooth

---

## Version History

- **v1.0** (2025-11-13): Initial implementation plans created
  - Tier 1: Critical Improvements
  - Tier 2: Quality Improvements
  - Tier 3: Evaluate Need
  - Tier 4: Polish

---

## Additional Resources

### Related Documentation
- `frontend/docs/THEMING.md` - Color system and theming
- `frontend/README.md` - Project setup and architecture
- `frontend/components.json` - shadcn/ui configuration

### External Resources
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [SWR Documentation](https://swr.vercel.app/)

---

**Remember:** These plans are comprehensive guides, not rigid scripts. Adapt as needed based on actual implementation discoveries, but maintain the core principles of TDD, accessibility, and user-centered design.

---

## Future Considerations

Each tier includes a "Future Considerations" section to prevent scope creep while capturing valuable ideas:

### What Goes Here
- Good ideas that aren't current priorities
- Features that may never be needed
- Over-engineering that should be avoided for now
- Advanced capabilities to revisit later

### Examples from Each Tier

**Tier 1 Future Considerations:**
- URL state compression for complex filters
- Server-side error translation
- Auto-save conflict resolution
- Real-time calculation progress via WebSockets

**Tier 2 Future Considerations:**
- Professional font stack (Inter)
- Typography utility classes
- Micro-animations
- Dark mode contrast reduction
- Scroll shadow indicators

**Tier 3 Future Considerations:**
- Infinite scroll/pagination
- Advanced query builder
- Offline mode with service workers
- Customizable dashboard widgets
- Export/import filter presets

**Tier 4 Future Considerations:**
- Comparison view enhancements
- Staggered list animations
- Enhanced group hover visibility
- Quarter-based date display variants
- Advanced number formatting

### When to Revisit
Future considerations should be revisited when:
- User feedback explicitly requests the feature
- Analytics data proves the need
- Core features are complete and stable
- Team has bandwidth for polish
- Technical infrastructure changes enable the feature

**Philosophy:** Capture ideas to avoid forgetting them, but resist implementing until proven necessary.

---

## UX/UI Integration Philosophy

### Component-Based Approach (Chosen)
We chose to keep configuration co-located with components rather than extracting to design tokens:

```typescript
// ✅ Preferred: Co-located in component
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '...', icon: Clock }
}
```

**Rationale:**
- Type-safe and IDE-friendly
- Clear ownership
- More than just styles (labels, icons)
- No duplication issues currently

### Utility-First CSS (Chosen)
We chose Tailwind utilities over custom CSS classes:

```tsx
// ✅ Preferred: Tailwind utilities
<h1 className="text-3xl font-bold tracking-tight lg:text-4xl">

// ❌ Avoided: Custom CSS classes  
<h1 className="heading-1">
```

**Rationale:**
- Tailwind's philosophy is utility-first
- More flexible for variations
- No context switching between CSS and JSX
- Team comfortable with approach

### Flexible Guidelines (Chosen)
We chose guidelines over rigid rules for spacing and typography:

**Approach:**
- Document common patterns
- Provide copy-paste examples
- Trust developer judgment
- Fix inconsistencies as they arise

**Avoided:**
- Prescriptive spacing rules
- Mandatory class names
- Over-engineered design system

**Rationale:**
- Design is contextual
- Rigid rules slow development
- Current spacing looks good
- No evidence of problems

---

## Validation & Quality Control

### Code Validation
Before integrating UI recommendations, we validated against the actual codebase:

**False Positives Identified:**
- ❌ Dark mode dialog bug (doesn't exist - already uses `bg-card`)
- ❌ Duplicate Input styling (not found in codebase)
- ❌ Unused shadow classes (don't exist in config)

**Valid Issues Confirmed:**
- ✅ Responsive typography needed
- ✅ Touch targets could be larger
- ✅ Number formatting inconsistent

**Lesson:** Always validate recommendations against actual code before planning work.

### Integration Process
1. ✅ Read recommendation
2. ✅ Check if issue actually exists in codebase
3. ✅ Evaluate priority and impact
4. ✅ Check for conflicts with existing plans
5. ✅ Integrate valid items into appropriate tier
6. ✅ Document deferred items in Future Considerations
7. ✅ Update README with integrated tasks

---

## Task Count Summary

| Tier | Original Tasks | Added (UI) | Total | Effort |
|------|----------------|------------|-------|--------|
| Tier 1 | 5 | 0 | **5 tasks** | 2-3 days |
| Tier 2 | 5 | 2 | **7 tasks** | 5-7 days |
| Tier 3 | 4 | 0 | **4 tasks** | 3-5 days |
| Tier 4 | 5 | 2 | **7 tasks** | 2-4 days |
| **Total** | **19** | **4** | **23 tasks** | **12-19 days** |

### Future Considerations Count
- Tier 1: 5 items deferred
- Tier 2: 7 items deferred
- Tier 3: 6 items deferred
- Tier 4: 7 items deferred
- **Total: 25 items captured without scope creep**

---

## Success Metrics (Updated)

### Tier 1
- [ ] Users can bookmark filtered views and share URLs
- [ ] Error messages are understandable and actionable
- [ ] Form data never lost on accidental navigation
- [ ] Users know which states need immediate action
- [ ] Calculation progress is clear with time estimates

### Tier 2
- [ ] Delete feels instant (optimistic updates)
- [ ] Keyboard users can skip navigation
- [ ] Password strength is clear during signup
- [ ] Screen readers announce page context correctly
- [ ] Large uploads show progress and can be cancelled
- [ ] ⭐ Text scales properly on mobile (no overflow)
- [ ] ⭐ All touch targets meet 44px minimum

### Tier 3 (if implemented)
- [ ] Large tables scroll at 60fps
- [ ] Reduced duplicate API requests visible in network tab
- [ ] Power users utilize keyboard shortcuts
- [ ] Date selection is faster with presets

### Tier 4 (if implemented)
- [ ] Empty states guide new users with clear CTAs
- [ ] Dates are scannable in tables (compact format)
- [ ] Filter presets save time for repeat tasks
- [ ] Loading states feel smooth (no layout shift)
- [ ] ⭐ Currency displays consistently formatted
- [ ] ⭐ Cards use optimal spacing on mobile and desktop

