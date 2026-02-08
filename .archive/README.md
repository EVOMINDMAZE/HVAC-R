# Archive Directory

This directory contains archived files from the documentation audit and optimization process.

## Purpose
- **Preservation**: Store original versions of modified documentation files
- **Rollback**: Provide backup for removed or significantly changed files
- **Audit Trail**: Maintain historical record of documentation changes
- **Compliance**: Meet documentation retention requirements

## Structure
```
.archive/
├── README.md (this file)
├── documentation/
│   ├── originals/     # Original versions of modified files
│   ├── removed/       # Files removed during optimization
│   └── inventory.md   # Archive inventory tracking
```

## Usage Guidelines

### 1. File Naming Convention
- **Originals**: `YYYYMMDD-original-<original-path>.md` (e.g., `20260207-original-skills-README.md`)
- **Removed**: `YYYYMMDD-removed-<original-path>.md` (e.g., `20260207-removed-dist-docs-README.md`)

### 2. Archiving Process
1. **Before Modification**: Copy original file to `.archive/documentation/originals/`
2. **When Removing**: Move file to `.archive/documentation/removed/`
3. **Update Inventory**: Record archiving in `.archive/documentation/inventory.md`

### 3. Restoration Process
1. **Rollback**: Copy archived file back to original location
2. **Reference**: Use git history for additional context
3. **Validation**: Verify restoration doesn't break dependencies

## Inventory Tracking
Maintain `inventory.md` with the following information:

| Archive Date | Original Path | Archive Path | Archive Reason | Archived By |
|--------------|---------------|--------------|----------------|-------------|
| 2026-02-07 | skills/README.md | originals/20260207-skills-README.md | Pre-audit backup | Documentation Team |
| | | | | |

## Related Documentation
- [Documentation Audit Changelog](../docs/documentation-audit-changelog.md)
- [PR Template for Documentation Changes](../.github/PULL_REQUEST_TEMPLATE/documentation.md)
- [Change Management Process](../docs/documentation-audit-changelog.md#change-management-process)

## Notes
- Archive files are version controlled for historical reference
- Consider storage implications for large binary files
- Regular archive cleanup may be needed (retention policy)
- All archive operations should be documented in PR descriptions