# Developer Guide

This documentation has moved to the consolidated skills directory.

**Please refer to the [Developer Guide](./skills/03_development/developer_guide.md) for the latest documentation.**

---

## Why was this moved?

The ThermoNeural project uses a skills-based documentation architecture where all technical documentation is organized in the `skills/` directory. This ensures:

1. **Single Source of Truth** - All documentation lives in one structured location
2. **Template Compliance** - All skills follow the standardized YAML frontmatter format
3. **Better Navigation** - The [skills/README.md](./skills/README.md) provides a comprehensive directory index

## Quick Links

- [Skills Directory Overview](./skills/README.md)
- [Development Documentation](./skills/03_development/)
- [Architecture Guides](./skills/03_development/architecture/)
- [Deployment Guides](./skills/03_development/deployment_guide.md)

---

## Recent Updates from Code Cleanup

### TypeScript Strict Mode
- **Strict Mode Enabled**: `strict: true` with `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`, `strictNullChecks`
- **Fast Refresh Compliance**: Components must export only React components (no mixed exports) to support Hot Module Replacement
- **Dependency Cleanup**: 17 unused devDependencies removed, Sentry and Datadog monitoring packages added
- **Security Improvements**: Regular `npm audit` fixes applied; `xlsx` package removed; `@capgo/capacitor-native-biometric` updated

### Migration Consolidation
- **Baseline Migration**: `20260313_baseline.sql` consolidates over 50 previous migrations, reducing migration count by 50%+

Refer to the [Developer Guide](./skills/03_development/developer_guide.md) for detailed documentation.

---

*Last updated: 2026-03-13 | Code Cleanup Updates*