# Deployment Guide

This documentation has moved to the consolidated skills directory.

**Please refer to the [Comprehensive Deployment Guide](./skills/03_development/deployment.md) for the latest documentation.**

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
- [Deployment Guide](./skills/03_development/deployment.md)

---

*Last updated: 2026-03-13 | Code Cleanup Updates*

## Recent Updates from Code Cleanup

The deployment process has been updated with the following changes:

### Dependency Updates
- **Security Vulnerabilities Addressed**: Regular `npm audit` fixes applied; `xlsx` package removed; `@capgo/capacitor-native-biometric` updated.
- **Unused Dependencies Removed**: 17 unused devDependencies removed, reducing attack surface.
- **Monitoring Packages Added**: Sentry and Datadog packages added for error tracking and performance monitoring.
- **TypeScript Strict Mode**: Enabled with `strict: true` and additional flags (`noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`, `strictNullChecks`).

### Migration Consolidation
- **Baseline Migration**: Created `20260313_baseline.sql` consolidating over 50 previous migrations, reducing migration count by 50%+.
- **Simplified Deployment**: New deployments use baseline migration; existing databases unaffected.

### Environment Variables
Added monitoring environment variables:
- `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE`
- `VITE_DATADOG_CLIENT_TOKEN`, `VITE_DATADOG_APPLICATION_ID`, `VITE_DATADOG_ENVIRONMENT`, `VITE_DATADOG_SERVICE`

Refer to the [Comprehensive Deployment Guide](./skills/03_development/deployment.md) for detailed instructions.