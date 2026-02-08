# Documentation Change Pull Request

## Change Description
<!-- Briefly describe what documentation changes are being made -->

**Change Type:** (docs/fix/feat/refactor/style/chore)  
**Scope:** (root-readme/skills/skills-readme/docs/deployment/api/template)  
**Related Audit Issue:** (Reference audit finding or changelog entry)  
**Priority:** (Critical/High/Medium/Low)

## Justification
<!-- Link to audit finding, broken link, duplication issue, or documentation gap -->

**Audit Reference:** [Documentation Audit Changelog](../docs/documentation-audit-changelog.md)  
**Quality Metric Addressed:** (Freshness/Completeness/Accuracy/Consistency/Referential Integrity)  
**Impact Assessment:** (How this change improves documentation quality)

## Changes Made
<!-- List specific files modified, added, or removed -->

### Modified Files
- `path/to/file.md`: Description of changes

### Added Files
- `path/to/new-file.md`: Purpose of new documentation

### Removed Files (Archived)
- `path/to/removed.md`: Reason for removal, backup location

## Testing & Validation
<!-- Describe how changes were tested -->

- [ ] **Internal Links**: All internal links validated (automated or manual)
- [ ] **YAML Frontmatter**: Skills files have proper metadata (if applicable)
- [ ] **Navigation**: Paths updated in navigation indices (README.md, skills/README.md)
- [ ] **Spelling/Grammar**: Checked with linter or manual review
- [ ] **Formatting**: Consistent markdown formatting applied

## Backup & Rollback
<!-- Document backup strategy for removed/modified files -->

**Archive Location:** `.archive/documentation/`  
**Original Files Preserved:** Yes/No (location)  
**Rollback Plan:** (git revert, archive restoration, etc.)

## Related Documentation
<!-- Link to related documentation that might need updating -->

- [Skills Template](../skills/00_meta/SKILL_TEMPLATE.md)
- [Root README](../README.md)
- [Skills README](../skills/README.md)
- [Documentation Audit Changelog](../docs/documentation-audit-changelog.md)

## Commit History
<!-- List relevant commits in this PR -->

```
docs(scope): brief description
fix(scope): corrected issue
```

## Review Checklist
- [ ] Change aligns with audit findings and priority classification
- [ ] Justification clearly documented with audit references
- [ ] All broken links fixed (if applicable)
- [ ] YAML frontmatter added/updated for skills files (if applicable)
- [ ] No unintended deletions or broken functionality
- [ ] Navigation paths updated in relevant indices
- [ ] Archive created for removed files (if applicable)
- [ ] Commit messages follow conventional format

## Additional Notes
<!-- Any additional context for reviewers -->