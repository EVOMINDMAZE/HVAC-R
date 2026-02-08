# Documentation Navigation Map

This document provides a hierarchical overview of all documentation in the HVAC-R (ThermoNeural) project, showing how to navigate from the root README to any documentation resource.

## Navigation Starting Points

1. **Root Documentation** - [README.md](../README.md)
   - Project overview, quick start, and primary navigation
   - Links to: [Developer Guide](./skills/03_development/developer_guide.md), [Deployment Guide](./skills/03_development/deployment.md), [API Portal](../docs/api/portal/index.html), [Architecture](../docs/architecture/)

2. **Skills Index** - [skills/README.md](../skills/README.md)
   - Organized documentation by category (00_meta through 06_automations)
   - Each category contains specialized documentation for different aspects of the project

## Documentation Hierarchy

### Skills Documentation (`skills/`)
Organized by functional areas with YAML frontmatter for metadata.

```
skills/
├── 00_meta/                      # Documentation templates and standards
│   └── SKILL_TEMPLATE.md         # Template for creating new skill documentation
├── 01_strategy/                  # Strategic planning and business strategy
│   ├── status/                   # Implementation status and gap analysis
│   │   ├── gap_remediation_plan.md
│   │   ├── implementation_summary.md
│   │   ├── integration_roadmap.md
│   │   ├── platform_enhancements_summary.md
│   │   ├── production_readiness.md
│   │   └── rebranding_verification.md
│   ├── blue_ocean_plan.md
│   ├── cloud_strategy.md
│   ├── commercial_roadmap.md
│   ├── master_execution_plan.md
│   ├── revenue_expansion_plan.md
│   ├── strategic_implementation_plan.md
│   ├── strategic_modules_spec.md
│   └── thermoneural_master_blueprint.md
├── 02_business/                  # Business operations and pricing
│   ├── reports/
│   │   └── business_report.md
│   ├── business_in_a_box.md
│   └── pricing_model.md
├── 03_development/               # Development guides and technical documentation
│   ├── architecture/             # System architecture details
│   │   ├── ai_engine_config.md
│   │   └── native_automations.md
│   ├── features/                 # Feature-specific documentation
│   │   ├── automation_settings.md
│   │   ├── infographic.md
│   │   ├── stripe_upgrade_fix.md
│   │   └── upgrade_button_fix.md
│   ├── deployment.md             # Comprehensive deployment guide
│   ├── developer_guide.md        # Complete developer onboarding guide
│   ├── environment_variables.md
│   ├── mobile_guide.md
│   ├── render_deployment.md
│   └── render_service.md
├── 04_ai/                        # AI and machine learning
│   └── agents.md                 # AI agent architecture and configuration
├── 05_domain/                    # HVAC domain knowledge
│   └── hvac_formulas/
│       └── SKILL.md              # HVAC formulas and calculations
└── 06_automations/               # Automation workflows
    └── notification_system.md    # Notification system architecture
```

### Technical Documentation (`docs/`)
Supplementary technical documentation, API specs, and security information.

```
docs/
├── api/                          # API documentation
│   ├── portal/                   # Interactive API portal
│   │   └── index.html
│   ├── INVENTORY.md              # API endpoint inventory
│   └── openapi.yaml              # OpenAPI specification
├── architecture/                 # Architecture diagrams
│   ├── c4-level1-system-context.puml
│   ├── c4-level2-container.puml
│   └── c4-level3-component.puml
├── cleanup/                      # Codebase cleanup documentation
│   └── CODEBASE_CLEANUP_INVENTORY.md
├── monitoring/                   # Monitoring and observability
│   ├── ELK_SETUP.md              # ELK stack setup guide
│   ├── alert-config.yaml
│   ├── dashboard-config.json
│   └── privacy-compliance-monitoring.md
├── security/                     # Security and compliance
│   ├── ENCRYPTION_VALIDATION.md
│   ├── PENETRATION_TEST_SCOPE.md
│   ├── SBOM.md                   # Software Bill of Materials
│   ├── SOC2_READINESS_ASSESSMENT.md
│   └── VULNERABILITY_REPORT.md
├── ACTION_PLAN_PROGRESS.md
├── DOCUMENTATION_SPRINT_SUMMARY.md
├── ai-patterns.md
├── deployment-guide.md           # Legacy deployment guide (see skills/03_development/deployment.md)
├── deployment-readiness-report.md
├── documentation-audit-changelog.md  # This documentation audit changelog
├── production-checklist.md
└── production-environment-configuration.md
```

### Project README Files
Essential README files for different parts of the codebase:

- **[README.md](../README.md)** - Main project documentation and entry point
- **[skills/README.md](../skills/README.md)** - Skills documentation index
- **[supabase/README.md](../supabase/README.md)** - Supabase Edge Functions deployment (to be merged into deployment guide)
- **[e2e/README.md](../e2e/README.md)** - Playwright end-to-end testing guide
- **[studio/README.md](../studio/README.md)** - Sanity Studio configuration
- **[public/docs/README.md](../public/docs/README.md)** - Public documentation placeholder

## Recommended Navigation Paths

### For New Developers
1. Start with [README.md](../README.md) for project overview
2. Follow the [Developer Guide](./skills/03_development/developer_guide.md) for setup instructions
3. Review [Deployment Guide](./skills/03_development/deployment.md) for deployment procedures
4. Explore [Architecture](../docs/architecture/) diagrams for system understanding

### For Deployment
1. Read [Deployment Guide](./skills/03_development/deployment.md) for comprehensive deployment steps
2. Check [Environment Variables](./skills/03_development/environment_variables.md) for configuration
3. Review [Monitoring](../docs/monitoring/ELK_SETUP.md) setup for production observability

### For Business Stakeholders
1. Review [Strategic Documentation](./skills/01_strategy/) for business strategy
2. Examine [Business Reports](./skills/02_business/reports/business_report.md) for operational insights
3. Check [Pricing Model](./skills/02_business/pricing_model.md) for revenue details

## Maintenance Notes

- **Regular Updates**: The navigation map should be updated when documentation structure changes
- **Link Validation**: Use `markdown-link-check` to validate internal links periodically
- **Spelling/Grammar**: Use `cspell` for spelling validation across documentation
- **Consistency**: Follow the YAML frontmatter format for skills documentation

## Quick Access Links

- [Documentation Audit Changelog](./documentation-audit-changelog.md) - Track documentation changes
- [Developer Guide](./skills/03_development/developer_guide.md) - Complete developer onboarding
- [Deployment Guide](./skills/03_development/deployment.md) - Full deployment instructions
- [API Portal](../docs/api/portal/index.html) - Interactive API documentation
- [Security Documentation](../docs/security/) - Security and compliance information