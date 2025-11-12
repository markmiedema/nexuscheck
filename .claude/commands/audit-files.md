# Audit Project Files for Cleanup

**Your task:** Review the project's current file structure and identify candidates for archival.

---

## Steps to Follow

### 1. List Current Files
List all markdown files in the project root directory to see what currently exists.

### 2. Identify Archive Candidates

Look for files that fall into these categories:

**Superseded documents:**
- Files that have been replaced by newer, better versions
- Example: OLD-TEMPLATE.md superseded by NEW-TEMPLATE.md

**Historical work logs:**
- Session logs that tracked specific work periods
- Summary documents for completed work
- Files with dates in the title (WORK-LOG-2025-11-02.md)

**Phase-specific files:**
- Documents tied to a specific phase that's now complete
- Example: Phase 2A implementation notes when Phase 2A is complete

**Redundant documentation:**
- Information that's been merged into other files
- Duplicate guides (when START-HERE covers it)

### 3. Propose Archive Structure

Create a logical archive organization:
- Use descriptive subdirectory names under `_archives/`
- Group related files together
- Examples: `_archives/phase-2a-database/`, `_archives/historical-logs/`, `_archives/superseded/`

### 4. Create Archive READMEs

For EACH archive subdirectory, create a README.md that explains:
- **Archived date:** When files were moved
- **Reason:** Why these files were archived
- **Contents:** What's in this archive
- **Use when:** When someone might need these files
- **Current location:** Where to find the current/active versions

### 5. Generate Cleanup Script

Create a Windows batch (.bat) file that:
- Creates the archive directories
- Moves files to appropriate locations
- Can be reviewed before execution

### 6. Present Plan

Show the user:
1. Files to be archived (with reasons)
2. Proposed archive structure
3. README content for each archive
4. Batch script for execution
5. Expected result (what stays in root)

---

## Important Guidelines

- **Never delete files** - only archive them
- **Always create READMEs** explaining the archive
- **Keep root focused** - aim for 10-12 essential files
- **Batch operations** - don't move files one at a time
- **Wait for approval** - present plan before creating scripts

---

## Expected Outcome

After cleanup:
- Root directory has 10-12 current, essential files
- All historical/superseded files are organized in `_archives/`
- Each archive has a clear README explaining its purpose
- File structure is easier to navigate for new LLM sessions
