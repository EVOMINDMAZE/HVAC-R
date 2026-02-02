# ThermoNeural Skills & Documentation

Welcome to the consolidated skills and documentation library. This directory is the single source of truth for all project knowledge, from high-level strategy to low-level implementation details.

## 📂 Directory Structure

### [01_Strategy](./01_strategy/)
High-level business goals, roadmaps, and execution plans.
- [Master Blueprint](./01_strategy/thermoneural_master_blueprint.md): The overarching vision and architecture.
- [Cloud Strategy](./01_strategy/cloud_strategy.md): The "Digital Landlord" infrastructure model.
- [Commercial Roadmap](./01_strategy/commercial_roadmap.md): Phased rollout plan.
- [Master Execution Plan](./01_strategy/master_execution_plan.md): Comprehensive project execution guide.
- [Revenue Expansion Plan](./01_strategy/revenue_expansion_plan.md): Hardware, Fintech, and Enterprise strategies.
- [Blue Ocean Plan](./01_strategy/blue_ocean_plan.md): Market differentiation strategy.
- [Status](./01_strategy/status/): Gap analysis and implementation summaries.
    - [Implementation Summary](./01_strategy/status/implementation_summary.md)
    - [Gap Remediation Plan](./01_strategy/status/gap_remediation_plan.md)
    - [Production Readiness](./01_strategy/status/production_readiness.md)
    - [Integration Roadmap](./01_strategy/status/integration_roadmap.md)

### [02_Business](./02_business/)
Business logic, pricing models, and "Business in a Box" offerings.
- [Business in a Box](./02_business/business_in_a_box.md): The core product offering for members.
- [Pricing Model](./02_business/pricing_model.md): Detailed pricing structures.
- [Reports](./02_business/reports/): Business reports and readiness assessments.
    - [Business Report](./02_business/reports/business_report.md)

### [03_Development](./03_development/)
Technical guides for contributors and maintainers.
- [Developer Guide](./03_development/developer_guide.md): **Start Here**. Setup, coding standards, and workflow.
- [Deployment Guide](./03_development/deployment_guide.md): **App Deployment**. Netlify + Supabase Cloud instructions.
- [Supabase Setup](./03_development/supabase_setup.md): Database schema and local/cloud config.
- [Mobile Guide](./03_development/mobile_guide.md): iOS/Android specific instructions.
- [Integration](./03_development/integration/): Third-party tool integrations.
    - [AI Engine Config](./03_development/architecture/ai_engine_config.md)
    - [Native Automations](./03_development/architecture/native_automations.md): Serverless automation strategy.
- [Architecture](./03_development/architecture/): System configuration and agent designs.
    - [Agents](./03_development/architecture/agents.md)
    - [Render Service](./03_development/render_service.md): Heavy calculation engine documentation.
- [Features](./03_development/features/): Feature specifications and active feature guides.
    - [Automation Settings](./03_development/features/automation_settings.md): Per-client notification preferences.
    - [Infographic](./03_development/features/infographic.md)
    - [Stripe Upgrade Fix](./03_development/features/stripe_upgrade_fix.md)
    - [Archive Room](./00_meta/archive/): Historical fix plans and legacy specs.

### [06_Automations](./06_automations/)
Architecture and logic for automated communications.
- [Notification System](./06_automations/notification_system.md): SMS and Email engine with white-labeling and per-client preferences.

### [04_Infrastructure](./04_infrastructure/)
Deployment scripts and configuration files.


### [05_Domain](./05_domain/)
Core HVAC-R domain logic and formulas.
- [HVAC Formulas](./05_domain/hvac_formulas/): Psychrometrics, Superheat/Subcooling calculations, etc.

## 📚 User-Facing Documentation
The application includes a comprehensive library of 23+ technician articles located in the `public/docs/` directory. These are rendered live in the app via the `DocsViewer` component.

- **Content Path:** `public/docs/`
- **Article Categories:** Getting Started, Field Tools, HVAC Reference.

## 🤝 How to Contribute
- **New Skill**: Copy `00_meta/SKILL_TEMPLATE.md` to the appropriate directory.
- **Update**: Always update this `README.md` if you add new files or change functionality.
