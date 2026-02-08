---
name: Business & Technical Report: Simulateon - HVAC&R Engineering Tool
description: Simulateon is a specialized SaaS application designed for HVAC&R (Heating, Ventilation, Air Conditioning, and Refrigeration) engineers. It provides...
version: 1.0
---

# Business & Technical Report: Simulateon - HVAC&R Engineering Tool

## 1. Executive Summary

**Simulateon** is a specialized SaaS application designed for HVAC&R (Heating, Ventilation, Air Conditioning, and Refrigeration) engineers. It provides a suite of calculation tools for analyzing thermodynamic cycles, comparing refrigerants, and optimizing system designs. The platform operates on a freemium subscription model, leveraging modern web technologies (React, Supabase, Stripe) to deliver a responsive and scalable user experience.

## 2. Product Analysis

### Core Value Proposition

Simulateon simplifies complex thermodynamic calculations, replacing manual spreadsheet methods with an intuitive, web-based interface. It offers industry-standard accuracy (NIST REFPROP data) and productivity features like automated reporting and project management.

### Key Features

* **Standard Cycle Analysis**: Basic thermodynamic cycle calculations (Available on all plans).
* **Advanced Simulation Tools**:
  * **Cascade Cycle Analysis**: For multi-stage low-temperature systems.
  * **Refrigerant Comparison**: Side-by-side performance analysis of different refrigerants.
  * **Enhanced Standard Cycle**: More detailed parameters and outputs.
* **Productivity Tools**:
  * **Calculation History**: Save and retrieve past projects.
  * **Reporting**: Generate detailed PDF reports and export data to Excel/CSV.
  * **Project Management**: Organize calculations by project.
* **Support & Resources**:
  * Troubleshooting guides.
  * DIY Calculators for quick estimations.
  * Comprehensive documentation and API access (Enterprise).

### Target Audience

* **HVAC&R Engineers**: Primary users needing daily calculation tools.
* **System Designers**: For optimizing equipment selection.
* **Engineering Firms**: Enterprise teams requiring collaboration and API integration.
* **Students/Academics**: Free tier users learning thermodynamic principles.

## 3. Business Model Analysis

The application utilizes a tiered subscription model with monthly and yearly billing options.

### Pricing Tiers

| Feature | Free Plan | Professional Plan | Enterprise Plan |
| :--- | :--- | :--- | :--- |
| **Price** | **$0 / month** | **$29 / month** ($290/yr) | **$99 / month** ($990/yr) |
| **Usage Limit** | 10 calculations/mo | 500 calculations/mo | Unlimited |
| **Core Tools** | Standard Cycle only | All Tools (Cascade, etc.) | All Tools + Custom |
| **Data Access** | Basic | Advanced Database | Custom Properties |
| **Reporting** | Basic | PDF & Excel Export | Custom Reporting |
| **Support** | Email | Priority Email | Phone & SLA |
| **Extras** | - | Calculation History | API Access, Team Collab |

### Revenue Streams

* **Recurring Subscriptions**: Primary revenue from Pro and Enterprise users.
* **Potential Upsells**: API usage overages (future), specialized consulting (via "Contact Sales").

## 4. Technical Analysis

### Technology Stack

* **Frontend**: React (Vite), TypeScript, Tailwind CSS, Radix UI.
* **Backend**: Supabase (PostgreSQL, Authentication, Realtime).
* **Infrastructure**: Serverless architecture (Vite build, likely deployed to Netlify/Vercel).
* **Payments**: Stripe integration for subscription management.
* **Testing**: Vitest (Unit), Playwright (E2E).

### Architecture & Security

* **Authentication**: Securely handled via Supabase Auth.
* **Database**: PostgreSQL with Row Level Security (RLS).
  * *Note*: A security audit revealed some tables (e.g., `kv_store`) lack RLS policies, which should be addressed.
* **Scalability**: The serverless and PaaS approach allows for high scalability with minimal maintenance.

## 5. SWOT Analysis

| **Strengths** | **Weaknesses** |
| :--- | :--- |
| + Modern, responsive UI/UX.<br>+ Robust feature set for niche market.<br>+ Scalable serverless architecture.<br>+ Clear monetization strategy. | - Dependency on external APIs (Supabase/Stripe).<br>+ Niche market limits total addressable market.<br>- Mobile experience for complex graphs may be challenging. |
| **Opportunities** | **Threats** |
| + API monetization for third-party integrations.<br>+ Mobile app development for field engineers.<br>+ Partnerships with HVAC equipment manufacturers.<br>+ Educational licenses for universities. | - Competitors with established desktop software.<br>- Changes in refrigerant regulations requiring constant data updates.<br>- Platform risk (Supabase pricing changes). |

## 6. Recommendations

### Short-Term (Immediate Actions)

1. **Security Hardening**: Fix missing RLS policies on `kv_store` and other tables to prevent unauthorized data access.
2. **Environment Configuration**: Ensure all developers have the correct `.env` setup (as fixed recently) to prevent local dev issues.
3. **Database Maintenance**: Update the Postgres version as recommended by Supabase advisories.

### Long-Term (Strategic)

1. **Mobile Optimization**: Develop a "Field Mode" for quick calculations on tablets/phones for on-site engineers.
2. **Enterprise Features**: Flesh out the "Team Collaboration" features (shared projects, role-based access) to justify the Enterprise price point.
3. **API Economy**: Formalize the API offering for manufacturers to embed Simulateon's engine into their own selection software.
